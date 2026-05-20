/**
 * NotificationBell — icon button for the app header nav.
 *
 * Shows a bell icon with an optional count badge. The dot/badge
 * uses --color-heat per the heat visual language. Animates in
 * when a new notification arrives (count increments).
 *
 * Tokens used:
 *   --color-heat, --color-night, --color-muted, --color-paper
 *   --color-surface, --border-soft
 *   --text-micro, --text-label
 *   --font-scoreboard
 *   --space-1, --space-2
 *   --radius-sm, --radius-md
 *   --motion-hover, --motion-heat
 *
 * Components reused: none — this is a net-new primitive for the nav.
 * Primitive classes reused: none needed at this scope.
 *
 * Props:
 *   count       number — unread notification count (0 hides the badge)
 *   onClick     fn    — called when the button is clicked
 *   label       string — accessible label (default "Notifications")
 */

import { Bell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './NotificationBell.css'

export default function NotificationBell({
  count = 0,
  onClick,
  label = 'Notifications',
}) {
  const prevCount = useRef(count)
  const [animating, setAnimating] = useState(false)

  // Trigger the pulse animation whenever count increases
  useEffect(() => {
    if (count > prevCount.current) {
      setAnimating(false)
      // Allow a frame to reset before re-triggering the class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    }
    prevCount.current = count
  }, [count])

  function handleAnimationEnd() {
    setAnimating(false)
  }

  const hasCount = count > 0
  const displayCount = count > 99 ? '99+' : count

  return (
    <button
      className={`notif-bell${animating ? ' notif-bell--pulse' : ''}`}
      onClick={onClick}
      aria-label={`${label}${hasCount ? `, ${count} unread` : ''}`}
      type="button"
    >
      <span className="notif-bell__icon">
        <Bell size={16} strokeWidth={2} />
      </span>

      {hasCount && (
        <span
          className={`notif-bell__badge${animating ? ' notif-bell__badge--in' : ''}`}
          aria-hidden="true"
          onAnimationEnd={handleAnimationEnd}
        >
          {displayCount}
        </span>
      )}
    </button>
  )
}
