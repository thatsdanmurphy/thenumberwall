/* AppLoading — shared loading state.
   Spinning basketball + contextual copy.
   Usage: <AppLoading text="FINDING THE LEGENDS" /> */

import './AppLoading.css'

export default function AppLoading({ text = 'LOADING' }) {
  return (
    <div className="app-loading">
      {/* Basketball — circle + horizontal seam + two vertical arcs bowing out */}
      <svg
        className="app-loading__ball"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer circle */}
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.8" />

        {/* Horizontal seam — straight line across middle */}
        <line x1="2" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

        {/* Left vertical seam — bows left */}
        <path d="M20 2 Q8 20 20 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Right vertical seam — bows right */}
        <path d="M20 2 Q32 20 20 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>

      <span className="app-loading__text">{text}</span>
    </div>
  )
}
