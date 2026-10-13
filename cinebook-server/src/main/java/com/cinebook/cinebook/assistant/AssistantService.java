package com.cinebook.cinebook.assistant;

import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.service.EventService;
import com.cinebook.cinebook.service.MovieService;
import com.cinebook.cinebook.service.TheaterService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Runs one assistant turn: Gemini decides, {@link AssistantTools} acts, and the reply goes back with cards. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantService {

    private static final int MAX_TOOL_ROUNDS = 6;
    private static final int MAX_HISTORY = 24;
    private static final Pattern PAGE = Pattern.compile("^/(movies|events|book|checkout|bookings)/(\\d+)");

    private final GeminiClient gemini;
    private final AssistantTools tools;
    private final CurrentUser currentUser;
    private final MovieService movieService;
    private final EventService eventService;
    private final TheaterService theaterService;
    private final KnowledgeBase knowledgeBase;
    private final ObjectMapper json;

    @Value("${gemini.model:${GEMINI_MODEL:gemini-2.5-flash}}")
    private String chatModel;

    @Value("${app.booking.hold-minutes}")
    private int holdMinutes;

    @Value("${app.booking.max-seats}")
    private int maxSeats;

    public record Message(String role, String text) {
    }

    public record Request(List<Message> messages, String path, String language) {
    }

    public record Card(String type, JsonNode items) {
    }

    public record Reply(String reply, List<Card> cards, List<JsonNode> actions, boolean signedIn) {
    }

    public Reply chat(Request req) {
        AssistantTools.Turn turn = new AssistantTools.Turn(req.path());
        ObjectNode body = json.createObjectNode();
        body.putObject("systemInstruction").putArray("parts").addObject().put("text", systemPrompt(req));
        ArrayNode contents = body.putArray("contents");
        history(req.messages()).forEach(m -> contents.addObject()
                .put("role", "assistant".equals(m.role()) ? "model" : "user")
                .putArray("parts").addObject().put("text", m.text()));
        body.putArray("tools").addObject().set("functionDeclarations", tools.declarations());
        ObjectNode gen = body.putObject("generationConfig").put("temperature", 0.4).put("maxOutputTokens", 1024);
        if (chatModel.startsWith("gemini-2.5-flash")) {
            gen.putObject("thinkingConfig").put("thinkingBudget", 0); // fastest replies for voice
        }

        String text = "";
        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            JsonNode res = gemini.generate(body);
            JsonNode content = res.path("candidates").path(0).path("content");
            if (content.isMissingNode() || !content.has("parts")) {
                String reason = res.path("candidates").path(0).path("finishReason").asText(
                        res.path("promptFeedback").path("blockReason").asText(""));
                log.info("Gemini returned no content ({})", reason);
                break;
            }
            contents.add(content); // keep the model's parts as-is (thought signatures included)

            ArrayNode responses = json.createArrayNode();
            StringBuilder said = new StringBuilder();
            for (JsonNode part : content.path("parts")) {
                if (part.has("functionCall")) {
                    JsonNode call = part.get("functionCall");
                    String name = call.path("name").asText();
                    JsonNode result = tools.run(name, call.path("args"), turn);
                    log.debug("assistant tool {} {} -> {}", name, call.path("args"), abbreviate(result.toString()));
                    ObjectNode fr = responses.addObject().putObject("functionResponse");
                    fr.put("name", name);
                    if (call.has("id")) fr.put("id", call.get("id").asText());
                    fr.putObject("response").set("result", result);
                } else if (part.has("text") && !part.path("thought").asBoolean(false)) {
                    said.append(part.get("text").asText());
                }
            }
            if (responses.isEmpty()) {
                text = said.toString().trim();
                break;
            }
            contents.addObject().put("role", "user").set("parts", responses);
        }

        if (text.isBlank()) {
            text = turn.actions.isEmpty()
                    ? "Sorry, I could not work that out. Could you say it another way?"
                    : "Done.";
        }
        List<Card> cards = turn.cards.entrySet().stream().map(e -> new Card(e.getKey(), e.getValue())).toList();
        return new Reply(clean(text), cards, turn.actions, currentUser.find().isPresent());
    }

    private String systemPrompt(Request req) {
        LocalDateTime now = LocalDateTime.now();
        User user = currentUser.find().orElse(null);

        String movies = movieService.listPublic(null, null, null).stream().limit(40)
                .map(m -> "- movie id " + m.id() + ": " + m.title() + " (" + nz(m.certificate()) + ", " + nz(m.genre())
                        + ", " + nz(m.language()) + ", " + m.duration() + " min, " + m.upcomingShows() + " upcoming shows"
                        + (m.avgRating() == null ? "" : ", rated " + String.format(Locale.ROOT, "%.1f", m.avgRating()) + "/5") + ")")
                .collect(Collectors.joining("\n"));
        String events = eventService.listPublic(null, null).stream().limit(30)
                .map(e -> "- event id " + e.id() + ": " + e.name() + " (" + nz(e.category())
                        + (e.performer() == null ? "" : ", " + e.performer())
                        + (e.nextDate() == null ? ", no dates yet" : ", next " + e.nextDate()) + ")")
                .collect(Collectors.joining("\n"));
        String venues = theaterService.getAllTheaters().stream()
                .map(t -> t.name() + " (" + nz(t.city()) + ")").collect(Collectors.joining("; "));

        return """
                You are the CineBook booking concierge: a calm, warm, highly competent assistant for a cinema and live-event \
                ticketing service in Sri Lanka. You help people find movies and events, choose shows and seats, and book tickets. \
                Many customers talk to you by voice, so your replies are read aloud.

                HOW TO SPEAK
                - Be brief and natural: usually 1-3 short sentences. Sound like a friendly professional at a premium box office.
                - Plain text only. No markdown, bullet lists, emojis, asterisks or headings. Never read out ids or URLs.
                - Say times like "7:30 PM" and dates like "Friday 16 October". Say prices like "LKR 1,500".
                - When there are several options, mention at most 3 out loud; the screen shows cards for the rest.
                - Reply in the customer's language (English, Sinhala or Tamil) - match what they use.
                - Use ASCII hyphens, never long dashes.

                HOW TO BOOK
                1. Identify the movie or event (use the catalog below; call search_catalog for anything unclear or misheard - \
                voice input may garble names, so pick the closest title). When the customer names a title, call open_page to show it.
                2. Find showtimes with get_showtimes (filter by date, venue, time of day). If the customer gave enough detail \
                to pick one show, go on; otherwise offer the best 2-3 choices.
                3. Ask how many seats if not given. Use check_seats to quote the seat class, price and the seats you would pick.
                4. Confirm in one sentence (title, day, time, venue, seats, total) and ask "Shall I hold these for you?".
                5. Only after a clear yes, call hold_seats. The checkout page then opens; tell them the seats are held for \
                %d minutes and they just confirm their details and pay by card there. You never take payment details.
                - If a tool says AUTH_REQUIRED, say they need to sign in first (a button is shown), and that you will continue after.
                - If the customer wants to pick seats themselves, open the seat map (open_page seat_map).
                - Never invent showtimes, prices or availability: only state what tools returned.
                - Max %d seats per booking.

                ANSWERING QUESTIONS
                - For questions about accounts, payment, tickets, refunds, promo codes, check-in or how the assistant works,                 answer from the KNOWLEDGE BASE below. For anything about this customer's own bookings, call get_my_bookings.
                - If neither the knowledge base nor a tool covers it, say you are not sure and suggest what they can do;                 never make up policies, prices, phone numbers or email addresses.
                - Never ask for or accept card numbers, passwords or one-time codes.

                                CONTEXT
                - Now: %s.
                - Customer: %s.
                - Current page: %s.
                - Venues: %s.

                NOW SHOWING
                %s

                EVENTS
                %s

                KNOWLEDGE BASE
                %s
                """.formatted(
                holdMinutes, maxSeats,
                now.format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy, h:mm a", Locale.ENGLISH)),
                user == null ? "not signed in (they must sign in before seats can be held)" : user.getName() + " (signed in)",
                describePage(req.path()),
                venues.isEmpty() ? "none yet" : venues,
                movies.isEmpty() ? "(none)" : movies,
                events.isEmpty() ? "(none)" : events,
                knowledgeBase.text());
    }

    private String describePage(String path) {
        if (path == null || path.isBlank()) return "unknown";
        Matcher m = PAGE.matcher(path);
        if (!m.find()) return path;
        long id = Long.parseLong(m.group(2));
        try {
            return switch (m.group(1)) {
                case "movies" -> "details of movie id " + id + " (" + movieService.getPublicDetail(id).movie().title()
                        + ") - 'this movie' means this one";
                case "events" -> "details of event id " + id + " (" + eventService.getPublicDetail(id).event().name()
                        + ") - 'this event' means this one";
                case "book" -> "seat map of showtime id " + id + " - 'this show' means this showtime";
                case "checkout" -> "checkout of held booking id " + id;
                default -> "booking id " + id;
            };
        } catch (RuntimeException e) {
            return path;
        }
    }

    /** Recent turns only, starting with a user turn, each capped in length. */
    private List<Message> history(List<Message> all) {
        List<Message> msgs = all == null ? List.of() : all.stream()
                .filter(m -> m != null && m.text() != null && !m.text().isBlank())
                .map(m -> new Message(m.role(), m.text().length() > 1500 ? m.text().substring(0, 1500) : m.text()))
                .toList();
        if (msgs.size() > MAX_HISTORY) msgs = msgs.subList(msgs.size() - MAX_HISTORY, msgs.size());
        int first = 0;
        while (first < msgs.size() && "assistant".equals(msgs.get(first).role())) first++;
        return msgs.subList(first, msgs.size());
    }

    /** Spoken replies must not contain markdown or long dashes. */
    private static String clean(String s) {
        return s.replace("**", "").replace("__", "").replace("—", " - ").replace("–", "-")
                .replaceAll("(?m)^\\s*[*#]+\\s*", "").trim();
    }

    private static String nz(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }

    private static String abbreviate(String s) {
        return s.length() > 300 ? s.substring(0, 300) + "..." : s;
    }
}
