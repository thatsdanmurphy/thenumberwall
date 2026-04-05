import AppShell from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import LegendTimeline from '../components/LegendTimeline.jsx'
import timelineData from '../data/timeline_brady_tom.json'
import './TimelinePage.css'

export default function TimelinePage() {
  return (
    <AppShell>
      <AppHeader />
      <main className="timeline-page">
        <LegendTimeline timeline={timelineData} />
      </main>
      <AppFooter />
    </AppShell>
  )
}
