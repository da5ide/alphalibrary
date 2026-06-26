'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, Slot } from '@/lib/types'
import styles from './BorrowForm.module.css'

function formatSlot(slot: Slot): string {
  const date = new Date(slot.date + 'T00:00:00')
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = dayNames[date.getDay()]
  const month = monthNames[date.getMonth()]
  const dateNum = date.getDate()
  const formatTime = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }
  return `${day}, ${month} ${dateNum} — ${formatTime(slot.start_time)}–${formatTime(slot.end_time)}`
}

export default function BorrowForm({ book, slots }: { book: Book; slots: Slot[] }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [slotId, setSlotId] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!name || !email || !slotId || !passphrase) { setErrorMsg('Please fill in all fields.'); return }
    setStatus('loading'); setErrorMsg('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, slotId, passphrase, bookId: book.id })
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('success')
    } catch { setErrorMsg('Something went wrong. Please try again.'); setStatus('error') }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/library" className={styles.backLink}>← Back to library</Link>
        </nav>

        {status === 'success' ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>Booked.</h1>
            <p className={styles.successText}>
              You'll receive a confirmation email at <strong>{email}</strong> shortly.
              The address will be included in your reminder email the day before your visit.
            </p>
            <Link href="/library" className={styles.backBtn}>Back to library</Link>
          </div>
        ) : (
          <>
            <div className={styles.bookContext}>
              <p className={styles.bookLabel}>You'd like to borrow</p>
              <h1 className={styles.bookTitle}>{book.title}</h1>
              {book.author && <p className={styles.bookAuthor}>{book.author}</p>}
              {!book.available && (
                <div className={styles.unavailableNotice}>
                  This book is currently on loan. Check back later or browse other titles.
                </div>
              )}
            </div>

            {book.available && (
              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Your name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" disabled={status === 'loading'} className={styles.fieldInput} />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={status === 'loading'} className={styles.fieldInput} />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Pick a time slot</label>
                  {slots.length === 0 ? (
                    <div className={styles.noSlots}>
                      No available dates yet — check back soon. In the meantime, feel free to{' '}
                      <a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer">DM on Instagram</a>.
                    </div>
                  ) : (
                    <div className={styles.slotList}>
                      {slots.map(slot => (
                        <label key={slot.id} className={`${styles.slotOption} ${slotId === slot.id ? styles.selected : ''}`}>
                          <input type="radio" name="slot" value={slot.id} checked={slotId === slot.id} onChange={() => setSlotId(slot.id)} disabled={status === 'loading'} />
                          <span>{formatSlot(slot)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Access code</label>
                  <input type="text" value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Enter the access code" disabled={status === 'loading'} className={styles.fieldInput} />
                  <span className={styles.fieldHint}>Posted occasionally on <a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer">@alphagallery.co</a></span>
                </div>

                {errorMsg && <div className={styles.formError}>{errorMsg}</div>}

                {slots.length > 0 && (
                  <button className={styles.submitBtn} onClick={handleSubmit} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Booking…' : 'Confirm visit'}
                  </button>
                )}
              </div>
            )}

            <div className={styles.guidelines}>
              <h2 className={styles.guidelinesTitle}>A few things to know</h2>
              <ul className={styles.guidelinesList}>
                <li>Borrowing is free.</li>
                <li>One item at a time, please.</li>
                <li>Come pick it up yourself — you'll receive the exact address by email after booking (the closest station is Omotesando).</li>
                <li>Take your time with it, but please return it within 45 days; a reminder will be sent before then.</li>
                <li>Return by post or drop it in the mailbox — no need to schedule a return visit.</li>
                <li>If you can no longer make your visit, please cancel by email.</li>
                <li>Please do not feel like you have to bring anything in exchange — but if there's a book or magazine you'd like to share, it's always welcome.</li>
                <li>We trust you'll take good care of what you borrow and return it in the same condition.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
