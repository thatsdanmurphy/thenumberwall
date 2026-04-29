import { Link } from 'react-router-dom'
import './WallExplore.css'

/**
 * WallExplore — homepage discovery section
 *
 * Top: city row — 2×2 hero tiles, horizontal scroll on mobile (peek).
 * Bottom: 3-col wall grid — Team, The Series, Reel Legends.
 * Cross-hatch background separates from main wall above.
 */

const CITIES = [
  {
    id:    'boston',
    title: 'Boston',
    cta:   'Explore Boston',
    href:  '/boston',
    tiles: [
      { num: 9,  mod: 'sox'     },
      { num: 4,  mod: 'bruins'  },
      { num: 33, mod: 'celtics' },
      { num: 12, mod: 'pats'    },
    ],
  },
  {
    id:    'newyork',
    title: 'New York',
    soon:  true,
    tiles: [
      { num: 2,  mod: 'ny-yankees' },
      { num: 33, mod: 'ny-knicks'  },
      { num: 56, mod: 'ny-giants'  },
      { num: 11, mod: 'ny-rangers' },
    ],
  },
  {
    id:    'chicago',
    title: 'Chicago',
    soon:  true,
    blank: true,
    tiles: [
      { num: '', mod: 'dim' },
      { num: '', mod: 'dim' },
      { num: '', mod: 'dim' },
      { num: '', mod: 'dim' },
    ],
  },
]

const WALLS = [
  {
    id:    'team',
    title: 'Team Walls',
    body:  'Your school. Your team. Your era. Log the number you wore and find the wall you belong on.',
    cta:   'Browse Teams',
    href:  '/walls',
    tiles: [
      { num: 1, mod: 'unwritten' },
      { num: 2, mod: 'heat'      },
      { num: 3, mod: 'heat'      },
      { num: 4, mod: 'sacred'    },
    ],
  },
  {
    id:    'series',
    title: 'The Series',
    body:  'Two teams. One defining series. The numbers that lived in those games.',
    cta:   'See the Matchups',
    href:  '/walls',
    stub:  true,
    tiles: [
      { num: 34, mod: 'rival-red'  },
      { num: 45, mod: 'rival-red'  },
      { num: 2,  mod: 'rival-navy' },
      { num: 42, mod: 'rival-navy' },
    ],
  },
  {
    id:    'reel',
    title: 'Reel Legends',
    body:  'Major League. Slap Shot. Rookie of the Year. Bull Durham. The numbers that never retired.',
    cta:   'Browse Reel Legends',
    href:  '/walls',
    stub:  true,
    tiles: [
      { num: 99, mod: 'reel' },
      { num: 17, mod: 'reel' },
      { num: 7,  mod: 'reel' },
      { num: 21, mod: 'reel' },
    ],
  },
]

export default function WallExplore() {
  return (
    <section className="wall-explore" aria-label="Explore the walls">

      {/* ── Section heading ── */}
      <div className="wall-explore__head">
        <h2 className="wall-explore__heading">Explore the walls</h2>
        <div className="wall-explore__divider-line" aria-hidden="true" />
      </div>

      {/* ── City row — 2×2 tiles, scroll on mobile ── */}
      <div className="wall-explore__cities" role="list">
        {CITIES.map(city => (
          <div
            key={city.id}
            role="listitem"
            className={`wall-explore__city-item${city.soon ? ' wall-explore__city-item--soon' : ''}`}
          >
            <div className="wall-explore__preview wall-explore__preview--2x2" aria-hidden="true">
              {city.tiles.map((t, i) => (
                <div key={i} className={`wall-explore__mt we-mt--${t.mod}`}>
                  {t.num}
                </div>
              ))}
            </div>

            <div className="wall-explore__text">
              <span className="wall-explore__title">{city.title}</span>
              {city.soon ? (
                <span className="wall-explore__badge">Coming Soon</span>
              ) : (
                <Link to={city.href} className="wall-explore__cta">
                  {city.cta}
                  <span className="wall-explore__arrow" aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Wall type grid — 3 col ── */}
      <div className="wall-explore__grid">
        {WALLS.map(item => (
          <div key={item.id} className="wall-explore__item">

            <div className="wall-explore__preview" aria-hidden="true">
              {item.tiles.map((t, i) => (
                <div key={i} className={`wall-explore__mt we-mt--${t.mod}`}>
                  {t.num}
                </div>
              ))}
            </div>

            <div className="wall-explore__text">
              <span className="wall-explore__title">{item.title}</span>
              <p className="wall-explore__body">{item.body}</p>
              <Link
                to={item.href}
                className="wall-explore__cta"
                aria-label={`${item.cta}${item.stub ? ' (coming soon)' : ''}`}
              >
                {item.cta}
                <span className="wall-explore__arrow" aria-hidden="true">→</span>
              </Link>
            </div>

          </div>
        ))}
      </div>

    </section>
  )
}
