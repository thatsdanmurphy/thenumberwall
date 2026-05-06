/**
 * FOUNDATION — /behindthecurtains/foundation
 *
 * The north star, the principles, and the people. Everything else in BTC
 * is how we build. This page is why we build, and for whom.
 *
 * Pulled directly from the source docs in 00_Foundation/ — not paraphrased.
 * If the principles drift from this page, update this page.
 */

import { Link } from 'react-router-dom'
import './foundation.css'

// ── Principles ─────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    n: '01',
    name: 'Charge the moment or cut it.',
    desc: 'Every decision — visual, editorial, technical — either earns emotional weight or it doesn\'t belong. The question is always: does this serve the shrine?',
  },
  {
    n: '02',
    name: 'Curation is the product.',
    desc: 'The wall doesn\'t list every player who wore a number. It surfaces the ones that matter. The editorial decision isn\'t a constraint — it\'s the point.',
  },
  {
    n: '03',
    name: 'No asterisk on gender.',
    desc: 'Women\'s legends play by the same rules, earn the same tiers, and share the same wall.',
  },
  {
    n: '04',
    name: 'Earn your place.',
    desc: 'Not every number has a legend yet. Unwritten cells are honest, not broken.',
  },
  {
    n: '05',
    name: 'Facts and editorial decisions are always separate.',
    desc: 'A player\'s number is a fact. Whether they belong on the wall is a judgment. They live in different places.',
  },
  {
    n: '06',
    name: 'Everything must be citable.',
    desc: 'If you can\'t source it, it doesn\'t go in the fact layer.',
  },
  {
    n: '07',
    name: 'Accuracy over completeness.',
    desc: 'A wall with 60 verified entries beats one with 100 guesses. Gaps are honest. Wrong data isn\'t.',
  },
  {
    n: '08',
    name: 'Disputes are first-class.',
    desc: 'Contested facts are tracked explicitly, not quietly overridden.',
  },
]

// ── Personas ───────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: 'the-kid',
    name: 'The Kid',
    trigger: 'Just got assigned a number.',
    need: 'They want to know who wore it before them. The product turns a jersey assignment into a discovery — a lineage they\'re now part of.',
    flows: ['The Tile Tap', 'The Share'],
    moment: 'They see a name they recognize and send it to their whole team.',
    design: 'Speed is the product. Under a second from number to name. If there\'s friction, the moment evaporates.',
  },
  {
    id: 'the-kidult',
    name: 'The Kidult',
    trigger: 'Sees a number and gets an involuntary hit.',
    need: 'The adult who looks at #4 and immediately sees Bobby Orr. The game they watched with their father. The number their best friend used to wear. This is returning, not discovering.',
    flows: ['The Tile Tap', 'The Vote', 'The Timeline Drill', 'The Showdown'],
    moment: 'They end up on the timeline and spend ten minutes they didn\'t plan to spend.',
    design: 'Depth below the surface. The first tap is for everyone; what\'s underneath is for them.',
  },
  {
    id: 'the-fan',
    name: 'The Fan',
    trigger: 'Has a take and wants to register it.',
    need: 'Opinionated. They know who really owns #23 and they\'re not shy about it. They come to vote, to see if the wall agrees, and to argue if it doesn\'t.',
    flows: ['The Vote', 'The Timeline Drill', 'The Showdown', 'The Share'],
    moment: 'Wall agrees or wall differs — either way, they screenshot it.',
    design: 'The vote tally has to feel like the crowd has a real opinion. Tepid aggregation kills the moment.',
  },
  {
    id: 'the-alumni',
    name: 'The Alumni',
    trigger: 'Wore a number here. Wants to see their lineage.',
    need: 'They played at BC High. Or K-State. Or wherever. They want to see who wore their number before them, and they want to add themselves — to put their name in the lineage.',
    flows: ['The Alumni Lookup', 'The Identity Claim'],
    moment: 'They find their number still open on the team wall and fill it in.',
    design: 'Framing is everything: "Did you play with a legend?" not "Start this wall." Recognition first, task second.',
  },
  {
    id: 'the-coach',
    name: 'The Coach',
    trigger: 'Needs something shareable for the team.',
    need: 'Looking for a motivational story — a wall to show at practice, a number with a legend behind it that means something to their players. They want to create something and send it.',
    flows: ['The Identity Claim', 'The Share', 'The Reel Wall'],
    moment: 'They build a team wall and send it before the season starts.',
    design: 'The share flow has to be obvious. A coach who can\'t find the share button doesn\'t share.',
  },
]

// ── The page ───────────────────────────────────────────────────────────────

export default function Foundation() {
  return (
    <div className="fdn-page">

      {/* ── Banner ────────────────────────────────────────── */}
      <header className="fdn-banner">
        <div className="fdn-banner__eyebrow">00 · Foundation</div>
        <h1 className="fdn-banner__title">THE WHY AND THE WHO</h1>
        <p className="fdn-banner__lede">
          Everything else in Behind the Curtains is how we build. This page is
          why — and for whom. If the product ever feels like it's drifting,
          come back here first.
        </p>
      </header>

      {/* ── North Star ────────────────────────────────────── */}
      <section className="fdn-section">
        <div className="fdn-north-star">
          <span className="fdn-north-star__label">NORTH STAR</span>
          <p className="fdn-north-star__body">
            The Number Wall exists because jersey numbers mean something
            and nobody's built a place for that meaning to live. The product
            wins when a 12-year-old gets assigned #12 and can instantly see
            every legend who wore it — and feel like they're part of something
            bigger than a roster.
          </p>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────── */}
      <section className="fdn-section">
        <h2 className="fdn-section__title">MISSION</h2>
        <p className="fdn-section__lede">
          To connect every generation of sports fan to the legends who wore
          their number. Not a stats database. Not a trivia app. An emotional
          experience built around one specific moment: the number assignment.
        </p>
        <div className="fdn-insight">
          <p className="fdn-insight__body">
            The strongest part of this idea isn't statistics. It's sports
            folklore. Fans don't associate #23 with points per game — they
            associate it with <em>Michael Jordan</em>. By organizing sports
            history around numbers instead of players, a new lens on sports
            culture opens up: one built around identity, inheritance, and
            folklore.
          </p>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────── */}
      <section className="fdn-section">
        <h2 className="fdn-section__title">PRINCIPLES</h2>
        <p className="fdn-section__lede">
          Eight rules the product follows. If a decision conflicts with one of
          these, the rule wins — or you write down why the exception is worth it.
        </p>
        <div className="fdn-principles">
          {PRINCIPLES.map(p => (
            <div key={p.n} className="fdn-principle">
              <span className="fdn-principle__n">{p.n}</span>
              <div className="fdn-principle__body">
                <h3 className="fdn-principle__name">{p.name}</h3>
                <p className="fdn-principle__desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Audience ──────────────────────────────────────── */}
      <section className="fdn-section">
        <h2 className="fdn-section__title">WHO WE'RE BUILDING FOR</h2>
        <p className="fdn-section__lede">
          Two core audiences, one emotional center. Three extended personas that
          emerge as the product grows. Every flow, every editorial decision, every
          piece of friction removed is ultimately for one of these five people.
        </p>
        <div className="fdn-core-pair">
          <div className="fdn-core-card">
            <h3 className="fdn-core-card__name">The Kid</h3>
            <p className="fdn-core-card__desc">
              Just got assigned #22. Has no idea Jordan, Drexler, and Caitlin
              Clark wore it. The number assignment is the trigger. The product
              turns it into a discovery.
            </p>
          </div>
          <div className="fdn-core-card fdn-core-card--kidult">
            <h3 className="fdn-core-card__name">The Kidult</h3>
            <p className="fdn-core-card__desc">
              Looks at #4 and immediately sees Orr. The involuntary hit of
              memory. The game they watched with their father. This audience
              isn't discovering — they're returning.
            </p>
          </div>
        </div>

        <div className="fdn-personas">
          {PERSONAS.map(p => (
            <div key={p.id} className="fdn-persona">
              <div className="fdn-persona__head">
                <h3 className="fdn-persona__name">{p.name}</h3>
                <span className="fdn-persona__trigger">{p.trigger}</span>
              </div>
              <p className="fdn-persona__need">{p.need}</p>
              <div className="fdn-persona__moment">
                <span className="fdn-persona__moment-label">THE MOMENT</span>
                <span className="fdn-persona__moment-body">{p.moment}</span>
              </div>
              <div className="fdn-persona__foot">
                <div className="fdn-persona__flows">
                  <span className="fdn-persona__flows-label">FLOWS</span>
                  <div className="fdn-persona__flow-chips">
                    {p.flows.map(f => (
                      <Link
                        key={f}
                        to={`/behindthecurtains/flows#${f.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '')}`}
                        className="fdn-persona__chip"
                      >
                        {f}
                      </Link>
                    ))}
                  </div>
                </div>
                <p className="fdn-persona__design">
                  <strong>Design implication:</strong> {p.design}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="fdn-footer">
        <p className="fdn-footer__line">
          The product is the shrine. Every decision either serves the shrine or it doesn't.
        </p>
      </footer>

    </div>
  )
}
