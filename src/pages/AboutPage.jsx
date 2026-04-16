import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import AppShell      from '../components/AppShell.jsx'
import AppHeader     from '../components/AppHeader.jsx'
import AppFooter     from '../components/AppFooter.jsx'
import EmailCapture  from '../components/EmailCapture.jsx'
import WhatsNext     from '../components/WhatsNext.jsx'
import './AboutPage.css'

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
            The Number Wall is a shrine to jersey numbers. Every number from 0 to 99 has a story: the athletes who wore it, the moments that defined it, and the weight it carries. The heatmap glows brightest where the legends are densest. Tap any number to meet the athletes who made it mean something.
          </p>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">WHAT MAKES SOMEONE A LEGEND</h2>
          <p className="about-page__body">
            One question: when fans across more than one generation hear a number, does a single name come up without prompting? That cross-generational consensus is the bar. Not first for one city, first across the sport. Jordan and #23. Gretzky and #99. No qualifier needed.
          </p>
          <p className="about-page__body">
            Active players can qualify, but only if what they've already done is beyond revision. The global wall is for athletes whose number means something to fans who never watched their team. Regional legends belong on city walls.
          </p>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">LOCAL LEGENDS</h2>
          <p className="about-page__body">
            Beyond the global wall, each city gets its own. More cities are coming.
          </p>
          <Link to="/boston" className="about-page__city-cta">
            <span className="about-page__city-cta-name">THE BOSTON WALL</span>
            <span className="about-page__city-cta-teams">Red Sox · Patriots · Celtics · Bruins</span>
            <ChevronRight size={16} className="about-page__city-cta-arrow" aria-hidden="true" />
          </Link>
          <Link to="/newyork" className="about-page__city-cta">
            <span className="about-page__city-cta-name">THE NEW YORK WALL</span>
            <span className="about-page__city-cta-teams">Yankees · Mets · Giants · Jets · Knicks · Nets · Rangers · Islanders</span>
            <ChevronRight size={16} className="about-page__city-cta-arrow" aria-hidden="true" />
          </Link>
        </section>

        {/* Team Walls — Disabled until ready
        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">TEAM WALLS</h2>
          <p className="about-page__body">
            Start a wall for your team. Share the link with your teammates. Everyone claims their number. See who wore what — and who else in history wore it too.
          </p>
          <Link to="/walls" className="about-page__city-cta">
            <span className="about-page__city-cta-name">BROWSE TEAM WALLS</span>
            <span className="about-page__city-cta-teams">High school · College · Club · Any team, any era</span>
            <ChevronRight size={16} className="about-page__city-cta-arrow" aria-hidden="true" />
          </Link>
        </section>
        */}

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">SOURCES</h2>
          <p className="about-page__body">
            Stats sourced from Basketball-Reference, Baseball-Reference, Hockey-Reference, and Pro-Football-Reference. International soccer from FBref and Transfermarkt. Hall of Fame status from each league's official records. Every player verified against at least one primary source. If you spot an error, tell us.
          </p>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">WHAT'S NEXT</h2>
          <p className="about-page__body">
            The wall is growing. Vote on what gets built next.
          </p>
          <WhatsNext />
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">WHO BUILT THIS</h2>
          <p className="about-page__body">
            Built by Dan Murphy — product thinker, BC kid, lifelong sports fan who believes jersey numbers carry weight that nobody's bothered to organize. The Number Wall started with a simple observation: when a kid gets assigned a jersey number, that moment means nothing. It should mean everything. So he built the place where it does.
          </p>
          <a href="mailto:dan@thenumberwall.com" className="tnw-btn tnw-btn--secondary about-page__cta">
            DAN@THENUMBERWALL.COM
          </a>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">HOW IT'S MADE</h2>
          <p className="about-page__body">
            The Number Wall is documented from the inside out — the design system, the engineering decisions, the user flows, the trade-offs. If you're curious how a solo founder ships a product like this, the whole story is open.
          </p>
          <Link to="/behindthecurtains" className="about-page__city-cta">
            <span className="about-page__city-cta-name">BEHIND THE CURTAINS</span>
            <span className="about-page__city-cta-teams">Design · Engineering · Flows · Process</span>
            <ChevronRight size={16} className="about-page__city-cta-arrow" aria-hidden="true" />
          </Link>
        </section>

        <hr className="about-page__rule" />

        <section className="about-page__section">
          <h2 className="about-page__subheading">STAY IN TOUCH</h2>
          <p className="about-page__body">
            The wall is a living document. Leave your email to hear when something new drops.
          </p>
          <EmailCapture variant="footer" />
        </section>

      </main>

      <AppFooter />
    </AppShell>
  )
}
