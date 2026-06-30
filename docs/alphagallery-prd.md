# Alphagallery Library — Product Requirements Document
*Version 3.0 — June 30, 2026*

---

## 1. Overview

A private book lending library hosted at Davide's apartment in Tokyo. ~200 art/fashion/architecture/design/photography/food/travel books and magazines. People browse the catalog online, book a visit, pick up a book in person, return within 45 days.

**Status:** Fully live at alphagallery.co. All core features shipped. Actively cataloging.

**GitHub:** github.com/da5ide/alphalibrary (public, MIT license)

---

## 2. URLs

| Path | Status | Notes |
|------|--------|-------|
| alphagallery.co | ✅ Live | Root — two links: Library + Instagram |
| alphagallery.co/library | ✅ Live | Public catalog |
| alphagallery.co/library/borrow/[id] | ✅ Live | Booking page |
| alphagallery.co/library/admin | ✅ Live | Admin (password protected) |
| alphagallery.co/library/admin/catalog | ✅ Live | Catalog tool (same password) |

---

## 3. Root page (alphagallery.co)

Ultra-minimal. Two centered links on two rows:
- "Enter the Library" → /library (underline removes on hover)
- "@alphagallery.co" → instagram.com/alphagallery.co (turns black on hover)

Background: #FAFAF8. No title, no logo. Favicon: open alpha mark (white on black).

---

## 4. Public catalog (/library)

### Layout
- Max width 740px, centered, 24px side padding
- Background #FAFAF8, EB Garamond + Inter
- No FOUC — CSS modules, background in globals.css
- Default sort: **Recent** (newest first, so repeat visitors see new books)

### Header
- Opening description: EB Garamond, terracotta (#8C4A2F), 24px desktop / 21px mobile
- Copy: "A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment.\n\nTo book a visit, you'll need an access code."
- "To book a visit..." line on its own paragraph (visual break)

### Search
- Full-width search input: `Search… N items available` placeholder
- × button clears, Escape key clears

### Filter pills — two rows
**Row 1 — Categories** (alphabetical, All first, Other last):
All / Architecture / Art / Design / Fashion / Food / Photography / Travel / Other

**Row 2 — Type + Sort:**
All / Books / Magazines | Sort pill (dashed border): A–Z / Recent toggle

- Active pill background: #6B6560 (medium grey, not black)
- Gap between rows: 8px; gap within row: 6px; flex-wrap

### Book entries
- Type + tag pills
- Title: EB Garamond 23px, font-weight 500
- Author: 15px, #555250
- Publisher + year: 14px, #9B9793
- Description: 2-line clamp, click description or MORE to expand
- MORE · BORROW inline (small all-caps, underlined)
- IG icon (terracotta SVG, 16px) inline after title when instagram_url set
- ON LOAN: replaces BORROW for unavailable books (muted grey)
- Filter matches tags[] array with category fallback

### Footer
Three links separated by ·:
- "Alphagallery Library" → alphagallery.co/library
- "Alphagallery on Instagram" → instagram.com/alphagallery.co
- "Clone this project" → github.com/da5ide/alphalibrary

### Mobile
- 16px font on all inputs (prevents iOS zoom)
- Side padding 20px, smaller header padding

---

## 5. Borrow page (/library/borrow/[id])

### Layout
- Max width 520px, centered
- ← Back to library link (only shown during booking flow, not on success screen)

### Book context
- "You'd like to borrow" (small caps label)
- Book title: EB Garamond 32px
- Author below

### Form fields
1. **Your name** — text
2. **Email address** — email
3. **Pick a time slot** — `<select>` dropdown, grey placeholder "Select…"
4. **Access code** — text, inline hint "(posted occasionally on @alphagallery.co)"
5. **Note** — textarea, optional, 300 chars, "NOTE (optional 0/300)" counter

### Submit button
- Grey/disabled until all required fields + slot selected
- Terracotta outline when active (transparent background)
- Fills terracotta on hover
- Label: "Book a visit"

### On success
- Inline success state (no redirect)
- Single "Back to Library" button (capital L)
- Confirmation email → visitor
- Notification email → da5ide+alphalibrary@gmail.com
- Book marked unavailable, slot marked booked in DB

### Guidelines ("A few things to know")
- Clean list, no dashes, semi-bold key phrases

---

## 6. Email system

All emails: HTML + plain text fallback. Sent from library@alphagallery.co via Resend.

**Shared style:**
```css
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #111110; background: #ffffff; }
.wrap { max-width: 540px; margin: 0 auto; padding: 40px 24px; }
.footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E4DF; font-size: 13px; color: #9B9793; }
```

**Shared footer:**
Alphagallery Library · Alphagallery on Instagram (both linked, muted grey)

**Time format:** `H:MM - H:MM AM/PM` (single dash, spaces, AM/PM shown once from end time)

### Email 1 — Booking confirmation → visitor
Trigger: successful booking via /api/book

- Greeting + "Your visit is confirmed."
- BOOK section label + book title/author
- VISIT section label + date + time
- ADDRESS section label + street address (no apt # — full address comes in reminder) + Google Maps link
- Note in muted grey: "You'll receive a reminder with the full address the day before your visit."
- "A few things to remember" (underlined, not bold) + 7 bullet points
- "See you soon,"

### Email 2 — Admin notification → Davide
Trigger: successful booking via /api/book
Plain text only. Borrower name, email, book, visit slot, optional note from borrower.

### Email 3 — Cancellation → visitor
Trigger: admin clicks Cancel in admin panel
- Optional note field in cancel modal (starts blank)
- "Hi [NAME], I am sorry but I need to cancel your upcoming visit for [BOOK] on [DATE] [TIME]."
- Note (if any) follows opening
- Booking link to re-book
- "Sorry again for the inconvenience."

### Email 4 — Day-before visit reminder → visitor
Trigger: Vercel cron at 23:00 UTC (08:00 JST), fires for bookings where slot.date = tomorrow JST
- Full address including Apt #401 + Google Maps link
- "Reply to this email if you need to cancel or have any questions."
- "See you tomorrow."
- Sets reminder_sent = true

### Email 5a — 30-day return reminder → visitor
Trigger: cron, slot.date ≤ 30 days ago, returned = false, return_reminder_sent = false
- "A reminder that it has been 30 days since you borrowed [BOOK] on [DATE]."
- "Please return it when you're done," + address with Apt #401 + Google Maps
- Sets return_reminder_sent = true

### Email 5b — 45-day return reminder → visitor
Trigger: cron, slot.date ≤ 45 days ago, returned = false, return_reminder_2_sent = false
- Same as 5a but: "We appreciate if you could return it as soon as possible,"
- Sets return_reminder_2_sent = true

### Email 6 — Book returned confirmation → visitor
Trigger: admin clicks Mark returned in admin panel
- Optional note field in return modal
- "Hi [NAME], We've received [TITLE] — thank you for returning it!"
- Note (if any)
- "Hope to see you again soon."

### Cron schedule
`vercel.json`: `"0 23 * * *"` = 23:00 UTC = 08:00 JST daily

---

## 7. Admin page (/library/admin)

Password protected (ADMIN_PASSWORD), stored in sessionStorage as `ag_admin_pw`.

### Header / nav
Breadcrumb: Alphagallery / Library / Admin / Catalog

### Add availability
- Custom MiniCalendar component (React, no native date picker, past dates disabled)
- Custom TimePicker (24h, 15-min increments, scrollable list showing ~5 at once)
- Desktop: calendar + time pickers on same row
- Mobile: calendar row 1, times + Add button row 2

### Upcoming slots
- Slots where end_time has not yet passed (hides slots once the visit is over)
- Sorted ascending
- Each row: date | time range | OPEN (green) or BOOKED (grey) pill | action
- OPEN: × to delete
- BOOKED: "Cancel" link → opens CancelModal

### Cancel modal
- Shows: borrower name + email, book title, date/time
- Optional note textarea (starts blank)
- "Send cancellation" button

### Active loans
- Bookings where returned = false AND slot end_time has passed
- Days counted from slot visit date
- Overdue = >45 days: red border, warm background, ⚠ warning text
- Overdue count badge in section header
- "Mark returned" → opens ReturnModal

### Return modal
- Shows: book title, borrower name + email
- Optional note textarea (for return confirmation email)
- "Mark returned" button → sends email + updates DB

### Past loans
- Collapsed by default, expandable
- Sorted by returned_at descending

---

## 8. Catalog tool (/library/admin/catalog)

### Auth
- Next.js page handles password gate → renders `<iframe src="/catalog-tool.html">`
- `catalog-tool.html` — fully self-contained single-file app (HTML + CSS + JS inline)
- Talks directly to Supabase (anon key in file — acceptable for private tool)
- AI calls go through `/api/identify` (Next.js proxy to avoid CORS)

### List view
- Clickable stat pills: N ITEMS / N AVAILABLE / N ON LOAN / N PRIVATE
- Search input + "+ Add item" button
- Book cards with thumbnail, title, author, type + tag + status tags

### Add/Edit form
- Up to 6 photos, stored at original resolution
- AI Identify: photos re-compressed to 800px/72% JPEG just for the API call (smaller payload, AI only needs to read text)
- Returns: title, author, publisher, year, type, tags[], description, confidence
- Falls back to manual entry with helpful error message if AI fails
- Tags: Architecture / Art / Design / Fashion / Food / Photography / Travel / Other (multi-select pills)
- Available toggle + Private toggle
- Borrower fields appear when Available = off

### Detail view
- Photos: scrollable row (scroll-snap), lightbox on click, keyboard navigation, stops at ends

---

## 9. Access control

| Area | Protection |
|------|-----------|
| Public catalog | None — open |
| Booking | NEXT_PUBLIC_BORROW_PASSPHRASE (posted on IG Stories) |
| Admin | ADMIN_PASSWORD (Vercel env) |
| Catalog tool | ADMIN_PASSWORD (same) |

---

## 10. Open source

- GitHub: github.com/da5ide/alphalibrary (public, MIT)
- README covers: stack, project structure, Supabase SQL schema, env vars, customization, Vercel deploy
- .env.example included
- Footer on public catalog links to repo ("Clone this project")

---

## 11. Backlog

See `docs/alphagallery-backlog.md` for future ideas.

---

## 12. Content status (June 30, 2026)

- Books being added actively — aim for ~200 total
- All books have tags[]
- ~50% have year (fill rest manually in catalog tool)
- Books with instagram_url grow as IG posts go live
- DB constraint updated to allow: art, fashion, architecture, design, photography, food, travel, other
