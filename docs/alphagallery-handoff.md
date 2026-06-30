# Alphagallery Library — Handoff Document
*Last updated: June 30, 2026*

## What this is

A private lending library at Davide's apartment in Tokyo. People browse books online, book a visit, come pick up a book, return it within 45 days. The project lives under the Alphagallery umbrella — a broader cultural space (library, future exhibitions, etc).

All core features are live. The system is stable. Current focus is cataloging books.

---

## Key facts

| | |
|-|-|
| **Domain** | alphagallery.co (Cloudflare DNS → Vercel) |
| **Instagram** | @alphagallery.co |
| **GitHub** | github.com/da5ide/alphalibrary (public, MIT) |
| **Vercel project** | alphalibrary |
| **Local folder** | ~/alphalibrary |
| **Supabase project** | lldmgalcgrmghsqlrmjp.supabase.co |
| **Supabase anon key** | sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ |
| **Email sender** | library@alphagallery.co via Resend |
| **Notification email** | da5ide+alphalibrary@gmail.com |
| **Stack** | Next.js 16 App Router + Supabase + Vercel + Resend + Anthropic API |

---

## Repo structure

```
alphalibrary/
  app/
    layout.tsx                        ← root layout, EB Garamond + Inter fonts, metadata
    icon.svg                          ← favicon (open alpha mark, white on black)
    page.tsx                          ← root alphagallery.co — two links: Library + IG
    page.module.css                   ← root page styles
    globals.css                       ← background #FAFAF8
    library/
      page.tsx                        ← public catalog (server component, fetches books)
      borrow/[id]/
        page.tsx                      ← borrow/booking page (server component)
      admin/
        page.tsx                      ← admin: slots, loans, overdue (client component)
        catalog/
          page.tsx                    ← auth gate + iframe wrapper (client component)
    api/
      book/route.ts                   ← POST: booking + confirmation + admin notification emails
      identify/route.ts               ← POST: proxy to Anthropic API (avoids CORS from static HTML)
      admin/
        slots/route.ts                ← GET/POST/DELETE: manage slots + bookings
        auth/route.ts                 ← POST: verify ADMIN_PASSWORD
        cancel/route.ts               ← POST: cancel booking + send cancellation email
        return/route.ts               ← POST: mark returned + send return confirmation email
      cron/
        reminders/route.ts            ← GET: day-before + 30-day + 45-day reminder emails
  components/
    LibraryCatalog.tsx                ← catalog UI (client, search/filter/sort/expand)
    LibraryCatalog.module.css
    BorrowForm.tsx                    ← borrow form UI (client component)
    BorrowForm.module.css
  lib/
    supabase.ts                       ← Supabase client
    types.ts                          ← TypeScript types: Book, Slot, Booking
  public/
    catalog-tool.html                 ← private cataloging tool (self-contained, iframe'd)
  scripts/
    batch-year.js                     ← AI batch fill publication years
    batch-tags.js                     ← AI batch assign tags[]
  vercel.json                         ← cron job config (0 23 * * * = 08:00 JST)
  .env.example                        ← all required env vars documented
  docs/
    alphagallery-handoff.md           ← this file
    alphagallery-prd.md               ← product requirements
    alphagallery-backlog.md           ← future ideas (no action yet)
```

### Critical notes on catalog tool
- `catalog-tool.html` is a self-contained static HTML file with all CSS + JS inline — no TypeScript, no build step
- Served at `alphagallery.co/catalog-tool.html`, iframe'd by `/library/admin/catalog`
- Talks directly to Supabase (anon key hardcoded — acceptable for this private tool)
- AI identification calls `/api/identify` which proxies to Anthropic (CORS workaround)
- Password is stored in `sessionStorage` under key `ag_admin_pw` — shared between admin and catalog pages (no re-entry)
- Photos uploaded at original resolution; AI call uses a separate 800px/72% recompression to stay within Vercel's 4.5MB body limit

---

## Database (Supabase)

### Table: books

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| created_at | timestamptz | auto |
| title | text NOT NULL | |
| author | text | |
| publisher | text | |
| type | text | 'book' or 'magazine' |
| category | text | legacy single-value; kept as fallback for old records |
| tags | text[] | primary tag field; valid values: art, fashion, architecture, design, photography, food, travel, other |
| description | text | AI-generated, editable |
| notes | text | private — never shown publicly |
| price | numeric | private — never shown publicly |
| link | text | publisher/shop URL |
| cover_url | text | first photo (legacy field) |
| photo_urls | text[] | up to 6 photos; stored in Supabase Storage |
| available | boolean | default true |
| borrower | text | name, set when lent |
| borrower_contact | text | email, set when lent |
| borrowed_at | timestamptz | set when book lent |
| due_at | timestamptz | borrowed_at + 45 days |
| private | boolean | default false — hides from public catalog |
| instagram_url | text | URL to IG post; shows icon on public site |
| year | int | publication year |

**CHECK constraint:** `books_category_check` — must include all valid tags. If adding a new tag, update this constraint in Supabase SQL:
```sql
ALTER TABLE books DROP CONSTRAINT books_category_check;
ALTER TABLE books ADD CONSTRAINT books_category_check
  CHECK (category IN ('art', 'fashion', 'architecture', 'design', 'photography', 'food', 'travel', 'other'));
```

### Table: slots

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| date | date | |
| start_time | time | |
| end_time | time | |
| booked | boolean | default false |
| created_at | timestamptz | auto |

### Table: bookings

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| book_id | uuid FK → books | |
| slot_id | uuid FK → slots | |
| borrower_name | text | |
| borrower_email | text | |
| note | text | optional note from borrower (300 char form limit) |
| created_at | timestamptz | auto |
| confirmation_sent | boolean | |
| reminder_sent | boolean | day-before visit reminder |
| return_reminder_sent | boolean | 30-day return reminder |
| return_reminder_2_sent | boolean | 45-day return reminder |
| returned | boolean | |
| returned_at | timestamptz | |

**Storage bucket:** `covers` (public) — catalog photos; never shown on public site

---

## Environment variables

| Key | Notes |
|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| ADMIN_PASSWORD | Admin + catalog tool access |
| NEXT_PUBLIC_BORROW_PASSPHRASE | Required to complete a booking (posted on IG Stories) |
| RESEND_API_KEY | Email sending via Resend |
| ANTHROPIC_API_KEY | AI book identification + batch scripts |
| CRON_SECRET | Authorization header for /api/cron/reminders |

All documented in `.env.example`.

---

## Email flows

| # | Email | Trigger | Route |
|---|-------|---------|-------|
| 1 | Booking confirmation → visitor | Successful booking | /api/book |
| 2 | New booking notification → Davide | Successful booking | /api/book |
| 3 | Cancellation → visitor | Admin cancels booking | /api/admin/cancel |
| 4 | Day-before visit reminder → visitor | Cron (tomorrow's bookings) | /api/cron/reminders |
| 5a | 30-day return reminder → visitor | Cron (30 days post-visit) | /api/cron/reminders |
| 5b | 45-day return reminder → visitor | Cron (45 days post-visit) | /api/cron/reminders |
| 6 | Book returned confirmation → visitor | Admin marks returned | /api/admin/return |

All emails: HTML + plain text. Sent from `library@alphagallery.co`.

**Cron schedule:** `vercel.json` → `"0 23 * * *"` = 23:00 UTC = 08:00 JST

**Time format across all emails:** `H:MM - H:MM AM/PM` (single dash, spaces, AM/PM from end time only)

---

## Admin panel behavior

**Upcoming slots:** hides a slot once its `end_time` has passed (not just the date).

**Active loans:** a booking appears in Active Loans once `slot.end_time` has passed (visitor has left with the book). Before that, it shows in Upcoming Slots as BOOKED.

**Cancel modal:** starts with a blank note. The email still goes out even without a note.

**Return modal:** optional note field. If filled, the note appears between the "thank you" line and "Hope to see you again soon." in the return confirmation email.

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
| Max width catalog | 740px |
| Max width borrow | 520px |
| Max width admin | 640px |
| Max width emails | 540px |

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

Valid tags: art, fashion, architecture, design, photography, food, travel, other.

---

## Davide's coding preferences

- Plain text responses in chat — no HTML/markdown artifacts rendered in chat
- Full complete files when there are more than 2 changes — never find/replace snippets, no exceptions
- Git commit command with every code change, commit frequently
- Always build things properly with rigor, built to last — no shortcuts
- Never say "let me build it properly this time" — build it properly the first time
- Pipe terminal output to clipboard with `| pbcopy`
