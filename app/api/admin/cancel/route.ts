import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo',
  })
}

function formatTime(t: string): string {
  return t.slice(0, 5)
}

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #111110; background: #ffffff; margin: 0; padding: 0; }
  .wrap { max-width: 540px; margin: 0 auto; padding: 40px 24px; }
  p { margin: 0 0 16px; }
  .section-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #9B9793; margin-bottom: 2px; }
  .section-value { margin-bottom: 20px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E4DF; font-size: 13px; color: #9B9793; }
  .footer a { color: #9B9793; text-decoration: none; }
  .footer-sep { margin: 0 6px; }
`

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, slotId, bookId, borrowerName, borrowerEmail, bookTitle, bookAuthor, slotDate, slotStart, slotEnd, note } = await req.json()

  const dateFormatted = formatDate(slotDate)
  const timeFormatted = `${formatTime(slotStart)} – ${formatTime(slotEnd)}`
  const bookLine = `${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}`

  const cancellationHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${emailStyles}</style>
</head>
<body>
<div class="wrap">
  <p>Hi ${borrowerName},<br>I am sorry but I need to cancel your upcoming visit to Alphagallery Library.</p>

  ${note ? `<p>${note.trim()}</p>` : ''}
  <p>You can book a new visit whenever you're ready at <a href="https://alphagallery.co/library" style="color:#111110;">alphagallery.co/library</a>.</p>

  <p class="section-label">Visit</p>
  <p class="section-value">${dateFormatted} ${timeFormatted}</p>

  <p class="section-label">Book</p>
  <p class="section-value">${bookLine}</p>

  <p>Sorry again for the inconvenience.</p>

  <div class="footer">
    <a href="https://alphagallery.co/library">Alphagallery Library</a>
    <span class="footer-sep">·</span>
    <a href="https://www.instagram.com/alphagallery.co">Alphagallery on Instagram</a>
  </div>
</div>
</body>
</html>`

  const cancellationText = `Hi ${borrowerName},
I am sorry but I need to cancel your upcoming visit to Alphagallery Library.
${note ? `\n${note.trim()}\n` : ''}
You can book a new visit whenever you're ready at alphagallery.co/library.

Visit:
${dateFormatted} ${timeFormatted}

Book:
${bookLine}

Sorry again for the inconvenience.

Alphagallery Library — alphagallery.co/library
Alphagallery on Instagram — instagram.com/alphagallery.co`

  const { error: emailError } = await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: borrowerEmail,
    subject: `Cancelled: your visit on ${dateFormatted}`,
    html: cancellationHtml,
    text: cancellationText,
  })

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 })
  }

  // Unbook the slot
  await supabase.from('slots').update({ booked: false }).eq('id', slotId)

  // Restore book availability
  await supabase.from('books').update({
    available: true, borrower: null, borrower_contact: null, borrowed_at: null, due_at: null,
  }).eq('id', bookId)

  // Delete the booking record
  await supabase.from('bookings').delete().eq('id', bookingId)

  return NextResponse.json({ ok: true })
}
