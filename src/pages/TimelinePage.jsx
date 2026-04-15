import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import LegendTimeline from '../components/LegendTimeline.jsx'
import timelineData from '../data/timeline_brady_tom.json'
import './TimelinePage.css'

// Mobile-only slim nav — desktop keeps the full AppHeader chrome above.
// Mobile hides AppHeader to give the vertical timeline the whole viewport,
// so this slim bar reinstates the two things users need from a nav: the
// site wordmark (context) and a way back to the main wall (escape hatch).
function TimelineNav() {
  return (
    <nav className="timeline-nav" aria-label="Timeline navigation">
      <Link to="/" className="timeline-nav__back" aria-label="Back to the main wall">
        <ArrowLeft size={14} />
        <span>WALL</span>
      </Link>
      <Link to="/" className="timeline-nav__title" aria-label="The Number Wall">
        THE NUMBER WALL
      </Link>
      <span className="timeline-nav__spacer" aria-hidden="true" />
    </nav>
  )
}

export default function TimelinePage() {
  return (
    <AppShell>
      <AppHeader />
      <main className="timeline-page">
        <TimelineNav />
        <LegendTimeline timeline={timelineData} />
      </main>
      <AppFooter />
    </AppShell>
  )
}
