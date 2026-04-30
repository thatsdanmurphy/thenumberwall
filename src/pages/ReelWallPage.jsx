import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import { reelData, RIVAL_TILE, SACRED_TILE } from '../data/index.js'
import './ReelWallPage.css'

// ─── Film configs ─────────────────────────────────────────────────────────────
const FILMS = [
  {
    id:      'Space Jam',
    slug:    'space-jam',
    heading: 'Tune Squad',
    sub:     'Space Jam · 1996',
    coaches: [
      { name: 'Michael Jordan', side: 'Tune Squad', role: 'hero' },
    ],
    tileDim:  { bg: 'rgba(15,50,160,0.40)',  border: 'rgba(40,85,225,0.58)',  glow: '0 0 10px rgba(40,85,225,0.38)',                                        text: 'rgba(255,168,55,0.80)' },
    tileFull: { bg: 'rgba(18,62,198,0.58)',   border: 'rgba(58,105,255,0.76)', glow: '0 0 20px rgba(58,105,255,0.62), 0 0 36px rgba(255,138,28,0.20)',        text: 'rgba(255,190,70,1)'    },
  },
  {
    id:      'Mighty Ducks',
    slug:    'mighty-ducks',
    heading: 'District 5 Ducks',
    sub:     'The Mighty Ducks · 1992–1996',
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
    coaches: [
      { name: "Danny O'Shea", side: 'Little Giants', role: 'hero'  },
      { name: "Kevin O'Shea", side: 'Cowboys',       role: 'rival' },
    ],
    tileDim:  { bg: 'rgba(158,18,18,0.38)', border: 'rgba(208,40,40,0.55)', glow: '0 0 10px rgba(208,40,40,0.38)', text: 'rgba(245,120,100,0.80)' },
    tileFull: { bg: 'rgba(188,22,22,0.58)', border: 'rgba(232,48,48,0.74)', glow: '0 0 18px rgba(232,48,48,0.54)', text: 'rgba(255,142,118,1)'    },
  },
]

const SLUG_TO_ID = {
  'space-jam':     'Space Jam',
  'mighty-ducks':  'Mighty Ducks',
  'little-giants': 'Little Giants',
}

function filmGroup(filmStr) {
  if (!filmStr) return null
  if (filmStr === 'Space Jam') return 'Space Jam'
  if (filmStr.includes('Mighty Ducks') || filmStr.startsWith('D2') || filmStr.startsWith('D3')) return 'Mighty Ducks'
  if (filmStr.includes('Little Giants')) return 'Little Giants'
  return null
}

// ─── Tile heat ────────────────────────────────────────────────────────────────
// Pure-rival   → jet black, white outline, white number
// Pure-hero    → team color, scaled by stat weight
// Mixed        → diagonal split: rival black fading into team color

function makeTeamHeat(film) {
  return function(num, entries) {
    const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
    if (legends.length === 0) return {}

    if (legends.some(e => e.tier === 'SACRED'))
      return { heatStyle: SACRED_TILE, textColor: SACRED_TILE.text }

    const allRival = legends.every(e => e.tier === 'RIVAL')
    const hasRival = legends.some(e => e.tier === 'RIVAL')
    const hasHero  = legends.some(e => e.tier !== 'RIVAL')

    if (allRival) return { heatStyle: RIVAL_TILE, textColor: RIVAL_TILE.text }

    const maxWeight = Math.max(...legends.map(e => e.statWeight || 1))
    const teamTile  = maxWeight >= 2 ? film.tileFull : film.tileDim

    if (hasRival && hasHero) {
      return {
        heatStyle: {
          bg:     `linear-gradient(135deg, rgba(0,0,0,0.92) 0%, ${teamTile.bg} 100%)`,
          border: 'rgba(255,255,255,0.18)',
          glow:   teamTile.glow,
          text:   teamTile.text,
        },
        textColor: teamTile.text,
      }
    }

    return { heatStyle: teamTile, textColor: teamTile.text }
  }
}

export default function ReelWallPage() {
  const navigate     = useNavigate()
  const { filmSlug } = useParams()
  const [selected,   setSelected]   = useState(null)
  const [coachView,  setCoachView]  = useState(false)

  const filmId = SLUG_TO_ID[filmSlug] ?? 'Space Jam'
  const film   = FILMS.find(f => f.id === filmId) ?? FILMS[0]

  useEffect(() => {
    document.title = `${film.heading} — Reel Legends | The Number Wall`
    track('reel_view', { film: film.id })
  }, [film])

  const filteredData = useMemo(
    () => reelData.filter(e => filmGroup(e.film) === film.id),
    [film]
  )

  const filteredIndex = useMemo(() => {
    const index = new Map()
    for (const entry of filteredData) {
      const key = String(entry.number)
      if (!index.has(key)) index.set(key, [])
      index.get(key).push(entry)
    }
    return index
  }, [filteredData])

  const tileHeatFn = useMemo(() => makeTeamHeat(film), [film])

  function handleClear() { setSelected(null) }

  function handleSelect(selection) {
    if (!selection || selection.entries.filter(e => e.tier !== 'UNWRITTEN').length === 0) return
    const style = tileHeatFn(selection.number, selection.entries)
    setCoachView(false)
    setSelected({ ...selection, tileStyle: style })
  }

  function openCoachPanel() {
    setSelected(null)
    setCoachView(v => !v)
    track('reel_coaches', { film: film.id })
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { handleClear(); setCoachView(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const heroCoaches  = film.coaches?.filter(c => c.role === 'hero')  ?? []
  const rivalCoaches = film.coaches?.filter(c => c.role === 'rival') ?? []

  // Coach tile injected before the number grid via prefixContent
  const coachTile = (
    <button
      className={`reel-coach-tile${coachView ? ' reel-coach-tile--active' : ''}`}
      onClick={openCoachPanel}
      aria-label="View coaches"
    >
      <span className="reel-coach-tile__label">COACHES</span>
    </button>
  )

  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="reel-page">

        <div className="reel-page__heading">
          <span className="reel-page__overline">REEL LEGENDS</span>
          <h1 className="reel-page__team">{film.heading}</h1>
          <span className="reel-page__sub">{film.sub}</span>
        </div>

        <div className="reel-page__body">
          <div className="reel-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={handleSelect}
              wallId="none"
              tileHeatFn={tileHeatFn}
              prefixContent={coachTile}
            />
          </div>

          {/* Coach panel — shown instead of PlayerPanel when coachView is active */}
          {coachView && !selected ? (
            <aside className="player-panel">
              <div className="player-panel__handle" aria-hidden="true" />
              <div className="player-panel__inner">

                <div className="player-panel__header">
                  <div className="player-panel__header-left">
                    <div
                      className="player-panel__number"
                      style={{ color: film.tileFull.text, textShadow: `0 0 28px ${film.tileFull.border}` }}
                    >
                      COACHES
                    </div>
                  </div>
                  <div className="player-panel__header-actions">
                    <button
                      className="player-panel__close"
                      onClick={() => setCoachView(false)}
                      aria-label="Close coaches"
                    >
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
