/**
 * Modal — standard overlay dialog for the TNW design system.
 *
 * Pattern extracted from FirstVisitModal. All modals in the app should
 * use this primitive to ensure consistent backdrop, animation, close
 * button, sizing, and escape-key behavior.
 *
 * Props:
 *   open      — boolean, controls visibility
 *   onClose   — callback to dismiss
 *   children  — modal body content
 *   maxWidth  — optional max-width in px (default 400)
 *   zIndex    — optional z-index (default 520)
 *   ariaLabel — accessible label for the dialog
 */

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './Modal.css'

export default function Modal({ open, onClose, children, maxWidth = 400, zIndex = 520, ariaLabel = 'Dialog' }) {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, handleEscape])

  if (!open) return null

  return createPortal(
    <div
      className="tnw-overlay tnw-modal__backdrop"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="tnw-modal"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <button className="tnw-modal__close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div className="tnw-modal__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
