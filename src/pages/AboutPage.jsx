import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppShell      from '../components/AppShell.jsx'
import AppHeader     from '../components/AppHeader.jsx'
import AppFooter     from '../components/AppFooter.jsx'
import EmailCapture  from '../components/EmailCapture.jsx'
import './AboutPage.css'

const TIERS = [
  {
    key:   'SACRED',
    label: 'Sacred',
    desc:  'Formally retired by an entire league. No active player wears it anywhere in that sport. Three numbers in all of professional sports have reached this level: #6 (NBA, Bill Russell), #42 (MLB, Jackie Robinson), #99 (NHL, Wayne Gretzky). The bar is triple-locked: league-wide retirement, transcendent cultural impact beyond the game, and unanimous historical consensus across generations. SACRED is not a superlative. It is a designation that has happened three times in modern sports history.',
  },
  {
    key:   'LEGEND',
    label: 'Legend',
    desc:  'The primary tier. A player whose name became permanently associated with their number — the first name a knowledgeable fan says when that number comes up, across more than one generation. Legacy is already locked. What they did cannot be revised by anything that happens next.',
  },
  {
    key:   'ACTIVE',
    label: 'Active',
    desc:  'A currently active player already operating at a level that belongs here. Not a prospect. Not promising. Already remarkable — and wearing the number right now. Active entries are reviewed every season.',
  },
  {
    key:   'CULTURAL_LEGEND',
    label: 'Cultural Legend',
    desc:  'A player whose significance cannot be measured in a stat line. The number is suppressed on purpose. Their card is carried entirely by what they represent — a barrier broken, a city defined, a moment that went beyond the game. Two sub-designations: Barrier Breaker (changed what was possible for everyone who came after) and City Icon (their legend belongs to the people who were there).',
  },
  {
    key:   'UNWRITTEN',
    label: 'Unwritten',
    desc:  'No legend has claimed this number yet across any major sport. The cell is dim on purpose. Every legendary number started exactly here.',
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
            Three questions. A player has to pass all three.
          </p>
          <p className="about-page__body">
            First: when fans across more than one generation hear the number, does this player's name come up without prompting? Not first for one age group — first across age groups. That cross-generational consensus is the bar. Jordan and #23. Gretzky and #99. No qualifier needed.
          </p>
          <p className="about-page__body">
            Second: is the legacy already permanent? If this player retired tomorrow, would the card still be true in ten years? Active players can qualify — but only if what they've already done is beyond revision. The future can't be what earns the spot.
          </p>
          <p className="about-page__body">
            Third: does the association reach beyond one city? Regional legends belong on city walls. The global wall is for athletes whose number means something to fans who never watched their team.
          </p>
          <p className="about-page__body">
            Not every legend travels. Some belong to a city, a college, a high school gym. Those stories live on their own walls — where the people who were there can find them.
          </p>
          <p className="about-page__body">
            The same bar applies to every sport, every era, and every gender. Some numbers are spoken for. Some are still being written.
          </p>
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
          <h2 className="about-page__subheading">THE TIERS</h2>
          <p className="about-page__body">
            Every number on the wall carries a tier. The tier is an editorial designation — a statement about permanence, not popularity.
          </p>
          <div className="about-page__tiers">
            {TIERS.map(t => (
              <div key={t.key} className={`about-page__tier about-page__tier--${t.key.toLowerCase()}`}>
                <span className="about-page__tier-label">{t.label}</span>
                <p className="about-page__tier-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">SOURCES & METHODOLOGY</h2>
          <p className="about-page__body">
            Stats and records are sourced from Sports Reference — Basketball-Reference, Hockey-Reference, Baseball-Reference, and Pro-Football-Reference. International soccer draws from FBref and Transfermarkt. Hall of Fame status is sourced from each league's official records. Every player on this wall has been verified against at least one primary source. If you spot an error, tell us.
          </p>
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
          <a href="mailto:dan@thenumberwall.com" className="about-page__cta">
            DAN@THENUMBERWALL.COM
          </a>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">STAY IN TOUCH</h2>
          <p className="about-page__body">
            The wall is a living document. New city walls are being added. Numbers get reviewed when careers end and eras settle. Entries get corrected when someone who was actually there tells us we got it wrong.
          </p>
          <p className="about-page__body">
            If you want to know when something new drops — a new city, a number that finally gets its due, a significant update — leave your email here.
          </p>
          <EmailCapture variant="footer" />
        </section>

      </main>

      <AppFooter />
    </AppShell>
  )
}
