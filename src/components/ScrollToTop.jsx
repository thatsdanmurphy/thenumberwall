import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to the top of the page on every route change.
// Prevents linking to a city/reel page and landing mid-scroll.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
