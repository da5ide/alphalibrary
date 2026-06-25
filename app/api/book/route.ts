import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, slotId, passphrase, bookId } = await req.json()

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
  const slotFormatted = `${dayNames[slotDate.getDay()]}, ${monthNames[slotDate.getMonth()]} ${slotDate.getDate()} — ${formatTime(slot.start_time)}–${formatTime(slot.end_time)}`

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      book_id: bookId,
      slot_id: slotId,
      borrower_name: name,
      borrower_email: email,
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

  // Send confirmation email to visitor
  await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: email,
    subject: `Visit confirmed — ${book.title}`,
    text: `Hi ${name},

Your visit to Alphagallery Library is confirmed.

Book: ${book.title}${book.author ? ` by ${book.author}` : ''}
Visit: ${slotFormatted}

You'll receive a reminder with the address the day before your visit.

A few things to remember:
— Only one item per visit
— Please return within 45 days
— Cancel by replying to this email if your plans change

See you soon.

Alphagallery Library · Tokyo · instagram.com/alphagallery.co`,
  })

  // Send notification to Davide
  await resend.emails.send({
    from: 'Alphagallery Library <library@alphagallery.co>',
    to: 'da5ide+alphalibrary@gmail.com',
    reply_to: email,
    subject: `New booking: ${book.title}`,
    text: `New booking received.

Borrower: ${name}
Email: ${email}
Book: ${book.title}${book.author ? ` by ${book.author}` : ''}
Visit: ${slotFormatted}`,
  })

  // Update confirmation sent flag
  await supabase.from('bookings').update({ confirmation_sent: true }).eq('id', booking.id)

  return NextResponse.json({ success: true })
}
