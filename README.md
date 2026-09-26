# RoomWise

**Guests book the exact room they want. Housekeeping gets that exact room ready in time.**

RoomWise is a small tool for independent hotels, resorts and BnBs. It does two connected things:

1. **Exact-room booking.** A guest picks their dates, browses a floor plan, compares rooms side by side, and books *Room 403*, not "a Deluxe Room".
2. **Turnover queue.** Housekeeping sees every room that needs cleaning, sorted by how much time is left before its next guest arrives.

The guest's choice becomes the room staff must prepare, and the arrival time they book is what sets that room's priority.

---

## Try it

| | |
|---|---|
| **Live demo** | https://roomwise-five.vercel.app |
| **Guest side** | Browsing and comparing rooms is open to everyone. To **book**, sign in with your email: we send a 6-digit code (no password). No inbox handy? Use **`guest@demo.roomwise`**, whose code is shown on screen. |
| **Staff side: admin** | Click **Housekeeping Ops** and log in with username **`admin`**, password **`roomwise-staff-demo`**. Sees every room, **assigns** dirty rooms to housekeepers, **approves** cleaned rooms (or sends them back), and manages staff accounts (**Team**). |
| **Staff side: housekeepers** | **`ramesh`** / **`ramesh-demo-2026`** and **`sunita`** / **`sunita-demo-2026`**. Each sees only the rooms assigned to them: **Start cleaning → Cleaning done**. |
| **Reset** | Demo data is shared by everyone who opens it. It re-seeds itself automatically when it is more than 6 hours old, so the queue always shows a realistic "this morning". Staff can also click **Reset demo**. |

**A 2-minute walkthrough**

1. **Pick the room.** On the guest side, keep tonight's dates. Floor 4 shows Rooms 401 and 403 at the same ₹5,000 price. Click **+ Compare** on both, then **Compare Specs Side-by-Side**. The comparison highlights that 403 has a pool view, a balcony and a bathtub.
2. **Book it.** Click book on **403**. You'll be asked to sign in with an email code (or use `guest@demo.roomwise`), then you can book, optionally with early check-in. **My bookings** in the top bar lists your stays.
3. **Assign it (admin).** Open **Housekeeping Ops** and log in as `admin`. Room 403 now has your arrival time and priority, and nobody assigned. Assign it to Ramesh.
4. **Clean it (housekeeper).** Log out, then log in as `ramesh`. He sees only his rooms. **Start cleaning → Cleaning done.**
5. **Approve it (admin).** Log in as `admin` again and **Approve** Room 403. The front desk gets a (simulated) "guest may enter" message. Each person's **messages** show only what was sent to them.
6. **Try to double-book it.** Back on the guest side, 403 now shows *Booked for your dates*. Change the dates and it becomes available again.

---

## 1. The problem, and why I believe it's real

**Guests book a category, but they experience a specific room.** Two "Deluxe" rooms at the same price can differ in view, balcony, bathtub, size and distance from the lift. Most booking flows hide this, so the guest learns what they got only at the front desk.

This is a real gap, and I don't think I've invented it:

- **Large chains already sell exact-room choice as a feature.** Hilton lets Honors members choose a room from floor-plan maps during digital check-in, and the app shows photos plus attributes such as floor and distance from the elevator ([Hospitality Technology](https://hospitalitytech.com/hilton-rolls-out-digital-check-inout-room-selection-and-customization-across-4000-properties), [The Frugal South walkthrough](https://www.thefrugalsouth.com/how-to-check-in-select-your-room-in-the-hilton-honors-app/)).
- **Guests will pay for it.** TUI BLUE charges **€10 per room per night** to reserve an exact room number from an interactive hotel map ([TUI BLUE blog](https://blog.tui-blue.com/en/select-your-preferred-room/)). A resort chain charging for this suggests the demand is real, and it's revenue an independent property could capture too.
- **Otherwise a request is only a request.** Consumer guides warn that room preferences typed into a booking are "subject to availability". A paid, confirmed selection is the only reliable way to get a specific room ([Travel Fine Print](https://travelfineprint.com/hotel-room-type-vs-room-request/)).

Independent properties usually don't have a chain's app team. This feature is the part I'm making available to them.

**Promising a specific room creates an operations problem.** Once a guest is promised Room 403 from 12:00, *that* room has to be ready by 12:00. Swapping in another Deluxe room is no longer an option. Industry writing on housekeeping bottlenecks describes the same failure: when staffing is tight, "room readiness becomes unpredictable" and "early arrivals may be forced to wait longer for check-in" ([Hotel Management Network](https://www.hotelmanagement-network.com/features/how-housekeeping-bottlenecks-affect-hotel-performance/)). A queue ordered by checkout time or room number cleans the wrong room first.

That's why RoomWise combines both halves: exact-room booking is only safe to offer if the turnover side is tied to it.

**Honest limit of my research:** my evidence is public sources, not interviews with hotel staff. Before building further, the first thing I'd do is talk to 3–5 front-desk or housekeeping leads at independent properties to confirm how they prioritize today.

## 2. Users and workflow

| | Before | With RoomWise |
|---|---|---|
| **Guest** (Ananya, booking a weekend) | Books "Deluxe". At check-in gets a city-view room with no balcony, while the pool-view room on the same floor at the same price went to someone else. | Picks dates, compares 401 and 403 side by side, and books **403**. The confirmation names the room. |
| **Housekeeping supervisor** (admin) | Works from a printed departures list. Assigns rooms by shouting down the corridor or by WhatsApp. Has to walk the floors to find out which rooms are finished. | Sees every room sorted by **slack**, with unassigned rooms flagged. Assigns each one from a dropdown, gets a message when a room is done, then **approves** it or **sends it back**. |
| **Housekeeper** (Ramesh) | Gets rooms in room-number order. Doesn't know which guest arrives first. | Sees only *their* rooms, most urgent first. Two buttons: **Start cleaning** and **Cleaning done**. |

**Separation of duties.** The server enforces who can make each status change, not just the UI:

| Change | Who |
|---|---|
| Assign / reassign (only while *Needs cleaning*) | Admin |
| Needs cleaning → Cleaning → Cleaned | The assigned housekeeper only |
| Cleaned → Ready (approve) or → Cleaning (send back) | Admin only |

Each simulated WhatsApp message goes to an inbox: `admin`, `frontdesk`, or a housekeeper's username. Housekeepers see only their own messages, and the admin sees all of them.

**How the priority is computed** (a pure function, see [`lib/priority.ts`](lib/priority.ts)):

```
slack = next arrival − max(now, checkout time) − remaining work
remaining work = cleaning estimate (minus time already spent) + 10 min inspection
URGENT ≤ 30 min · HIGH ≤ 90 min · NORMAL above · LOW if no guest is booked in
```

The `max(now, checkout)` term matters. A room whose guest hasn't checked out yet can't be cleaned early, so it may be more urgent than a room that is already empty. Early check-in isn't hard-coded as "urgent". It moves the arrival to 12:00, and the arrival time alone raises the room's priority. The example from my original brief (402 must outrank 403) is a unit test.

## 3. Architecture

```
Browser (Next.js client components)
   │  fetch JSON
   ▼
Next.js Route Handlers  /api/rooms  /api/bookings  /api/staff/*  /api/auth/*
   │  zod validation → service functions (lib/server/*) → pure rules (lib/priority.ts, lib/booking-rules.ts)
   ▼
MongoDB Atlas   rooms · bookings · room_nights · tasks · notifications
```

**Stack and why**

- **Next.js 14 (App Router) + TypeScript.** UI and API live in one deployable app. For a tool this size, a separate backend would add deploy complexity without buying anything.
- **MongoDB Atlas.** Rooms have uneven attribute lists (amenities, images), which fit documents well. The free tier is enough for a demo. I use the plain driver rather than Mongoose, because a few typed helpers were all I needed.
- **zod.** One schema per API input, plus shared limits (e.g. max stay) used by the date pickers. Invalid dates, bad emails and injected objects (`{"$ne": null}`) are rejected before any query runs.
- **Vitest.** For the logic that must be right: the priority, time and booking rules (20 tests).

**Data model**

| Collection | Holds | Notes |
|---|---|---|
| `rooms` | Physical attributes plus the current housekeeping status | `_id` like `room_403` |
| `bookings` | Guest, stay dates, expected arrival, price | Price = nightly rate × nights, plus the early check-in fee |
| `room_nights` | One document per room per booked night | **Unique index on `(roomId, night)`**. See below. |
| `tasks` | One turnover per room: status, checkout time, next arrival | Stores *facts only*. Priority and slack are computed when read, so they never go stale. |
| `notifications` | Log of simulated SMS/WhatsApp messages | |

**Preventing double booking.** Checking "is it free?" and then inserting would let two guests who click at the same moment both get Room 403. Instead, a booking *claims* each night by inserting into `room_nights`, and the unique index makes MongoDB reject the second claim. If any night fails, the booking releases the nights it already claimed and returns `409`. I tested this with 5 simultaneous requests for the same room: exactly 1 succeeded.

**Housekeeping status changes** can only move one step (Dirty → Cleaning → Inspection → Ready). The update includes the expected current status in its filter, so if two housekeepers tap at once, the second gets a clear "someone else just updated this" message and can't skip inspection.

**Auth.** There are two separate kinds of login:

- **Guests** sign in without a password. They enter their email, receive a **6-digit code**, and type it in. The first sign-in creates the account. Details:
  - Codes are stored only as an HMAC, never as the code itself.
  - A code expires after 10 minutes and works only once.
  - Five wrong tries cancel the code.
  - Guests have to wait 60 seconds before asking for a new code.
  - A MongoDB TTL index deletes old codes automatically.
  - A booking always takes the guest's name and email from the signed-in session, never from the request body, so nobody can book under someone else's name.
  - Emails are sent through Gmail SMTP. One demo address (`guest@demo.roomwise`) shows its code on screen, so reviewers can test without an inbox.

The staff side has two roles:

- **Admin.** The admin's password comes from an environment variable, so a new deployment can never be locked out. Only the admin can create or remove staff accounts and reset the demo.
- **Housekeepers.** The admin creates their accounts and hands over the username and password in person. The admin plans and inspects but never cleans, so the API refuses to let the admin start or finish a clean, and refuses to let a housekeeper touch rooms that aren't assigned to them. Staff don't sign themselves up and there's no email step, which matches how small hotels onboard staff. Passwords are stored as **scrypt hashes with a per-user salt**, and the API never returns them.

Logging in issues an **HMAC-signed, httpOnly, SameSite cookie** that holds the username and role and expires after 12 hours (one shift). Housekeeper sessions are re-checked against the database on each request, so removing someone locks them out immediately. Secrets live in environment variables, never in git (see `.env.example`).

**Failure handling.** Every route goes through one wrapper that turns errors into JSON (`400/401/404/409/503`). The UI shows these inline, with retry buttons and loading/empty states. If the database is unreachable, users see "Database is unavailable" rather than a crashed page. The staff view polls every 15 s. If a refresh fails, it keeps showing the last data and says so.

**Multi-tenancy.** None, deliberately: this is one demo property. The next step would be a `propertyId` on every document, part of every index, and taken from the staff session.

## 4. What I left out or simplified, and what's next

**Left out on purpose**

- **Payments.** The confirmation says "pay at hotel". Real payment would need a Razorpay/Stripe checkout and a way to handle abandoned holds.
- **PMS / channel-manager sync.** In reality, OTA bookings would also claim `room_nights`. This is the biggest piece before RoomWise could be used for real.
- **Real SMS/WhatsApp.** Messages are logged and shown in the UI, clearly labelled *simulated*.
- **Cancelling or changing a booking.** Guests can see their bookings, but changes go through the hotel.
- **Login rate limiting and password reset.** The admin can remove an account and create a new one instead.
- **Modelling check-out.** A turnover's `checkoutAt` comes from the seed data. A real version would create a turnover automatically from each departing booking.

**Simplified**

- Cleaning estimate is a fixed number per room, and inspection takes 10 minutes. The next step would be to learn both from actual history.
- Same-day bookings made after the standard check-in time assume the guest arrives one hour after booking.
- Times use IST, for one property.
- The early check-in fee is flat, with no limit on how many are sold per day.

**Next, in order**

1. Talk to 3–5 housekeeping leads to check the priority rule against how they really decide.
2. Add `propertyId` multi-tenancy, booking cancellation, and a proper transactional email provider with a verified domain (instead of Gmail SMTP).
3. Add an iCal/channel-manager import so bookings from other channels block nights too.
4. Cap early check-ins by housekeeping capacity: only sell a 12:00 arrival if the queue can absorb it.
5. Learn cleaning times from actual Start → Inspection durations.

## 5. Trade-offs made under the deadline

| Decision | Why | Cost |
|---|---|---|
| Kept the existing UI and replaced the logic underneath it | The prototype UI already covered the flow. The weak part was that priority was hard-coded and data lived only in `localStorage`, so a booking never reached the staff side on another device. | Some visual flourishes remain from the prototype |
| One shared demo database, with the seed anchored to "now" | Reviewers see a realistic morning rush whenever they open it | Reviewers can see each other's test bookings. **Reset demo** fixes this |
| Admin-created staff accounts; passwordless email-code login for guests | Staff get real identities with admin control. Guests have no password to forget or leak | Guest login depends on Gmail SMTP (daily sending limits), so the demo address exists as a fallback |
| Polling instead of websockets | 15 s delay is fine for housekeeping, and it works on serverless hosting | Not instant |
| Claiming nights one by one instead of a transaction | Correct under races on any MongoDB tier, and simple to reason about | A crash halfway could leave orphaned nights (rare; would need a cleanup job) |
| Kept secondary features (damage report, CSV export, print) | They were already built and cost nothing to keep | Not the focus. The core is booking → queue → ready |

---

## Run locally

```bash
git clone https://github.com/RudraShrivastava14/roomwise.git
cd roomwise
npm install
cp .env.example .env.local   # fill in MONGODB_URI, STAFF_PASSWORD, SESSION_SECRET
npm run dev                  # http://localhost:3000 (empty DB is seeded automatically)
npm test                     # unit tests
```

Generate a session secret with `openssl rand -base64 48`.

## Project layout

```
app/
  page.tsx                 guest / staff shell
  api/                     route handlers (rooms, bookings, auth, staff)
components/                floor plan, room cards, comparison, booking modal, staff queue, login
lib/
  priority.ts              slack + priority (pure, tested)
  booking-rules.ts         pricing + expected arrival (pure, tested)
  validation.ts            zod schemas for every API input
  time.ts                  IST date helpers (tested)
  seed.ts                  demo property, times relative to now
  store.ts                 client state hook calling the API
  server/                  db, auth, bookings, housekeeping services
```

Demo property photos are from Unsplash. The hotel "Grand Azure Resort" is fictional.
