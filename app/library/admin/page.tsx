'use client'

import { useState, useEffect } from 'react'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  booked: boolean
}

interface Booking {
  id: string
  borrower_name: string
  borrower_email: string
  returned: boolean
  books: { title: string; author: string | null } | null
  slots: { date: string; start_time: string } | null
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const auth = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      }).then(r => r.json()).then(d => {
        if (d.ok) setAuthed(true)
        else setAuthError('Wrong password.')
      })
    }
  }

  const load = () => {
    fetch('/api/admin/slots', {
      headers: { 'x-admin-password': password }
    }).then(r => r.json()).then(d => {
      if (d.slots) setSlots(d.slots)
      if (d.bookings) setBookings(d.bookings)
    })
  }

  useEffect(() => { if (authed) load() }, [authed])

  const addSlot = async () => {
    if (!newDate || !newStart || !newEnd) return
    setSaving(true)
    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ date: newDate, start_time: newStart, end_time: newEnd })
    })
    if (res.ok) {
      setMsg('Slot added.')
      setNewDate(''); setNewStart(''); setNewEnd('')
      load()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const removeSlot = async (id: string) => {
    await fetch(`/api/admin/slots?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password }
    })
    load()
  }

  const markReturned = async (bookingId: string, bookId: string) => {
    await fetch('/api/admin/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ bookingId, bookId })
    })
    load()
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (!authed) {
    return (
      <div className="admin-auth">
        <div className="admin-inner">
          <h1 className="admin-title">Alphagallery Admin</h1>
          <div className="form-field">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && auth()}
            />
          </div>
          {authError && <p className="auth-error">{authError}</p>}
          <button className="auth-btn" onClick={auth}>Enter</button>
        </div>
        <style jsx>{`
          .admin-auth { min-height: 100vh; background: #FAFAF8; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
          .admin-inner { width: 320px; padding: 0 24px; }
          .admin-title { font-family: 'EB Garamond', Georgia, serif; font-size: 24px; margin-bottom: 24px; }
          .form-field input { width: 100%; border: 1.5px solid #E8E4DF; border-radius: 8px; padding: 12px 14px; font-size: 15px; font-family: 'Inter', sans-serif; outline: none; box-sizing: border-box; }
          .form-field input:focus { border-color: #111110; }
          .auth-error { font-size: 13px; color: #C0392B; margin: 8px 0; }
          .auth-btn { margin-top: 12px; background: #111110; color: white; border: none; padding: 12px 24px; border-radius: 100px; font-size: 14px; font-family: 'Inter', sans-serif; cursor: pointer; width: 100%; }
        `}</style>
      </div>
    )
  }

  const upcomingSlots = slots.filter(s => s.date >= new Date().toISOString().split('T')[0])
  const activeBookings = bookings.filter(b => !b.returned)

  return (
    <div className="admin-wrap">
      <div className="admin-inner">
        <header className="admin-header">
          <h1>Admin</h1>
          <a href="/library" className="admin-back">← Library</a>
        </header>

        {/* Active bookings */}
        <section className="admin-section">
          <h2>Active loans ({activeBookings.length})</h2>
          {activeBookings.length === 0 ? (
            <p className="empty">No active loans.</p>
          ) : (
            <ul className="booking-list">
              {activeBookings.map(b => (
                <li key={b.id} className="booking-item">
                  <div className="booking-info">
                    <span className="booking-book">{b.books?.title || '—'}</span>
                    <span className="booking-borrower">{b.borrower_name} · {b.borrower_email}</span>
                    {b.slots && <span className="booking-date">{formatDate(b.slots.date)}</span>}
                  </div>
                  <button className="return-btn" onClick={() => markReturned(b.id, b.id)}>
                    Mark returned
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add slot */}
        <section className="admin-section">
          <h2>Add availability</h2>
          <div className="slot-form">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} />
            <span className="time-sep">to</span>
            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
            <button onClick={addSlot} disabled={saving} className="add-btn">
              {saving ? '…' : 'Add'}
            </button>
          </div>
          {msg && <p className="slot-msg">{msg}</p>}
        </section>

        {/* Upcoming slots */}
        <section className="admin-section">
          <h2>Upcoming slots ({upcomingSlots.length})</h2>
          {upcomingSlots.length === 0 ? (
            <p className="empty">No upcoming slots.</p>
          ) : (
            <ul className="slot-list">
              {upcomingSlots.map(s => (
                <li key={s.id} className="slot-item">
                  <span className="slot-date">{formatDate(s.date)}</span>
                  <span className="slot-time">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                  <span className={`slot-status ${s.booked ? 'booked' : 'free'}`}>
                    {s.booked ? 'Booked' : 'Available'}
                  </span>
                  {!s.booked && (
                    <button className="remove-btn" onClick={() => removeSlot(s.id)}>×</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <style jsx>{`
        .admin-wrap { min-height: 100vh; background: #FAFAF8; font-family: 'Inter', sans-serif; padding-bottom: 60px; }
        .admin-inner { max-width: 640px; margin: 0 auto; padding: 0 24px; }
        .admin-header { display: flex; justify-content: space-between; align-items: baseline; padding: 40px 0 32px; border-bottom: 1px solid #E8E4DF; margin-bottom: 32px; }
        .admin-header h1 { font-family: 'EB Garamond', Georgia, serif; font-size: 24px; font-weight: 500; }
        .admin-back { font-size: 13px; color: #9B9793; text-decoration: none; }
        .admin-back:hover { color: #111110; }
        .admin-section { margin-bottom: 40px; }
        .admin-section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9B9793; font-weight: 600; margin-bottom: 16px; }
        .empty { font-size: 14px; color: #9B9793; }
        .booking-list, .slot-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .booking-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1.5px solid #E8E4DF; border-radius: 8px; }
        .booking-info { display: flex; flex-direction: column; gap: 3px; }
        .booking-book { font-size: 14px; font-weight: 500; }
        .booking-borrower, .booking-date { font-size: 12px; color: #6B6560; }
        .return-btn { border: 1.5px solid #E8E4DF; background: white; padding: 6px 12px; border-radius: 100px; font-size: 12px; font-family: 'Inter', sans-serif; cursor: pointer; white-space: nowrap; }
        .return-btn:hover { border-color: #111110; }
        .slot-form { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .slot-form input { border: 1.5px solid #E8E4DF; border-radius: 8px; padding: 9px 12px; font-size: 14px; font-family: 'Inter', sans-serif; background: white; outline: none; }
        .slot-form input:focus { border-color: #111110; }
        .time-sep { font-size: 13px; color: #9B9793; }
        .add-btn { background: #111110; color: white; border: none; padding: 10px 20px; border-radius: 100px; font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer; }
        .add-btn:disabled { opacity: 0.4; }
        .slot-msg { font-size: 13px; color: #2D6A4F; margin-top: 8px; }
        .slot-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border: 1.5px solid #E8E4DF; border-radius: 8px; }
        .slot-date { font-size: 14px; font-weight: 500; flex: 1; }
        .slot-time { font-size: 13px; color: #6B6560; }
        .slot-status { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 100px; }
        .slot-status.free { background: #E8F5EE; color: #2D6A4F; }
        .slot-status.booked { background: #F2EFE9; color: #9B9793; }
        .remove-btn { background: none; border: none; color: #C0BCB8; font-size: 18px; cursor: pointer; line-height: 1; padding: 0 4px; }
        .remove-btn:hover { color: #C0392B; }
      `}</style>
    </div>
  )
}
