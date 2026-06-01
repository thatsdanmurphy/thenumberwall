import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { trackEvent as track } from '../lib/analytics.js'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import { reelData, RIVAL_TILE, SACRED_TILE } from '../data/index.js'
import { filmGroup } from '../utils/filmUtils.js'
import './ReelWallPage.css'

// ─── Film configs ─────────────────────────────────────────────────────────────
// All films kept here for future use. Only FEATURED_FILM_IDS appear in the
// switcher and on the main wall.
export const FILMS = [
  {
    id:      'Space Jam',
    slug:    'space-jam',
    heading: 'Tune Squad',
    sub:     'Space Jam · 1996',
    sport:   'Basketball',
    year:    1996,
    coaches: [{ name: 'Michael Jordan', side: 'Tune Squad', role: 'hero' }],
    tileDim:  { bg: 'rgba(15,50,160,0.40)',  border: 'rgba(40,85,225,0.58)',  glow: '0 0 10px rgba(40,85,225,0.38)',                                   text: 'rgba(255,168,55,0.80)' },
    tileFull: { bg: 'rgba(18,62,198,0.58)',  border: 'rgba(58,105,255,0.76)', glow: '0 0 20px rgba(58,105,255,0.62), 0 0 36px rgba(255,138,28,0.20)', text: 'rgba(255,190,70,1)'    },
  },
  {
    id:      'Mighty Ducks',
    slug:    'mighty-ducks',
    heading: 'District 5 Ducks',
    sub:     'The Mighty Ducks · 1992–1996',
    sport:   'Hockey',
    year:    1992,
    coaches: [
      { name: 'Gordon Bombay', side: 'Ducks',   role: 'hero'  },
      { name: 'Jack Reilly',   side: 'Hawks',   role: 'rival' },
      { name: 'Wolf Stansson', side: 'Iceland', role: 'rival' },
    ],
    tileDim:  { bg: 'rgba(0,88,80,0.38)',   border: 'rgba(0,140,128,0.55)', glow: '0 0 10px rgba(0,140,128,0.35)', text: 'rgba(70,202,185,0.80)' },
    tileFull: { bg: 'rgba(0,108,98,0.58)',  border: 'rgba(0,165,150,0.74)', glow: '0 0 18px rgba(0,165,150,0.54)', text: 'rgba(92,228,210,1)'    },
  },
  {
    id:      'Little Giants',
    slug:    'little-giants',
    heading: 'Urbania Little Giants',
    sub:     'Little Giants · 1994',
    sport:   'Football',
    year:    1994,
    coaches: [
      { name: "Danny O'Shea", side: 'Little Giants', role: 'hero'  },
      { name: "Kevin O'Shea", side: 'Cowboys',       role: 'rival' },
    ],
    tileDim:  { bg: 'rgba(158,18,18,0.38)', border: 'rgba(208,40,40,0.55)', glow: '0 0 10px rgba(208,40,40,0.38)', text: 'rgba(245,120,100,0.80)' },
    tileFull: { bg: 'rgba(188,22,22,0.58)', border: 'rgba(232,48,48,0.74)', glow: '0 0 18px rgba(232,48,48,0.54)', text: 'rgba(255,142,118,1)'    },
  },
  {
    id:      'Bad News Bears',
    slug:    'bad-news-bears',
    heading: 'Bears',
    sub:     'The Bad News Bears · 1976',
    sport:   'Baseball',
    year:    1976,
    coaches: [{ name: 'Morris Buttermaker', side: 'Bears', role: 'hero' }],
    tileDim:  { bg: 'rgba(72,90,18,0.38)',   border: 'rgba(112,138,28,0.55)', glow: '0 0 10px rgba(112,138,28,0.35)', text: 'rgba(185,218,88,0.80)' },
    tileFull: { bg: 'rgba(88,110,22,0.58)',  border: 'rgba(135,165,35,0.74)', glow: '0 0 18px rgba(135,165,35,0.52)', text: 'rgba(210,245,108,1)'   },
  },
  {
    id:      'Slap Shot',
    slug:    'slap-shot',
    heading: 'Charlestown Chiefs',
    sub:     'Slap Shot · 1977',
    sport:   'Hockey',
    year:    1977,
    coaches: [{ name: 'Reggie Dunlop', side: 'Chiefs', role: 'hero' }],
    tileDim:  { bg: 'rgba(15,52,155,0.38)',  border: 'rgba(28,80,220,0.55)', glow: '0 0 10px rgba(28,80,220,0.35)', text: 'rgba(245,218,65,0.80)'  },
    tileFull: { bg: 'rgba(18,62,185,0.58)',  border: 'rgba(35,95,250,0.74)', glow: '0 0 20px rgba(35,95,250,0.55)', text: 'rgba(255,235,85,1)'     },
  },
  {
    id:      'The Natural',
    slug:    'the-natural',
    heading: 'New York Knights',
    sub:     'The Natural · 1984',
    sport:   'Baseball',
    year:    1984,
    coaches: [{ name: 'Pop Fisher', side: 'Knights', role: 'hero' }],
    tileDim:  { bg: 'rgba(130,95,18,0.36)',  border: 'rgba(190,145,28,0.52)', glow: '0 0 10px rgba(190,145,28,0.30)', text: 'rgba(240,200,70,0.80)'  },
    tileFull: { bg: 'rgba(158,118,22,0.56)', border: 'rgba(215,168,35,0.72)', glow: '0 0 18px rgba(215,168,35,0.50)', text: 'rgba(255,222,90,1)'     },
  },
  {
    id:      'Hoosiers',
    slug:    'hoosiers',
    heading: 'Hickory Huskers',
    sub:     'Hoosiers · 1986',
    sport:   'Basketball',
    year:    1986,
    coaches: [
      { name: 'Norman Dale',    side: 'Hickory', role: 'hero' },
      { name: 'Shooter Flatch', side: 'Hickory', role: 'hero' },
    ],
    tileDim:  { bg: 'rgba(110,22,12,0.38)',  border: 'rgba(165,38,22,0.55)', glow: '0 0 10px rgba(165,38,22,0.35)', text: 'rgba(225,128,100,0.80)'  },
    tileFull: { bg: 'rgba(135,28,16,0.58)',  border: 'rgba(188,48,28,0.74)', glow: '0 0 18px rgba(188,48,28,0.52)', text: 'rgba(248,152,122,1)'     },
  },
  {
    id:      'Bull Durham',
    slug:    'bull-durham',
    heading: 'Durham Bulls',
    sub:     'Bull Durham · 1988',
    sport:   'Baseball',
    year:    1988,
    coaches: [{ name: 'Joe Riggins', side: 'Bulls', role: 'hero' }],
    tileDim:  { bg: 'rgba(98,14,28,0.38)',   border: 'rgba(155,28,45,0.55)', glow: '0 0 10px rgba(155,28,45,0.35)', text: 'rgba(228,110,120,0.80)'  },
    tileFull: { bg: 'rgba(120,18,34,0.58)',  border: 'rgba(178,36,56,0.74)', glow: '0 0 18px rgba(178,36,56,0.52)', text: 'rgba(248,138,145,1)'     },
  },
  {
    id:      'Major League',
    slug:    'major-league',
    heading: 'Cleveland Indians',
    sub:     'Major League · 1989',
    sport:   'Baseball',
    year:    1989,
    coaches: [{ name: 'Lou Brown', side: 'Indians', role: 'hero' }],
    tileDim:  { bg: 'rgba(175,18,18,0.38)',  border: 'rgba(220,38,38,0.55)', glow: '0 0 10px rgba(220,38,38,0.35)', text: 'rgba(255,135,115,0.80)'  },
    tileFull: { bg: 'rgba(205,22,22,0.58)',  border: 'rgba(245,45,45,0.74)', glow: '0 0 18px rgba(245,45,45,0.52)', text: 'rgba(255,158,138,1)'     },
  },
  {
    id:      'A League of Their Own',
    slug:    'a-league-of-their-own',
    heading: 'Rockford Peaches',
    sub:     'A League of Their Own · 1992',
    sport:   'Baseball',
    year:    1992,
    coaches: [{ name: 'Jimmy Dugan', side: 'Peaches', role: 'hero' }],
    tileDim:  { bg: 'rgba(168,55,88,0.36)',  border: 'rgba(210,85,118,0.52)', glow: '0 0 10px rgba(210,85,118,0.32)', text: 'rgba(248,168,190,0.80)' },
    tileFull: { bg: 'rgba(192,68,105,0.56)', border: 'rgba(235,100,138,0.72)', glow: '0 0 18px rgba(235,100,138,0.50)', text: 'rgba(255,192,212,1)'   },
  },
  {
    id:      'Varsity Blues',
    slug:    'varsity-blues',
    heading: 'West Canaan Coyotes',
    sub:     'Varsity Blues · 1999',
    sport:   'Football',
    year:    1999,
    coaches: [{ name: 'Bud Kilmer', side: 'Coyotes', role: 'rival' }],
    tileDim:  { bg: 'rgba(12,30,110,0.38)',  border: 'rgba(22,52,168,0.55)', glow: '0 0 10px rgba(22,52,168,0.35)', text: 'rgba(100,148,248,0.80)'  },
    tileFull: { bg: 'rgba(15,38,138,0.58)',  border: 'rgba(28,65,200,0.74)', glow: '0 0 18px rgba(28,65,200,0.52)', text: 'rgba(125,172,255,1)'     },
  },
  {
    id:      'The Replacements',
    slug:    'the-replacements',
    heading: 'Washington Sentinels',
    sub:     'The Replacements · 2000',
    sport:   'Football',
    year:    2000,
    coaches: [{ name: 'Jimmy McGinty', side: 'Sentinels', role: 'hero' }],
    tileDim:  { bg: 'rgba(145,12,12,0.38)',  border: 'rgba(198,22,22,0.55)', glow: '0 0 10px rgba(198,22,22,0.35)', text: 'rgba(238,105,95,0.80)'  },
    tileFull: { bg: 'rgba(178,15,15,0.58)',  border: 'rgba(225,28,28,0.74)', glow: '0 0 18px rgba(225,28,28,0.52)', text: 'rgba(255,130,118,1)'    },
  },
  {
    id:      'Remember the Titans',
    slug:    'remember-the-titans',
    heading: 'T.C. Williams Titans',
    sub:     'Remember the Titans · 2000',
    sport:   'Football',
    year:    2000,
    coaches: [
      { name: 'Herman Boone', side: 'Titans', role: 'hero' },
      { name: 'Bill Yoast',   side: 'Titans', role: 'hero' },
    ],
    tileDim:  { bg: 'rgba(88,14,14,0.38)',  border: 'rgba(138,22,22,0.55)', glow: '0 0 10px rgba(138,22,22,0.35)', text: 'rgba(225,100,90,0.80)'  },
    tileFull: { bg: 'rgba(112,18,18,0.58)',  border: 'rgba(165,28,28,0.74)', glow: '0 0 18px rgba(165,28,28,0.52)', text: 'rgba(248,125,112,1)'     },
  },
  {
    id:      'Hardball',
    slug:    'hardball',
    heading: 'Kekambas',
    sub:     'Hardball · 2001',
    sport:   'Baseball',
    year:    2001,
    coaches: [{ name: "Conor O'Neill", side: 'Kekambas', role: 'hero' }],
    tileDim:  { bg: 'rgba(28,72,45,0.38)',   border: 'rgba(45,115,72,0.55)', glow: '0 0 10px rgba(45,115,72,0.35)', text: 'rgba(105,195,140,0.80)'  },
    tileFull: { bg: 'rgba(35,90,56,0.58)',   border: 'rgba(56,138,88,0.74)', glow: '0 0 18px rgba(56,138,88,0.52)', text: 'rgba(128,218,162,1)'     },
  },
  {
    id:      'Friday Night Lights',
    slug:    'friday-night-lights',
    heading: 'Permian Panthers',
    sub:     'Friday Night Lights · 2004',
    sport:   'Football',
    year:    2004,
    coaches: [{ name: 'Gary Gaines', side: 'Panthers', role: 'hero' }],
    tileDim:  { bg: 'rgba(8,8,8,0.75)',   border: 'rgba(38,38,38,0.88)', glow: '0 0 10px rgba(185,158,22,0.28)', text: 'rgba(215,188,52,0.80)' },
    tileFull: { bg: 'rgba(12,12,12,0.90)', border: 'rgba(52,52,52,0.96)', glow: '0 0 18px rgba(205,178,30,0.42)', text: 'rgba(240,210,62,1)'    },
  },
  {
    id:      'Ted Lasso',
    slug:    'ted-lasso',
    heading: 'AFC Richmond',
    sub:     'Ted Lasso · 2020–2023',
    sport:   'Soccer',
    year:    2020,
    coaches: [
      { name: 'Ted Lasso',    side: 'Richmond', role: 'hero' },
      { name: 'Nate Shelley', side: 'Richmond', role: 'hero' },
    ],
    tileDim:  { bg: 'rgba(12,38,135,0.38)',  border: 'rgba(22,62,198,0.55)', glow: '0 0 10px rgba(22,62,198,0.35)', text: 'rgba(95,152,255,0.80)'  },
    tileFull: { bg: 'rgba(15,48,165,0.58)',  border: 'rgba(28,75,232,0.74)', glow: '0 0 18px rgba(28,75,232,0.52)', text: 'rgba(120,175,255,1)'     },
  },
]

// The 6 film walls featured on the main wall and in the switcher.
// Sorted chronologically. All other films are staged for future use.
export const FEATURED_FILM_IDS = [
  'Major League',       // 1989
  'Mighty Ducks',       // 1992
  'Little Giants',      // 1994
  'Space Jam',          // 1996
  'The Replacements',   // 2000
  'Hardball',           // 2001
]

// ─── filmGroup re-export ─────────────────────────────────────────────────────
// Shared util — avoids circular dep between ReelWallPage and PlayerPanel
export { filmGroup }

// ─── Film-specific tile heat ─────────────────────────────────────────────────
// Each film wall uses its own color palette. statWeight 2+ → tileFull.
// Rival blend: numbers with both hero + rival entries get a dark bg with the
// film's color border/glow bleeding through — two sides, one number.
function makeFilmHeat(film) {
  return function heatFn(_num, entries) {
    const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
    if (legends.length === 0) return {}
    if (legends.some(e => e.tier === 'SACRED'))
      return { heatStyle: SACRED_TILE, textColor: SACRED_TILE.text }

    const hasRival = legends.some(e => e.tier === 'RIVAL')
    const hasHero  = legends.some(e => e.tier !== 'RIVAL')

    // Pure rival — full blackout
    if (!hasHero) return { heatStyle: RIVAL_TILE, textColor: RIVAL_TILE.text }

    // Rival blend — both sides on this number: rival dark + film color halo
    if (hasRival) {
      const blend = {
        bg:     'rgba(8,8,8,0.90)',
        border: film.tileFull.border,
        glow:   `0 0 18px ${film.tileFull.border}`,
        text:   film.tileFull.text,
      }
      return { heatStyle: blend, textColor: blend.text }
    }

    // Heroes only
    const maxWeight = Math.max(...legends.map(e => e.statWeight || 1))
    const tile = maxWeight >= 2 ? film.tileFull : film.tileDim
    return { heatStyle: tile, textColor: tile.text }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReelWallPage() {
  const navigate     = useNavigate()
  const { filmSlug } = useParams()

  // Resolve slug → film config. Always valid — falls back to Mighty Ducks.
  const film = useMemo(() => {
    if (!filmSlug) return null  // triggers redirect below
    return FILMS.find(f => f.slug === filmSlug) ?? null
  }, [filmSlug])

  const [selected,  setSelected]  = useState(null)
  const [coachView, setCoachView] = useState(false)

  // Reset panel when film changes
  useEffect(() => {
    setSelected(null)
    setCoachView(false)
  }, [filmSlug])

  useEffect(() => {
    if (!film) return
    document.title = `${film.heading} — Reel Legends | The Number Wall`
    track('reel_film_open', { film: film.id })
  }, [film])

  // Wall data — entries for this film only
  const wallData = useMemo(
    () => film ? reelData.filter(e => filmGroup(e.film) === film.id) : [],
    [film]
  )

  const wallIndex = useMemo(() => {
    const index = new Map()
    for (const entry of wallData) {
      const key = String(entry.number)
      if (!index.has(key)) index.set(key, [])
      index.get(key).push(entry)
    }
    return index
  }, [wallData])

  // Only render numbers that have entries — no blank cells
  const wallNumbers = useMemo(() => {
    return [...wallIndex.keys()].sort((a, b) => {
      const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
      const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
      return na - nb
    })
  }, [wallIndex])

  const tileHeatFn = useMemo(
    () => film ? makeFilmHeat(film) : () => ({}),
    [film]
  )

  // ── Panel handlers ─────────────────────────────────────────────────────────
  function handleClear() { setSelected(null) }

  function handleSelect(selection) {
    if (!selection) return
    const legends = selection.entries.filter(e => e.tier !== 'UNWRITTEN')
    if (legends.length === 0) return
    setCoachView(false)
    const style = tileHeatFn(selection.number, selection.entries)
    setSelected({ ...selection, tileStyle: style })
  }

  function openCoachPanel() {
    setSelected(null)
    setCoachView(v => !v)
    if (film) track('reel_coaches', { film: film.id })
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (selected || coachView) { handleClear(); setCoachView(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, coachView])

  // Redirect bare /reel or unknown slugs to Mighty Ducks
  if (!film) return <Navigate to="/reel/mighty-ducks" replace />

  const heroCoaches  = film.coaches?.filter(c => c.role === 'hero')  ?? []
  const rivalCoaches = film.coaches?.filter(c => c.role === 'rival') ?? []

  const coachTile = (
    <button
      className={`reel-coach-tile${coachView ? ' reel-coach-tile--active' : ''}`}
      onClick={openCoachPanel}
      aria-label="View coaches"
    >
      <span className="reel-coach-tile__label">COACHES</span>
    </button>
  )

  const featuredFilms = FILMS.filter(f => FEATURED_FILM_IDS.includes(f.id))
    .sort((a, b) => FEATURED_FILM_IDS.indexOf(a.id) - FEATURED_FILM_IDS.indexOf(b.id))

  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="reel-page">

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <div className="reel-page__heading">
          <h1 className="reel-page__team">{film.heading}</h1>
          <span className="reel-page__sub">{film.sub}</span>
        </div>

        <div className="reel-page__body">
          <div className="reel-page__grid-col">
            <WallGrid
              index={wallIndex}
              numbers={wallNumbers}
              activeNumber={selected?.number ?? null}
              onSelect={handleSelect}
              wallId="none"
              tileHeatFn={tileHeatFn}
              prefixContent={coachTile}
            />

            {/* ── Film switcher ──────────────────────────────────────── */}
            <div className="reel-page__film-selector">
              <div className="reel-page__film-grid">
                {featuredFilms.map(f => (
                  <button
                    key={f.id}
                    className={`reel-film-tile${film.id === f.id ? ' reel-film-tile--active' : ''}`}
                    style={film.id === f.id
                      ? { '--film-border': f.tileFull.border, '--film-text': f.tileFull.text }
                      : undefined}
                    onClick={() => {
                      if (film.id !== f.id) navigate(`/reel/${f.slug}`)
                    }}
                    aria-current={film.id === f.id ? 'page' : undefined}
                  >
                    <span className="reel-film-tile__name">{f.id}</span>
                    <span className="reel-film-tile__year">{f.year}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Coach panel or player panel ───────────────────────────── */}
          {coachView && !selected ? (
            <aside className="player-panel">
              <div className="player-panel__handle" aria-hidden="true" />
              <div className="player-panel__inner">
                <div className="player-panel__header">
                  <div className="player-panel__header-left">
                    <div
                      className="player-panel__number player-panel__number--label"
                      style={{ color: film.tileFull.text, textShadow: `0 0 18px ${film.tileFull.border}` }}
                    >
                      COACHES
                    </div>
                  </div>
                  <div className="player-panel__header-actions">
                    <button className="player-panel__close" onClick={() => setCoachView(false)} aria-label="Close coaches">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="player-panel__cards">
                  {heroCoaches.map((c, i) => (
                    <div key={c.name} className={`player-card${i === 0 ? ' player-card--top' : ''}`}>
                      <div className="player-card__row">
                        <div className="player-card__info">
                          <div className="player-card__name-row">
                            <span className="player-card__name">{c.name}</span>
                          </div>
                          <div className="player-card__badges">
                            <span className="player-card__badge">{c.side}</span>
                            <span className="player-card__badge player-card__badge--dim">Head Coach</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rivalCoaches.length > 0 && (
                    <div className="reel-page__coach-section">RIVAL BENCH</div>
                  )}
                  {rivalCoaches.map(c => (
                    <div key={c.name} className="player-card reel-coach-card--rival">
                      <div className="player-card__row">
                        <div className="player-card__info">
                          <div className="player-card__name-row">
                            <span className="player-card__name">{c.name}</span>
                          </div>
                          <div className="player-card__badges">
                            <span className="player-card__badge player-card__badge--dim">{c.side}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          ) : (
            <PlayerPanel
              selected={selected}
              onClear={handleClear}
              wallId="none"
              accentColor={selected?.tileStyle?.textColor ?? null}
            />
          )}
        </div>

      </main>

      <AppFooter />

      {(selected || coachView) && (
        <div
          className="tnw-backdrop reel-page__backdrop"
          onClick={() => { handleClear(); setCoachView(false) }}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
