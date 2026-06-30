import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

const footerHtml = `
  <div class="footer">
    <a href="https://alphagallery.co/library">Alphagallery Library</a>
    <span class="footer-sep">·</span>
    <a href="https://www.instagram.com/alphagallery.co">Alphagallery on Instagram</a>
  </div>
`

const footerText = `Alphagallery Library — alphagallery.co/library
Alphagallery on Instagram — instagram.com/alphagallery.co`

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  })
}

function formatTimeRange(start: string, end: string): string {
  const hm = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m}`
  }
  const endHour = parseInt(end.split(':')[0])
  const ampm = endHour >= 12 ? 'PM' : 'AM'
  return `${hm(start)} - ${hm(end)} ${ampm}`
}

function buildReturnReminderEmail(
  borrowerName: string,
  bookLine: string,
  visitDate: string,
  days: 30 | 45
) {
  const returnPhrase = days === 30
    ? 'Please return it when you\'re done,'
    : 'We appreciate if you could return it as soon as possible,'

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${emailStyles}</style>
</head>
<body>
<div class="wrap">
  <p>Hi ${borrowerName},</p>

  <p>A reminder that it has been ${days} days since you borrowed ${bookLine} on ${visitDate}.</p>

  <p>${returnPhrase} either by post or by dropping it in the mailbox:<br>
  4-18-17 Jingumae, Imperial Omotesando Apt #401<br>
  Shibuya-ku, Tokyo, 150-0001<br>
  (<a href="https://maps.app.goo.gl/SMuYyqhqDMHNfARG6" style="color:#111110;">Google Maps</a>)</p>

  <p>Thank you,</p>

  ${footerHtml}
</div>
</body>
</html>`

  const text = `Hi ${borrowerName},

A reminder that it has been ${days} days since you borrowed ${bookLine} on ${visitDate}.

${returnPhrase} either by post or by dropping it in the mailbox:
4-18-17 Jingumae, Imperial Omotesando Apt #401
Shibuya-ku, Tokyo, 150-0001
maps.app.goo.gl/SMuYyqhqDMHNfARG6

Thank you,

${footerText}`

  return { html, text }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const errors: string[] = []
  let visitRemindersSent = 0
  let returnRemindersSent = 0

  // -------------------------------------------------------------------------
  // 1. Day-before visit reminders
  //    Find bookings where slot.date = tomorrow (JST) and reminder_sent = false
  // -------------------------------------------------------------------------

  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const tomorrowJST = new Date(nowJST)
  tomorrowJST.setDate(tomorrowJST.getDate() + 1)
  const tomorrowDate = tomorrowJST.toISOString().split('T')[0]

  const { data: tomorrowSlots, error: tomorrowSlotsError } = await supabase
    .from('slots')
    .select('id, date, start_time, end_time')
    .eq('date', tomorrowDate)
    .eq('booked', true)

  if (tomorrowSlotsError) {
    errors.push(`slots query: ${tomorrowSlotsError.message}`)
  } else if (tomorrowSlots && tomorrowSlots.length > 0) {
    const slotIds = tomorrowSlots.map((s: { id: string }) => s.id)

    const { data: visitBookings, error: visitBookingsError } = await supabase
      .from('bookings')
      .select('id, borrower_name, borrower_email, slot_id, books(title, author)')
      .in('slot_id', slotIds)
      .eq('reminder_sent', false)
      .eq('returned', false)

    if (visitBookingsError) {
      errors.push(`visit bookings query: ${visitBookingsError.message}`)
    } else if (visitBookings) {
      for (const booking of visitBookings) {
        const slot = tomorrowSlots.find((s: { id: string }) => s.id === booking.slot_id)
        if (!slot) continue

        const book = booking.books as unknown as { title: string; author: string | null } | null
        const bookLine = book ? `${book.title}${book.author ? ` by ${book.author}` : ''}` : 'your book'
        const dateFormatted = formatDate(slot.date)
        const timeFormatted = formatTimeRange(slot.start_time, slot.end_time)

        const visitReminderHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${emailStyles}</style>
</head>
<body>
<div class="wrap">
  <p>Hi ${booking.borrower_name},<br>A reminder that your visit for ${bookLine} is tomorrow, ${dateFormatted} at ${timeFormatted}.</p>

  <p class="section-label">Address</p>
  <p class="section-value">
    4-18-17 Jingumae, Imperial Omotesando Apt #401<br>
    Shibuya-ku, Tokyo, 150-0001<br>
    (<a href="https://maps.app.goo.gl/SMuYyqhqDMHNfARG6" style="color:#111110;">Google Maps</a>)
  </p>

  <p>Reply to this email if you need to cancel or have any questions.</p>

  <p>See you tomorrow.</p>

  ${footerHtml}
</div>
</body>
</html>`

        const visitReminderText = `Hi ${booking.borrower_name},
A reminder that your visit for ${bookLine} is tomorrow, ${dateFormatted} at ${timeFormatted}.

Address:
4-18-17 Jingumae, Imperial Omotesando Apt #401
Shibuya-ku, Tokyo, 150-0001
maps.app.goo.gl/SMuYyqhqDMHNfARG6

Reply to this email if you need to cancel or have any questions.

See you tomorrow.

${footerText}`

        const { error: emailError } = await resend.emails.send({
          from: 'Alphagallery Library <library@alphagallery.co>',
          to: booking.borrower_email,
          subject: 'Reminder: your visit to Alphagallery Library is tomorrow',
          html: visitReminderHtml,
          text: visitReminderText,
        })

        if (emailError) {
          errors.push(`visit reminder email (booking ${booking.id}): ${emailError.message}`)
          continue
        }

        const { error: updateError } = await supabase
          .from('bookings')
          .update({ reminder_sent: true })
          .eq('id', booking.id)

        if (updateError) {
          errors.push(`reminder_sent update (booking ${booking.id}): ${updateError.message}`)
        } else {
          visitRemindersSent++
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. 30-day return reminders
  //    slot.date <= 30 days ago, returned = false, return_reminder_sent = false
  // -------------------------------------------------------------------------

  const thirtyDaysAgoJST = new Date(nowJST)
  thirtyDaysAgoJST.setDate(thirtyDaysAgoJST.getDate() - 30)
  const thirtyDaysAgoDate = thirtyDaysAgoJST.toISOString().split('T')[0]

  const { data: thirtyDaySlots, error: thirtyDaySlotsError } = await supabase
    .from('slots')
    .select('id, date')
    .lte('date', thirtyDaysAgoDate)
    .eq('booked', true)

  if (thirtyDaySlotsError) {
    errors.push(`30-day slots query: ${thirtyDaySlotsError.message}`)
  } else if (thirtyDaySlots && thirtyDaySlots.length > 0) {
    const slotIds = thirtyDaySlots.map((s: { id: string }) => s.id)
    const slotDateMap = Object.fromEntries(thirtyDaySlots.map((s: { id: string; date: string }) => [s.id, s.date]))

    const { data: returnBookings, error: returnBookingsError } = await supabase
      .from('bookings')
      .select('id, borrower_name, borrower_email, slot_id, books(title, author)')
      .in('slot_id', slotIds)
      .eq('returned', false)
      .eq('return_reminder_sent', false)

    if (returnBookingsError) {
      errors.push(`30-day bookings query: ${returnBookingsError.message}`)
    } else if (returnBookings) {
      for (const booking of returnBookings) {
        const book = booking.books as unknown as { title: string; author: string | null } | null
        const bookLine = book ? `${book.title}${book.author ? ` by ${book.author}` : ''}` : 'your book'
        const bookTitle = book?.title ?? 'your borrowed book'
        const visitDate = formatDate(slotDateMap[booking.slot_id] ?? '')

        const { html, text } = buildReturnReminderEmail(booking.borrower_name, bookLine, visitDate, 30)

        const { error: emailError } = await resend.emails.send({
          from: 'Alphagallery Library <library@alphagallery.co>',
          to: booking.borrower_email,
          subject: `Please return: ${bookTitle}`,
          html,
          text,
        })

        if (emailError) {
          errors.push(`30-day return email (booking ${booking.id}): ${emailError.message}`)
          continue
        }

        const { error: updateError } = await supabase
          .from('bookings')
          .update({ return_reminder_sent: true })
          .eq('id', booking.id)

        if (updateError) {
          errors.push(`return_reminder_sent update (booking ${booking.id}): ${updateError.message}`)
        } else {
          returnRemindersSent++
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. 45-day return reminders
  //    slot.date <= 45 days ago, returned = false, return_reminder_2_sent = false
  // -------------------------------------------------------------------------

  const fortyFiveDaysAgoJST = new Date(nowJST)
  fortyFiveDaysAgoJST.setDate(fortyFiveDaysAgoJST.getDate() - 45)
  const fortyFiveDaysAgoDate = fortyFiveDaysAgoJST.toISOString().split('T')[0]

  const { data: fortyFiveDaySlots, error: fortyFiveDaySlotsError } = await supabase
    .from('slots')
    .select('id, date')
    .lte('date', fortyFiveDaysAgoDate)
    .eq('booked', true)

  if (fortyFiveDaySlotsError) {
    errors.push(`45-day slots query: ${fortyFiveDaySlotsError.message}`)
  } else if (fortyFiveDaySlots && fortyFiveDaySlots.length > 0) {
    const slotIds = fortyFiveDaySlots.map((s: { id: string }) => s.id)
    const slotDateMap = Object.fromEntries(fortyFiveDaySlots.map((s: { id: string; date: string }) => [s.id, s.date]))

    const { data: lateBookings, error: lateBookingsError } = await supabase
      .from('bookings')
      .select('id, borrower_name, borrower_email, slot_id, books(title, author)')
      .in('slot_id', slotIds)
      .eq('returned', false)
      .eq('return_reminder_2_sent', false)

    if (lateBookingsError) {
      errors.push(`45-day bookings query: ${lateBookingsError.message}`)
    } else if (lateBookings) {
      for (const booking of lateBookings) {
        const book = booking.books as unknown as { title: string; author: string | null } | null
        const bookLine = book ? `${book.title}${book.author ? ` by ${book.author}` : ''}` : 'your book'
        const bookTitle = book?.title ?? 'your borrowed book'
        const visitDate = formatDate(slotDateMap[booking.slot_id] ?? '')

        const { html, text } = buildReturnReminderEmail(booking.borrower_name, bookLine, visitDate, 45)

        const { error: emailError } = await resend.emails.send({
          from: 'Alphagallery Library <library@alphagallery.co>',
          to: booking.borrower_email,
          subject: `Please return: ${bookTitle}`,
          html,
          text,
        })

        if (emailError) {
          errors.push(`45-day return email (booking ${booking.id}): ${emailError.message}`)
          continue
        }

        const { error: updateError } = await supabase
          .from('bookings')
          .update({ return_reminder_2_sent: true })
          .eq('id', booking.id)

        if (updateError) {
          errors.push(`return_reminder_2_sent update (booking ${booking.id}): ${updateError.message}`)
        } else {
          returnRemindersSent++
        }
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    visitRemindersSent,
    returnRemindersSent,
    errors,
  })
}
