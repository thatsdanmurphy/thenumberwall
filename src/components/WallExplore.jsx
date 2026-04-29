import { Link } from 'react-router-dom'
import './WallExplore.css'

/**
 * WallExplore — homepage discovery section
 *
 * Thumbnails-first layout: 4×1 inert mini-tiles above title + text.
 * No containers — items float directly on the page background.
 * 3 col desktop / 2 tablet / 1 mobile.
 *
 * Routes marked `soon: true` render a badge instead of a CTA.
 * Routes marked `stub: true` link to /walls as a placeholder.
 */

const ITEMS = [
  {
    id:    'city',
    title: 'City Walls',
    body:  'The legends who built your city. Boston is live.',
    cta:   'Explore Cities',
    href:  '/boston',
    tiles: [
      { num: 9,  mod: 'sox'     },
      { num: 4,  mod: 'bruins'  },
      { num: 33, mod: 'celtics' },
      { num: 12, mod: 'pats'    },
    ],
  },
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
    id:    'rival',
    title: 'Rival Walls',
    body:  'Two teams. Numbers that glowed. The matchups that defined an era.',
    cta:   'See the Rivalries',
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
    body:  'The teams that never existed but should have. Mighty Ducks and beyond.',
    cta:   'Browse Reel Legends',
    href:  '/walls',
    stub:  true,
    tiles: [
      { num: 96, mod: 'reel' },
      { num: 99, mod: 'reel' },
      { num: 21, mod: 'reel' },
      { num: 33, mod: 'reel' },
    ],
  },
  {
    id:    'era',
    title: 'Era Walls',
    body:  'The 90s. The Original Six. The Dynasty Era. Walls organized by the years that made them.',
    soon:  true,
    tiles: [
      { num: 23,  mod: 'era'     },
      { num: 33,  mod: 'era'     },
      { num: '?', mod: 'era dim' },
      { num: '?', mod: 'era dim' },
    ],
  },
  {
    id:    'my',
    title: 'My Wall',
    body:  'Build the wall only you would build. Your numbers. Your identity.',
    cta:   'Start Your Wall',
    href:  '/my-wall',
    tiles: [
      { num: 12,  mod: 'my'     },
      { num: '+', mod: 'my dim' },
      { num: '+', mod: 'my dim' },
      { num: '+', mod: 'my dim' },
    ],
  },
]

export default function WallExplore() {
  return (
    <section className="wall-explore" aria-label="Explore the walls">

      <div className="wall-explore__head">
        <span className="wall-explore__divider-label tnw-eyebrow">Explore the walls</span>
        <div className="wall-explore__divider-line" aria-hidden="true" />
      </div>

      <div className="wall-explore__grid">
        {ITEMS.map(item => (
          <div key={item.id} className="wall-explore__item">

            {/* ── Thumbnails — inert, aria-hidden ── */}
            <div className="wall-explore__preview" aria-hidden="true">
              {item.tiles.map((t, i) => (
                <div
                  key={i}
                  className={`wall-explore__mt we-mt--${t.mod.replace(' ', ' we-mt--')}`}
                >
                  {t.num}
                </div>
              ))}
            </div>

            {/* ── Text ── */}
            <div className="wall-explore__text">
              <span className="wall-explore__title">{item.title}</span>
              <p className="wall-explore__body">{item.body}</p>

              {item.soon ? (
                <span className="wall-explore__badge">Coming Soon</span>
              ) : (
                <Link
                  to={item.href}
                  className="wall-explore__cta"
                  aria-label={`${item.cta}${item.stub ? ' (coming soon)' : ''}`}
                >
                  {item.cta}
                  <span className="wall-explore__arrow" aria-hidden="true">→</span>
                </Link>
              )}
            </div>

          </div>
        ))}
      </div>

    </section>
  )
}
