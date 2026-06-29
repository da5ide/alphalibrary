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

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, slotId, bookId, borrowerName, borrowerEmail, bookTitle, bookAuthor, slotDate, slotStart, slotEnd, note } = await req.json()

  const dateFormatted = formatDate(slotDate)
  const timeFormatted = `${formatTime(slotStart)} – ${formatTime(slotEnd)}`

  const emailText = [
    `Hi ${borrowerName},`,
    '',
    'I need to cancel your upcoming visit to Alphagallery Library.',
    '',
    'Visit:',
    dateFormatted,
    timeFormatted,
    '',
    'Book:',
    bookTitle,
    bookAuthor ? `by ${bookAuthor}` : '',
    '',
    note ? note.trim() : '',
    '',
    'You can book a new visit whenever you\'re ready at alphagallery.co/library.',
    '',
    'Sorry again for the inconvenience.',
    'instagram.com/alphagallery.co',
  ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n')

  const { error: emailError } = await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: borrowerEmail,
    subject: `Cancelled: your visit on ${dateFormatted}`,
    text: emailText,
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
