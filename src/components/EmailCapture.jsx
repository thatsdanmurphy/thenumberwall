import { useState } from 'react'
import './EmailCapture.css'

const KIT_FORM_ID  = '9221625'
const KIT_API_KEY  = 'zfPkBvNBibG980b3l7TFJw'
const KIT_ENDPOINT = `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`

/**
 * EmailCapture — posts directly to Kit v3 subscribe endpoint.
 * No Kit embed script, no Kit branding.
 *
 * variant="footer"   → horizontal row, lower-key label
 * variant="panel"    → vertical, appears post-pick in PlayerPanel
 */
export default function EmailCapture({ variant = 'footer' }) {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState('idle') // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch(KIT_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ api_key: KIT_API_KEY, email: email.trim() }),
      })
      if (!res.ok) throw new Error(`Kit ${res.status}`)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className={`email-capture email-capture--${variant} email-capture--done`}>
        You're on the list.
      </p>
    )
  }

  return (
    <form
      className={`email-capture email-capture--${variant}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {variant === 'panel' && (
        <span className="email-capture__label">
          Get notified when new numbers drop.
        </span>
      )}
      <div className="email-capture__row">
        <input
          className="email-capture__input"
          type="email"
          placeholder={variant === 'footer' ? 'your@email.com' : 'Email address'}
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={status === 'loading'}
          aria-label="Email address"
          autoComplete="email"
        />
        <button
          className="email-capture__btn"
          type="submit"
          disabled={status === 'loading' || !email.trim()}
        >
          {status === 'loading' ? '…' : 'Notify me'}
        </button>
      </div>
      {status === 'error' && (
        <span className="email-capture__err">Something went wrong — try again.</span>
      )}
    </form>
  )
}
