# Alphagallery Library

A private lending library web app. People browse a catalog of books and magazines online, book a visit, borrow something, and return it. Built for a real library at a private apartment in Tokyo — but the code is generic enough to run your own.

Live at [alphagallery.co/library](https://alphagallery.co/library).

---

## What it does

- Public catalog with search, category filters, and type filters (Books / Magazines)
- Borrowing flow: visitor picks a book, selects a visit slot, enters name + email + passphrase
- Confirmation email sent on booking; reminder email sent the day before the visit
- Admin panel: manage slots, view active loans, cancel bookings, mark returns
- Private cataloging tool with AI-assisted book identification from photos
- Past loans history

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (book photos) |
| Email | Resend |
| AI identification | Anthropic API (Claude) |
| Deployment | Vercel |
| Fonts | EB Garamond + Inter (Google Fonts) |

---

## Project structure

```
app/
  library/
    page.tsx                  ← public catalog
    borrow/[id]/page.tsx      ← booking flow
    admin/page.tsx            ← admin panel
    admin/catalog/page.tsx    ← catalog tool (password-gated iframe)
  api/
    book/route.ts             ← create booking, send confirmation email
    identify/route.ts         ← proxy to Anthropic API (AI book ID)
    admin/
      auth/route.ts           ← verify admin password
      slots/route.ts          ← manage visit slots and bookings
      return/route.ts         ← mark book returned
      cancel/route.ts         ← cancel booking + send email
components/
  LibraryCatalog.tsx          ← catalog UI (search, filter, sort)
  BorrowForm.tsx              ← booking form
lib/
  types.ts                    ← TypeScript types
  supabase.ts                 ← Supabase client
public/
  catalog-tool.html           ← self-contained cataloging tool (vanilla JS)
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
```

### 2. Supabase

Create a project at [supabase.com](https://supabase.com). Then run this SQL in the Supabase SQL editor to create the three tables:

```sql
-- Books
create table books (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  author text,
  publisher text,
  year int,
  type text check (type in ('book', 'magazine')),
  category text,
  tags text[],
  description text,
  notes text,
  price numeric,
  link text,
  cover_url text,
  photo_urls text[],
  instagram_url text,
  available boolean default true,
  private boolean default false,
  borrower text,
  borrower_contact text,
  borrowed_at timestamptz,
  due_at timestamptz
);

-- Visit slots
create table slots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  start_time time not null,
  end_time time not null,
  booked boolean default false
);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  book_id uuid references books(id),
  slot_id uuid references slots(id),
  borrower_name text,
  borrower_email text,
  confirmation_sent boolean default false,
  reminder_sent boolean default false,
  return_reminder_sent boolean default false,
  returned boolean default false,
  returned_at timestamptz
);
```

Enable Row Level Security (RLS) on all three tables, then add a policy on each that allows `anon` full access — the app uses the anon key for all operations, with the admin password checked at the API layer.

Create a Storage bucket called `book-photos` and set it to public.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin
ADMIN_PASSWORD=choose-a-strong-password

# Passphrase visitors need to book a visit
NEXT_PUBLIC_BORROW_PASSPHRASE=your-passphrase

# Email (Resend)
RESEND_API_KEY=re_...

# AI book identification (optional — catalog tool works without it)
ANTHROPIC_API_KEY=sk-ant-...

# Cron job authentication (for reminder emails via Vercel cron)
CRON_SECRET=choose-a-random-string
```

### 4. Customize

A few things to update before deploying:

- **Email sender** — search for `library@alphagallery.co` and replace with your verified Resend sender address
- **Notification email** — in `app/api/book/route.ts`, update the address where booking notifications are sent to you
- **Site name and copy** — `app/layout.tsx` (metadata), `components/LibraryCatalog.tsx` (intro text), `components/BorrowForm.tsx`
- **Category tags** — in `components/LibraryCatalog.tsx` and `public/catalog-tool.html`, update `CATEGORIES` and the tag pills to match your collection
- **Loan duration** — in `app/api/book/route.ts`, the due date defaults to 45 days; adjust as needed

### 5. Deploy to Vercel

```bash
npm run build   # verify it builds locally first
```

Push to GitHub, import the repo in Vercel, and add all environment variables from step 3 in the Vercel dashboard.

For reminder emails, Vercel cron is configured in `vercel.json`. The cron route lives at `app/api/cron/reminders/route.ts`. Add `CRON_SECRET` to your Vercel environment variables to authenticate the cron calls.

---

## The cataloging tool

`/library/admin/catalog` is a private, password-gated tool for adding and managing books. It uses the Anthropic API to identify books from photos — point your phone camera at the cover, upload the photo, and it fills in title, author, publisher, year, and tags automatically. You can edit everything before saving.

The tool works without an Anthropic API key; you'd just fill in fields manually.

---

## License

MIT. Use it, adapt it, run your own library.
