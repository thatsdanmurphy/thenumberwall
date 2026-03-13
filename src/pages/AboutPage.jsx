import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppShell  from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import './AboutPage.css'

const TIERS = [
  {
    key:   'SACRED',
    label: 'Sacred',
    desc:  'Formally retired by an entire league. No active player wears it — or in extraordinary cases, one documented exception was made. Three numbers in all of sports qualify: #6 (NBA), #42 (MLB), #99 (NHL).',
  },
  {
    key:   'LEGEND',
    label: 'Legend',
    desc:  'A retired player whose name became permanently associated with their number. Hall of Fame inducted, or consensus top-5 all-time. Their name is the first name a knowledgeable fan says when that number comes up.',
  },
  {
    key:   'ACTIVE',
    label: 'Active',
    desc:  'A currently active player already operating at a level kids recognise. Not a prospect. Not promising. Already remarkable — and wearing it right now.',
  },
  {
    key:   'UNWRITTEN',
    label: 'Unwritten',
    desc:  'No legend has claimed this number yet across any sport. The cell is dim on purpose. Every legendary number started exactly here.',
  },
]

export default function AboutPage() {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'About | The Number Wall' }, [])

  return (
    <AppShell>
      <AppHeader back={{ label: 'Wall', onClick: () => navigate('/') }} />

      <main className="about-page">

        <div className="about-page__title-block">
          <h1 className="about-page__heading">ABOUT</h1>
          <p className="about-page__tagline">Every number has a legend behind it.</p>
        </div>

        <section className="about-page__section">
          <p className="about-page__body">
            The Number Wall is a shrine to jersey numbers. Every number from 0 to 99 has a story: the athletes who wore it, the moments that defined it, and the weight it carries. This is where those stories live.
          </p>
          <p className="about-page__body">
            The heatmap glows brightest where the legends are densest. Tap any number to meet the athletes who made it mean something.
          </p>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">WHAT MAKES SOMEONE A LEGEND</h2>
          <p className="about-page__body">
            This wall is for athletes whose number became part of sports history. When fans hear the number, their name comes to mind first. Hall of Fame careers. Era-defining players. The athletes who made a number famous. The same bar applies to every sport and every generation.
          </p>
          <p className="about-page__body">Some numbers are already spoken for. Some are still waiting.</p>
        
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">LOCAL LEGENDS</h2>
          <p className="about-page__body">
            Beyond the global wall, each city gets its own. The Boston Wall covers all four major Boston franchises: Bruins, Celtics, Red Sox, Patriots. Numbers filtered by sport and era. More cities are coming.
          </p>
          <Link to="/boston" className="about-page__city-cta">
            <span className="about-page__city-cta-name">THE BOSTON WALL</span>
            <span className="about-page__city-cta-teams">Red Sox · Patriots · Celtics · Bruins</span>
            <span className="about-page__city-cta-arrow" aria-hidden="true">→</span>
          </Link>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">WHO BUILT THIS</h2>
          <p className="about-page__body">
            The Number Wall was built by Dan Murphy. The idea started with a simple observation: when a kid gets assigned a jersey number, that moment means nothing. It should mean everything.
          </p>
          <p className="about-page__body">
            Questions, corrections, or nominations for an unwritten number:
          </p>
          <a href="mailto:hello@thenumberwall.com" className="about-page__cta">
            DAN@THENUMBERWALL.COM
          </a>
        </section>

      </main>

      <AppFooter />
    </AppShell>
  )
}
