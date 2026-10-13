# CineBook knowledge base

Facts the booking assistant may use when answering customers. Edit freely; values in curly brackets
are filled in from the server settings. Keep answers consistent with this file - if something
is not covered here or by the live tools, say you are not sure instead of guessing.

## About CineBook
- CineBook sells tickets for movies at partner cinemas and for live events (concerts, comedy,
  theatre, kids shows and more) at partner venues in Sri Lanka.
- Everything is booked online: on the website or by asking this assistant by chat or voice.
- Prices are shown and charged in {currency}.

## Accounts
- Browsing movies, events and showtimes works without an account.
- To book, the customer needs a free account: tap "Get started", enter name, email and a password.
- Signing in: "Sign in" at the top right. Passwords can be shown or hidden with the eye button.
- CineBook staff never ask for or see passwords. There is no self-service password reset yet;
  if a customer cannot sign in, they can create a new account with another email.
- Accounts that break the rules can be blocked by CineBook; blocked accounts cannot sign in.

## Finding a show
- Movies page: search by title, filter by genre and language.
- Each movie page lists showtimes by date and cinema, with filters for price range, show time of
  day (morning, afternoon, evening, night) and a cinema search. "Seats left" is live.
- Events page: filter by category (Theatre, Concert, Comedy, Kids...). Each event lists its dates
  and venues.
- Age ratings are shown on each movie (for example U, U/A, PG-13, A). The ages for events are
  shown on the event page.
- Ratings: customers who attended can rate a movie or event 1-5 stars with a comment; the average
  appears on cards and detail pages.

## Seats
- Seat classes: Standard, Premium and VIP, each with its own price per show. VIP and Premium are
  usually the better positioned rows.
- The seat map shows free seats, seats someone else is currently paying for (striped, "held") and
  sold seats. It refreshes every few seconds.
- Up to {maxSeats} seats per booking. For more, make a second booking.
- The assistant can pick the best seats automatically: the most central block of seats side by
  side, about two thirds back from the screen. Customers can also choose seats themselves on the
  seat map.

## Holding seats and paying
- When seats are selected they are held for {holdMinutes} minutes so nobody else can take them.
  A countdown shows on the checkout page. If time runs out the seats are released and the customer
  can start again.
- Checkout asks for the ticket holder's name, email and mobile number, then payment.
- Payment is on Stripe's secure hosted page: credit and debit cards, plus Apple Pay and Google Pay
  where the device supports them. CineBook never sees or stores card numbers.
- The assistant never takes card details. Never ask for or accept card numbers in chat.
- If payment fails or is cancelled, no money is taken and the seats stay held until the timer ends,
  so the customer can try again.
- The same seat can never be sold twice; if two people pick it at the same moment, only one hold
  succeeds and the other is asked to choose again.

## Promo codes
- Enter a promo code on the checkout page ("Have a promo code?") before paying.
- Codes can be a percentage or a fixed amount off, and may have an expiry date, a minimum order,
  a total usage limit and a per-customer limit. The checkout explains why a code does not apply.
- The discount is shown on the order summary and on the payment page. The smallest amount that can
  be paid after a discount is {minPayable}.
- Only one code per booking. Codes cannot be added after payment.

## Tickets
- After payment the ticket PDF (with QR code) is emailed automatically to the checkout email.
- Tickets are always available under "My Tickets", where they can be viewed, printed, downloaded
  as PDF or emailed again.
- At the venue, show the QR code (on the phone or printed). Staff scan it at the door; each ticket
  can be used once. The booking code (like CB-ABC1234) can be typed in if the QR cannot be scanned.
- Didn't get the email? Check spam, then use "Email ticket" on the ticket page to send it again.

## Cancellations and refunds
- Customers can cancel a paid ticket themselves until {refundCutoffHours} hours before the show
  starts, from the ticket page ("Cancel and refund"). {refundFeeText}
- The money goes back to the original card through Stripe, usually within 5-10 business days
  depending on the bank. A refund confirmation email is sent.
- After the deadline, or once the ticket has been checked in, tickets cannot be refunded.
- The assistant cannot cancel or refund on the customer's behalf; it opens the ticket page where
  the customer confirms.
- If CineBook or the venue cancels a booking, the full amount is refunded automatically and the
  customer is emailed.
- An unpaid hold can be released any time from the checkout page at no cost, or simply left to
  expire.

## Using the assistant
- Customers can type or talk - both work in the same conversation. Tap the microphone to speak;
  replies to spoken questions are read aloud and the assistant listens again for the answer.
- The speaker button turns spoken replies on or off. The menu lets customers pick a voice, the
  speech language (English, Sinhala, Tamil), download the conversation, or clear it.
- Conversations are kept only in the customer's browser tab and are cleared when the tab closes or
  when they choose "Clear conversation".
