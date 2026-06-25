# Alphagallery Library — Product Requirements Document
*Version 1.1 — June 25, 2026*

---

## 1. Overview

A private book lending library hosted at Davide's apartment in Tokyo. ~200 art/fashion/architecture/design/photography books and magazines. People browse the catalog online, book a visit, pick up a book in person, return within 45 days.

**Status:** Catalog tool complete, public site deployed, DNS not yet pointed, not yet publicly launched.

---

## 2. URLs

| Path | Status | Notes |
|------|--------|-------|
| alphalibrary.vercel.app/catalog | ✅ Live | Private cataloging tool |
| alphalibrary.vercel.app/library | ✅ Live | Public catalog |
| alphalibrary.vercel.app/library/borrow/[id] | ✅ Live | Booking page |
| alphalibrary.vercel.app/library/admin | ✅ Live | Slot management |
| alphagallery.co/library | ⏳ Pending | DNS not yet configured |

---

## 3. Catalog tool (done)

Phone-friendly private tool at /catalog. Flow: take photos → AI identifies book → review/edit → save.

**Key details:**
- Up to 6 photos per book, compressed to 800px/70% JPEG before sending to API
- AI call proxied through /api/identify.js (Vercel serverless) to avoid CORS
- ISBN lookup via Open Library as secondary option
- Fields: title, author, publisher, type, category, description, notes (private), price (private), link, instagram_url, year, available toggle, private toggle
- 51 books cataloged as of June 25, 2026

---

## 4. Public catalog page (done)

**Design:**
- Opening paragraph: EB Garamond, terracotta (#8C4A2F), regular weight, ~22px
- No masthead/title — description leads
- Search box (full width) with placeholder "Search… N items available"
- Category filter pills + A-Z/Recent sort pill (dashed border)
- Active pill: medium grey (#6B6560)
- Max width 720px, borders inside content column
- Book entries: type+category tags, title (EB Garamond 22px), author, publisher, 2-line truncated description, MORE · BORROW inline
- IG icon: terracotta, 16px, inline after title for books with instagram_url
- BORROW: small all-caps terracotta with underline, fades on hover
- Footer: Alphagallery · @alphagallery.co

**Opening description (current):**
"A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment. To visit and borrow, you'll need an access code."

---

## 5. Borrow page (done, design needs polish)

**Functional:**
- Book title/author shown at top
- Name + email + slot picker + passphrase fields
- Passphrase validated server-side
- On success: marks book unavailable, marks slot booked, sends emails
- No slots available → "No available dates yet" message

**Guidelines (current):**
- Borrowing is free.
- One item at a time, please.
- Come pick it up yourself — exact address by email after booking (closest station: Omotesando).
- Return within 45 days; a reminder will be sent.
- Return by post or drop in mailbox — no return visit needed.
- Cancel by email if you can't make it.
- No obligation to bring anything in exchange — but a book or magazine to share is always welcome.
- We trust you'll take good care of what you borrow.

**Still needed:**
- Design polish to match catalog aesthetic
- Borrow page currently functional but visually bare

---

## 6. Email flows (done)

Via Resend, sender library@alphagallery.co:

| Email | Trigger | Status |
|-------|---------|--------|
| Booking confirmation → visitor | Successful booking | ✅ |
| New booking notification → Davide | Successful booking | ✅ |
| Day-before reminder → visitor | 24h before slot | ⏳ Needs cron |
| 30-day return reminder → visitor | 30 days after borrow | ⏳ Needs cron |

---

## 7. Admin page (done)

Password-protected at /library/admin:
- Add time slots (date + start/end time)
- Remove unbooked slots
- View active loans
- Mark books as returned

**Still needed:** No slots have been added yet — add before launch.

---

## 8. Access control

- Public: browse catalog freely
- Booking: requires LIBRARY_PASSPHRASE (set in Vercel env)
- Admin: requires ADMIN_PASSWORD (set in Vercel env)
- Passphrase posted on @alphagallery.co IG Stories

---

## 9. Pending work (prioritized)

### Must do before launch
1. **DNS** — point alphagallery.co/library to Vercel via Cloudflare CNAME
2. **Add slots** in admin — no slots = no bookings possible
3. **Borrow page design** — polish to match catalog
4. **Test full booking flow** end to end

### Soon after launch
5. **Reminder emails** — need cron job (Vercel cron or Supabase scheduled function)
6. **IG url field in catalog tool** — currently Supabase only
7. **Multi-tag support** — replace category with tags[], retroactive AI re-tag pass
8. **Continue cataloging** — 51 in, ~150 more to go

### Later
9. **Batch price + link fill** — AI pass to populate missing prices and publisher links
10. **Root alphagallery.co** — something at the root domain eventually

---

## 10. Out of scope (v1)

- User accounts
- Waitlist for lent-out books
- Japanese language
- Mobile app
- Payments
- Tracking deposit books

