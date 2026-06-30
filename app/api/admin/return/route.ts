import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #111110; background: #ffffff; margin: 0; padding: 0; }
  .wrap { max-width: 540px; margin: 0 auto; padding: 40px 24px; }
  p { margin: 0 0 16px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E4DF; font-size: 13px; color: #9B9793; }
  .footer a { color: #9B9793; text-decoration: none; }
  .footer-sep { margin: 0 6px; }
`

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, bookId, borrowerName, borrowerEmail, bookTitle, note } = await req.json()

  const { data: booking } = await supabase.from('bookings').select('slot_id').eq('id', bookingId).single()

  await supabase.from('bookings').update({ returned: true, returned_at: new Date().toISOString() }).eq('id', bookingId)
  await supabase.from('books').update({ available: true, borrower: null, borrower_contact: null, borrowed_at: null, due_at: null }).eq('id', bookId)
  if (booking?.slot_id) await supabase.from('slots').update({ booked: false }).eq('id', booking.slot_id)

  if (borrowerEmail && borrowerName && bookTitle) {
    const noteBlock = note?.trim() ? `<p>${note.trim()}</p>` : ''
    const noteLine = note?.trim() ? `\n${note.trim()}\n` : ''

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${emailStyles}</style>
</head>
<body>
<div class="wrap">
  <p>Hi ${borrowerName},<br>We've received ${bookTitle} — thank you for returning it!</p>

  ${noteBlock}

  <p>Hope to see you again soon.</p>

  <div class="footer">
    <a href="https://alphagallery.co/library">Alphagallery Library</a>
    <span class="footer-sep">·</span>
    <a href="https://www.instagram.com/alphagallery.co">Alphagallery on Instagram</a>
  </div>
</div>
</body>
</html>`

    const text = `Hi ${borrowerName},
We've received ${bookTitle} — thank you for returning it!
${noteLine}
Hope to see you again soon.

Alphagallery Library — alphagallery.co/library
Alphagallery on Instagram — instagram.com/alphagallery.co`

    await resend.emails.send({
      from: 'Alphagallery Library <library@alphagallery.co>',
      to: borrowerEmail,
      subject: `Thank you for returning ${bookTitle}`,
      html,
      text,
    })
  }

  return NextResponse.json({ ok: true })
}
