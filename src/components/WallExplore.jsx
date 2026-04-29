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
      { num: 9,  mod: 'sox'     },  // Ted Williams
      { num: 8,  mod: 'sox'     },  // Yaz
      { num: 45, mod: 'sox'     },  // Pedro
      { num: 4,  mod: 'bruins'  },  // Bobby Orr
      { num: 7,  mod: 'bruins'  },  // Phil Esposito
      { num: 33, mod: 'celtics' },  // Larry Bird
      { num: 6,  mod: 'celtics' },  // Bill Russell
      { num: 12, mod: 'pats'    },  // Tom Brady
      { num: 87, mod: 'pats'    },  // Gronk
    ],
  },
  {
    id:    'newyork',
    title: 'New York',
    cta:   'Explore New York',
    href:  '/walls',
    tiles: [
      { num: 2,  mod: 'ny-yankees' },  // Jeter
      { num: 7,  mod: 'ny-yankees' },  // Mantle
      { num: 3,  mod: 'ny-yankees' },  // Ruth
      { num: 33, mod: 'ny-knicks'  },  // Ewing
      { num: 56, mod: 'ny-giants'  },  // LT
      { num: 11, mod: 'ny-rangers' },  // Messier
      { num: 42, mod: 'ny-mets'    },  // Jackie (retired across MLB)
      { num: 17, mod: 'ny-knicks'  },  // Frazier
      { num: 10, mod: 'ny-knicks'  },  // Walt Frazier alt
    ],
  },
  {
    id:    'chicago',
    title: 'Chicago',
    soon:  true,
    tiles: [
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
      { num: '', mod: 'blank' },
    ],
  },
  {
    id:    'la',
    title: 'Los Angeles',
    cta:   'Explore Los Angeles',
    href:  '/walls',
    stub:  true,
    tiles: [
      { num: 24, mod: 'la-lakers'  },  // Kobe
      { num: 32, mod: 'la-lakers'  },  // Magic
      { num: 33, mod: 'la-lakers'  },  // Kareem
      { num: 42, mod: 'la-dodgers' },  // Jackie
      { num: 32, mod: 'la-dodgers' },  // Koufax
      { num: 19, mod: 'la-dodgers' },  // Piazza (wore 31, but close)
      { num: 99, mod: 'la-kings'   },  // Gretzky
      { num: 29, mod: 'la-rams'    },
      { num: 80, mod: 'la-rams'    },
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
    title: 'Heated Matchups',
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
            <div className="wall-explore__preview wall-explore__preview--3x3" aria-hidden="true">
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
