/**
 * MyWallsHub — the My Walls landing experience.
 *
 * Structure:
 *   MY WALL      — picks grid (legends added via "Add to my wall" on any wall)
 *   WALLS I FOLLOW — city walls + team walls you've contributed to
 *   MY WALLS     — fully built custom walls (themed, shareable)
 *   ADD A WALL   — modal: Add your city | Build a new wall
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, X, MapPin, Layout } from 'lucide-react'
import { listMyWalls } from '../lib/myWallStore.js'
import { getMyPicks, removePick } from '../lib/myPicks.js'
import { MY_WALL_TOKEN, IDENTITY_NUMBER, FOLLOWED_WALLS } from '../lib/storageKeys.js'
import { setIdentityField } from '../lib/identity.js'
import AppLoading  from './AppLoading.jsx'
import NewWallModal from './NewWallModal.jsx'
import PlayerPanel from './PlayerPanel.jsx'
import SportsFilter, { SPORTS as LEGEND_SPORTS } from './SportsFilter.jsx'
import { globalIndex, getHeatStyle, getTileTextColor, SELECTED_TILE } from '../data/index.js'

// ─── All city walls available to follow ──────────────────────────────────────
const ALL_CITY_WALLS = [
  { label: 'Boston',   sub: 'Red Sox · Patriots · Celtics · Bruins', path: '/boston' },
  { label: 'New York', sub: 'Yankees · Mets · Giants · Jets · Knicks', path: '/newyork' },
]

// ─── Followed walls helpers ───────────────────────────────────────────────────
function readFollowed() {
  try { return JSON.parse(localStorage.getItem(FOLLOWED_WALLS)) || [] } catch { return [] }
}
function writeFollowed(arr) {
  localStorage.setItem(FOLLOWED_WALLS, JSON.stringify(arr))
}

// ─── Collaborator dots ────────────────────────────────────────────────────────
function CollabDots({ contributors }) {
  if (!contributors || contributors.length === 0) return null
  const colors = [
    'rgba(60, 130, 255, 0.30)',
    'rgba(232, 124, 42, 0.30)',
    'rgba(130, 200, 100, 0.30)',
    'rgba(200, 100, 200, 0.30)',
  ]
  const shown = contributors.slice(0, 3)
  const extra = contributors.length - shown.length
  return (
    <span className="wall-row__collabs">
      {shown.map((name, i) => (
        <span key={i} className="collab-dot" style={{ background: colors[i % colors.length] }}>
          {name.charAt(0).toUpperCase()}
        </span>
      ))}
      {extra > 0 && <span className="collab-more">+{extra}</span>}
    </span>
  )
}

// All 101 tile numbers — same order as main wall (0, 00, 1-99)
const ALL_NUMBERS = ['0', '00', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

// Personal blue overrides — matches WallGrid MINE_STYLE
const MINE_BG     = 'var(--color-personal-tile-bg)'
const MINE_BORDER = 'var(--color-personal-border)'
const MINE_GLOW   = '0 0 20px var(--color-personal-glow)'
const MINE_TEXT   = 'var(--color-personal)'

// DIM style — unowned tiles default state (clean dark, not full heat)
const DIM_STYLE = {
  background:   'var(--surface-1)',
  border:       '1px solid var(--border-faint)',
  borderRadius: '4px',
  boxShadow:    'none',
}

// Cinema amber — reel picks glow with film-strip warmth, distinct from sports orange
const REEL_TILE_STYLE = {
  background:   'rgba(68, 48, 10, 0.55)',
  border:       '1px solid rgba(210, 155, 45, 0.62)',
  borderRadius: '4px',
  boxShadow:    '0 0 14px rgba(210, 155, 45, 0.40), 0 0 28px rgba(160, 100, 20, 0.18)',
}
const REEL_TEXT_COLOR = 'rgba(240, 190, 85, 1)'

/**
 * getTileStyle — compute inline tile style for the hub grid.
 *
 * Priority: active > my-number > picked (sport-gated) > dim
 *
 * isPickedInSport: pre-computed in render loop.
 *   • No sport filter active → equals isPicked (all picks show heat)
 *   • Sport filter active    → true only when user has a pick in that specific sport
 *   This prevents the global TNW dataset from lighting up tiles the user never added.
 *
 * isReelPick: user has a reel/film pick on this number → cinema amber treatment.
 * pickCount:  number of user picks on this number → drives heat level (not TNW tier).
 */
function getTileStyle(isPicked, isActive, isMyNumber, isPickedInSport, isReelPick, pickCount = 1, globalEntries = []) {
  if (isActive) {
    if (isMyNumber) {
      return {
        background:   MINE_BG,
        border:       '1px solid rgba(255,255,255,0.82)',
        borderRadius: '4px',
        boxShadow:    `0 0 0 2px rgba(255,255,255,0.45), ${MINE_GLOW}`,
      }
    }
    return {
      ...DIM_STYLE,
      border:    '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
    }
  }
  if (isMyNumber) {
    return { background: MINE_BG, border: `1px solid ${MINE_BORDER}`, borderRadius: '4px', boxShadow: MINE_GLOW }
  }
  // Show pick heat only when this tile passes the sport gate
  if (isPicked && isPickedInSport) {
    if (isReelPick) return REEL_TILE_STYLE
    // Heat level from user's own pick count — not global TNW entry count
    const fakeEntries = Array(pickCount).fill({ tier: 'LEGEND' })
    const heat = getHeatStyle(fakeEntries)
    return { background: heat.bg, border: `1px solid ${heat.border}`, borderRadius: '4px', boxShadow: heat.glow }
  }
  // Ghost mode — global TNW heat at 17% opacity. Shows the wall's universe
  // without competing with tiles the user has personally claimed.
  if (globalEntries.length > 0) {
    const isSacred = globalEntries.some(e => e.tier === 'SACRED')
    const heat     = getHeatStyle(globalEntries, isSacred)
    return {
      background:   heat.bg,
      border:       `1px solid ${heat.border}`,
      borderRadius: '4px',
      boxShadow:    'none',
      opacity:      0.17,
    }
  }
  return DIM_STYLE
}

function getTileTextCol(isPicked, isActive, isMyNumber, isPickedInSport, isReelPick, pickCount = 1, globalEntries = []) {
  if (isActive)   return SELECTED_TILE.text
  if (isMyNumber) return MINE_TEXT
  if (isPicked && isPickedInSport) {
    if (isReelPick) return REEL_TEXT_COLOR
    const fakeEntries = Array(pickCount).fill({ tier: 'LEGEND' })
    return getTileTextColor(fakeEntries)
  }
  // Ghost — tile opacity handles the fade; return full heat color so it reads at 17%
  if (globalEntries.length > 0) {
    const isSacred = globalEntries.some(e => e.tier === 'SACRED')
    return getTileTextColor(globalEntries, isSacred)
  }
  return 'var(--ink-dim)'
}

// ─── Hub ─────────────────────────────────────────────────────────────────────
export default function MyWallsHub() {
  const navigate = useNavigate()
  const [walls, setWalls]         = useState([])
  const [wallsLoading, setWallsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Picks — loaded on mount, updates when user removes inline
  const [picks, setPicks] = useState(() => getMyPicks())

  const [selected,    setSelected]    = useState(null)   // { number, entries } | null
  const [sportFilter, setSportFilter] = useState(null)   // Set<sportId> | null

  // Identity number — which number is "yours"
  const [myNumber, setMyNumber] = useState(
    () => typeof window !== 'undefined' ? localStorage.getItem(IDENTITY_NUMBER) || null : null
  )

  // Followed walls — persisted in localStorage
  const [followed, setFollowed] = useState(() => readFollowed())

  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem(MY_WALL_TOKEN) : null

  // Map number → picks[] for O(1) tile lookup (used in grid render)
  const picksByNum = useMemo(() => {
    const map = new Map()
    for (const p of picks) {
      const k = String(p.number)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(p)
    }
    return map
  }, [picks])

  // Sports the user actually has picks for — drives SportsFilter visibility
  const availableSports = useMemo(() => {
    const sportIds = new Set(picks.map(p => p.sport).filter(Boolean))
    return LEGEND_SPORTS.filter(s => sportIds.has(s.id))
  }, [picks])

  // Enrich bare picks ({name,number,team,sport,...}) with full globalIndex data
  // so PlayerCard gets stats, fun facts, tier, etc.
  function enrichPicks(rawPicks, num) {
    const globalEntries = globalIndex.get(num) || []
    return rawPicks.map(pick => {
      const full = globalEntries.find(e => e.name === pick.name)
      return full ?? pick   // fall back to bare pick for custom players
    })
  }

  function handleTileClick(num) {
    const rawPicks    = picks.filter(p => String(p.number) === String(num))
    const myEntries   = enrichPicks(rawPicks, num)
    const globalEntries = globalIndex.get(num) || []
    const suggestions = globalEntries.filter(
      e => e.tier !== 'UNWRITTEN' && !rawPicks.some(m => m.name === e.name)
    )
    setSelected(prev => prev?.number === num ? null : { number: num, entries: myEntries, suggestions })
  }

  // Called by PlayerPanel when user adds a pick from the suggestion list or search.
  // Re-reads localStorage so the grid tile lights up immediately.
  function handlePickAdded() {
    const fresh = getMyPicks()
    setPicks(fresh)
    setSelected(prev => {
      if (!prev) return prev
      const rawPicks    = fresh.filter(p => String(p.number) === String(prev.number))
      const myEntries   = enrichPicks(rawPicks, prev.number)
      const globalEntries = globalIndex.get(prev.number) || []
      const suggestions = globalEntries.filter(
        e => e.tier !== 'UNWRITTEN' && !rawPicks.some(m => m.name === e.name)
      )
      return { ...prev, entries: myEntries, suggestions }
    })
  }

  function handleClaimNumber(num) {
    const val = String(num)
    if (myNumber === val) {
      setIdentityField('number', null)
      setMyNumber(null)
    } else {
      setIdentityField('number', val)
      setMyNumber(val)
    }
  }

  function handleUnfollow(path) {
    const next = followed.filter(p => p !== path)
    writeFollowed(next)
    setFollowed(next)
  }

  function handleFollowCity(path) {
    if (!followed.includes(path)) {
      const next = [...followed, path]
      writeFollowed(next)
      setFollowed(next)
    }
    navigate(path)
  }

  useEffect(() => {
    if (!ownerToken) { setWallsLoading(false); return }
    listMyWalls(ownerToken)
      .then(result => { setWalls(result); setWallsLoading(false) })
      .catch(() => setWallsLoading(false))
  }, [ownerToken])

  function handleRemovePick(playerName) {
    removePick(playerName)
    setPicks(prev => prev.filter(p => p.name !== playerName))
  }

  function handlePromptSelect(prompt) {
    setShowModal(false)
    navigate('/my-wall/new', prompt ? { state: { prompt } } : undefined)
  }

  function handleAddCity(path) {
    setShowModal(false)
    handleFollowCity(path)
  }

  // City walls split into followed / unfollowed
  const followedCities   = ALL_CITY_WALLS.filter(c => followed.includes(c.path))
  const unfollowedCities = ALL_CITY_WALLS.filter(c => !followed.includes(c.path))

  // Accent color for the panel number header:
  // - personal blue ONLY when this is the user's claimed number
  // - global heat color when the number has legends but user has no picks yet
  // - null (lets panel derive from entries) when user has picks
  const selectedAccentColor = (() => {
    if (!selected) return null
    if (myNumber && String(myNumber) === String(selected.number)) return 'var(--color-personal)'
    if (selected.entries.length > 0) return null
    const globalEntries = globalIndex.get(selected.number) || []
    const isSacred = globalEntries.some(e => e.tier === 'SACRED')
    return getTileTextColor(globalEntries, isSacred)
  })()

  return (
    <div className="my-walls-hub">

      {/* ── My Walls — heading ───────────────────────────────────── */}
      <div className="hub-my-wall__heading">
        <h1 className="hub-my-wall__title">My Walls</h1>
        <p className="hub-my-wall__sublabel">Claim your number. Add the legends that matter to you.</p>
      </div>

      {/* Only show filter when user has picks in multiple sports */}
      {availableSports.length > 1 && (
        <SportsFilter
          active={sportFilter}
          onChange={setSportFilter}
          sports={availableSports}
          trackEvent="my_walls_sport_filter"
        />
      )}

      {/* ── Two-column body: left = grid + sections, right = sticky panel ── */}
      <div className="hub-body">

        <div className="hub-body__left">
          {/* Grid */}
          <div className="hub-my-wall__grid wall-grid">
            {ALL_NUMBERS.map(num => {
              const myPicksForNum = picksByNum.get(String(num)) || []
              const isPicked      = myPicksForNum.length > 0
              const isActive      = selected?.number === num
              const isMyNum       = Boolean(myNumber) && String(myNumber) === String(num)
              const isReelPick    = myPicksForNum.some(p => Boolean(p.film))
              const pickCount     = myPicksForNum.length || 1

              // Sport gate: no filter → all picks show; filter active → only matching sport
              const activeSportId = sportFilter instanceof Set ? [...sportFilter][0] : sportFilter
              const isPickedInSport = activeSportId
                ? myPicksForNum.some(p => (p.sport || '').toLowerCase() === activeSportId.toLowerCase())
                : isPicked

              // Ghost — global TNW entries for this number (used when tile has no personal picks)
              const globalEntries = (!isPicked && !isMyNum && !isActive)
                ? (globalIndex.get(num) || []).filter(e => e.tier !== 'UNWRITTEN')
                : []

              return (
                <button
                  key={num}
                  className={`wall-tile${isMyNum ? ' wall-tile--mine' : ''}`}
                  style={getTileStyle(isPicked, isActive, isMyNum, isPickedInSport, isReelPick, pickCount, globalEntries)}
                  onClick={() => handleTileClick(num)}
                  aria-label={`#${num}${isPicked ? ' — on my wall' : ''}`}
                  aria-pressed={isActive}
                >
                  <span
                    className="wall-tile__number"
                    style={{ color: getTileTextCol(isPicked, isActive, isMyNum, isPickedInSport, isReelPick, pickCount, globalEntries) }}
                  >
                    {num}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="hub-divider" />

          {/* ── BUILT WALLS — loading dots ──────────────────────────── */}
          {wallsLoading && ownerToken && (
            <AppLoading text="LOADING YOUR WALLS" />
          )}

          {/* ── BUILT WALLS — list ──────────────────────────────────── */}
          {!wallsLoading && walls.length > 0 && (
            <>
              <div className="hub-built-header">
                <span className="hub-section-label">BUILT WALLS</span>
                <p className="hub-built-sub">Themed walls you've built to share — pick a lens, fill the numbers, send the link.</p>
              </div>
              <div className="hub-wall-list">
                {walls.map(w => {
                  const isPersonal = !w.theme
                  return (
                    <button
                      key={w.id}
                      className="hub-wall-row"
                      onClick={() => navigate(`/wall/${w.slug}`)}
                    >
                      <span className="hub-wall-row__theme-preview">
                        {isPersonal ? (
                          <>
                            <span className="prev-cell" /><span className="prev-cell" /><span className="prev-cell" />
                            <span className="prev-cell" /><span className="prev-cell prev-cell--blue" /><span className="prev-cell" />
                            <span className="prev-cell" /><span className="prev-cell" /><span className="prev-cell" />
                          </>
                        ) : (
                          <>
                            <span className="prev-cell prev-cell--lit" /><span className="prev-cell" /><span className="prev-cell prev-cell--hot" />
                            <span className="prev-cell" /><span className="prev-cell prev-cell--lit" /><span className="prev-cell" />
                            <span className="prev-cell prev-cell--sacred" /><span className="prev-cell prev-cell--lit" /><span className="prev-cell" />
                          </>
                        )}
                      </span>
                      <span className="hub-wall-row__info">
                        <span className="hub-wall-row__name">
                          {isPersonal ? `${w.owner_name}'s Wall` : w.theme}
                        </span>
                        <span className="hub-wall-row__desc">
                          {isPersonal ? 'My personal wall' : (w.theme_description || '')}
                        </span>
                        <span className="hub-wall-row__bottom">
                          <span className="hub-wall-row__count">{w.entryCount} PICKS</span>
                          <CollabDots contributors={w.contributors} />
                        </span>
                      </span>
                      <ChevronRight size={16} className="hub-wall-row__arrow" />
                    </button>
                  )
                })}
              </div>
              <div className="hub-divider" />
            </>
          )}

          {/* ── ADD A WALL ───────────────────────────────────────────── */}
          <div className="hub-build-cta">
            <button className="hub-build-btn" onClick={() => setShowModal(true)}>
              <Layout size={16} />
              <span className="hub-build-btn__text">ADD A WALL</span>
            </button>
          </div>

        </div>{/* end hub-body__left */}

        {/* Sticky panel — right column */}
        <PlayerPanel
          selected={selected}
          onClear={() => setSelected(null)}
          wallId="my-wall"
          accentColor={selectedAccentColor}
          myNumber={myNumber}
          onClaimNumber={handleClaimNumber}
          onPickAdded={handlePickAdded}
        />

      </div>{/* end hub-body */}

      {/* Mobile backdrop */}
      {selected && (
        <div
          className="tnw-backdrop hub-my-wall__backdrop"
          onClick={() => setSelected(null)}
          aria-hidden="true"
        />
      )}

      {/* Modal — city option at the top, then themed wall prompts */}
      <AddWallModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelectCity={handleAddCity}
        onSelectPrompt={handlePromptSelect}
      />
    </div>
  )
}

// ─── Add a Wall modal ─────────────────────────────────────────────────────────
// Two top options: your city (Boston/NY) or build a new themed wall.
function AddWallModal({ open, onClose, onSelectCity, onSelectPrompt }) {
  if (!open) return null

  return (
    <div className="tnw-overlay nw-modal__overlay" onClick={onClose}>
      <div className="nw-modal" onClick={e => e.stopPropagation()}>
        <div className="nw-modal__header">
          <span className="nw-modal__title">ADD A WALL</span>
          <button className="nw-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="nw-modal__body">
          {/* City walls */}
          <span className="nw-modal__section-label">YOUR CITY</span>
          {ALL_CITY_WALLS.map(city => (
            <button
              key={city.path}
              className="nw-modal__prompt-row"
              onClick={() => onSelectCity(city.path)}
            >
              <span className="nw-modal__prompt-icon">
                <MapPin size={16} />
              </span>
              <span className="nw-modal__prompt-info">
                <span className="nw-modal__prompt-name">{city.label}</span>
                <span className="nw-modal__prompt-desc">{city.sub}</span>
              </span>
              <ChevronRight size={14} className="nw-modal__prompt-arrow" />
            </button>
          ))}

          {/* Themed / blank walls */}
          <span className="nw-modal__section-label">BUILD A WALL</span>
          <NewWallModalRows onSelect={onSelectPrompt} />
        </div>
      </div>
    </div>
  )
}

// ─── Reusable row list from NewWallModal ──────────────────────────────────────
// Extracted so we can embed it inside AddWallModal without duplication.
import { Trophy, Flame, Shield, Diamond, Zap, ClipboardList, Users, Swords, Map as MapIcon } from 'lucide-react'
import { getActivePrompts } from '../data/seasonalPrompts.js'

const ICON_MAP = {
  trophy: Trophy, flame: Flame, shield: Shield, diamond: Diamond,
  zap: Zap, 'clipboard-list': ClipboardList, users: Users, swords: Swords, map: MapIcon,
}

function NewWallModalRows({ onSelect }) {
  const prompts  = getActivePrompts()
  const seasonal = prompts.filter(p => p.months !== null)
  const evergreen = prompts.filter(p => p.months === null)

  return (
    <>
      {seasonal.map(p => {
        const Icon = ICON_MAP[p.lucideIcon] || Trophy
        return (
          <button key={p.id} className="nw-modal__prompt-row" onClick={() => onSelect(p)}>
            <span className="nw-modal__prompt-icon nw-modal__prompt-icon--seasonal"><Icon size={16} /></span>
            <span className="nw-modal__prompt-info">
              <span className="nw-modal__prompt-name">{p.name}</span>
              <span className="nw-modal__prompt-desc">{p.description}</span>
            </span>
            <ChevronRight size={14} className="nw-modal__prompt-arrow" />
          </button>
        )
      })}
      {evergreen.map(p => {
        const Icon = ICON_MAP[p.lucideIcon] || Users
        return (
          <button key={p.id} className="nw-modal__prompt-row" onClick={() => onSelect(p)}>
            <span className="nw-modal__prompt-icon"><Icon size={16} /></span>
            <span className="nw-modal__prompt-info">
              <span className="nw-modal__prompt-name">{p.name}</span>
              <span className="nw-modal__prompt-desc">{p.description}</span>
            </span>
            <ChevronRight size={14} className="nw-modal__prompt-arrow" />
          </button>
        )
      })}
      <button className="nw-modal__prompt-row nw-modal__prompt-row--blank" onClick={() => onSelect(null)}>
        <span className="nw-modal__prompt-icon nw-modal__prompt-icon--blank"><Plus size={16} /></span>
        <span className="nw-modal__prompt-info">
          <span className="nw-modal__prompt-name">Blank Wall</span>
          <span className="nw-modal__prompt-desc">Start from scratch. Name it whatever you want.</span>
        </span>
        <ChevronRight size={14} className="nw-modal__prompt-arrow" />
      </button>
    </>
  )
}
