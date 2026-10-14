package com.cinebook.cinebook.assistant;

import com.cinebook.cinebook.dto.*;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.SeatType;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.service.BookingService;
import com.cinebook.cinebook.service.EventService;
import com.cinebook.cinebook.service.MovieService;
import com.cinebook.cinebook.service.SeatService;
import com.cinebook.cinebook.service.ShowtimeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The actions the assistant may take, exposed to Gemini as function declarations.
 * Every tool goes through the normal services, so the same rules apply as in the app
 * (seat locks, hold limits, ownership). Payment always happens on the checkout page, never here.
 */
@Component
@RequiredArgsConstructor
public class AssistantTools {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH);

    private final MovieService movieService;
    private final EventService eventService;
    private final ShowtimeService showtimeService;
    private final SeatService seatService;
    private final BookingService bookingService;
    private final CurrentUser currentUser;
    private final ObjectMapper json;

    /** Cards and page actions produced during one assistant turn, sent to the browser with the reply. */
    public static final class Turn {
        final Map<String, JsonNode> cards = new LinkedHashMap<>();
        final List<JsonNode> actions = new ArrayList<>();
        /** Ids and facts found this turn, handed back to the model on later turns (never shown). */
        final Map<String, String> notes = new LinkedHashMap<>();
        final String path;

        Turn(String path) {
            this.path = path;
        }
    }

    // ---------------------------------------------------------------- declarations

    public ArrayNode declarations() {
        ArrayNode list = json.createArrayNode();

        fn(list, "search_catalog",
                "Find movies and live events (concerts, comedy, theatre, sports...) by title, performer, genre, language or category. "
                        + "Call with no query to list everything currently showing.",
                props(p -> {
                    str(p, "query", "Words from the title or performer, e.g. 'dune' or 'coldplay'. Optional.");
                    enm(p, "kind", "Limit to movies or events.", "movie", "event", "any");
                    str(p, "genre", "Movie genre, e.g. Action, Drama. Optional.");
                    str(p, "language", "Language, e.g. English, Tamil, Sinhala. Optional.");
                    str(p, "category", "Event category, e.g. Concert, Comedy. Optional.");
                }), List.of());

        fn(list, "get_showtimes",
                "List upcoming bookable showtimes. Give titleId+kind for one movie/event, or leave them out to see "
                        + "everything on a date or at a cinema. Returns showtime ids needed for booking.",
                props(p -> {
                    num(p, "titleId", "Movie id or event id from search_catalog.");
                    enm(p, "kind", "What titleId refers to.", "movie", "event");
                    str(p, "date", "Show date as YYYY-MM-DD. Optional.");
                    str(p, "venue", "Part of the cinema/venue name or city, e.g. 'Scope' or 'Colombo'. Optional.");
                    enm(p, "timeOfDay", "Optional time-of-day filter.", "morning", "afternoon", "evening", "night");
                    str(p, "format", "Screen format such as IMAX, 3D, 4DX. Optional.");
                }), List.of());

        fn(list, "check_seats",
                "Seat availability and prices per seat class for one showtime, plus the best seats the system would pick.",
                props(p -> {
                    num(p, "showtimeId", "Showtime id.");
                    num(p, "quantity", "How many seats the customer wants (for the suggestion). Default 2.");
                    enm(p, "seatType", "Preferred seat class.", "STANDARD", "PREMIUM", "VIP");
                }), List.of("showtimeId"));

        fn(list, "hold_seats",
                "Reserve seats for the signed-in customer for a few minutes and open the secure checkout page to pay. "
                        + "Only call after the customer has clearly confirmed the show, time and number of seats. "
                        + "Picks the best seats together automatically unless exact seat labels are given.",
                props(p -> {
                    num(p, "showtimeId", "Showtime id.");
                    num(p, "quantity", "Number of seats (1-10). Ignored when seatLabels is given.");
                    enm(p, "seatType", "Seat class. Optional; defaults to the best-value block.", "STANDARD", "PREMIUM", "VIP");
                    p.putObject("seatLabels").put("type", "array")
                            .put("description", "Exact seats the customer asked for, e.g. ['F7','F8']. Optional.")
                            .putObject("items").put("type", "string");
                }), List.of("showtimeId"));

        fn(list, "open_page",
                "Take the customer to a page in the app. Use it whenever they want to see a movie, event, seat map, "
                        + "their tickets or a listing.",
                props(p -> {
                    enm(p, "page", "Which page.", "movie", "event", "seat_map", "my_bookings", "booking",
                            "movies", "events", "home");
                    num(p, "id", "Movie id, event id, showtime id (seat_map) or booking id, when the page needs one.");
                }), List.of("page"));

        fn(list, "get_my_bookings",
                "The signed-in customer's bookings (upcoming first), with status, seats, refund eligibility and check-in.",
                props(p -> {
                }), List.of());

        return list;
    }

    // ---------------------------------------------------------------- execution

    public JsonNode run(String name, JsonNode args, Turn turn) {
        try {
            return switch (name) {
                case "search_catalog" -> searchCatalog(args, turn);
                case "get_showtimes" -> showtimes(args, turn);
                case "check_seats" -> checkSeats(args, turn);
                case "hold_seats" -> holdSeats(args, turn);
                case "open_page" -> openPage(args, turn);
                case "get_my_bookings" -> myBookings(turn);
                default -> error("Unknown tool " + name);
            };
        } catch (ApiException e) {
            if (e.getStatus() == HttpStatus.UNAUTHORIZED) return signInRequired(turn);
            return error(e.getMessage());
        } catch (RuntimeException e) {
            return error("That did not work: " + e.getMessage());
        }
    }

    private JsonNode searchCatalog(JsonNode a, Turn turn) {
        String kind = text(a, "kind", "any");
        String query = text(a, "query", null);
        ArrayNode results = json.createArrayNode();
        ArrayNode cards = json.createArrayNode();

        if (!"event".equals(kind)) {
            List<MovieSummaryDTO> movies = movieService.listPublic(query, text(a, "genre", null), text(a, "language", null));
            if (movies.isEmpty() && query != null) movies = fuzzyMovies(query);
            for (MovieSummaryDTO m : movies) {
                ObjectNode r = results.addObject();
                r.put("kind", "movie").put("id", m.id()).put("title", m.title()).put("genre", m.genre())
                        .put("language", m.language()).put("certificate", m.certificate())
                        .put("durationMinutes", m.duration()).put("upcomingShows", m.upcomingShows());
                if (m.avgRating() != null) r.put("rating", round1(m.avgRating())).put("reviews", m.reviewCount());
                if (m.director() != null) r.put("director", m.director());
                cards.addObject().put("kind", "movie").put("id", m.id()).put("title", m.title())
                        .put("poster", m.posterUrl())
                        .put("meta", join(" · ", m.certificate(), m.genre(), m.language(), m.duration() + " min"))
                        .put("rating", m.avgRating() == null ? null : round1(m.avgRating()))
                        .put("path", "/movies/" + m.id());
            }
        }
        if (!"movie".equals(kind)) {
            List<EventSummaryDTO> events = eventService.listPublic(text(a, "category", null), query);
            for (EventSummaryDTO e : events) {
                ObjectNode r = results.addObject();
                r.put("kind", "event").put("id", e.id()).put("title", e.name()).put("category", e.category())
                        .put("performer", e.performer()).put("venues", e.venues()).put("upcomingShows", e.upcomingShows());
                if (e.nextDate() != null) r.put("nextDate", e.nextDate().toString());
                if (e.fromPrice() != null) r.put("fromPrice", e.fromPrice()).put("currency", e.currency());
                cards.addObject().put("kind", "event").put("id", e.id()).put("title", e.name())
                        .put("poster", e.posterUrl())
                        .put("meta", join(" · ", e.category(), e.performer(),
                                e.nextDate() == null ? null : e.nextDate().format(DAY)))
                        .put("rating", e.avgRating() == null ? null : round1(e.avgRating()))
                        .put("path", "/events/" + e.id());
            }
        }
        if (cards.size() > 0 && cards.size() <= 8) putCards(turn, "titles", cards);
        if (results.size() > 0 && results.size() <= 12) {
            StringBuilder n = new StringBuilder();
            results.forEach(r -> n.append(r.path("kind").asText()).append(" id ").append(r.path("id").asText())
                    .append(" = ").append(r.path("title").asText()).append("; "));
            turn.notes.put("titles", n.toString());
        }
        ObjectNode out = json.createObjectNode();
        out.put("count", results.size()).set("results", results);
        if (results.isEmpty()) {
            out.put("note", "Nothing matched. Voice input may have misheard the name - these are all titles showing:");
            ArrayNode all = out.putArray("allTitles");
            movieService.listPublic(null, null, null).forEach(m -> all.addObject().put("kind", "movie").put("id", m.id()).put("title", m.title()));
            eventService.listPublic(null, null).forEach(e -> all.addObject().put("kind", "event").put("id", e.id()).put("title", e.name()));
        }
        return out;
    }

    /** Loose title match for misheard voice input ("doon" -> "Dune"). */
    private List<MovieSummaryDTO> fuzzyMovies(String query) {
        String q = normalize(query);
        return movieService.listPublic(null, null, null).stream()
                .filter(m -> similarity(q, normalize(m.title())) >= 0.6
                        || Arrays.stream(normalize(m.title()).split(" ")).filter(w -> w.length() > 2)
                        .anyMatch(w -> Arrays.stream(q.split(" ")).anyMatch(qw -> similarity(qw, w) >= 0.7 || soundsLike(qw, w))))
                .toList();
    }

    private JsonNode showtimes(JsonNode a, Turn turn) {
        Long titleId = longOrNull(a, "titleId");
        String kind = text(a, "kind", "movie");
        LocalDate date = dateOrNull(text(a, "date", null));
        String venue = lower(text(a, "venue", null));
        String timeOfDay = text(a, "timeOfDay", null);
        String format = lower(text(a, "format", null));

        List<ShowtimeResponseDTO> all;
        if (titleId != null) {
            all = "event".equals(kind) ? eventService.getPublicDetail(titleId).showtimes()
                    : movieService.getPublicDetail(titleId).showtimes();
        } else {
            all = showtimeService.search(null, null, null, null, date);
        }
        LocalDateTime now = LocalDateTime.now();
        List<ShowtimeResponseDTO> shows = all.stream()
                .filter(s -> LocalDateTime.of(s.showDate(), s.startTime()).isAfter(now))
                .filter(ShowtimeResponseDTO::bookable)
                .filter(s -> date == null || date.equals(s.showDate()))
                .filter(s -> venue == null || lower(s.theaterName()).contains(venue) || lower(s.city()).contains(venue))
                .filter(s -> format == null || lower(s.format()).contains(format))
                .filter(s -> timeOfDay == null || timeOfDay.equals(partOfDay(s.startTime())))
                .sorted(Comparator.comparing(ShowtimeResponseDTO::showDate).thenComparing(ShowtimeResponseDTO::startTime))
                .toList();

        ArrayNode results = json.createArrayNode();
        ArrayNode cards = json.createArrayNode();
        for (ShowtimeResponseDTO s : shows.stream().limit(25).toList()) {
            results.addObject().put("showtimeId", s.id()).put("title", s.movieTitle())
                    .put("date", s.showDate().toString()).put("day", s.showDate().format(DAY))
                    .put("time", s.startTime().format(TIME)).put("venue", s.theaterName()).put("city", s.city())
                    .put("screen", s.screenName()).put("format", s.format())
                    .put("priceStandard", s.priceStandard()).put("pricePremium", s.pricePremium())
                    .put("priceVip", s.priceVip()).put("currency", s.currency())
                    .put("seatsLeft", s.availableSeats() == null ? 0 : s.availableSeats());
        }
        for (ShowtimeResponseDTO s : shows.stream().limit(12).toList()) {
            cards.addObject().put("id", s.id()).put("title", s.movieTitle())
                    .put("day", s.showDate().format(DAY)).put("time", s.startTime().format(TIME))
                    .put("venue", s.theaterName()).put("city", s.city()).put("format", s.format())
                    .put("from", s.priceStandard()).put("currency", s.currency())
                    .put("seatsLeft", s.availableSeats() == null ? 0 : s.availableSeats())
                    .put("path", "/book/" + s.id());
        }
        if (cards.size() > 0) putCards(turn, "showtimes", cards);
        if (!shows.isEmpty()) {
            turn.notes.put("showtimes", shows.stream().limit(15)
                    .map(s -> "showtimeId " + s.id() + " = " + s.movieTitle() + ", " + s.showDate().format(DAY) + " "
                            + s.startTime().format(TIME) + ", " + s.theaterName() + (s.format() == null ? "" : " " + s.format()))
                    .collect(Collectors.joining("; ")));
        }
        ObjectNode out = json.createObjectNode();
        out.put("count", shows.size()).set("showtimes", results);
        if (shows.size() > 25) out.put("note", "Only the first 25 are listed; narrow by date, venue or time of day.");
        if (shows.isEmpty()) out.put("note", "No upcoming bookable shows match. Try another date or remove filters.");
        return out;
    }

    private JsonNode checkSeats(JsonNode a, Turn turn) {
        long showtimeId = a.path("showtimeId").asLong();
        int qty = clamp(a.path("quantity").asInt(2));
        SeatMapDTO map = seatService.getSeatMap(showtimeId);
        ObjectNode out = json.createObjectNode();
        out.put("showtimeId", showtimeId).put("title", map.showtime().movieTitle())
                .put("when", map.showtime().showDate().format(DAY) + " " + map.showtime().startTime().format(TIME))
                .put("venue", map.showtime().theaterName()).put("maxSeatsPerBooking", map.maxSeats())
                .put("holdMinutes", map.holdMinutes()).put("currency", map.showtime().currency());
        ObjectNode classes = out.putObject("seatClasses");
        for (SeatType t : SeatType.values()) {
            List<SeatDTO> ofType = map.seats().stream().filter(s -> s.type() == t && s.active()).toList();
            if (ofType.isEmpty()) continue;
            long free = ofType.stream().filter(s -> "AVAILABLE".equals(s.status())).count();
            classes.putObject(t.name()).put("available", free).put("total", ofType.size())
                    .put("price", ofType.get(0).price());
        }
        SeatType pref = seatType(a);
        List<SeatDTO> best = bestSeats(map, qty, pref);
        if (!best.isEmpty()) {
            out.put("suggestedSeats", best.stream().map(SeatDTO::label).collect(Collectors.joining(", ")))
                    .put("suggestedClass", best.get(0).type().name())
                    .put("suggestedTotal", best.stream().map(SeatDTO::price).reduce(BigDecimal.ZERO, BigDecimal::add));
            out.put("together", adjacent(best));
            turn.notes.put("quote", "quoted showtimeId " + showtimeId + " (" + out.path("title").asText() + ", "
                    + out.path("when").asText() + "): seats " + out.path("suggestedSeats").asText() + ", "
                    + out.path("suggestedClass").asText() + ", quantity " + qty + ", total " + out.path("suggestedTotal").asText());
        } else {
            out.put("note", "Not enough free seats" + (pref == null ? "" : " in " + pref.name()) + " for " + qty + ".");
        }
        return out;
    }

    private JsonNode holdSeats(JsonNode a, Turn turn) {
        if (currentUser.find().isEmpty()) return signInRequired(turn);
        long showtimeId = a.path("showtimeId").asLong();
        SeatMapDTO map = seatService.getSeatMap(showtimeId);

        List<SeatDTO> chosen;
        List<String> labels = new ArrayList<>();
        a.path("seatLabels").forEach(n -> labels.add(n.asText().trim().toUpperCase().replace(" ", "")));
        if (!labels.isEmpty()) {
            Map<String, SeatDTO> byLabel = map.seats().stream()
                    .collect(Collectors.toMap(s -> s.label().toUpperCase(), s -> s, (x, y) -> x));
            chosen = new ArrayList<>();
            for (String l : labels) {
                SeatDTO s = byLabel.get(l);
                if (s == null) return error("Seat " + l + " does not exist in this hall.");
                if (!"AVAILABLE".equals(s.status())) return error("Seat " + l + " is already taken. Offer the best available seats instead.");
                chosen.add(s);
            }
        } else {
            int qty = clamp(a.path("quantity").asInt(1));
            if (qty > map.maxSeats()) return error("At most " + map.maxSeats() + " seats can be booked at once.");
            chosen = bestSeats(map, qty, seatType(a));
            if (chosen.isEmpty()) return error("Not enough free seats for " + qty + (seatType(a) == null ? "" : " in " + seatType(a)) + ".");
        }

        BookingResponseDTO b = bookingService.hold(new BookingRequestDTO(showtimeId, chosen.stream().map(SeatDTO::id).toList()));
        putCards(turn, "booking", bookingCard(b));
        turn.notes.put("held", "held bookingId " + b.id() + " (" + b.reference() + ") for showtimeId " + showtimeId
                + ": seats " + b.seatLabels() + ", total " + b.totalAmount());
        action(turn, "/checkout/" + b.id(), "Opening secure checkout");

        ObjectNode out = json.createObjectNode();
        out.put("status", "HELD").put("bookingId", b.id()).put("reference", b.reference())
                .put("seats", b.seatLabels()).put("total", b.totalAmount()).put("currency", b.currency())
                .put("holdExpiresAt", b.expiresAt() == null ? null : b.expiresAt().toLocalTime().format(TIME))
                .put("next", "The checkout page is now open. The customer confirms name, email and mobile, can add a "
                        + "promo code, then pays securely by card. The seats are held until the time shown.");
        return out;
    }

    private JsonNode openPage(JsonNode a, Turn turn) {
        String page = text(a, "page", "home");
        Long id = longOrNull(a, "id");
        String path = switch (page) {
            case "movie" -> id == null ? null : "/movies/" + id;
            case "event" -> id == null ? null : "/events/" + id;
            case "seat_map" -> id == null ? null : "/book/" + id;
            case "booking" -> id == null ? null : "/bookings/" + id;
            case "my_bookings" -> "/bookings";
            case "movies" -> "/movies";
            case "events" -> "/events";
            default -> "/";
        };
        if (path == null) return error("That page needs an id.");
        if ((path.startsWith("/bookings")) && currentUser.find().isEmpty()) return signInRequired(turn);
        action(turn, path, null);
        return json.createObjectNode().put("opened", path);
    }

    private JsonNode myBookings(Turn turn) {
        if (currentUser.find().isEmpty()) return signInRequired(turn);
        LocalDateTime now = LocalDateTime.now();
        List<BookingResponseDTO> mine = bookingService.myBookings();
        // upcoming shows soonest first, then past shows most recent first
        List<BookingResponseDTO> all = new ArrayList<>(mine.stream().filter(b -> start(b).isAfter(now))
                .sorted(Comparator.comparing(AssistantTools::start)).toList());
        all.addAll(mine.stream().filter(b -> !start(b).isAfter(now))
                .sorted(Comparator.comparing(AssistantTools::start).reversed()).toList());
        all = all.stream().limit(15).toList();
        ArrayNode list = json.createArrayNode();
        ArrayNode cards = json.createArrayNode();
        for (BookingResponseDTO b : all) {
            ShowtimeResponseDTO s = b.showtime();
            list.addObject().put("bookingId", b.id()).put("reference", b.reference()).put("status", b.status().name())
                    .put("title", s.movieTitle()).put("when", s.showDate().format(DAY) + " " + s.startTime().format(TIME))
                    .put("upcoming", start(b).isAfter(now)).put("venue", s.theaterName()).put("seats", b.seatLabels())
                    .put("total", b.totalAmount()).put("currency", b.currency())
                    .put("refundable", b.refundable())
                    .put("refundDeadline", b.refundDeadline() == null ? null : b.refundDeadline().toString())
                    .put("checkedIn", b.checkedInAt() != null);
            if (cards.size() < 4 && start(b).isAfter(now) && !"CANCELLED".equals(b.status().name())
                    && !"EXPIRED".equals(b.status().name())) {
                cards.add(bookingCard(b));
            }
        }
        if (cards.size() > 0) putCards(turn, "bookings", cards);
        ObjectNode out = json.createObjectNode();
        out.put("count", list.size()).set("bookings", list);
        out.put("howToRefund", "Refunds are done by the customer on the booking's page (open_page booking) with the "
                + "Cancel and refund button, until the refund deadline.");
        return out;
    }

    // ---------------------------------------------------------------- seat picking

    /**
     * Best block of seats next to each other: as central as possible, about two thirds back from the screen.
     * Falls back to the best individual seats when no block is free.
     */
    List<SeatDTO> bestSeats(SeatMapDTO map, int qty, SeatType pref) {
        List<SeatDTO> free = map.seats().stream()
                .filter(s -> s.active() && "AVAILABLE".equals(s.status()))
                .filter(s -> pref == null || s.type() == pref)
                .toList();
        if (free.size() < qty) return List.of();
        double idealRow = Math.max(1, map.rows() * 0.62);
        double centerCol = (map.columns() + 1) / 2.0;

        List<SeatDTO> bestBlock = null;
        double bestScore = Double.MAX_VALUE;
        Map<Integer, List<SeatDTO>> rows = free.stream().collect(Collectors.groupingBy(SeatDTO::row));
        for (List<SeatDTO> row : rows.values()) {
            List<SeatDTO> sorted = row.stream().sorted(Comparator.comparingInt(SeatDTO::col)).toList();
            for (int i = 0; i + qty <= sorted.size(); i++) {
                List<SeatDTO> block = sorted.subList(i, i + qty);
                if (!adjacent(block) || block.stream().map(SeatDTO::type).distinct().count() > 1) continue;
                double mid = (block.get(0).col() + block.get(qty - 1).col()) / 2.0;
                double score = Math.abs(mid - centerCol) / Math.max(1, map.columns())
                        + Math.abs(block.get(0).row() - idealRow) / Math.max(1, map.rows()) * 1.2
                        // without a requested class, prefer the cheaper class when quality is similar
                        + (pref == null ? block.get(0).type().ordinal() * 0.08 : 0);
                if (score < bestScore) {
                    bestScore = score;
                    bestBlock = block;
                }
            }
        }
        if (bestBlock != null) return new ArrayList<>(bestBlock);
        return free.stream()
                .sorted(Comparator.comparingDouble(s -> Math.abs(s.col() - centerCol) / Math.max(1, map.columns())
                        + Math.abs(s.row() - idealRow) / Math.max(1, map.rows())))
                .limit(qty).toList();
    }

    private static boolean adjacent(List<SeatDTO> seats) {
        for (int i = 1; i < seats.size(); i++) {
            if (seats.get(i).row() != seats.get(0).row() || seats.get(i).col() != seats.get(i - 1).col() + 1) return false;
        }
        return true;
    }

    // ---------------------------------------------------------------- helpers

    private ObjectNode bookingCard(BookingResponseDTO b) {
        ShowtimeResponseDTO s = b.showtime();
        ObjectNode c = json.createObjectNode();
        c.put("id", b.id()).put("reference", b.reference()).put("status", b.status().name())
                .put("title", s.movieTitle()).put("poster", s.moviePosterUrl())
                .put("when", s.showDate().format(DAY) + " · " + s.startTime().format(TIME))
                .put("venue", s.theaterName() + (s.screenName() == null ? "" : " · " + s.screenName()))
                .put("seats", b.seatLabels()).put("total", b.totalAmount()).put("currency", b.currency())
                .put("expiresAt", b.expiresAt() == null ? null : b.expiresAt().toString())
                .put("path", "PENDING".equals(b.status().name()) ? "/checkout/" + b.id() : "/bookings/" + b.id());
        return c;
    }

    private JsonNode signInRequired(Turn turn) {
        ObjectNode act = json.createObjectNode().put("type", "login").put("path", "/login").put("label", "Sign in to continue");
        turn.actions.add(act);
        return error("AUTH_REQUIRED: the customer must sign in first. A sign-in button is shown to them; "
                + "after signing in they can continue this conversation.");
    }

    private void action(Turn turn, String path, String label) {
        if (path.equals(turn.path)) return;
        turn.actions.removeIf(n -> "navigate".equals(n.path("type").asText()));
        turn.actions.add(json.createObjectNode().put("type", "navigate").put("path", path).put("label", label));
    }

    private void putCards(Turn turn, String type, JsonNode items) {
        turn.cards.remove(type);
        turn.cards.put(type, items);
    }

    private ObjectNode error(String message) {
        return json.createObjectNode().put("error", message);
    }

    private void fn(ArrayNode list, String name, String desc, ObjectNode params, List<String> required) {
        ObjectNode f = list.addObject().put("name", name).put("description", desc);
        if (!required.isEmpty()) required.forEach(r -> params.withArray("required").add(r));
        // Gemini rejects an object schema without properties, so parameterless tools send none
        if (!params.path("properties").isEmpty()) f.set("parameters", params);
    }

    private ObjectNode props(java.util.function.Consumer<ObjectNode> body) {
        ObjectNode schema = json.createObjectNode().put("type", "object");
        body.accept(schema.putObject("properties"));
        return schema;
    }

    private static void str(ObjectNode p, String name, String desc) {
        p.putObject(name).put("type", "string").put("description", desc);
    }

    private static void num(ObjectNode p, String name, String desc) {
        p.putObject(name).put("type", "integer").put("description", desc);
    }

    private static void enm(ObjectNode p, String name, String desc, String... values) {
        ObjectNode o = p.putObject(name).put("type", "string").put("description", desc);
        ArrayNode e = o.putArray("enum");
        for (String v : values) e.add(v);
    }

    private static String text(JsonNode a, String field, String def) {
        String v = a.path(field).asText("");
        return v.isBlank() ? def : v.trim();
    }

    private static Long longOrNull(JsonNode a, String field) {
        JsonNode n = a.path(field);
        return n.isNumber() || (n.isTextual() && n.asText().matches("\\d+")) ? n.asLong() : null;
    }

    private static LocalDate dateOrNull(String s) {
        try {
            return s == null ? null : LocalDate.parse(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static SeatType seatType(JsonNode a) {
        try {
            String v = a.path("seatType").asText("");
            return v.isBlank() ? null : SeatType.valueOf(v.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static int clamp(int qty) {
        return Math.max(1, Math.min(10, qty));
    }

    private static LocalDateTime start(BookingResponseDTO b) {
        return LocalDateTime.of(b.showtime().showDate(), b.showtime().startTime());
    }

    private static String partOfDay(LocalTime t) {
        int h = t.getHour();
        return h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
    }

    private static String lower(String s) {
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }

    private static String join(String sep, String... parts) {
        return Arrays.stream(parts).filter(p -> p != null && !p.isBlank()).collect(Collectors.joining(sep));
    }

    private static String normalize(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    /** Same consonant skeleton, e.g. "doon" / "dune", "avenjers" / "avengers". */
    private static boolean soundsLike(String a, String b) {
        if (a.length() < 3 || b.length() < 3) return false;
        String ka = skeleton(a), kb = skeleton(b);
        return ka.length() >= 2 && (ka.equals(kb) || similarity(ka, kb) >= 0.75);
    }

    private static String skeleton(String w) {
        String s = w.charAt(0) + w.substring(1).replaceAll("[aeiouyhw]", "");
        s = s.replace("ph", "f").replace("ck", "k").replace('c', 'k').replace('q', 'k').replace('z', 's').replace('j', 'g');
        return s.replaceAll("(.)\\1+", "$1");
    }

    /** 1 - normalised Levenshtein distance. */
    private static double similarity(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] t = prev;
            prev = cur;
            cur = t;
        }
        return 1.0 - (double) prev[b.length()] / Math.max(a.length(), b.length());
    }
}
