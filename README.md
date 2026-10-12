# 🎬 CineBook – Movie Ticket Booking Platform

CineBook is a full-stack cinema booking system: customers browse movies, pick seats on a live seat map, pay with **Stripe Checkout** and get a QR e-ticket. Admins manage movies, theaters, screen seat layouts, showtimes and bookings (including refunds) from a separate dashboard.

| App | Path | URL | Stack |
|---|---|---|---|
| API server | `cinebook-server` | http://localhost:8080 | Java 17, Spring Boot 3.2, Spring Security (JWT), JPA, MySQL/MariaDB, Stripe Java SDK |
| Customer site | `cinebook-client` | http://localhost:5173 | React 19, Vite, Tailwind CSS 4 |
| Admin dashboard | `cinebook-admin` | http://localhost:5174 | React 19, Vite, Tailwind CSS 4 |

---

## Features

**Customers**
- Browse, search and filter movies by genre and language; trailer playback
- Showtimes grouped by date and cinema, with live "seats left"
- Interactive seat map with Standard / Premium / VIP pricing, aisles, held and sold seats (refreshes every 15 s)
- Seats are **held for 10 minutes** while you pay; the countdown is shown at checkout
- Secure payment on Stripe's hosted checkout (cards, Apple Pay, Google Pay)
- My Tickets (upcoming / past / cancelled) and a printable ticket with QR code

**Admins**
- Dashboard: revenue, tickets sold, 7-day revenue chart, top movies, recent bookings
- Movies CRUD (poster preview, active/hidden flag)
- Theaters CRUD, with each theater's screens
- **Seat layout designer**: set rows × seats, paint seat types per seat/row/column, mark gaps and aisles
- Showtimes: schedule several start times at once, with per-tier prices and automatic clash detection (movie runtime + 15 min turnaround), plus a seat occupancy view
- Bookings: search and filter, view details, cancel a hold, or **cancel and refund through Stripe**

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
      C[Customer site :5173]
      A[Admin dashboard :5174]
    end
    C -- REST + JWT --> S
    A -- REST + JWT (ADMIN) --> S
    S[Spring Boot API :8080] -- JPA --> DB[(MySQL / MariaDB)]
    S -- create session / retrieve / refund --> ST[Stripe API]
    C -- redirect to pay --> SC[Stripe Checkout]
    SC -- redirect back /payment/success --> C
    ST -- webhook checkout.session.* --> S
```

### Booking and payment flow

```mermaid
sequenceDiagram
    participant U as Customer
    participant API as CineBook API
    participant DB as Database
    participant S as Stripe
    U->>API: POST /api/bookings {showTimeId, seatIds}
    API->>DB: insert booking (PENDING, expires +10 min) + booking_seat rows (locked = TRUE)
    Note over DB: unique(show_time_id, seat_id, locked) rejects a double booking -> 409
    U->>API: POST /api/payments/checkout/{id}
    API->>S: create Checkout Session (metadata.bookingId)
    API-->>U: session.url
    U->>S: pays on hosted page
    S-->>U: redirect /payment/success?session_id=...
    U->>API: POST /api/payments/confirm {sessionId}
    API->>S: retrieve session (server-side check)
    API->>DB: PENDING -> CONFIRMED (row lock, idempotent)
    S->>API: webhook checkout.session.completed (signed)
    API->>DB: already CONFIRMED -> no-op; event id stored to ignore duplicates
```

### How double booking is prevented
- Each held or booked seat is a `booking_seat` row with `locked = TRUE`. The unique key `(show_time_id, seat_id, locked)` means only one live booking can own a seat. Released rows get `locked = NULL`, and NULLs never collide, so history is kept.
- Two people clicking the same seat at the same moment: one insert wins and the other gets **HTTP 409** ("seat was just taken"). Tested with 8 parallel requests: 1 success, 7 conflicts.
- A scheduled job (every 30 s) expires unpaid holds and frees their seats. Expired holds for a showtime are also released before each new hold.

### Payment safety
- The browser never marks anything as paid. A booking is confirmed only after the server reads a `paid` Checkout Session **from Stripe**, via the signed webhook or via `/api/payments/confirm`, which re-fetches the session.
- The amount and currency are checked against the booking; a mismatch is refunded.
- Webhook signatures are verified, and processed event ids are stored, so **duplicate notifications are ignored**.
- Confirmation takes a row lock (`SELECT ... FOR UPDATE`), so the webhook and the redirect can race safely.
- Payment arriving after a hold expired: if the seats are still free the booking is confirmed; otherwise the payment is **refunded automatically**.

---

## Setup

### Prerequisites
- Java 17+, Maven 3.9+
- Node 20+
- MySQL 8 or MariaDB 10.4+ (XAMPP works). The database `cinebook` is created automatically.
- A Stripe account (test mode)

### 1. Server
```bash
cd cinebook-server
cp .env.example .env        # then edit .env
mvn spring-boot:run
```
`.env` (gitignored):
```properties
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # optional locally, see below
APP_CURRENCY=usd                  # or lkr, inr, eur...
DB_USERNAME=root
DB_PASSWORD=
JWT_SECRET=a-long-random-string-of-32+-characters
```
On first start the server:
- creates the admin account **admin@cinebook.com / Admin@123** (change it with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- seeds demo data (6 movies, 2 theaters, 3 screens, about 60 showtimes over the next 6 days) if there are no movies. Disable with `SEED_DEMO_DATA=false`.

> `src/main/resources/application.properties` is listed in `.gitignore`. It no longer contains secrets (they come from `.env`), so you can commit it if you want others to be able to run the project.

### 2. Customer site
```bash
cd cinebook-client
npm install
npm run dev        # http://localhost:5173
```

### 3. Admin dashboard
```bash
cd cinebook-admin
npm install
npm run dev        # http://localhost:5174
```
Both apps read `VITE_API_URL` (default `http://localhost:8080/api`).

### 4. Stripe webhooks (optional locally)
Bookings are confirmed through the success-page redirect even without webhooks. To test webhooks too:
```bash
stripe login
stripe listen --forward-to localhost:8080/api/payments/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET and restart the server
```
Events handled: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`.

**Test cards:** `4242 4242 4242 4242` (success), `4000 0000 0000 9995` (declined); any future expiry date and any CVC.

---

## API reference

All responses are JSON. Errors look like `{"status":409,"error":"Conflict","message":"..."}`.

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | `{name,email,password}` → `{token,id,name,email,role}` |
| POST | `/api/auth/login` | `{email,password}` → token |
| GET | `/api/movies?search=&genre=&language=` | Active movies |
| GET | `/api/movies/{id}` | Movie + upcoming showtimes (with seats left) |
| GET | `/api/theaters`, `/api/theaters/{id}` | Theaters |
| GET | `/api/showtimes/{id}` | Showtime details |
| GET | `/api/showtimes/{id}/seats` | Seat map: each seat's type, price and `AVAILABLE` / `HELD` / `BOOKED` status |
| GET | `/api/payments/config` | Whether Stripe is configured |
| POST | `/api/payments/webhook` | Stripe webhook (signature verified) |

### Signed-in user (`Authorization: Bearer <token>`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user |
| POST | `/api/bookings` | Hold seats `{showTimeId, seatIds}` → PENDING booking (409 if a seat is taken) |
| GET | `/api/bookings/my` | My bookings |
| GET | `/api/bookings/{id}` | One of my bookings |
| POST | `/api/bookings/{id}/cancel` | Release an unpaid hold |
| POST | `/api/payments/checkout/{bookingId}` | Create a Stripe Checkout Session → `{url}` |
| POST | `/api/payments/confirm` | `{sessionId}`; the server verifies with Stripe and confirms |

### Admin (`ROLE_ADMIN`; others get 403)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | KPIs, 7-day revenue, top movies, recent bookings |
| GET/POST | `/api/admin/movies` | List / create |
| GET/PUT/DELETE | `/api/admin/movies/{id}` | Read / update / delete (refused if it has bookings) |
| GET/POST | `/api/admin/theaters` | List / create |
| GET/PUT/DELETE | `/api/admin/theaters/{id}` | Read / update / delete |
| GET/POST | `/api/admin/screens?theaterId=` | List / create with seat layout |
| GET/PUT/DELETE | `/api/admin/screens/{id}` | Layout / update (resizing is blocked once showtimes exist) / delete |
| GET/POST | `/api/admin/showtimes?movieId=&theaterId=&date=` | List / create several start times (clash-checked) |
| GET | `/api/admin/showtimes/{id}/seats` | Occupancy |
| DELETE | `/api/admin/showtimes/{id}` | Delete (refused if it has bookings) |
| GET | `/api/admin/bookings?status=&q=` | Search bookings |
| GET | `/api/admin/bookings/{id}` | Booking details |
| POST | `/api/admin/bookings/{id}/cancel` | Cancel a hold, or cancel and refund via Stripe |

---

## Data model

```mermaid
erDiagram
    USERS ||--o{ BOOKING : places
    MOVIES ||--o{ SHOW_TIME : "is shown in"
    THEATER ||--o{ SCREEN : has
    SCREEN ||--o{ SEAT : contains
    SCREEN ||--o{ SHOW_TIME : hosts
    SHOW_TIME ||--o{ BOOKING : "is booked for"
    BOOKING ||--o{ BOOKING_SEAT : includes
    SEAT ||--o{ BOOKING_SEAT : "is reserved as"
    BOOKING_SEAT {
        bigint show_time_id
        bigint seat_id
        bit locked "TRUE while held or booked, NULL when released"
    }
```

Booking statuses: `PENDING` (held, awaiting payment) → `CONFIRMED` | `EXPIRED` | `CANCELLED`; `CONFIRMED` → `REFUNDED`.
