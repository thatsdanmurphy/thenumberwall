import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import LegendTimeline from '../components/LegendTimeline.jsx'
import timelineData from '../data/timeline_brady_tom.json'
import './TimelinePage.css'

/**
 * Timeline lives under the system header — AppHeader's own `back` slot is
 * the canonical back-button pattern (ArrowLeft + label in the top-left of
 * every deep page). No bespoke nav for this view.
 */
export default function TimelinePage() {
  const navigate = useNavigate()
  return (
    <AppShell>
      <AppHeader back={{ label: 'Back to the wall', onClick: () => navigate('/') }} />
      <main className="timeline-page">
        <LegendTimeline timeline={timelineData} />
      </main>
      <AppFooter />
    </AppShell>
  )
}
