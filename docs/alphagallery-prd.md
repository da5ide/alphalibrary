# Alphagallery Library — Product Requirements Document
*Version 2.0 — June 28, 2026*

---

## 1. Overview

A private book lending library hosted at Davide's apartment in Tokyo. ~200 art/fashion/architecture/design/photography books and magazines. People browse the catalog online, book a visit, pick up a book in person, return within 45 days.

**Status:** Fully live at alphagallery.co. DNS configured. Booking flow tested end-to-end. 51 books cataloged.

---

## 2. URLs

| Path | Status | Notes |
|------|--------|-------|
| alphagallery.co | ✅ Live | Root — two links: Library + IG |
| alphagallery.co/library | ✅ Live | Public catalog |
| alphagallery.co/library/borrow/[id] | ✅ Live | Booking page |
| alphagallery.co/library/admin | ✅ Live | Admin (password protected) |
| alphagallery.co/library/admin/catalog | ✅ Live | Catalog tool (password protected) |

---

## 3. Root page (alphagallery.co)

Ultra-minimal. Two centered links on two rows:
- "Enter the Library" → /library (underline removes on hover)
- "@alphagallery.co" → instagram.com/alphagallery.co (turns black on hover)

Background: #FAFAF8. No title, no logo.

---

## 4. Public catalog (/library)

### Layout
- Max width 720px, centered, padding 24px sides
- Background #FAFAF8, EB Garamond + Inter
- No FOUC — CSS modules, background set in globals.css

### Header
- Opening description: EB Garamond, terracotta (#8C4A2F), 24px desktop / 21px mobile, no bold
- Text: "A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment. To visit and borrow, you'll need an access code."

### Search & filters
- Full-width search input, placeholder: "Search… N items available"
- × button to clear search, Escape key also clears
- Filter pills: All / Art / Fashion / Architecture / Design / Photography / Other
- Active pill: #6B6560 (medium grey, not black)
- Sort pill (dashed border): A–Z / Recent toggle
- Divider line below pills, above first book (same spacing as between books)

### Book entries
- Tags row: type pill + tag pill(s)
- Title: EB Garamond 23px, font-weight 500
- Author: 15px, #555250
- Publisher + year: 14px, #9B9793 (e.g. "A Publisher BVBA, Antwerp, Belgium, 2019")
- Description: 2-line clamp, click description or MORE to expand
- MORE · BORROW inline (small all-caps, underlined)
- IG icon: terracotta SVG, 16px, inline after title, links to instagram_url
- ON LOAN: replaces BORROW for unavailable books (muted grey)
- Filter matches against tags[] array with category fallback

### Mobile
- 16px font on all inputs (prevents iOS zoom)
- Side padding 20px
- Smaller header top padding

### Footer
- "Alphagallery · @alphagallery.co"

---

## 5. Borrow page (/library/borrow/[id])

### Layout
- Max width 520px, centered
- Back link: ← Back to library

### Book context
- "You'd like to borrow" label (small caps)
- Book title in EB Garamond 32px
- Author below

### Form fields
1. **Your name** — text input
2. **Email address** — email input
3. **Pick a time slot** — `<select>` dropdown, "Select…" placeholder in grey, turns dark when selected
4. **Access code** — text input, with inline hint "(posted occasionally on @alphagallery.co)"
5. **Note** — textarea, optional, 300 char limit, shows "NOTE (optional 0/300)" counter

### Submit button
- Disabled/grey when any required field empty
- Terracotta outline when all fields filled (active state)
- Fills terracotta on hover
- Label: "Book a visit"

### On success
- Inline success state (no redirect)
- Sends confirmation email to visitor
- Sends notification email to Davide (da5ide+alphalibrary@gmail.com)
- Marks book unavailable, slot booked in DB

### Guidelines ("A few things to know")
- No bullet dashes — clean list
- Semi-bold key phrases: **free**, **One item at a time**, **Come pick it up yourself**, **return it within 45 days**, **Return by post or drop it in the mailbox**, **cancel by email**

### Mobile
- 16px font on all inputs
- Smaller top padding

---

## 6. Confirmation email

```
Hi [NAME],

Your visit is confirmed.

Book:
[TITLE]
by [AUTHOR]

Visit:
[DAY], [MONTH] [DATE]
[START TIME] – [END TIME]
Address: 4-18-17 Jingumae, Shibuya-ku (you'll receive a reminder with the full address the day before your visit).

A few things to remember:
Only one item per visit
Please return it within 45 days
Cancel by replying to this email if your plans change

See you soon.
instagram.com/alphagallery.co
```

Sent from: library@alphagallery.co (Resend, verified domain)

---

## 7. Admin page (/library/admin)

Password protected via ADMIN_PASSWORD env var.

### Header
- Lock icon → Catalog (SVG, dark grey outline, hover underline)
- Globe icon → Library (SVG, dark grey outline, hover underline)

### Add availability section
- Custom MiniCalendar (clean grid, no native picker, past dates disabled)
- Custom TimePicker (24h, 15-min increments, scrollable, shows ~5 at once)
- Desktop: calendar + time pickers on same row
- Mobile: calendar on row 1, times + Add button on row 2

### Upcoming slots section
- Shows all slots with date ≥ today, sorted ascending
- Each row: date | time range | OPEN (green pill) / BOOKED (grey pill) | × (delete, unbooked only)
- Pills fixed-width, consistently right-aligned

### Active loans section
- Counts days from visit slot date (not booking creation)
- "On loan for X days" (or "On loan for 1 day")
- Overdue (>45 days from slot date): red border, ⚠ X days — overdue
- Overdue count badge in section header
- "Mark returned" button → calls /api/admin/return

---

## 8. Catalog tool (/library/admin/catalog)

Password gate reuses ADMIN_PASSWORD. Password stored in sessionStorage — shared with admin page login so no re-entry needed when navigating between them.

After auth: iframe loads `/catalog-tool.html` (static file in `public/`).

### List view
- Breadcrumb: Alphagallery / Library / Catalog (each a link, hover underline)
- Stats bar: N items / N available / N on loan / N private
- Search input + "+ Add item" button
- Each card: thumbnail, title, author, type + tag + AVAILABLE/ON LOAN tags

### Add/Edit form (view-form)
- Photos: up to 6, compressed to 1200px/85% JPEG client-side
- "✦ Identify with AI" button — sends photos to Claude Vision via /api/identify
- Fields: title*, author, publisher, year, type (book/magazine), tags (multi-select pills), description, notes (private), price (private), link, instagram_url
- Available toggle (green), Private toggle (purple)
- Borrower section appears when Available is off
- "Save item" button

### Detail view (view-detail)
- Header: ← back, "ITEM DETAIL", Edit + Delete buttons
- Photos: scrollable row (scroll-snap), 140×186px each
- Lightbox on click: full-screen, ← → nav buttons, keyboard ArrowLeft/ArrowRight/Escape
- All fields displayed: title, author, type+tags, available/on loan/private status, publisher+year, price, instagram link, description, notes (private), borrower info
- Publisher left-aligned in its own row (not two-column grid)

### AI identification
- Sends up to 6 compressed photos to /api/identify
- /api/identify proxies to Anthropic API (claude-sonnet) to avoid CORS
- Returns: title, author, publisher, year, tags[], description
- Falls back to manual entry

---

## 9. Email flows

| Email | Trigger | Sender | Status |
|-------|---------|--------|--------|
| Booking confirmation | Successful booking | library@alphagallery.co | ✅ Done |
| New booking notification | Successful booking | library@alphagallery.co | ✅ Done |
| Day-before reminder with address | 24h before slot | library@alphagallery.co | ⏳ Needs cron |
| 30-day return reminder | 30 days after slot date | library@alphagallery.co | ⏳ Needs cron |

**Reminder cron plan:**
- Vercel cron job, daily at a fixed time
- Route: `/api/cron/reminders`
- Check bookings where slot.date = tomorrow, reminder_sent = false → send day-before email with full address, set reminder_sent = true
- Check bookings where slot.date ≤ 30 days ago, returned = false, return_reminder_sent = false → send return reminder, set return_reminder_sent = true

---

## 10. Access control

| Area | Protection |
|------|-----------|
| Public catalog | None — open |
| Booking | LIBRARY_PASSPHRASE (posted on IG Stories) |
| Admin | ADMIN_PASSWORD (Vercel env) |
| Catalog tool | ADMIN_PASSWORD (same, via /api/admin/auth) |

---

## 11. Remaining work

### Must do next
1. **Reminder emails** — Vercel cron job, day-before + 30-day return (see section 9)

### Content (ongoing)
2. Continue cataloging — 51 in, ~150 more to go
3. Add Instagram URLs to books as posts go up
4. Add prices + publisher links (batch AI pass script)
5. Fill remaining missing years manually via catalog tool

### Later
6. Admin page minor polish
7. Batch price + link fill script (similar to batch-year.js)

### Out of scope (v1)
- User accounts / login
- Waitlist for lent-out books
- Japanese language
- Mobile app
- Payments
- Deposit book tracking

---

## 12. Content status (June 28, 2026)

- 51 books cataloged
- All books have tags[] (batch AI pass complete)
- ~50% have year (batch AI pass; obscure titles missed — fill manually)
- 1 book has instagram_url (Atmosphere in the Solarium)
- 0 books have price or link filled
- 2 active test loans
- 7 upcoming slots in DB
