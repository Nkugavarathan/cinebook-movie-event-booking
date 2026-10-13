package com.cinebook.cinebook.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.cinebook.cinebook.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Thin REST client for the Gemini API. The key stays on the server; the browser only talks to /api/assistant.
 */
@Slf4j
@Component
public class GeminiClient {

    /** Used when the configured model is unknown to the API (e.g. a retired preview name). */
    private static final String FALLBACK_CHAT_MODEL = "gemini-2.5-flash";
    private static final String FALLBACK_TTS_MODEL = "gemini-2.5-flash-preview-tts";
    private static final int TTS_SAMPLE_RATE = 24000;

    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${gemini.base-url:${GEMINI_BASE_URL:https://generativelanguage.googleapis.com/v1beta/models/}}")
    private String baseUrl;

    @Value("${gemini.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    @Value("${gemini.model:${GEMINI_MODEL:gemini-2.5-flash}}")
    private String chatModel;

    @Value("${gemini.tts-model:${GEMINI_TTS_MODEL:gemini-2.5-flash-preview-tts}}")
    private String ttsModel;

    public GeminiClient(ObjectMapper json) {
        this.json = json;
    }

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public ObjectMapper json() {
        return json;
    }

    /** One generateContent call on the chat model; returns the raw response. */
    public JsonNode generate(ObjectNode body) {
        return callWithFallback(chatModel, FALLBACK_CHAT_MODEL, body, Duration.ofSeconds(45));
    }

    /** Text to natural speech; returns a WAV file. */
    public byte[] speak(String text, String voice, String style) {
        ObjectNode body = json.createObjectNode();
        String prompt = (style == null || style.isBlank() ? "" : style.trim() + ": ") + text;
        body.putArray("contents").addObject().putArray("parts").addObject().put("text", prompt);
        ObjectNode gen = body.putObject("generationConfig");
        gen.putArray("responseModalities").add("AUDIO");
        gen.putObject("speechConfig").putObject("voiceConfig").putObject("prebuiltVoiceConfig").put("voiceName", voice);

        JsonNode res = callWithFallback(ttsModel, FALLBACK_TTS_MODEL, body, Duration.ofSeconds(60));
        ByteArrayOutputStream pcm = new ByteArrayOutputStream();
        for (JsonNode part : res.path("candidates").path(0).path("content").path("parts")) {
            String data = part.path("inlineData").path("data").asText(null);
            if (data != null) pcm.writeBytes(Base64.getDecoder().decode(data));
        }
        if (pcm.size() == 0) throw new ApiException(HttpStatus.BAD_GATEWAY, "The voice service returned no audio");
        return wav(pcm.toByteArray(), TTS_SAMPLE_RATE);
    }

    /** Short audio clip to text (for browsers without built-in speech recognition). */
    public String transcribe(byte[] audio, String mimeType) {
        ObjectNode body = json.createObjectNode();
        ArrayNode parts = body.putArray("contents").addObject().put("role", "user").putArray("parts");
        parts.addObject().put("text", "Transcribe this speech exactly as spoken. It is a customer talking to a "
                + "cinema and event ticket booking assistant. Return only the transcript, no quotes or notes. "
                + "If nothing intelligible is said, return an empty string.");
        parts.addObject().putObject("inlineData").put("mimeType", mimeType).put("data", Base64.getEncoder().encodeToString(audio));
        JsonNode res = callWithFallback(chatModel, FALLBACK_CHAT_MODEL, body, Duration.ofSeconds(45));
        StringBuilder out = new StringBuilder();
        for (JsonNode part : res.path("candidates").path(0).path("content").path("parts")) {
            if (!part.path("thought").asBoolean(false)) out.append(part.path("text").asText(""));
        }
        return out.toString().trim();
    }

    private JsonNode callWithFallback(String model, String fallback, ObjectNode body, Duration timeout) {
        if (!enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is not configured yet");
        }
        Set<String> models = new LinkedHashSet<>(List.of(model, fallback));
        ApiException last = null;
        for (String m : models) {
            try {
                return call(m, body, timeout);
            } catch (ModelNotFound e) {
                log.warn("Gemini model {} is not available, trying the next one", m);
                last = new ApiException(HttpStatus.BAD_GATEWAY, "The assistant model is not available");
            }
        }
        throw last;
    }

    private JsonNode call(String model, ObjectNode body, Duration timeout) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + model + ":generateContent"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 404) throw new ModelNotFound();
            if (res.statusCode() == 429) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "The assistant is busy right now. Please try again in a moment.");
            }
            if (res.statusCode() >= 400) {
                log.warn("Gemini {} returned {}: {}", model, res.statusCode(), abbreviate(res.body()));
                throw new ApiException(HttpStatus.BAD_GATEWAY, res.statusCode() == 400 || res.statusCode() == 403
                        ? "The assistant could not be reached. Check GEMINI_API_KEY on the server."
                        : "The assistant is unavailable right now. Please try again.");
            }
            return json.readTree(res.body());
        } catch (ApiException | ModelNotFound e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant request was interrupted");
        } catch (Exception e) {
            log.warn("Gemini call failed: {}", e.toString());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The assistant is unavailable right now. Please try again.");
        }
    }

    /** Wraps 16-bit mono little-endian PCM in a WAV header so browsers can play it directly. */
    static byte[] wav(byte[] pcm, int sampleRate) {
        ByteBuffer b = ByteBuffer.allocate(44 + pcm.length).order(ByteOrder.LITTLE_ENDIAN);
        b.put("RIFF".getBytes()).putInt(36 + pcm.length).put("WAVE".getBytes());
        b.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) 1)
                .putInt(sampleRate).putInt(sampleRate * 2).putShort((short) 2).putShort((short) 16);
        b.put("data".getBytes()).putInt(pcm.length).put(pcm);
        return b.array();
    }

    private static String abbreviate(String s) {
        return s == null ? "" : s.length() > 400 ? s.substring(0, 400) + "..." : s;
    }

    private static final class ModelNotFound extends RuntimeException {
    }
}
