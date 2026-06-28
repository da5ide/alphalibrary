# Alphagallery Library — Handoff Document
*Last updated: June 28, 2026 (evening)*

## What we're building

A private lending library at Davide's apartment in Tokyo. People browse books online, book a visit, come pick up a book, return it within 45 days. The project lives under the Alphagallery umbrella — a broader cultural space Davide is developing (private library, future exhibitions, etc).

---

## Key facts

**Domain:** alphagallery.co (registered on Cloudflare, DNS pointed to Vercel — live)
**Instagram:** @alphagallery.co
**GitHub repo:** github.com/da5ide/alphalibrary (private)
**Vercel project:** alphalibrary — live at alphagallery.co
**Local folder:** ~/alphalibrary
**Supabase project:** lldmgalcgrmghsqlrmjp.supabase.co
**Supabase anon key:** sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ
**Email sender:** library@alphagallery.co via Resend (verified and working)
**Notification email:** da5ide+alphalibrary@gmail.com
**Stack:** Next.js 16 App Router + Supabase + Vercel + Resend + Anthropic API

---

## Repo structure

```
alphalibrary/
  app/
    layout.tsx                        ← root layout, EB Garamond + Inter fonts, metadata
    icon.svg                          ← favicon (open alpha mark, white on black)
    page.tsx                          ← root alphagallery.co — two links: Library + IG
    page.module.css                   ← root page styles
    globals.css                       ← background #FAFAF8, no webkit-font-smoothing
    library/
      page.tsx                        ← public catalog (server component, fetches books)
      borrow/[id]/
        page.tsx                      ← borrow/booking page (server component)
      admin/
        page.tsx                      ← admin: slots, loans, overdue (client component)
        catalog/
          page.tsx                    ← auth gate for catalog tool (client component, iframe)
    api/
      book/route.ts                   ← POST: create booking, validate passphrase, send emails
      identify/route.ts               ← POST: proxy to Anthropic API for AI book identification
      admin/
        slots/route.ts                ← GET/POST/DELETE: manage slots + bookings
        auth/route.ts                 ← POST: verify ADMIN_PASSWORD
        return/route.ts               ← POST: mark book returned
  components/
    LibraryCatalog.tsx                ← catalog UI (client, search/filter/sort/expand)
    LibraryCatalog.module.css         ← CSS module (no styled-jsx)
    BorrowForm.tsx                    ← borrow form UI (client component)
    BorrowForm.module.css             ← CSS module
  lib/
    supabase.ts                       ← Supabase client
    types.ts                          ← TypeScript types: Book, Slot, Booking
  public/
    catalog-tool.html                 ← private cataloging tool (static HTML)
                                        served at /catalog-tool.html
                                        iframe'd by /library/admin/catalog
  scripts/
    batch-year.js                     ← AI batch fill publication years for all books
    batch-tags.js                     ← AI batch assign tags[] for all books
  docs/
    alphagallery-handoff.md           ← this file
    alphagallery-prd.md               ← product requirements
```

**Critical notes on catalog tool:**
- `catalog-tool.html` is a self-contained static HTML file with all CSS + JS inline
- It is served at `alphagallery.co/catalog-tool.html` and iframe'd by the Next.js page at `/library/admin/catalog`
- The Next.js page at `app/library/admin/catalog/page.tsx` handles the password gate (calls `/api/admin/auth`) and then shows the iframe
- The `app/api/identify/route.ts` route proxies requests to the Anthropic API (needed to avoid CORS from the static HTML file)
- Password is stored in `sessionStorage` under key `ag_admin_pw` — shared between admin page and catalog page so no re-entry needed

---

## Database (Supabase)

**Table: books**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| created_at | timestamptz | auto |
| title | text NOT NULL | |
| author | text | |
| publisher | text | |
| type | text | 'book' or 'magazine' |
| category | text | legacy single-value, kept as fallback for old records |
| tags | text[] | multi-tag array — primary tag field (migrated June 2026) |
| description | text | AI-generated, editable |
| notes | text | private, never shown publicly |
| price | numeric | private, never shown publicly |
| link | text | publisher/shop URL |
| cover_url | text | first photo (legacy), private |
| photo_urls | text[] | up to 6 photos, private, stored in Supabase Storage |
| available | boolean | default true |
| borrower | text | name, set when lent |
| borrower_contact | text | email/phone, set when lent |
| borrowed_at | timestamptz | set when book lent out |
| due_at | timestamptz | borrowed_at + 45 days |
| private | boolean | default false — hides from public catalog |
| instagram_url | text | URL to IG post, shows icon on public site |
| year | int | publication year |

**Table: slots**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| date | date | |
| start_time | time | |
| end_time | time | |
| booked | boolean | default false |
| created_at | timestamptz | auto |

**Table: bookings**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| book_id | uuid FK → books | |
| slot_id | uuid FK → slots | |
| borrower_name | text | |
| borrower_email | text | |
| note | text | optional note from borrower (300 char limit on form) |
| created_at | timestamptz | auto |
| confirmation_sent | boolean | |
| reminder_sent | boolean | day-before reminder (not yet implemented) |
| return_reminder_sent | boolean | 30-day return reminder (not yet implemented) |
| returned | boolean | |
| returned_at | timestamptz | |

**Storage bucket:** covers (public) — catalog photos, never shown on public site

---

## Environment variables (Vercel)

| Key | Status | Notes |
|-----|--------|-------|
| ANTHROPIC_API_KEY | ✅ Set | Used by /api/identify proxy |
| RESEND_API_KEY | ✅ Set | Email sending |
| NEXT_PUBLIC_SUPABASE_URL | ✅ Set | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Set | |
| LIBRARY_PASSPHRASE | ✅ Set | Required to book a visit (Davide knows it) |
| ADMIN_PASSWORD | ✅ Set | Admin + catalog tool access (Davide knows it) |

---

## Live URLs

| URL | Description |
|-----|-------------|
| alphagallery.co | Root — two links: Library + Instagram |
| alphagallery.co/library | Public catalog |
| alphagallery.co/library/borrow/[id] | Booking page per book |
| alphagallery.co/library/admin | Admin: slots + loans (password protected) |
| alphagallery.co/library/admin/catalog | Catalog tool (password protected, same password) |

---

## Public catalog (alphagallery.co/library)

- Default sort: **Recent** (newest books first — so repeat visitors see new additions)
- EB Garamond opening description, terracotta (#8C4A2F), 24px desktop / 21px mobile
- Description text: "A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment. To book a visit, you'll need an access code."
- Search box full-width: `Search… N items available` placeholder; × button clears, Escape clears
- Filter pills: All / Art / Fashion / Architecture / Design / Photography / Other
- Sort pill (dashed border): A–Z / Recent toggle
- Active pill: medium grey (#6B6560)
- Each entry: type + tag pills, title (Garamond 23px), author, publisher+year, 2-line truncated description
- Click description or MORE to expand
- IG icon (terracotta, 16px) inline after title for books with instagram_url
- BORROW: small all-caps terracotta underlined → /library/borrow/[id]
- ON LOAN: muted grey for unavailable books
- Filter matches against tags[] array (with category fallback)
- CSS modules throughout — no FOUC
- Mobile: 16px input font-size (prevents iOS zoom)
- Footer: Alphagallery · @alphagallery.co

---

## Borrow page (alphagallery.co/library/borrow/[id])

- Max width 520px, centered
- "You'd like to borrow" label, book title in Garamond 32px, author
- Fields: name, email, slot dropdown (Select…), access code + inline hint, note (optional, 300 chars, shows counter)
- Book a Visit button: grey/disabled until all required fields filled, terracotta outline when active, fills on hover
- On submit: validates LIBRARY_PASSPHRASE → creates booking → marks book unavailable + slot booked → sends emails
- Success state shown inline
- Guidelines with semi-bold key phrases: **free**, **One item at a time**, **Come pick it up yourself**, **return it within 45 days**, **Return by post or drop it in the mailbox**, **cancel by email**
- Mobile: 16px font-size on all inputs

---

## Confirmation email

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

Sent from: library@alphagallery.co via Resend
Notification also sent to: da5ide+alphalibrary@gmail.com

---

## Admin page (alphagallery.co/library/admin)

- Password protected (ADMIN_PASSWORD env var), stored in sessionStorage
- Header: breadcrumb Alphagallery / Library / Admin with lock icon → Catalog and globe icon → Library links (hover underline)
- **Add availability:** custom MiniCalendar (no native picker) + custom TimePicker (24h, 15-min increments, scrollable ~5 visible)
  - Desktop: calendar + times on same row
  - Mobile: calendar row 1, times + Add button row 2
- **Upcoming slots:** date, time range, OPEN (green pill) / BOOKED (grey pill), × to delete unbooked
  - Pills fixed-width, right-aligned, consistent across rows
- **Active loans:** title, borrower name + email, visit date, "On loan for X days"
  - Overdue (>45 days from slot visit date): red border, ⚠ X days — overdue
  - Overdue count badge in section header
  - "Mark returned" button → /api/admin/return

---

## Catalog tool (alphagallery.co/library/admin/catalog)

- Auth gate in Next.js page (`app/library/admin/catalog/page.tsx`) — calls `/api/admin/auth`
- After auth: renders iframe pointing to `/catalog-tool.html`
- `catalog-tool.html` is fully self-contained (CSS + JS inline, no external dependencies except Supabase + /api/identify)

### List view
- Breadcrumb nav: Alphagallery / Library / Admin / Catalog (all clickable, hover underline)
- Clickable stat pills: N ITEMS / N AVAILABLE / N ON LOAN / N PRIVATE — clicking filters the list, clicking again deselects
- Search input + "+ Add item" button (medium grey, rounded pill)
- Book cards: thumbnail, title, author, type + tag + AVAILABLE/ON LOAN tags
- All fonts ~20% larger than typical admin tool

### Add/Edit form
- Up to 6 photos (compressed to 1200px / 85% JPEG client-side before upload)
- "✦ Identify with AI" button → sends photos to /api/identify → Anthropic API → fills fields
- Fields: title*, author, publisher, year, type (book/magazine), tags (multi-select pills: Art/Fashion/Architecture/Design/Photography/Other), description, notes (private), price (private), link, instagram_url
- Available toggle (green) / Private toggle (purple)
- Borrower section appears when Available is off

### Detail view
- Photos: scrollable row (scroll-snap), 168×224px
- Lightbox on click: ← → nav, keyboard ArrowLeft/ArrowRight/Escape, stops at ends (no wrap)
- All fields displayed: title, author, type+tags, available/on loan/private, publisher+year, price, instagram link (View post ↗), link (full URL), description, notes (private), borrower info
- Publisher left-aligned (not in two-column grid)

---

## Favicon

Open alpha mark (α loop with tail, no closing) — white on black rounded square.
Stored at `app/icon.svg` (Next.js auto-detects as favicon).

---

## Design system

| Token | Value |
|-------|-------|
| Background | #FAFAF8 (warm off-white) |
| Text | #111110 (near-black) |
| Accent | #8C4A2F (terracotta) |
| Muted | #9B9793 |
| Border | #E8E4DF |
| Active pill | #6B6560 (medium grey) |
| Font display | EB Garamond (400, 500) — public site only |
| Font UI | Inter — public site; system sans-serif — admin/catalog |
| Max width catalog | 720px |
| Max width borrow | 520px |
| Max width admin/catalog tool | 640px |

---

## Scripts

```bash
# Fill publication years via AI for all books (skips books that already have year)
export ANTHROPIC_API_KEY=your_key
node ~/alphalibrary/scripts/batch-year.js

# Assign tags[] via AI for all books (overwrites existing tags)
export ANTHROPIC_API_KEY=your_key
node ~/alphalibrary/scripts/batch-tags.js
```

Valid tags: art, fashion, architecture, design, photography, other.
Plan: finish cataloging all ~200 books first, then revisit taxonomy and re-run batch-tags with expanded tag list.

---

## Content status (June 28, 2026 evening)

- **~55 books cataloged** (actively adding more)
- All books have tags[] (batch AI pass complete)
- ~50% have year (batch AI; obscure titles missed — fill manually in catalog tool)
- 1 book has instagram_url (Atmosphere in the Solarium)
- 0 books have price or link filled
- 2 active loans (test bookings — Erdem No.24, Lucie+Luke Meier)
- Several upcoming slots in DB

---

## What's still to do

### Highest priority
1. **Reminder emails** — Vercel cron job (`vercel.json` + `/api/cron/reminders` route)
   - Day-before visit: check bookings where slot.date = tomorrow + reminder_sent = false → send email with full address, set reminder_sent = true
   - 30-day return: check bookings where slot.date ≤ 30 days ago + returned = false + return_reminder_sent = false → send return reminder, set return_reminder_sent = true

### Content (ongoing, Davide doing manually)
2. Continue cataloging (~150 more books to go)
3. Add instagram_url to books as IG posts go up
4. Add prices + publisher links (batch AI pass script TBD)
5. Fill missing years via catalog tool

### Later
6. Re-evaluate tag taxonomy once all ~200 books are cataloged — add new categories (food, etc), run batch re-tag
7. Batch price + link fill script

### Out of scope (v1)
- User accounts / waitlist
- Japanese language
- Mobile app / payments
- Deposit book tracking

---

## Davide's coding preferences

- Plain text responses in chat — no HTML/markdown artifacts rendered in chat
- Full complete files when there are more than 2 changes — never find/replace snippets, no exceptions
- Git commit command with every code change, commit frequently
- Always build things properly with rigor, built to last — no shortcuts, no "quick fix for now"
- Never say "let me build it properly this time" — build it properly the first time
- Pipe terminal output to clipboard with `| pbcopy`
- Verify file integrity before providing for download
