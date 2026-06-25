# Alphagallery Library — Handoff Document
*Last updated: June 25, 2026*

## What we're building

A private lending library at Davide's apartment in Tokyo. People browse books online, book a visit, come pick up a book, return it within 45 days. The project lives under the Alphagallery umbrella — a broader cultural space Davide is developing (private library, future exhibitions, etc).

---

## Key facts

**Domain:** alphagallery.co (registered on Cloudflare)
**Instagram:** @alphagallery.co
**GitHub repo:** github.com/da5ide/alphalibrary (private)
**Vercel project:** alphalibrary (alphalibrary.vercel.app) — deployed and live
**Local folder:** ~/alphalibrary
**Supabase project:** lldmgalcgrmghsqlrmjp.supabase.co
**Supabase anon key:** sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ
**Email sender:** library@alphagallery.co via Resend (verified and working)
**Notification email:** da5ide+alphalibrary@gmail.com
**Email service:** Resend — domain verified, API key set in Vercel

---

## Repo structure

```
alphalibrary/
  app/
    layout.tsx                  ← root layout, EB Garamond + Inter fonts
    page.tsx                    ← root (Next.js default, unused)
    library/
      page.tsx                  ← public catalog page (server component)
      borrow/[id]/
        page.tsx                ← borrow/booking page (server component)
      admin/
        page.tsx                ← admin slot management (client component)
    api/
      book/route.ts             ← POST: create booking, send emails
      admin/
        slots/route.ts          ← GET/POST/DELETE: manage slots
        auth/route.ts           ← POST: verify admin password
        return/route.ts         ← POST: mark book returned
      identify/                 ← (legacy, in /api/ not /app/api/) proxies Anthropic API
  components/
    LibraryCatalog.tsx          ← catalog UI (client component, search/filter/sort)
    BorrowForm.tsx              ← borrow form UI (client component)
  lib/
    supabase.ts                 ← Supabase client
    types.ts                    ← TypeScript types for Book, Slot, Booking
  public/
    catalog/
      index.html                ← private cataloging tool (alphalibrary.vercel.app/catalog)
  docs/
    handoff.md                  ← this file
    prd.md                      ← product requirements
```

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
| category | text | single — pending migration to tags[] |
| description | text | AI-generated, editable |
| notes | text | private, never public |
| price | numeric | private, never public |
| link | text | |
| cover_url | text | first photo, private |
| photo_urls | text[] | up to 6 photos, private |
| available | boolean | default true |
| borrower | text | |
| borrower_contact | text | |
| borrowed_at | timestamptz | |
| due_at | timestamptz | |
| private | boolean | default false |
| instagram_url | text | links to IG post, shown as icon on public site |
| year | int | publication year |

**Table: slots**
| Column | Type |
|--------|------|
| id | uuid PK |
| date | date |
| start_time | time |
| end_time | time |
| booked | boolean default false |
| created_at | timestamptz |

**Table: bookings**
| Column | Type |
|--------|------|
| id | uuid PK |
| book_id | uuid FK → books |
| slot_id | uuid FK → slots |
| borrower_name | text |
| borrower_email | text |
| created_at | timestamptz |
| confirmation_sent | boolean |
| reminder_sent | boolean |
| return_reminder_sent | boolean |
| returned | boolean |
| returned_at | timestamptz |

**Storage bucket:** covers (public) — catalog photos only, never shown publicly

---

## Env vars (Vercel)

| Key | Status |
|-----|--------|
| ANTHROPIC_API_KEY | ✅ Set |
| RESEND_API_KEY | ✅ Set |
| NEXT_PUBLIC_SUPABASE_URL | ✅ Set |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Set |
| LIBRARY_PASSPHRASE | ✅ Set (Davide knows it) |
| ADMIN_PASSWORD | ✅ Set (Davide knows it) |

---

## What's live

**alphalibrary.vercel.app/catalog** — private cataloging tool
- Phone-friendly, AI book identification via Claude Vision
- Up to 6 photos per book, compressed client-side before API call
- ISBN lookup via Open Library as fallback
- Fields: title, author, publisher, type, category, description, notes, price, link, instagram_url, available toggle, private toggle

**alphalibrary.vercel.app/library** — public catalog
- Opening description in EB Garamond, terracotta color
- Search (title/author/publisher), filter by category pills, sort A-Z/Recent
- Each book: type+category tags, title, author, publisher, 2-line truncated description (expandable), MORE · BORROW inline actions
- IG icon inline after title for books with instagram_url set
- BORROW is small all-caps terracotta text link
- Currently on loan shows as "On loan" in muted grey

**alphalibrary.vercel.app/library/borrow/[id]** — booking page
- Shows book title/author, name+email fields, slot picker, passphrase field
- Guidelines with Davide's copy
- Sends confirmation email to visitor + notification to Davide on booking
- Marks book unavailable + slot booked in DB

**alphalibrary.vercel.app/library/admin** — slot management
- Password protected
- Add/remove time slots
- View active loans, mark as returned

---

## Design decisions

- **Typography:** EB Garamond for display/titles/description, Inter for everything else
- **Color:** warm off-white bg (#FAFAF8), near-black text (#111110), terracotta accent (#8C4A2F) for description + Borrow + IG icon
- **No cover images** on public site — typography only
- **Borders** sit inside the 720px content column, not full-width
- **Max width:** 720px centered
- **Filter pills** active state: medium grey (#6B6560), not black
- **Borrow + More** are same size small all-caps, underlined, inline

---

## What's still to do

### High priority
1. **Point alphagallery.co/library to Vercel** — add CNAME in Cloudflare DNS, configure custom domain in Vercel
2. **Borrow page design** — currently functional but unstyled relative to the catalog
3. **Add time slots** in admin before going live — currently no slots = "no available dates"
4. **Choose and set LIBRARY_PASSPHRASE** — post on IG when ready to launch

### Medium priority
5. **Multi-tag support** — replace single `category` with `tags text[]`, update catalog tool, run retroactive AI re-tagging batch on all 51 books
6. **Reminder emails** — day-before visit reminder, 30-day return reminder (need cron job or Resend scheduled sends)
7. **Continue cataloging** — 51 books in, more to add

### Later
8. **Batch price + link fill** — Claude looks up publisher URLs and reference prices for all books
9. **IG url field in catalog tool** — currently must be added directly in Supabase; add to catalog UI
10. **Root alphagallery.co site** — library lives at /library; root domain needs something eventually

---

## Davide's coding preferences

- Plain text responses, no HTML artifacts in chat
- Full files when there are more than 2 changes — never find/replace snippets
- Always include git commit command with every code change
- File delivered with its correct final name and path — no renaming needed
- Pipe terminal output to clipboard with `| pbcopy`
- Commit frequently — don't batch too many changes before committing
