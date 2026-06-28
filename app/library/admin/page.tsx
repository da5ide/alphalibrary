'use client'

import { useState, useEffect, useRef } from 'react'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  booked: boolean
}

interface Booking {
  id: string
  book_id: string
  borrower_name: string
  borrower_email: string
  returned: boolean
  books: { title: string; author: string | null; borrowed_at: string | null } | null
  slots: { date: string; start_time: string } | null
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0')
  const m = ((i % 4) * 15).toString().padStart(2, '0')
  return `${h}:${m}`
})

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function isOverdue(booking: Booking): boolean {
  if (!booking.slots?.date) return false
  const slotDate = new Date(booking.slots.date + 'T00:00:00')
  const dueDate = new Date(slotDate.getTime() + 45 * 24 * 60 * 60 * 1000)
  return new Date() > dueDate
}

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function daysSinceBorrow(booking: Booking): number | null {
  if (!booking.slots?.date) return null
  const slotDate = new Date(booking.slots.date + 'T00:00:00')
  const ms = new Date().getTime() - slotDate.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return days >= 0 ? days : null
}

// SVG icons
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ value, onChange, minDate }: { value: string; onChange: (d: string) => void; minDate: string }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]

  const selectDay = (day: number) => {
    const m = (viewMonth + 1).toString().padStart(2, '0')
    const d = day.toString().padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date'

  return (
    <div ref={ref} style={{position:'relative',flex:1}}>
      <button type="button" onClick={() => setOpen(!open)} style={{border:'1.5px solid #E8E4DF',borderRadius:8,padding:'9px 14px',fontSize:14,fontFamily:'inherit',background:'white',color:value?'#111110':'#B0ACA8',cursor:'pointer',whiteSpace:'nowrap',width:'100%',textAlign:'left'}}>
        {display}
      </button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:100,background:'white',border:'1.5px solid #E8E4DF',borderRadius:12,padding:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',width:260}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }} style={navBtn}>‹</button>
            <span style={{fontSize:14,fontWeight:600,color:'#111110'}}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }} style={navBtn}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
            {DAYS.map(d => <div key={d} style={{textAlign:'center',fontSize:11,color:'#9B9793',fontWeight:600,padding:'4px 0'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const m = (viewMonth + 1).toString().padStart(2, '0')
              const d = day.toString().padStart(2, '0')
              const dateStr = `${viewYear}-${m}-${d}`
              const isPast = dateStr < minDate
              const isSelected = dateStr === value
              return (
                <button key={i} type="button" disabled={isPast} onClick={() => selectDay(day)} style={{border:'none',borderRadius:6,padding:'7px 4px',fontSize:13,cursor:isPast?'default':'pointer',background:isSelected?'#111110':'transparent',color:isSelected?'white':isPast?'#D0CCC8':'#111110',fontFamily:'inherit'}}>
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Time Picker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && listRef.current) {
      const idx = TIME_OPTIONS.indexOf(value)
      if (idx >= 0) listRef.current.scrollTop = Math.max(0, (idx - 2) * 40)
    }
  }, [open, value])

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" onClick={() => setOpen(!open)} style={{border:'1.5px solid #E8E4DF',borderRadius:8,padding:'9px 14px',fontSize:14,fontFamily:'inherit',background:'white',color:'#111110',cursor:'pointer',minWidth:90,textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        {value}<span style={{color:'#B0ACA8',fontSize:10}}>▾</span>
      </button>
      {open && (
        <div ref={listRef} style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:100,background:'white',border:'1.5px solid #E8E4DF',borderRadius:10,boxShadow:'0 4px 24px rgba(0,0,0,0.08)',overflowY:'auto',maxHeight:200,width:100}}>
          {TIME_OPTIONS.map(t => (
            <button key={t} type="button" onClick={() => { onChange(t); setOpen(false) }} style={{display:'block',width:'100%',border:'none',background:t===value?'#F2EFE9':'transparent',color:t===value?'#111110':'#333',padding:'10px 14px',fontSize:14,fontFamily:'inherit',cursor:'pointer',textAlign:'left',fontWeight:t===value?500:400}}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#6B6560',padding:'0 8px',lineHeight:1,borderRadius:6}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('10:00')
  const [newEnd, setNewEnd] = useState('11:00')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const auth = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    const d = await res.json()
    if (d.ok) { setAuthed(true); sessionStorage.setItem('ag_admin_pw', password) }
    else setAuthError('Wrong password.')
  }

  const load = async () => {
    const res = await fetch('/api/admin/slots', { headers: { 'x-admin-password': password } })
    const d = await res.json()
    if (d.slots) setSlots(d.slots)
    if (d.bookings) setBookings(d.bookings)
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
    if (res.ok) { setMsg('Slot added.'); setNewDate(''); load() }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const removeSlot = async (id: string) => {
    await fetch(`/api/admin/slots?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } })
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

  const today = new Date().toISOString().split('T')[0]
  const upcomingSlots = slots.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const activeBookings = bookings.filter(b => !b.returned)
  const overdueBookings = activeBookings.filter(isOverdue)
  const currentBookings = activeBookings.filter(b => !isOverdue(b))

  if (!authed) {
    return (
      <div style={{minHeight:'100vh',background:'#FAFAF8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-inter),-apple-system,sans-serif'}}>
        <div style={{width:320,padding:'0 24px'}}>
          <h1 style={{fontFamily:'var(--font-garamond),Georgia,serif',fontSize:24,marginBottom:24,color:'#111110'}}>Alphagallery Admin</h1>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && auth()} style={{width:'100%',border:'1.5px solid #E8E4DF',borderRadius:8,padding:'12px 14px',fontSize:15,fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,marginBottom:8}} />
          {authError && <p style={{fontSize:13,color:'#C0392B',marginBottom:8}}>{authError}</p>}
          <button onClick={auth} style={{width:'100%',background:'#111110',color:'white',border:'none',padding:'13px 24px',borderRadius:100,fontSize:14,fontFamily:'inherit',cursor:'pointer',marginTop:4}}>Enter</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#FAFAF8',fontFamily:'var(--font-inter),-apple-system,sans-serif',paddingBottom:80}}>
      <style>{`
        .admin-nav-link { color: #111110; text-decoration: none; font-size: 17px; display: flex; align-items: center; gap: 8px; }
        @media (max-width: 600px) { .admin-nav-link { padding: 4px 0; } }
        .admin-nav-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .slot-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border: 1.5px solid #E8E4DF; border-radius: 8px; }
        .avail-row { display: flex; gap: 10px; align-items: center; }
        @media (max-width: 600px) { .avail-row { flex-direction: column; align-items: flex-start; } }
      `}</style>
      <div style={{maxWidth:640,margin:'0 auto',padding:'0 24px'}}>

        {/* Header */}
        <div style={{padding:'40px 0 28px',borderBottom:'1px solid #E8E4DF',marginBottom:40}}>
          <nav style={{display:'flex',alignItems:'center',gap:0,flexWrap:'wrap'}}>
            <a href="/" className="breadcrumb-link">Alphagallery</a>
            <span className="breadcrumb-sep">/</span>
            <a href="/library" className="breadcrumb-link">Library</a>
            <span className="breadcrumb-sep">/</span>
            <a href="/library/admin" className="breadcrumb-link breadcrumb-active">Admin</a>
            <span className="breadcrumb-sep">/</span>
            <a href="/library/admin/catalog" className="breadcrumb-link">Catalog</a>
          </nav>
        </div>

        {/* Add availability */}
        <section style={{marginBottom:48}}>
          <h2 style={sectionLabel}>Add availability</h2>
          <div className="avail-row">
            <MiniCalendar value={newDate} onChange={setNewDate} minDate={today} />
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <TimePicker value={newStart} onChange={setNewStart} />
              <span style={{fontSize:13,color:'#9B9793'}}>to</span>
              <TimePicker value={newEnd} onChange={setNewEnd} />
              <button onClick={addSlot} disabled={saving || !newDate} style={{background:'#111110',color:'white',border:'none',padding:'10px 20px',borderRadius:100,fontSize:13,fontFamily:'inherit',cursor:saving||!newDate?'not-allowed':'pointer',opacity:saving||!newDate?0.4:1}}>
                Add
              </button>
            </div>
          </div>
          {msg && <p style={{fontSize:13,color:'#2D6A4F',marginTop:12}}>{msg}</p>}
        </section>

        {/* Upcoming slots */}
        <section style={{marginBottom:48}}>
          <h2 style={sectionLabel}>Upcoming slots ({upcomingSlots.length})</h2>
          {upcomingSlots.length === 0 ? (
            <p style={emptyStyle}>No upcoming slots.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {upcomingSlots.map(s => (
                <div key={s.id} className="slot-row">
                  <span style={{fontSize:14,fontWeight:500,flex:1,color:'#111110'}}>{formatDate(s.date)}</span>
                  <span style={{fontSize:13,color:'#6B6560',marginLeft:'auto'}}>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                  <span style={{fontSize:11,textTransform:'uppercase' as const,letterSpacing:'0.06em',padding:'3px 10px',borderRadius:100,background:s.booked?'#F2EFE9':'#E8F5EE',color:s.booked?'#9B9793':'#2D6A4F',minWidth:58,textAlign:'center' as const,whiteSpace:'nowrap' as const,flexShrink:0}}>
                    {s.booked ? 'Booked' : 'Open'}
                  </span>
                  <span style={{width:24,display:'flex',justifyContent:'center'}}>
                    {!s.booked && (
                      <button onClick={() => removeSlot(s.id)} style={{background:'none',border:'none',color:'#C0BCB8',fontSize:18,cursor:'pointer',padding:0,lineHeight:1}}>×</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active loans */}
        <section>
          <h2 style={{...sectionLabel}}>
            Active loans ({activeBookings.length})
            {overdueBookings.length > 0 && (
              <span style={{marginLeft:8,fontSize:11,background:'#FEF0EE',color:'#C0392B',padding:'2px 8px',borderRadius:100,letterSpacing:'0.04em'}}>
                {overdueBookings.length} overdue
              </span>
            )}
          </h2>
          {activeBookings.length === 0 ? (
            <p style={emptyStyle}>No active loans.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...overdueBookings, ...currentBookings].map(b => {
                const overdue = isOverdue(b)
                const days = daysSinceBorrow(b)
                return (
                  <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'14px 16px',background:overdue?'#FFFAF9':'white',border:`1.5px solid ${overdue?'#F5C6C0':'#E8E4DF'}`,borderRadius:8}}>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <span style={{fontSize:14,fontWeight:500,color:'#111110'}}>{b.books?.title || '—'}</span>
                      <span style={{fontSize:12,color:'#6B6560'}}>{b.borrower_name} · {b.borrower_email}</span>
                      {b.slots && <span style={{fontSize:12,color:'#9B9793'}}>{formatDate(b.slots.date)}</span>}
                      {days !== null && (
                        <span style={{fontSize:11,color:overdue?'#C0392B':'#9B9793',fontWeight:overdue?500:400}}>
                          {overdue ? `⚠ ${days} days — overdue` : `On loan for ${days} day${days === 1 ? '' : 's'}`}
                        </span>
                      )}
                    </div>
                    <button onClick={() => markReturned(b.id, b.book_id)} style={{border:'1.5px solid #E8E4DF',background:'white',padding:'6px 12px',borderRadius:100,fontSize:12,fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap' as const,flexShrink:0}}>
                      Mark returned
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'#9B9793',fontWeight:600,marginBottom:16,display:'flex',alignItems:'center'}
const emptyStyle: React.CSSProperties = {fontSize:14,color:'#9B9793'}
