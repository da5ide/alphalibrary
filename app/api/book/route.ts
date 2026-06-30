import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, slotId, passphrase, bookId, note } = await req.json()

  // Validate passphrase
  if (passphrase !== process.env.LIBRARY_PASSPHRASE) {
    return NextResponse.json({ error: 'Incorrect access code.' }, { status: 401 })
  }

  // Validate required fields
  if (!name || !email || !slotId || !bookId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // Check book is still available
  const { data: book } = await supabase
    .from('books')
    .select('id, title, author, available')
    .eq('id', bookId)
    .single()

  if (!book || !book.available) {
    return NextResponse.json({ error: 'This book is no longer available.' }, { status: 409 })
  }

  // Check slot is still available
  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('id', slotId)
    .eq('booked', false)
    .single()

  if (!slot) {
    return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 })
  }

  // Format slot for emails
  const slotDate = new Date(slot.date + 'T00:00:00')
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const formatTime = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }
  const dateFormatted = `${dayNames[slotDate.getDay()]}, ${monthNames[slotDate.getMonth()]} ${slotDate.getDate()}`
  const timeFormatted = `${formatTime(slot.start_time)}–${formatTime(slot.end_time)}`
  const slotFormatted = `${dateFormatted} — ${timeFormatted}`

  const bookLine = `${book.title}${book.author ? ` by ${book.author}` : ''}`

  // HTML email
  const confirmationHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #111110; background: #ffffff; margin: 0; padding: 0; }
  .wrap { max-width: 540px; margin: 0 auto; padding: 40px 24px; }
  p { margin: 0 0 16px; }
  ul { margin: 8px 0 16px; padding-left: 20px; }
  li { margin-bottom: 6px; }
  .section-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #9B9793; margin-bottom: 2px; }
  .section-value { margin-bottom: 20px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E4DF; font-size: 13px; color: #9B9793; }
  .footer a { color: #9B9793; text-decoration: none; }
  .footer a:hover { color: #111110; }
  .footer-sep { margin: 0 6px; }
</style>
</head>
<body>
<div class="wrap">
  <p>Hi ${name},<br>Your visit is confirmed.</p>

  <p class="section-label">Book</p>
  <p class="section-value">${bookLine}</p>

  <p class="section-label">Visit</p>
  <p class="section-value">${dateFormatted}<br>${timeFormatted}</p>

  <p class="section-label">Address</p>
  <p class="section-value">4-18-17 Jingumae, Shibuya-ku<br><span style="color:#9B9793;">You'll receive a reminder with the full address the day before your visit.</span></p>

  <p><strong>A few things to remember:</strong></p>
  <ul>
    <li>Borrowing is free.</li>
    <li>One item at a time, please.</li>
    <li>Come pick it up yourself — you'll receive a reminder with the full address the day before your visit.</li>
    <li>Take your time with it, but please return it within 45 days; a reminder will be sent before then.</li>
    <li>Return by post or drop it in the mailbox — no need to schedule a return visit.</li>
    <li>If you can no longer make your visit, please cancel by email.</li>
    <li>Please do not feel like you have to bring anything in exchange — but if there's a book or magazine you'd like to share, it's always welcome.</li>
    <li>We trust you'll take good care of what you borrow and return it in the same condition.</li>
  </ul>

  <p>See you soon,</p>

  <div class="footer">
    <a href="https://alphagallery.co/library">Alphagallery Library</a>
    <span class="footer-sep">·</span>
    <a href="https://www.instagram.com/alphagallery.co">Alphagallery on Instagram</a>
  </div>
</div>
</body>
</html>`

  // Plain text fallback
  const confirmationText = `Hi ${name},
Your visit is confirmed.

Book:
${bookLine}

Visit:
${dateFormatted} ${timeFormatted}

Address:
4-18-17 Jingumae, Shibuya-ku
(You'll receive a reminder with the full address the day before your visit.)

A few things to remember:

* Borrowing is free.
* One item at a time, please.
* Come pick it up yourself — you'll receive a reminder with the full address the day before your visit.
* Take your time with it, but please return it within 45 days; a reminder will be sent before then.
* Return by post or drop it in the mailbox — no need to schedule a return visit.
* If you can no longer make your visit, please cancel by email.
* Please do not feel like you have to bring anything in exchange — but if there's a book or magazine you'd like to share, it's always welcome.
* We trust you'll take good care of what you borrow and return it in the same condition.

See you soon,
Alphagallery Library — alphagallery.co/library
Alphagallery on Instagram — instagram.com/alphagallery.co`

  // Send confirmation email to visitor
  await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: email,
    subject: `Visit confirmed — ${book.title}`,
    html: confirmationHtml,
    text: confirmationText,
  })

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      book_id: bookId,
      slot_id: slotId,
      borrower_name: name,
      borrower_email: email,
      note: note || null,
    })
    .select()
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Failed to create booking.' }, { status: 500 })
  }

  // Mark slot as booked
  await supabase.from('slots').update({ booked: true }).eq('id', slotId)

  // Mark book as unavailable
  await supabase.from('books').update({
    available: false,
    borrower: name,
    borrower_contact: email,
    borrowed_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq('id', bookId)

  // Send notification to Davide
  await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: 'da5ide+alphalibrary@gmail.com',
    replyTo: email,
    subject: `New booking: ${book.title}`,
    text: `New booking received.

Borrower: ${name}
Email: ${email}
Book: ${book.title}${book.author ? ` by ${book.author}` : ''}
Visit: ${slotFormatted}${note ? `\nNote: ${note}` : ''}`,
  })

  // Update confirmation sent flag
  await supabase.from('bookings').update({ confirmation_sent: true }).eq('id', booking.id)

  return NextResponse.json({ success: true })
}
