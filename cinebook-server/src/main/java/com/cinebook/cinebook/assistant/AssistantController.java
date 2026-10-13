package com.cinebook.cinebook.assistant;

import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Booking assistant for the customer site. Open to visitors (browsing works signed out);
 * holding seats needs a signed-in user, which the tools check.
 */
@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    /** Voices offered in the widget (Gemini prebuilt voices). */
    private static final List<Map<String, String>> VOICES = List.of(
            Map.of("id", "Aoede", "label", "Aoede", "tone", "Warm"),
            Map.of("id", "Kore", "label", "Kore", "tone", "Clear"),
            Map.of("id", "Charon", "label", "Charon", "tone", "Calm"),
            Map.of("id", "Puck", "label", "Puck", "tone", "Bright"));
    private static final Set<String> VOICE_IDS = Set.of("Aoede", "Kore", "Charon", "Puck", "Zephyr", "Fenrir", "Leda", "Orus");
    private static final String SPEECH_STYLE = "Say in a warm, friendly, natural and professional tone, at a relaxed pace";

    private final AssistantService assistant;
    private final GeminiClient gemini;
    private final CurrentUser currentUser;

    @Value("${gemini.tts-voice:${GEMINI_TTS_VOICE:Aoede}}")
    private String defaultVoice;

    @Value("${assistant.requests-per-minute:${ASSISTANT_RPM:20}}")
    private int requestsPerMinute;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    /** Recently spoken replies (greetings repeat a lot), so the same audio is not generated twice. */
    private final Map<String, byte[]> speechCache = Collections.synchronizedMap(new LinkedHashMap<>(64, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
            return size() > 60;
        }
    });

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("enabled", gemini.enabled(), "voices", VOICES, "defaultVoice", defaultVoice);
    }

    @PostMapping("/chat")
    public AssistantService.Reply chat(@RequestBody AssistantService.Request req, HttpServletRequest http) {
        limit(http, "chat", requestsPerMinute);
        if (req.messages() == null || req.messages().isEmpty()) throw ApiException.badRequest("Say something first");
        return assistant.chat(req);
    }

    public record SpeechRequest(String text, String voice) {
    }

    @PostMapping(value = "/speech", produces = "audio/wav")
    public ResponseEntity<byte[]> speech(@RequestBody SpeechRequest req, HttpServletRequest http) {
        if (req.text() == null || req.text().isBlank()) throw ApiException.badRequest("Nothing to say");
        String text = req.text().length() > 1200 ? req.text().substring(0, 1200) : req.text();
        String voice = req.voice() != null && VOICE_IDS.contains(req.voice()) ? req.voice() : defaultVoice;
        String key = voice + "|" + text;
        byte[] audio = speechCache.get(key);
        if (audio == null) {
            limit(http, "speech", requestsPerMinute * 2);
            audio = gemini.speak(text, voice, SPEECH_STYLE);
            speechCache.put(key, audio);
        }
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/wav"))
                .cacheControl(CacheControl.noStore()).body(audio);
    }

    /** Fallback speech-to-text for browsers without the Web Speech API. */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> transcribe(@RequestParam("audio") MultipartFile audio, HttpServletRequest http) throws IOException {
        limit(http, "transcribe", requestsPerMinute);
        if (audio.isEmpty()) throw ApiException.badRequest("No audio received");
        if (audio.getSize() > 6 * 1024 * 1024) throw ApiException.badRequest("Recording is too long");
        String type = Optional.ofNullable(audio.getContentType()).orElse("audio/webm").split(";")[0];
        return Map.of("text", gemini.transcribe(audio.getBytes(), type));
    }

    /** Sliding one-minute window per signed-in user, or per IP for visitors. */
    private void limit(HttpServletRequest http, String bucket, int max) {
        String who = currentUser.find().map(u -> "u" + u.getId()).orElse("ip" + http.getRemoteAddr());
        Deque<Long> q = hits.computeIfAbsent(bucket + ":" + who, k -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > 60_000) q.pollFirst();
            if (q.size() >= max) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "You're going a little fast. Please wait a moment and try again.");
            }
            q.addLast(now);
        }
        if (hits.size() > 5000) hits.entrySet().removeIf(e -> e.getValue().isEmpty());
    }
}
