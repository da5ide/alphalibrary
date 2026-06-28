# Alphagallery Library — Handoff Document
*Last updated: June 28, 2026*

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
          page.tsx                    ← auth gate for catalog tool (client component)
    api/
      book/route.ts                   ← POST: create booking, validate passphrase, send emails
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
    catalog-tool.html                 ← private cataloging tool (served at /catalog-tool.html)
                                        iframe'd by /library/admin/catalog
  scripts/
    batch-year.js                     ← AI batch fill publication years for all books
    batch-tags.js                     ← AI batch assign tags[] for all books
  docs/
    alphagallery-handoff.md           ← this file
    alphagallery-prd.md               ← product requirements
  api/                                ← DELETED (was legacy Vercel /api folder)
```

**Important:** `app/library/admin/catalog/tool/` route was deleted during cleanup. The catalog is now served as a static HTML file at `public/catalog-tool.html` and iframe'd by the Next.js page at `/library/admin/catalog`.

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
| category | text | legacy single-value, kept as fallback |
| tags | text[] | multi-tag array — primary tag field |
| description | text | AI-generated, editable |
| notes | text | private, never shown publicly |
| price | numeric | private, never shown publicly |
| link | text | publisher/shop URL |
| cover_url | text | first photo (legacy), private |
| photo_urls | text[] | up to 6 photos, private |
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
| note | text | optional note from borrower |
| created_at | timestamptz | auto |
| confirmation_sent | boolean | |
| reminder_sent | boolean | day-before reminder |
| return_reminder_sent | boolean | 30-day return reminder |
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
| LIBRARY_PASSPHRASE | ✅ Set | Required to book a visit |
| ADMIN_PASSWORD | ✅ Set | Admin + catalog tool access |

---

## Live URLs

| URL | Description |
|-----|-------------|
| alphagallery.co | Root — two links: Catalog + Library |
| alphagallery.co/library | Public catalog |
| alphagallery.co/library/borrow/[id] | Booking page per book |
| alphagallery.co/library/admin | Admin: slots + loans |
| alphagallery.co/library/admin/catalog | Catalog tool (password protected) |

---

## Public catalog (alphagallery.co/library)

- EB Garamond opening description, terracotta (#8C4A2F)
- Search box full-width with `Search… N items available` placeholder; × button clears, Escape clears
- Category filter pills (Art / Fashion / Architecture / Design / Photography / Other) + A-Z/Recent sort
- Active pill: medium grey (#6B6560)
- Each entry: type + tag pills, title (Garamond 23px), author, publisher+year, 2-line truncated description
- Click description or MORE to expand
- IG icon (terracotta, 16px, inline after title) for books with instagram_url
- BORROW: small all-caps terracotta underlined link → /library/borrow/[id]
- ON LOAN: muted grey for unavailable books
- Filter matches against tags[] array (with category fallback)
- CSS modules throughout — no styled-jsx, no FOUC
- Mobile: 16px input font-size (prevents iOS zoom)
- Footer: Alphagallery · @alphagallery.co

---

## Borrow page (alphagallery.co/library/borrow/[id])

- Book title (Garamond 32px) + author
- Fields: name, email, slot dropdown (Select…), access code (with IG hint inline), note (optional, 300 chars)
- Book a Visit button: grey/disabled until all required fields filled, terracotta outline when active
- On submit: validates passphrase → creates booking → marks book unavailable + slot booked → sends emails
- Success state shown inline (no redirect)
- Guidelines: bold key phrases (free, One item at a time, Come pick it up yourself, return within 45 days, Return by post, cancel by email)
- Mobile: 16px input font-size

---

## Email flows

| Email | Trigger | Status |
|-------|---------|--------|
| Booking confirmation → visitor | Successful booking | ✅ Done |
| New booking notification → Davide | Successful booking | ✅ Done |
| Day-before reminder → visitor | 24h before slot | ⏳ Needs cron |
| 30-day return reminder → visitor | 30 days after visit | ⏳ Needs cron |

**Confirmation email format:**
```
Hi [NAME],

Your visit is confirmed.

Book:
[TITLE]
by [AUTHOR]

Visit:
[DAY], [MONTH] [DATE]
[TIME] – [TIME]
Address: 4-18-17 Jingumae, Shibuya-ku (you'll receive a reminder with the full address the day before your visit).

A few things to remember:
Only one item per visit
Please return it within 45 days
Cancel by replying to this email if your plans change

See you soon.
instagram.com/alphagallery.co
```

---

## Admin page (alphagallery.co/library/admin)

- Password protected (ADMIN_PASSWORD)
- Header: lock icon → Catalog, globe icon → Library (SVG icons, hover underline)
- **Add availability:** custom MiniCalendar component + custom TimePicker (24h, 15-min increments, scrollable ~5 visible)
  - Desktop: calendar + times on same row
  - Mobile: calendar on first row, times on second row
- **Upcoming slots:** date, time range, OPEN (green) / BOOKED (grey) pill, × to delete unbooked slots
  - Pills fixed-width, right-aligned, consistent across all rows
- **Active loans:** book title, borrower name + email, visit date, "On loan for X days"
  - Overdue (>45 days from visit date): red border, ⚠ X days — overdue warning
  - Overdue count badge in section header
  - "Mark returned" button

---

## Catalog tool (alphagallery.co/library/admin/catalog)

- Password gate reuses ADMIN_PASSWORD via /api/admin/auth
- Password stored in sessionStorage — shared with admin page so no re-entry needed
- After auth, iframe loads /catalog-tool.html
- **List view:** breadcrumb nav (Alphagallery / Library / Catalog), stats bar (N items / N available / N on loan / N private), search, + Add item button
- **Add/Edit form:** photos (up to 6, compressed to 1200px/85% JPEG), AI identify button, fields: title, author, publisher, year, type, tag pills (multi-select), description, notes, price, link, instagram_url, available toggle, private toggle
- **Detail view:** all photos (scrollable, 140×186px), lightbox with ← → arrow navigation + keyboard (ArrowLeft/ArrowRight/Escape), all fields displayed, ON LOAN / AVAILABLE / Private tags
- AI identification via /api/identify (proxies Anthropic API, Claude Vision)
- Tag pills replace old single category dropdown

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
| Font display | EB Garamond (400, 500) |
| Font UI | Inter |
| Max width catalog | 720px |
| Max width borrow | 520px |

---

## Scripts

```bash
# Fill publication years via AI for all books
export ANTHROPIC_API_KEY=...
node ~/alphalibrary/scripts/batch-year.js

# Re-tag all books with tags[] array via AI
export ANTHROPIC_API_KEY=...
node ~/alphalibrary/scripts/batch-tags.js
```

Both scripts read from Supabase, call Claude, write back. They skip books that already have values.

---

## Content status (June 28, 2026)

- **51 books cataloged** — all have tags[], ~50% have year, 1 has instagram_url (Atmosphere in the Solarium)
- **2 active test loans** (Erdem No.24, Lucie+Luke Meier)
- **7 upcoming slots** added for testing
- Batch AI tagging: done, good coverage
- Batch AI year fill: done, ~50% coverage (obscure titles missed)

---

## What's still to do

### Reminder emails (highest priority remaining feature)
- Day-before visit reminder with address
- 30-day return reminder
- Needs Vercel cron job (`vercel.json` + `/api/cron/reminders` route)
- Check bookings where slot.date = tomorrow → send reminder
- Check bookings where slot.date = 30 days ago + not returned → send return reminder

### Content
- Continue cataloging (~150 more books)
- Add Instagram URLs to books as they get posted
- Add prices and publisher links (batch AI pass)
- Fix remaining missing years manually via catalog tool

### Admin polish
- Minor improvements deferred

### Out of scope (v1)
- User accounts
- Waitlist for lent-out books
- Japanese language
- Mobile app / payments
- Tracking deposit books

---

## Davide's coding preferences

- Plain text responses in chat — no HTML/markdown artifacts
- Full complete files when there are more than 2 changes — never find/replace snippets, no exceptions
- Git commit command with every code change, commit frequently
- Always build things properly with rigor, built to last — no shortcuts, no "quick fix for now"
- Never say "let me build it properly this time"
- Pipe terminal output to clipboard with `| pbcopy`
