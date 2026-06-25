# Alphagallery Library — Handoff Document
*Last updated: June 25, 2026*

## What we're building

A private lending library at Davide's apartment in Tokyo. People browse books online, book a visit, come pick up a book, return it within 45 days. The project lives under the Alphagallery umbrella — a broader cultural space Davide is developing (private library, future exhibitions, etc).

---

## Key facts

**Domain:** alphagallery.co (registered on Cloudflare)
**Instagram:** @alphagallery.co
**GitHub repo:** github.com/da5ide/alphalibrary (private)
**Vercel project:** alphalibrary (alphalibrary.vercel.app)
**Local folder:** ~/alphalibrary
**Supabase project:** lldmgalcgrmghsqlrmjp.supabase.co
**Supabase anon key:** sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ
**Email for notifications:** da5ide+alphalibrary@gmail.com (temporary; switching to library@alphagallery.co once Resend is set up)
**Email service:** Resend (account being set up — not yet complete)

---

## Current repo structure

```
alphalibrary/
  public/
    catalog/
      index.html        ← private cataloging tool (alphalibrary.vercel.app/catalog)
  api/
    identify.js         ← Vercel serverless function, proxies Anthropic API for AI book identification
```

The public-facing site (alphagallery.co/library) has NOT been built yet. That's the next major task.

---

## Database (Supabase)

**Table: books**
- id (uuid, PK)
- created_at (timestamptz)
- title (text, required)
- author (text)
- publisher (text)
- type (text) — 'book' or 'magazine'
- category (text) — 'art', 'fashion', 'architecture', 'design', 'photography', 'other'
- description (text)
- notes (text, private — never shown publicly)
- price (numeric) — private, never shown publicly
- link (text)
- cover_url (text) — first photo URL, kept in sync with photo_urls[0]
- photo_urls (text[]) — up to 6 photos, for catalog tool only, never shown publicly
- available (boolean, default true)
- borrower (text) — name of current borrower
- borrower_contact (text) — email/phone of current borrower
- borrowed_at (timestamptz)
- due_at (timestamptz)
- private (boolean, default false) — hides from public site
- instagram_url (text) — NOT YET ADDED, planned

**Pending schema changes:**
- Add `instagram_url text` column
- Change `category` from single text to `tags text[]` (multi-tag support)
- These will require a migration + retroactive AI re-tagging pass

**Storage bucket:** covers (public) — stores book photos from cataloging tool

**Current data:** 51 books cataloged, all available, none private

---

## Cataloging tool (done)

Live at: alphalibrary.vercel.app/catalog
File: public/catalog/index.html (single HTML file, no framework)

Flow: Take up to 6 photos → tap "Identify with AI" → Claude Vision fills in fields → review/correct → save

Key implementation details:
- Images compressed client-side (canvas, 800px wide, 70% JPEG quality) before sending to API — necessary to stay under Vercel's 4.5MB serverless function body limit
- AI call goes through /api/identify.js (Vercel serverless) to avoid CORS — requires ANTHROPIC_API_KEY env var in Vercel
- Writes directly to Supabase via REST API using anon key
- Private toggle (purple) hides book from public site
- Available toggle (green) controls lending status

---

## Public site (next task — not yet built)

**URL structure:**
- alphagallery.co/library — catalog page (public)
- alphagallery.co/library/borrow/[book-id] — booking page (passphrase required)
- alphagallery.co/library/admin — slot management (admin password required)

**Stack:** Next.js (App Router) + Supabase + Vercel + Resend (email)

**Catalog page features:**
- Short "about" blurb at top explaining the library
- Search (title, author, publisher)
- Filter by tags (toggleable pills)
- Sort: title A-Z, most recently added
- Each book: title, author, publisher, tags, description, year, IG icon (if instagram_url set), Borrow button (disabled if unavailable or private)
- No cover images shown publicly — text/typography only

**Borrow page features:**
- Book title pre-filled
- Name + email fields
- Available time slots (from admin-managed list)
- Guidelines text (see below)
- Passphrase field — required to confirm booking
- If no slots available: "No available dates yet — check back soon"
- Confirm / Back to catalog

**Guidelines text (Davide's words, lightly edited):**
- All items are free to borrow
- Only one item per person at any given time
- You must come pick up the item yourself (exact address sent via email after booking)
- You're not obligated to bring anything in exchange, unless it's a book or magazine you'd like to share
- Please cancel via email if you can no longer make your visit
- Please return the item within 45 days, either by post or by dropping it in the mailbox
- We trust you'll take good care of the items you borrow

**Email flows (via Resend):**
1. Booking confirmation → visitor (includes book title, time slot, reminder about guidelines)
2. Day-before reminder → visitor
3. 30-day return reminder → visitor (sent automatically 30 days after borrow_date)
4. New booking notification → Davide (da5ide+alphalibrary@gmail.com / library@alphagallery.co)

**Admin slot management:**
- Simple page at /library/admin (password protected)
- Add/remove time slots (date + time window, e.g. "2026/07/05 14:00-15:00")
- If no future slots exist, borrow page shows "no available dates" message

**Passphrase system:**
- One passphrase controls access to the booking flow
- Davide posts it on Instagram Stories occasionally
- Stored as env var in Vercel (LIBRARY_PASSPHRASE)

---

## Planned future work (logged, not started)

1. **Multi-tag support** — replace single `category` with `tags text[]`, update catalog tool, run retroactive AI re-tagging batch
2. **Price + link batch fill** — script that loops through all books, sends title/author/publisher to Claude, asks for publisher link and reference price, writes back to Supabase
3. **Instagram URL field** — add `instagram_url` to schema and catalog tool; show IG icon on public site per book
4. **Alphagallery.co root site** — the library is at /library; the root domain will eventually host a broader Alphagallery presence (gallery, events, etc)

---

## Key decisions made

- No cover images on public site — typography only
- Catalog photos (up to 6 per book) are private reference only
- Price and notes fields are private, never surfaced publicly
- Deposit book mechanic (bring a book to exchange) is encouraged but not tracked in system
- Single passphrase for booking access, not per-user accounts
- English only (no Japanese)
- Resend for email (free tier sufficient)
- Next.js App Router for public site (consistent with Davide's Listicco experience)

---

## Vercel env vars needed

Already set:
- ANTHROPIC_API_KEY (set, working)

Still needed:
- RESEND_API_KEY (pending Resend setup)
- LIBRARY_PASSPHRASE (to be chosen by Davide)
- ADMIN_PASSWORD (to be chosen by Davide)

---

## DNS (Cloudflare)

- alphagallery.co registered and managed on Cloudflare
- Not yet pointed at Vercel — needs CNAME record added once Next.js site is deployed
- Resend domain verification DNS records also need to be added here

---

## Davide's preferences (coding)

- Plain text responses, no HTML artifacts in chat
- Full files when there are more than 2 changes — never find/replace snippets
- Always include git commit command with every code change
- File is delivered with its correct final name and path — no renaming needed
