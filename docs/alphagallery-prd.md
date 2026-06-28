# Alphagallery Library — Product Requirements Document
*Version 2.1 — June 28, 2026*

---

## 1. Overview

A private book lending library hosted at Davide's apartment in Tokyo. ~200 art/fashion/architecture/design/photography books and magazines. People browse the catalog online, book a visit, pick up a book in person, return within 45 days.

**Status:** Fully live at alphagallery.co. DNS configured. Booking flow tested end-to-end. ~55 books cataloged, actively adding more.

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
- Max width 720px, centered, 24px side padding
- Background #FAFAF8, EB Garamond + Inter
- No FOUC — CSS modules, background in globals.css
- Default sort: **Recent** (newest first, so repeat visitors see new books)

### Header
- Opening description: EB Garamond, terracotta (#8C4A2F), 24px desktop / 21px mobile
- Copy: "A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment. To book a visit, you'll need an access code."

### Search & filters
- Full-width search input: `Search… N items available` placeholder
- × button clears, Escape key clears
- Filter pills: All / Art / Fashion / Architecture / Design / Photography / Other
- Active pill: #6B6560 (medium grey, not black)
- Sort pill (dashed border): A–Z / Recent toggle (default: Recent)
- Divider line below pills, above first book entry

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

### Mobile
- 16px font on all inputs (prevents iOS zoom)
- Side padding 20px, smaller header padding

### Footer
- "Alphagallery · @alphagallery.co"

---

## 5. Borrow page (/library/borrow/[id])

### Layout
- Max width 520px, centered
- ← Back to library link

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
- Confirmation email → visitor
- Notification email → da5ide+alphalibrary@gmail.com
- Book marked unavailable, slot marked booked in DB

### Guidelines ("A few things to know")
- Clean list, no dashes
- Semi-bold: **free**, **One item at a time**, **Come pick it up yourself**, **return it within 45 days**, **Return by post or drop it in the mailbox**, **cancel by email**

### Mobile
- 16px font on all inputs

---

## 6. Confirmation email

Sent from library@alphagallery.co via Resend:

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

---

## 7. Email flows

| Email | Trigger | Status |
|-------|---------|--------|
| Booking confirmation → visitor | Successful booking | ✅ |
| New booking notification → Davide | Successful booking | ✅ |
| Day-before reminder with address | 24h before slot date | ⏳ Needs cron |
| 30-day return reminder | 30 days after slot date | ⏳ Needs cron |

### Cron job plan (not yet built)
- Vercel cron in `vercel.json`, daily execution
- Route: `app/api/cron/reminders/route.ts`
- Day-before: find bookings where slot.date = tomorrow, reminder_sent = false → send reminder with full address (4-18-17 Jingumae, Shibuya-ku), set reminder_sent = true
- 30-day return: find bookings where slot.date ≤ 30 days ago, returned = false, return_reminder_sent = false → send return reminder, set return_reminder_sent = true

---

## 8. Admin page (/library/admin)

Password protected (ADMIN_PASSWORD), stored in sessionStorage as `ag_admin_pw`.

### Header / nav
- Breadcrumb: Alphagallery / Library / Admin — with lock icon → Catalog link and globe icon → Library link
- Hover underline on all links

### Add availability
- Custom MiniCalendar component (React, no native date picker, past dates disabled)
- Custom TimePicker (24h, 15-min increments, scrollable list showing ~5 at once)
- Desktop: calendar + time pickers on same row
- Mobile: calendar row 1, times + Add button row 2

### Upcoming slots
- All slots with date ≥ today, sorted ascending
- Each row: date | time range | status pill | × (delete if unbooked)
- OPEN pill: green (#E8F5EE / #2D6A4F)
- BOOKED pill: grey (#F2EFE9 / #9B9793)
- Pills fixed-width, right-aligned for visual consistency

### Active loans
- Days counted from slot visit date (not booking creation timestamp)
- "On loan for X day(s)"
- Overdue = >45 days from slot date: red border (#F5C6C0), warm background (#FFFAF9), ⚠ X days — overdue text
- Overdue count badge in section header
- "Mark returned" → POST /api/admin/return

---

## 9. Catalog tool (/library/admin/catalog)

### Auth
- Next.js page at `app/library/admin/catalog/page.tsx` handles password gate
- Calls `/api/admin/auth` (same ADMIN_PASSWORD)
- Password stored in sessionStorage `ag_admin_pw` — shared with admin page so no re-entry needed

### Architecture
- After auth: renders `<iframe src="/catalog-tool.html">`
- `public/catalog-tool.html` — fully self-contained single-file app (HTML + CSS + JS inline)
- Talks directly to Supabase (anon key hardcoded in file — acceptable for private tool)
- AI identification calls `/api/identify` (Next.js route that proxies to Anthropic API)

### List view
- Breadcrumb: Alphagallery / Library / Admin / Catalog (all links, hover underline)
- Clickable stat pills: N ITEMS / N AVAILABLE / N ON LOAN / N PRIVATE
  - Clicking filters the list; clicking again resets to all
  - Active pill: #6B6560 (medium grey)
- Search input + "+ Add item" button (medium grey rounded pill)
- Book cards with thumbnail, title, author, type + tag + AVAILABLE/ON LOAN tags
- ~20% larger typography than default for comfortable cataloging use

### Add/Edit form
- Up to 6 photos, compressed to 1200px/85% JPEG client-side
- AI Identify button → sends all photos to /api/identify → Anthropic claude-sonnet → auto-fills fields
- Returns: title, author, publisher, year, type, tags[], description
- Falls back gracefully to manual entry
- Fields: title*, author, publisher, year, type, tags (multi-select pills), description, notes (private), price (private), link, instagram_url
- Available toggle (green), Private toggle (purple)
- Borrower fields appear when Available = off
- "Save item" button

### Detail view
- Photos: scrollable row, scroll-snap, 168×224px each
- Lightbox: click to open, ← → arrow buttons, keyboard navigation (ArrowLeft/ArrowRight/Escape)
- Lightbox stops at ends (no wrap)
- All fields shown: title, author, type+tags, status, publisher+year, price, instagram (View post ↗), link (full URL), description, notes, borrower info
- Publisher left-aligned (single column, not two-column grid)

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
1. **Reminder emails** — Vercel cron (see section 7 for full spec)

### Content (Davide, ongoing)
2. Continue cataloging — ~55 in, ~145 more to go
3. Add instagram_url as posts go live
4. Fill missing years via catalog tool
5. Add prices + links when useful

### When catalog is complete
6. Re-evaluate tag taxonomy (currently: art/fashion/architecture/design/photography/other)
   - Expected new categories: food, gastronomy, culture, etc.
   - Re-run batch-tags.js with updated valid tags list

### Out of scope (v1)
- User accounts / waitlist
- Japanese language
- Mobile app / payments
- Deposit book tracking

---

## 12. Content status (June 28, 2026 evening)

- ~55 books cataloged (adding more actively)
- All books have tags[] (batch AI complete)
- ~50% have year (batch AI; fill rest manually)
- 1 book has instagram_url (Atmosphere in the Solarium)
- 0 books have price or link filled
- 2 active test loans
- Several upcoming slots in DB
