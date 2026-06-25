'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, Slot } from '@/lib/types'

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
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
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
    if (!name || !email || !slotId || !passphrase) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, slotId, passphrase, bookId: book.id })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="borrow-wrap">
      <div className="borrow-inner">
        <nav className="borrow-nav">
          <Link href="/library" className="back-link">← Back to library</Link>
        </nav>

        {status === 'success' ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h1 className="success-title">Booked.</h1>
            <p className="success-text">
              You'll receive a confirmation email at <strong>{email}</strong> shortly.
              The address will be included in your reminder email the day before your visit.
            </p>
            <Link href="/library" className="back-btn">Back to library</Link>
          </div>
        ) : (
          <>
            <div className="borrow-book-context">
              <p className="borrow-book-label">You'd like to borrow</p>
              <h1 className="borrow-book-title">{book.title}</h1>
              {book.author && <p className="borrow-book-author">{book.author}</p>}
              {!book.available && (
                <div className="unavailable-notice">
                  This book is currently on loan. Check back later or browse other titles.
                </div>
              )}
            </div>

            {book.available && (
              <div className="borrow-form">
                <div className="form-field">
                  <label>Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="form-field">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="form-field">
                  <label>Pick a time slot</label>
                  {slots.length === 0 ? (
                    <div className="no-slots">
                      No available dates yet — check back soon. In the meantime, feel free to
                      {' '}<a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer">DM on Instagram</a>.
                    </div>
                  ) : (
                    <div className="slot-list">
                      {slots.map(slot => (
                        <label key={slot.id} className={`slot-option ${slotId === slot.id ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="slot"
                            value={slot.id}
                            checked={slotId === slot.id}
                            onChange={() => setSlotId(slot.id)}
                            disabled={status === 'loading'}
                          />
                          <span>{formatSlot(slot)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Access code</label>
                  <input
                    type="text"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Enter the access code"
                    disabled={status === 'loading'}
                  />
                  <span className="field-hint">Posted occasionally on <a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer">@alphagallery.co</a></span>
                </div>

                {errorMsg && <div className="form-error">{errorMsg}</div>}

                {slots.length > 0 && (
                  <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? 'Booking…' : 'Confirm visit'}
                  </button>
                )}
              </div>
            )}

            <div className="guidelines">
              <h2 className="guidelines-title">A few things to know</h2>
              <ul className="guidelines-list">
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

      <style jsx>{`
        .borrow-wrap {
          min-height: 100vh;
          background: #FAFAF8;
          color: #111110;
          font-family: 'Inter', -apple-system, sans-serif;
          padding-bottom: 80px;
        }

        .borrow-inner {
          max-width: 520px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .borrow-nav {
          padding: 32px 0 40px;
        }

        .back-link {
          font-size: 13px;
          color: #9B9793;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: color 0.12s;
        }

        .back-link:hover { color: #111110; }

        /* Book context */
        .borrow-book-context {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E4DF;
        }

        .borrow-book-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9B9793;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .borrow-book-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 30px;
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }

        .borrow-book-author {
          font-size: 14px;
          color: #6B6560;
        }

        .unavailable-notice {
          margin-top: 16px;
          padding: 14px 16px;
          background: #F2EFE9;
          border-radius: 8px;
          font-size: 14px;
          color: #6B6560;
          line-height: 1.5;
        }

        /* Form */
        .borrow-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 48px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field > label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6B6560;
          font-weight: 600;
        }

        .form-field input[type="text"],
        .form-field input[type="email"] {
          border: 1.5px solid #E8E4DF;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          background: white;
          color: #111110;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .form-field input:focus { border-color: #111110; }
        .form-field input::placeholder { color: #C0BCB8; }
        .form-field input:disabled { opacity: 0.6; }

        .field-hint {
          font-size: 12px;
          color: #9B9793;
        }

        .field-hint a { color: #9B9793; }
        .field-hint a:hover { color: #111110; }

        /* Slots */
        .no-slots {
          font-size: 14px;
          color: #6B6560;
          line-height: 1.6;
          padding: 14px 16px;
          background: #F2EFE9;
          border-radius: 8px;
        }

        .no-slots a { color: #6B6560; }
        .no-slots a:hover { color: #111110; }

        .slot-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slot-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1.5px solid #E8E4DF;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.12s;
          background: white;
        }

        .slot-option:hover { border-color: #111110; }

        .slot-option.selected {
          border-color: #111110;
          background: #111110;
          color: white;
        }

        .slot-option input[type="radio"] { display: none; }

        /* Submit */
        .submit-btn {
          background: #111110;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 100px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: opacity 0.15s;
          align-self: flex-start;
        }

        .submit-btn:hover { opacity: 0.85; }
        .submit-btn:disabled { opacity: 0.4; cursor: default; }

        .form-error {
          font-size: 13px;
          color: #C0392B;
          padding: 10px 14px;
          background: #FEF0EE;
          border-radius: 6px;
        }

        /* Guidelines */
        .guidelines {
          border-top: 1px solid #E8E4DF;
          padding-top: 32px;
        }

        .guidelines-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9B9793;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .guidelines-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .guidelines-list li {
          font-size: 14px;
          line-height: 1.6;
          color: #444240;
          padding-left: 16px;
          position: relative;
        }

        .guidelines-list li::before {
          content: '—';
          position: absolute;
          left: 0;
          color: #C8C4BF;
        }

        /* Success */
        .success-state {
          padding-top: 40px;
          text-align: center;
        }

        .success-icon {
          font-size: 32px;
          color: #2D6A4F;
          margin-bottom: 16px;
        }

        .success-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .success-text {
          font-size: 15px;
          line-height: 1.7;
          color: #444240;
          margin-bottom: 32px;
          max-width: 380px;
          margin-left: auto;
          margin-right: auto;
        }

        .back-btn {
          display: inline-block;
          border: 1.5px solid #111110;
          color: #111110;
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
        }

        .back-btn:hover { background: #111110; color: white; }

        @media (max-width: 600px) {
          .borrow-inner { padding: 0 16px; }
          .borrow-book-title { font-size: 26px; }
        }
      `}</style>
    </div>
  )
}
