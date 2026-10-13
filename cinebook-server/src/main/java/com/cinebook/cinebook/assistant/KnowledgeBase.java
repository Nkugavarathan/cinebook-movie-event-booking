package com.cinebook.cinebook.assistant;

import com.cinebook.cinebook.service.RefundPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;

/**
 * Help-centre facts for the assistant, from assistant/knowledge-base.md. Set ASSISTANT_KB_FILE to use
 * an edited copy on disk instead (re-read when it changes, no restart needed).
 * {placeholders} are filled from the live settings so the text never disagrees with the app.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KnowledgeBase {

    private static final String BUNDLED = "assistant/knowledge-base.md";

    private final RefundPolicy refundPolicy;

    @Value("${assistant.knowledge-file:${ASSISTANT_KB_FILE:}}")
    private String overrideFile;

    @Value("${app.currency}")
    private String currency;

    @Value("${app.booking.hold-minutes}")
    private int holdMinutes;

    @Value("${app.booking.max-seats}")
    private int maxSeats;

    @Value("${app.payment.min-amount:200}")
    private String minPayable;

    private String cached;
    private long cachedStamp = -1;

    public synchronized String text() {
        String raw = read();
        String fee = refundPolicy.feePercent().signum() == 0
                ? "The full amount is refunded."
                : "A " + refundPolicy.feePercent().stripTrailingZeros().toPlainString()
                + "% cancellation fee is kept; the rest is refunded.";
        String money = currency.toUpperCase(Locale.ROOT);
        Map<String, String> values = Map.of(
                "{currency}", money,
                "{holdMinutes}", String.valueOf(holdMinutes),
                "{maxSeats}", String.valueOf(maxSeats),
                "{minPayable}", money + " " + minPayable,
                "{refundCutoffHours}", String.valueOf(refundPolicy.cutoffHours()),
                "{refundFeeText}", fee);
        for (Map.Entry<String, String> e : values.entrySet()) raw = raw.replace(e.getKey(), e.getValue());
        return raw;
    }

    private String read() {
        try {
            if (overrideFile != null && !overrideFile.isBlank()) {
                Path p = Path.of(overrideFile);
                if (Files.isReadable(p)) {
                    long stamp = Files.getLastModifiedTime(p).toMillis();
                    if (cached == null || stamp != cachedStamp) {
                        cached = Files.readString(p, StandardCharsets.UTF_8);
                        cachedStamp = stamp;
                    }
                    return cached;
                }
                log.warn("ASSISTANT_KB_FILE {} is not readable, using the bundled knowledge base", overrideFile);
            }
            if (cached == null || cachedStamp != 0) {
                cached = new String(new ClassPathResource(BUNDLED).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                cachedStamp = 0;
            }
            return cached;
        } catch (IOException e) {
            log.warn("Knowledge base could not be read: {}", e.getMessage());
            return "";
        }
    }
}
