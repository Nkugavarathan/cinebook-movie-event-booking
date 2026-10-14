package com.cinebook.cinebook.config;

import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** Creates the admin account and, on an empty database, a demo catalogue so the app is usable at once. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final String TMDB = "https://image.tmdb.org/t/p/w500";

    private final UserRepository userRepo;
    private final MovieRepository movieRepo;
    private final TheaterRepository theaterRepo;
    private final ScreenRepository screenRepo;
    private final SeatRepository seatRepo;
    private final ShowTimeRepository showTimeRepo;
    private final EventRepository eventRepo;
    private final PromoCodeRepository promoRepo;
    private final SnackRepository snackRepo;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.seed-demo-data}")
    private boolean seedDemo;

    @Value("${app.currency}")
    private String currency;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!userRepo.existsByEmailIgnoreCase(adminEmail)) {
            userRepo.save(User.builder()
                    .name("CineBook Admin")
                    .email(adminEmail.toLowerCase())
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .build());
            log.info("Created admin account {}", adminEmail);
        }

        if (seedDemo && movieRepo.count() == 0) {
            seedCatalogue();
        }
        if (seedDemo && eventRepo.count() == 0) {
            seedEvents();
        }
        if (seedDemo && promoRepo.count() == 0) {
            seedPromos();
        }
        if (seedDemo && snackRepo.count() == 0) {
            seedSnacks();
        }
    }

    private void seedSnacks() {
        boolean lkr = "lkr".equalsIgnoreCase(currency);
        snackRepo.saveAll(List.of(
                snack("Regular popcorn", "Popcorn", "Freshly popped, lightly salted", lkr ? "800" : "4"),
                snack("Large caramel popcorn", "Popcorn", "Sweet caramel coating, sharing size", lkr ? "1200" : "6"),
                snack("Cola", "Drinks", "500 ml, chilled", lkr ? "450" : "2.50"),
                snack("Mineral water", "Drinks", "500 ml bottle", lkr ? "200" : "1.50"),
                snack("Nachos with cheese", "Snacks", "Warm tortilla chips with cheese dip", lkr ? "900" : "5"),
                snack("Movie combo for two", "Combos", "Large popcorn + 2 colas", lkr ? "1800" : "9")));
        log.info("Seeded demo snacks");
    }

    private static Snack snack(String name, String category, String description, String price) {
        return Snack.builder().name(name).category(category).description(description)
                .price(new BigDecimal(price)).active(true).build();
    }

    private void seedCatalogue() {
        List<Movie> movies = movieRepo.saveAll(List.of(
                movie("Dune: Part Two", "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                        "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "https://www.youtube.com/watch?v=Way9Dexny3w", 166, "Sci-Fi, Adventure", "English", "PG-13",
                        "Denis Villeneuve", "Timothee Chalamet, Zendaya, Rebecca Ferguson, Austin Butler", LocalDate.of(2024, 3, 1)),
                movie("Oppenheimer", "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.",
                        "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "https://www.youtube.com/watch?v=uYPbbksJxIg", 180, "Drama, History", "English", "R",
                        "Christopher Nolan", "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.", LocalDate.of(2023, 7, 21)),
                movie("Spider-Man: Across the Spider-Verse", "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
                        "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", "https://www.youtube.com/watch?v=shW9i6k8cB0", 140, "Animation, Action", "English", "PG",
                        "Joaquim Dos Santos", "Shameik Moore, Hailee Steinfeld, Oscar Isaac", LocalDate.of(2023, 6, 2)),
                movie("Interstellar", "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                        "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "https://www.youtube.com/watch?v=zSWdZVtXT7E", 169, "Sci-Fi, Drama", "English", "PG-13",
                        "Christopher Nolan", "Matthew McConaughey, Anne Hathaway, Jessica Chastain", LocalDate.of(2014, 11, 7)),
                movie("The Dark Knight", "Batman raises the stakes in his war on crime, facing a criminal mastermind known as the Joker.",
                        "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "https://www.youtube.com/watch?v=EXeTwQWrcwY", 152, "Action, Crime", "English", "PG-13",
                        "Christopher Nolan", "Christian Bale, Heath Ledger, Aaron Eckhart", LocalDate.of(2008, 7, 18)),
                movie("Avatar: The Way of Water", "Jake Sully lives with his newfound family on Pandora. When a familiar threat returns, he must work with Neytiri to protect their home.",
                        "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", "https://www.youtube.com/watch?v=d9MyW72ELq0", 192, "Sci-Fi, Adventure", "English", "PG-13",
                        "James Cameron", "Sam Worthington, Zoe Saldana, Sigourney Weaver", LocalDate.of(2022, 12, 16))
        ));

        Theater grand = theaterRepo.save(Theater.builder().name("CineBook Grand").city("Colombo")
                .address("12 Galle Road, Colombo 03").facilities("Parking,Food Court,Dolby Atmos,Wheelchair Access").build());
        Theater galaxy = theaterRepo.save(Theater.builder().name("Galaxy Cinemas").city("Kandy")
                .address("45 Peradeniya Road, Kandy").facilities("Parking,Snack Bar,3D").build());

        Screen imax = screen(grand, "Screen 1", "IMAX", 10, 16, new int[]{4, 13});
        Screen s2 = screen(grand, "Screen 2", "2D", 8, 12, new int[]{6});
        Screen s3 = screen(galaxy, "Hall A", "3D", 9, 14, new int[]{3, 12});

        BigDecimal[] prices = basePrices();
        List<ShowTime> shows = new ArrayList<>();
        LocalTime[] slots = {LocalTime.of(10, 0), LocalTime.of(13, 45), LocalTime.of(17, 30), LocalTime.of(21, 15)};
        Screen[] screens = {imax, s2, s3};
        for (int day = 0; day < 6; day++) {
            LocalDate date = LocalDate.now().plusDays(day);
            for (int si = 0; si < screens.length; si++) {
                for (int slot = 0; slot < slots.length; slot++) {
                    Movie m = movies.get((day + si * 2 + slot) % movies.size());
                    LocalTime start = slots[slot];
                    if (day == 0 && !LocalDate.now().atTime(start).isAfter(java.time.LocalDateTime.now())) continue;
                    BigDecimal factor = screens[si] == imax ? new BigDecimal("1.25") : BigDecimal.ONE;
                    shows.add(ShowTime.builder()
                            .movie(m).screen(screens[si]).showDate(date).startTime(start)
                            .endTime(start.plusMinutes(m.getDuration()))
                            .priceStandard(prices[0].multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP))
                            .pricePremium(prices[1].multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP))
                            .priceVip(prices[2].multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP))
                            .build());
                }
            }
        }
        showTimeRepo.saveAll(shows);
        log.info("Seeded demo data: {} movies, 2 theaters, 3 screens, {} showtimes", movies.size(), shows.size());
    }

    private void seedEvents() {
        String u = "https://images.unsplash.com/";
        String q = "?w=800&q=80&auto=format&fit=crop";
        List<Event> events = eventRepo.saveAll(List.of(
                event("Symphony Under the Stars", "Concert", "Colombo Symphony Orchestra", 120, "All ages",
                        "An evening of timeless classics - Beethoven, Vivaldi and film scores - performed live by a full orchestra.",
                        u + "photo-1465847899084-d164df4dedc6" + q),
                event("Laugh Out Loud: Stand-up Night", "Comedy", "Top local comedians", 90, "16+",
                        "Five of the island's sharpest stand-up comics, one mic, zero chill. Expect sold-out laughs.",
                        u + "photo-1585699324551-f6c309eedeca" + q),
                event("Hamlet", "Theatre", "Lionel Wendt Players", 150, "12+",
                        "Shakespeare's tragedy of revenge and madness, staged in a bold modern production.",
                        u + "photo-1503095396549-807759245b35" + q),
                event("Electro Pulse Live", "Concert", "DJ Nova & friends", 180, "18+",
                        "A high-energy night of electronic music with a full light show and guest DJs.",
                        u + "photo-1470225620780-dba8ba36b745" + q),
                event("The Great Kids Magic Show", "Kids", "Magician Max", 60, "All ages",
                        "Disappearing rabbits, floating balloons and plenty of audience participation for the little ones.",
                        u + "photo-1530103862676-de8c9debad1d" + q)
        ));

        Theater venue = theaterRepo.save(Theater.builder().name("Nelum Pokuna Theatre").city("Colombo")
                .address("110 Ananda Coomaraswamy Mawatha, Colombo 07").facilities("Parking,Wheelchair Access,Cafe").build());
        Screen mainHall = screen(venue, "Main Hall", "Live", 12, 20, new int[]{5, 16});
        Screen studio = screen(venue, "Studio Stage", "Live", 6, 12, new int[]{6});

        BigDecimal[] base = basePrices();
        BigDecimal mult = new BigDecimal("2.5");
        List<ShowTime> shows = new ArrayList<>();
        for (int day = 1; day <= 14; day++) {
            LocalDate date = LocalDate.now().plusDays(day);
            Event evening = events.get(day % 4);           // the four evening events rotate in the Main Hall
            shows.add(eventShow(evening, mainHall, date, LocalTime.of(19, 0), base, mult));
            if (date.getDayOfWeek().getValue() >= 6) {      // weekend matinee + kids show
                shows.add(eventShow(events.get(4), studio, date, LocalTime.of(11, 0), base, BigDecimal.ONE));
                shows.add(eventShow(events.get(1), studio, date, LocalTime.of(16, 0), base, new BigDecimal("1.5")));
            }
        }
        showTimeRepo.saveAll(shows);
        log.info("Seeded demo events: {} events at {}, {} performances", events.size(), venue.getName(), shows.size());
    }

    private void seedPromos() {
        boolean lkr = "lkr".equalsIgnoreCase(currency);
        promoRepo.save(PromoCode.builder()
                .code("FIRSTSHOW20").description("20% off your first show")
                .discountType(DiscountType.PERCENT).discountValue(new BigDecimal("20"))
                .maxDiscount(new BigDecimal(lkr ? "1000" : "5"))
                .expiresAt(java.time.LocalDateTime.now().plusDays(60))
                .usageLimit(500).perUserLimit(1).active(true).build());
        promoRepo.save(PromoCode.builder()
                .code("WEEKEND500").description(lkr ? "LKR 500 off orders over LKR 3,000" : "3 off orders over 20")
                .discountType(DiscountType.FIXED).discountValue(new BigDecimal(lkr ? "500" : "3"))
                .minOrderAmount(new BigDecimal(lkr ? "3000" : "20"))
                .expiresAt(java.time.LocalDateTime.now().plusDays(30))
                .perUserLimit(3).active(true).build());
        log.info("Seeded demo promo codes FIRSTSHOW20 and WEEKEND500");
    }

    private Event event(String name, String category, String performer, int duration, String age, String description, String poster) {
        return Event.builder().name(name).category(category).performer(performer).duration(duration).ageLimit(age)
                .description(description).posterUrl(poster).language("English").location("Colombo").active(true).build();
    }

    private ShowTime eventShow(Event e, Screen screen, LocalDate date, LocalTime start, BigDecimal[] base, BigDecimal mult) {
        return ShowTime.builder().event(e).screen(screen).showDate(date).startTime(start)
                .endTime(start.plusMinutes(e.getDuration()))
                .priceStandard(base[0].multiply(mult).setScale(2, java.math.RoundingMode.HALF_UP))
                .pricePremium(base[1].multiply(mult).setScale(2, java.math.RoundingMode.HALF_UP))
                .priceVip(base[2].multiply(mult).setScale(2, java.math.RoundingMode.HALF_UP))
                .build();
    }

    /** Sensible ticket prices for the configured currency: standard, premium, VIP. */
    private BigDecimal[] basePrices() {
        return switch (currency.toLowerCase()) {
            case "lkr" -> new BigDecimal[]{new BigDecimal("1500"), new BigDecimal("2200"), new BigDecimal("3500")};
            case "inr" -> new BigDecimal[]{new BigDecimal("250"), new BigDecimal("380"), new BigDecimal("600")};
            default -> new BigDecimal[]{new BigDecimal("9.00"), new BigDecimal("13.00"), new BigDecimal("20.00")};
        };
    }

    private Movie movie(String title, String description, String poster, String trailer, int duration, String genre,
                        String language, String certificate, String director, String cast, LocalDate release) {
        return Movie.builder().title(title).description(description).posterUrl(TMDB + poster).trailerUrl(trailer)
                .duration(duration).genre(genre).language(language).certificate(certificate).director(director)
                .castMembers(cast).releaseDate(release).active(true).build();
    }

    /** Back two rows VIP, middle third premium, aisle columns left empty. */
    private Screen screen(Theater theater, String name, String format, int rows, int cols, int[] aisleCols) {
        Screen screen = screenRepo.save(Screen.builder().theater(theater).screenName(name).format(format)
                .rows(rows).columns(cols).build());
        List<Seat> seats = new ArrayList<>();
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= cols; c++) {
                boolean aisle = false;
                for (int a : aisleCols) aisle |= a == c;
                SeatType type = r > rows - 2 ? SeatType.VIP : (r > rows / 3 ? SeatType.PREMIUM : SeatType.STANDARD);
                seats.add(Seat.builder().screen(screen).rowNumber(r).seatNumber(c).type(type).active(!aisle).build());
            }
        }
        seatRepo.saveAll(seats);
        return screen;
    }
}
