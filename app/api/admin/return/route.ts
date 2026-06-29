import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, bookId } = await req.json()

  const { data: booking } = await supabase.from('bookings').select('slot_id').eq('id', bookingId).single()

  await supabase.from('bookings').update({ returned: true, returned_at: new Date().toISOString() }).eq('id', bookingId)
  await supabase.from('books').update({ available: true, borrower: null, borrower_contact: null, borrowed_at: null, due_at: null }).eq('id', bookId)
  if (booking?.slot_id) await supabase.from('slots').update({ booked: false }).eq('id', booking.slot_id)

  return NextResponse.json({ ok: true })
}
