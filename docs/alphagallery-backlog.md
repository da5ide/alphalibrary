# Alphagallery Library — Backlog
*Last updated: June 30, 2026*

Ideas captured for future consideration. No priority order within sections — just grouped by theme. None of these are in scope right now.

---

## Catalog & Discovery

**"Just added" signal**
New books get a subtle NEW badge or highlight on the public catalog for the first 2–4 weeks after `created_at`. Lets regulars spot new arrivals without sorting.

**Language tag**
Add a `language` field (EN / JP / FR / bilingual / other). Low priority since 99% of books are English, but useful for international visitors. Could be a simple pill on the book entry.

**Series / collection grouping**
Group related books (e.g. all Wallpaper City Guides, all Phaidon monographs) under a shared series label. Especially useful for magazines where multiple issues of the same title exist. Could be a `series` text field.

**Random book button**
"Surprise me" — picks a random available book and opens it. Fun for people who don't know what they want.

---

## Borrower Experience

**Waitlist**
If a book is on loan, visitor can join a waitlist and get emailed automatically when it's returned. Requires a `waitlist` table + trigger in the return flow.

**"Pair with" suggestions in return confirmation email**
When Davide marks a book returned, the confirmation email could include a light editorial suggestion — "Since you enjoyed [title], you might like [related title]." Could be AI-generated based on the borrower's book and the current catalog.

**Borrower self-service cancel**
A unique cancel link in the confirmation email so the borrower can cancel without emailing. Generates a one-time token stored in the booking record.

---

## Admin

**Simple dashboard**
At the bottom of the admin page: total books, % on loan, most borrowed book, average return time. Could also show total unique borrowers to date.

**Bulk slot creation**
Instead of adding slots one by one, a recurring pattern: "Every Tuesday 10:00–11:00 for the next 4 weeks." Saves time when setting up a regular schedule.

**Export to CSV**
Full catalog export — title, author, publisher, year, tags, status, borrower. Useful as a backup and for sharing. Could be a button in the catalog tool header.

**60-day overdue escalation email**
A third return reminder (after 30 and 45 days) for books still not returned at 60 days. Hopefully rare.

---

## Communication

**Newsletter to past borrowers**
When a significant batch of new books is added (~20–30), email all past borrowers with a short note and a link to the catalog. Requires opting in or assuming borrowers are OK with it. Could be triggered manually from admin.

---

## Technical / Infrastructure

**PWA manifest for admin**
Add a `manifest.json` so the admin URL can be saved to the home screen as a proper icon on iOS (no browser chrome). Currently works as a web clip via Safari "Add to Home Screen" but a proper manifest improves the icon and splash screen. Low effort.

**Supabase DB constraint maintenance note**
Whenever a new tag/category is added, remember to update the `books_category_check` constraint in Supabase SQL. Learned from the food/travel incident on June 30, 2026.

---

## Out of scope (v1 decisions, kept for reference)

- User accounts / login
- Japanese language UI
- Mobile app / payments
- Deposit / book-for-book exchange tracking
- Public reviews or ratings
