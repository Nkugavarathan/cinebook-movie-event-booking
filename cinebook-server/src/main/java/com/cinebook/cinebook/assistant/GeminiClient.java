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
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thin REST client for the Gemini API. The key stays on the server; the browser only talks to /api/assistant.
 */
@Slf4j
@Component
public class GeminiClient {

    /**
     * Tried in order after the configured model when a model is retired, unavailable for this key or hangs.
     * Google retires model names regularly, so the first one that answers is remembered.
     */
    private static final List<String> CHAT_MODELS = List.of(
            "gemini-3-flash-preview", "gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash");
    private static final List<String> TTS_MODELS = List.of(
            "gemini-3.1-flash-tts-preview", "gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts");
    private static final int TTS_SAMPLE_RATE = 24000;
    private static final Pattern RATE = Pattern.compile("rate=(\\d+)");

    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${gemini.base-url:${GEMINI_BASE_URL:https://generativelanguage.googleapis.com/v1beta/models/}}")
    private String baseUrl;

    @Value("${gemini.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    @Value("${gemini.model:${GEMINI_MODEL:gemini-3-flash-preview}}")
    private String chatModel;

    @Value("${gemini.tts-model:${GEMINI_TTS_MODEL:gemini-3.1-flash-tts-preview}}")
    private String ttsModel;

    /** The model that last answered, per kind, so retired ones are not retried on every message. */
    private final Map<String, String> working = new ConcurrentHashMap<>();

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
        return callWithFallback("chat", chatModel, CHAT_MODELS, body, Duration.ofSeconds(40));
    }

    /** Text to natural speech; returns a WAV file. */
    public byte[] speak(String text, String voice, String style) {
        ObjectNode body = json.createObjectNode();
        String prompt = (style == null || style.isBlank() ? "" : style.trim() + ": ") + text;
        body.putArray("contents").addObject().putArray("parts").addObject().put("text", prompt);
        ObjectNode gen = body.putObject("generationConfig");
        gen.putArray("responseModalities").add("AUDIO");
        gen.putObject("speechConfig").putObject("voiceConfig").putObject("prebuiltVoiceConfig").put("voiceName", voice);

        JsonNode res = callWithFallback("tts", ttsModel, TTS_MODELS, body, Duration.ofSeconds(45));
        ByteArrayOutputStream pcm = new ByteArrayOutputStream();
        int rate = TTS_SAMPLE_RATE;
        for (JsonNode part : res.path("candidates").path(0).path("content").path("parts")) {
            String data = part.path("inlineData").path("data").asText(null);
            if (data == null) continue;
            byte[] bytes = Base64.getDecoder().decode(data);
            String mime = part.path("inlineData").path("mimeType").asText("").toLowerCase();
            if (mime.contains("wav")) return bytes; // already a playable file
            Matcher m = RATE.matcher(mime);
            if (m.find()) rate = Integer.parseInt(m.group(1));
            pcm.writeBytes(bytes);
        }
        if (pcm.size() == 0) throw new ApiException(HttpStatus.BAD_GATEWAY, "The voice service returned no audio");
        return wav(pcm.toByteArray(), rate);
    }

    /** Short audio clip to text (for browsers without built-in speech recognition). */
    public String transcribe(byte[] audio, String mimeType) {
        ObjectNode body = json.createObjectNode();
        ArrayNode parts = body.putArray("contents").addObject().put("role", "user").putArray("parts");
        parts.addObject().put("text", "Transcribe this speech exactly as spoken. It is a customer talking to a "
                + "cinema and event ticket booking assistant. Return only the transcript, no quotes or notes. "
                + "If nothing intelligible is said, return an empty string.");
        parts.addObject().putObject("inlineData").put("mimeType", mimeType).put("data", Base64.getEncoder().encodeToString(audio));
        JsonNode res = callWithFallback("chat", chatModel, CHAT_MODELS, body, Duration.ofSeconds(40));
        StringBuilder out = new StringBuilder();
        for (JsonNode part : res.path("candidates").path(0).path("content").path("parts")) {
            if (!part.path("thought").asBoolean(false)) out.append(part.path("text").asText(""));
        }
        return out.toString().trim();
    }

    private JsonNode callWithFallback(String kind, String configured, List<String> fallbacks, ObjectNode body, Duration timeout) {
        if (!enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is not configured yet");
        }
        Set<String> models = new LinkedHashSet<>();
        if (working.containsKey(kind)) models.add(working.get(kind));
        models.add(configured);
        models.addAll(fallbacks);
        for (String m : models) {
            try {
                JsonNode res = call(m, withModelSettings(m, body), timeout);
                if (!m.equals(working.put(kind, m))) log.info("Gemini {} model in use: {}", kind, m);
                return res;
            } catch (ModelNotFound e) {
                log.warn("Gemini model {} is not available ({}), trying the next one", m, e.getMessage());
                working.remove(kind, m);
            }
        }
        log.error("No Gemini {} model answered. Set GEMINI_{}MODEL in .env to one listed at "
                + "https://ai.google.dev/gemini-api/docs/models", kind, kind.equals("tts") ? "TTS_" : "");
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                "Sorry, the assistant is unavailable right now. You can still book from the Movies and Events pages.");
    }

    /** Per-model request tweaks for quick spoken replies: 2.5 Flash without thinking, Gemini 3 with low thinking. */
    private ObjectNode withModelSettings(String model, ObjectNode body) {
        if (model.contains("tts") || !body.has("tools")) return body;
        ObjectNode thinking;
        if (model.startsWith("gemini-2.5-flash")) thinking = json.createObjectNode().put("thinkingBudget", 0);
        else if (model.startsWith("gemini-3")) thinking = json.createObjectNode().put("thinkingLevel", "low");
        else return body;
        ObjectNode copy = body.deepCopy();
        copy.with("generationConfig").set("thinkingConfig", thinking);
        return copy;
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
            if (res.statusCode() == 404) throw new ModelNotFound("404");
            if (res.statusCode() == 500 || res.statusCode() == 503) throw new ModelNotFound(res.statusCode() + " overloaded or unavailable");
            if (res.statusCode() == 400 && res.body() != null
                    && res.body().matches("(?s).*(not supported|no longer available|is not found|deprecated).*")) {
                throw new ModelNotFound("400 " + abbreviate(res.body()));
            }
            // each model has its own per-minute quota, so a rate-limited model hands over to the next one
            if (res.statusCode() == 429) throw new ModelNotFound("429 rate limited");
            if (res.statusCode() >= 400) {
                String err = res.body() == null ? "" : res.body();
                if (err.contains("CONSUMER_SUSPENDED")) {
                    log.error("Gemini rejected GEMINI_API_KEY: the key has been SUSPENDED by Google. "
                            + "Create a new key at https://aistudio.google.com/apikey and put it in cinebook-server/.env");
                } else if (res.statusCode() == 400 && err.contains("API_KEY_INVALID") || res.statusCode() == 401 || res.statusCode() == 403) {
                    log.error("Gemini rejected GEMINI_API_KEY ({}): {}", res.statusCode(), abbreviate(err));
                } else {
                    log.warn("Gemini {} returned {}: {}", model, res.statusCode(), abbreviate(err));
                }
                // customers never see configuration details
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Sorry, the assistant is unavailable right now. You can still book from the Movies and Events pages.");
            }
            return json.readTree(res.body());
        } catch (ApiException | ModelNotFound e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            throw new ModelNotFound("no answer within " + timeout.toSeconds() + "s");
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
        ModelNotFound(String reason) {
            super(reason, null, false, false);
        }
    }
}
