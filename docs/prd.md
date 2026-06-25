# Alphagallery Library — Product Requirements Document
*Version 1.0 — June 25, 2026*

---

## 1. Overview

### What it is
A private book lending library hosted at Davide's apartment in Tokyo. The library is a curated collection of ~200 art, fashion, architecture, design, and photography books and magazines. People browse the catalog online, book a visit, pick up a book in person, and return it within 45 days.

### What it isn't
- Not a business. No money changes hands.
- Not a public library. Access is controlled via a passphrase.
- Not a marketplace. None of the books are for sale.

### Why it exists
Community building and connection. A chance to share an interesting collection, meet (or reconnect with) people, and create a slow, intentional cultural experience. The library is the first "program" of Alphagallery — a broader private cultural space Davide is developing in Tokyo.

### The Alphagallery context
Alphagallery (alphagallery.co) is Davide's emerging cultural brand. It currently consists of:
- An Instagram account (@alphagallery.co) where books are posted one by one
- This library (alphagallery.co/library)
- Future: private exhibitions, events in the same apartment space

---

## 2. Goals

### Primary
- Allow people to browse the full catalog online
- Allow qualified visitors (passphrase holders) to book a visit and borrow a book
- Allow Davide to manage his availability (time slots) and lending status

### Secondary
- Create a beautiful, minimal online presence for Alphagallery
- Drive traffic between the Instagram account and the library site
- Build a complete, queryable database of the collection for Davide's own reference

---

## 3. Users

### Visitors (public)
Anyone who finds the site. Can browse the catalog freely. Must have the passphrase to book.

### Borrowers (passphrase holders)
People Davide knows or who follow @alphagallery.co on Instagram. Can browse and book visits.

### Davide (admin)
Manages the catalog (via separate catalog tool), sets available time slots, marks books as lent/returned.

---

## 4. Site Structure

```
alphagallery.co/                    ← future Alphagallery root (not in scope now)
alphagallery.co/library             ← catalog page (public)
alphagallery.co/library/borrow/[id] ← booking page (passphrase required)
alphagallery.co/library/admin       ← admin: slot management (password required)
alphalibrary.vercel.app/catalog     ← private cataloging tool (Davide only)
```

---

## 5. Feature Requirements

### 5.1 Catalog Page (alphagallery.co/library)

**Header / About**
- Alphagallery wordmark or logotype
- 2-3 sentence description of the library — what it is, the spirit of it, how to borrow
- Link or CTA to the booking flow

**Search & Filter**
- Single search field: searches title, author, publisher simultaneously
- Tag filter pills: Art, Fashion, Architecture, Design, Photography, Other (multi-select)
- Sort: Title A–Z, Most recently added (default)
- Filter and search work together (AND logic)
- State persists within session (no page reload on filter change)

**Book List**
- Clean typographic list — no cover images
- Each entry shows:
  - Title (prominent)
  - Author
  - Publisher
  - Tags (small pills)
  - Description (full, AI-generated, editable)
  - Year (if available)
  - Instagram icon → links to @alphagallery.co post (if instagram_url set on book)
  - Borrow button
- Borrow button states:
  - Active (green/black): book is available and not private
  - Disabled + "Currently borrowed": book is lent out
  - Hidden: book is marked private in DB

**Empty states**
- No search results: "Nothing found for '[query]' — try a different search"
- All filters active with no results: "No books match these filters"

---

### 5.2 Borrow Page (alphagallery.co/library/borrow/[book-id])

**Book context**
- Title and author of the book being borrowed shown at top
- Back to catalog link

**Form fields**
- Name (required)
- Email (required)
- Time slot selector — radio buttons showing available slots
  - Format: "Saturday, July 5 — 2:00–3:00 PM"
  - Only future slots shown
  - Already-booked slots hidden
  - If no slots: "No available dates yet — check back soon. In the meantime, feel free to DM on Instagram."

**Passphrase**
- Single text field: "Enter the access code"
- Validated on submit (not on blur)
- Wrong passphrase: inline error, form not submitted
- Correct passphrase: booking confirmed

**Guidelines**
Shown below the form, always visible:
- All items are free to borrow
- Only one item per person at any given time
- You must come pick up the item yourself (exact address sent via email after booking)
- You're not obligated to bring anything in exchange, unless it's a book or magazine you'd like to share
- Please cancel via email if you can no longer make your visit
- Please return the item within 45 days, either by post or by dropping it in the mailbox
- We trust you'll take good care of the items you borrow

**On successful booking**
- Confirmation shown inline ("Booked. You'll receive a confirmation email shortly.")
- Book marked as unavailable in DB
- Confirmation email sent to visitor
- Notification email sent to Davide

---

### 5.3 Admin Page (alphagallery.co/library/admin)

**Authentication**
- Simple password field (separate from library passphrase)
- Stored as ADMIN_PASSWORD env var

**Slot management**
- List of all upcoming slots (date, time, status: available / booked)
- Add slot: date picker + time window input (e.g. "14:00–15:00")
- Remove slot: only if not yet booked
- View past slots (read-only)

**Lending dashboard** (nice to have, not blocking)
- List of currently lent books: title, borrower name, borrow date, due date
- Mark as returned button

---

### 5.4 Email Flows

All sent via Resend. Sender: library@alphagallery.co. Reply-to: da5ide+alphalibrary@gmail.com (or library@alphagallery.co once set up).

**Email 1: Booking confirmation (to visitor)**
Trigger: successful booking
Content: book title, borrower name, visit date/time, reminder that address will be shared closer to the date, brief guidelines summary, contact email for cancellations

**Email 2: Visit reminder (to visitor)**
Trigger: 24 hours before visit slot
Content: reminder of visit date/time, book title, Davide's address (full address revealed here only)

**Email 3: Return reminder (to visitor)**
Trigger: 30 days after borrow_date
Content: friendly reminder to return the book within 45 days, return instructions (post or mailbox drop)

**Email 4: New booking notification (to Davide)**
Trigger: successful booking
Content: borrower name, email, book title, visit slot — simple, quick to read

---

### 5.5 Catalog Tool (alphalibrary.vercel.app/catalog)

**Already built.** See Technical Specs for implementation details.

Planned additions (not yet built):
- Multi-tag selector (replace single category dropdown)
- Instagram URL field per book
- Batch re-identification pass (retroactive AI re-tagging)
- Batch price + link fill (Claude looks up publisher URLs and reference prices)

---

## 6. Database Schema

### books table (current)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| created_at | timestamptz | auto |
| title | text NOT NULL | |
| author | text | |
| publisher | text | |
| type | text | 'book' or 'magazine' |
| category | text | single category — to be replaced by tags[] |
| description | text | AI-generated, editable |
| notes | text | private, never public |
| price | numeric | private, never public |
| link | text | publisher or reference link |
| cover_url | text | first photo URL (private) |
| photo_urls | text[] | up to 6 photos (private) |
| available | boolean | default true |
| borrower | text | name of current borrower |
| borrower_contact | text | email/phone |
| borrowed_at | timestamptz | |
| due_at | timestamptz | |
| private | boolean | default false — hides from public site |

### Pending schema additions
- `instagram_url text` — link to IG post
- `tags text[]` — replaces `category` (migration required)
- `year int` — publication year

### slots table (to be created)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| date | date | |
| start_time | time | |
| end_time | time | |
| booked | boolean | default false |
| created_at | timestamptz | |

### bookings table (to be created)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| book_id | uuid FK → books.id | |
| slot_id | uuid FK → slots.id | |
| borrower_name | text | |
| borrower_email | text | |
| created_at | timestamptz | |
| confirmation_sent | boolean | |
| reminder_sent | boolean | |
| return_reminder_sent | boolean | |
| returned | boolean | default false |
| returned_at | timestamptz | |

---

## 7. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage (covers bucket) |
| Hosting | Vercel |
| DNS | Cloudflare |
| Email | Resend |
| AI | Anthropic Claude (claude-sonnet-4-6) via API |
| Catalog tool | Single HTML file (no framework) |

### Environment variables (Vercel)
| Key | Status | Notes |
|-----|--------|-------|
| ANTHROPIC_API_KEY | ✅ Set | For AI book identification |
| RESEND_API_KEY | ⏳ Pending | Resend account being set up |
| LIBRARY_PASSPHRASE | ⏳ To set | Davide to choose |
| ADMIN_PASSWORD | ⏳ To set | Davide to choose |
| NEXT_PUBLIC_SUPABASE_URL | ⏳ To set | Already known: lldmgalcgrmghsqlrmjp.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ⏳ To set | Already known |

---

## 8. UX Principles

1. **Slow by design.** This isn't Amazon. The experience should feel considered and unhurried. Typography does the work, not imagery.

2. **Trust is the product.** The passphrase, the guidelines, the personal address only revealed after booking — all reinforce that this is a human-to-human exchange, not a service.

3. **The writing matters.** AI-generated descriptions are genuinely good and should be front and center. The catalog is as much a reading experience as a browsing one.

4. **Mobile-first but not mobile-only.** Davide cataloged on his phone. Visitors may browse on desktop. Both must be excellent.

5. **No friction for browsing, some friction for borrowing.** Anyone can see the collection. The passphrase is a light filter — enough to keep it intentional, not enough to be exclusionary.

6. **The IG account and the site are one ecosystem.** Books posted on IG link to the site. The site links back to IG. They feed each other.

---

## 9. Out of Scope (v1)

- User accounts / login for borrowers
- Waitlist / reservation queue for lent-out books
- Reviews or ratings
- Payment of any kind
- Mobile app
- Japanese language support
- Books marked as "not for lending" (use private toggle instead)
- Tracking of deposit books left by borrowers (handled in person)

---

## 10. Open Questions

- [ ] What passphrase to use? (Davide to decide)
- [ ] What admin password to use? (Davide to decide)
- [ ] Exact "about" copy for the library homepage (Davide to write, Claude to polish)
- [ ] Should year be added to the DB and catalog tool now, or in a later pass?
- [ ] Resend setup — domain verification DNS records need adding to Cloudflare

