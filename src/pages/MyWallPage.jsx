import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell      from '../components/AppShell.jsx'
import AppHeader     from '../components/AppHeader.jsx'
import AppFooter     from '../components/AppFooter.jsx'
import PlayerSearch  from '../components/PlayerSearch.jsx'
import { TILE_NUMBERS, getHeatStyle, getTileTextColor, SELECTED_TILE, wallData, bostonLegends } from '../data/index.js'
import { createWall, loadWall, placeEntry, removeEntry, clearAllEntries, deleteWall, updateWall, isSlugAvailable } from '../lib/myWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import { getActivePrompts } from '../data/seasonalPrompts.js'
import { track } from '@vercel/analytics'
import '../components/WallGrid.css'
import './MyWallPage.css'

// ─── Build "who else wore this?" index from TNW data ─────────────────────────

function buildWhoElseIndex() {
  const index = {}  // number → [{ name, sport, team, tier, stat, statLabel, funFact }]
  for (const entry of [...wallData, ...bostonLegends]) {
    if (entry.tier === 'UNWRITTEN' || !entry.name) continue
    const num = String(entry.number)
    if (!index[num]) index[num] = []
    // Dedupe by name
    if (index[num].some(e => e.name === entry.name)) continue
    index[num].push({
      name:      entry.name,
      sport:     entry.sport,
      team:      entry.team,
      tier:      entry.tier,
      stat:      entry.stat,
      statLabel: entry.statLabel,
      funFact:   entry.funFact,
    })
  }
  return index
}

const WHO_ELSE = buildWhoElseIndex()

// ─── Onboarding: 3 steps — number → name → theme (optional) ────────────────

function Onboarding({ onComplete }) {
  const [step, setStep]           = useState('number')  // 'number' → 'name' → 'theme'
  const [myNumber, setMyNumber]   = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [resolvedSlug, setResolvedSlug] = useState('')
  const [slugStatus, setSlugStatus]     = useState('idle')  // 'idle' | 'checking' | 'ok' | 'exhausted'
  const [loading, setLoading]     = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [customTheme, setCustomTheme]       = useState('')
  const [allowContribs, setAllowContribs]   = useState(false)

  // Auto-generate slug from name and resolve availability
  const derivedSlug = ownerName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Profanity check
  const profanityResult = checkProfanity(ownerName)
  const nameBlocked = !profanityResult.clean

  useEffect(() => {
    // Don't check slug availability if name is blocked
    if (nameBlocked) {
      setSlugStatus('idle')
      setResolvedSlug('')
      return
    }
    if (!derivedSlug || derivedSlug.length < 2) {
      setSlugStatus('idle')
      setResolvedSlug('')
      return
    }

    let cancelled = false
    setSlugStatus('checking')

    const timer = setTimeout(async () => {
      // Try base slug first
      const baseOk = await isSlugAvailable(derivedSlug)
      if (cancelled) return
      if (baseOk) {
        setResolvedSlug(derivedSlug)
        setSlugStatus('ok')
        return
      }
      // Base taken — try suffixed variants
      for (let i = 2; i <= 20; i++) {
        if (cancelled) return
        const candidate = `${derivedSlug}-${i}`
        const ok = await isSlugAvailable(candidate)
        if (ok && !cancelled) {
          setResolvedSlug(candidate)
          setSlugStatus('ok')
          return
        }
      }
      if (!cancelled) {
        setResolvedSlug('')
        setSlugStatus('exhausted')
      }
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [derivedSlug, nameBlocked])

  async function handleCreate({ skipTheme = false } = {}) {
    if (!ownerName.trim() || !resolvedSlug || slugStatus !== 'ok' || nameBlocked) return
    setLoading(true)
    try {
      const themeLabel = skipTheme ? null : (selectedPrompt?.name || customTheme.trim() || null)
      const themeDesc  = skipTheme ? null : (selectedPrompt?.description || (customTheme.trim() ? customTheme.trim() : null))
      const contribs   = skipTheme ? false : allowContribs
      const wall = await createWall({
        slug: resolvedSlug,
        ownerName: ownerName.trim(),
        myNumber: myNumber || null,
        theme: themeLabel,
        themeDescription: themeDesc,
        allowContributions: contribs,
      })
      onComplete(wall)
    } catch (err) {
      console.error('Failed to create wall:', err)
      setLoading(false)
    }
  }

  return (
    <div className="my-wall-onboard">
      <div className="my-wall-onboard__card">

        {step === 'number' && (
          <>
            <div className="my-wall-onboard__top">
              <span className="my-wall-onboard__new-badge">NEW</span>
              <h2 className="my-wall-onboard__headline">Build Your Wall</h2>
            </div>
            <p className="my-wall-onboard__intro">
              Your corner of The Number Wall. Pick the athletes and numbers that mean something to you, and share it with the people who get it.
            </p>
            <div className="my-wall-onboard__section">
              <label className="my-wall-onboard__label">What's your number?</label>
              <input
                className="my-wall-onboard__number-input"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={myNumber}
                onChange={e => setMyNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="00"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') setStep('name')
                }}
              />
            </div>
            <div className="my-wall-onboard__actions">
              <button
                className="btn-primary"
                disabled={!myNumber}
                onClick={() => { track('wall_number_chosen', { number: myNumber }); setStep('name') }}
              >
                That's my number →
              </button>
              <button
                className="btn-text"
                onClick={() => setStep('name')}
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === 'name' && (
          <>
            <div className="my-wall-onboard__top">
              <h2 className="my-wall-onboard__headline">Name Your Wall</h2>
            </div>
            <p className="my-wall-onboard__intro">
              Give it a name. This becomes your link.
            </p>
            <input
              className="my-wall-onboard__name-input"
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="Wall name"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && ownerName.trim() && slugStatus === 'ok') setStep('theme')
              }}
            />
            {resolvedSlug && slugStatus === 'ok' && (
              <p className="my-wall-onboard__url-preview">
                thenumberwall.com/wall/<strong>{resolvedSlug}</strong>
              </p>
            )}
            {slugStatus === 'checking' && ownerName.trim().length >= 2 && (
              <p className="my-wall-onboard__url-preview">Checking...</p>
            )}
            {nameBlocked && ownerName.trim().length >= 2 && (
              <p className="my-wall-onboard__slug-taken">
                {profanityResult.reason}
              </p>
            )}
            {slugStatus === 'exhausted' && !nameBlocked && (
              <p className="my-wall-onboard__slug-taken">
                That name's popular — try a different one.
              </p>
            )}
            <button
              className="btn-primary"
              disabled={!ownerName.trim() || slugStatus !== 'ok' || nameBlocked}
              onClick={() => setStep('theme')}
            >
              Next →
            </button>
          </>
        )}

        {step === 'theme' && (() => {
          const activePrompts = getActivePrompts()
          const seasonal = activePrompts.filter(p => p.months !== null)
          const evergreen = activePrompts.filter(p => p.months === null)
          return (
            <>
              <div className="my-wall-onboard__top">
                <h2 className="my-wall-onboard__headline">Give It a Theme</h2>
              </div>
              <p className="my-wall-onboard__intro">
                A theme gives your wall a reason to exist — and a reason to share it.
              </p>

              {/* Seasonal prompts */}
              {seasonal.length > 0 && (
                <div className="my-wall-onboard__prompt-section">
                  <span className="my-wall-onboard__prompt-section-label">In season now</span>
                  <div className="my-wall-onboard__prompt-grid">
                    {seasonal.map(p => (
                      <button
                        key={p.id}
                        className={`my-wall-onboard__prompt-card ${selectedPrompt?.id === p.id ? 'my-wall-onboard__prompt-card--selected' : ''}`}
                        onClick={() => { setSelectedPrompt(selectedPrompt?.id === p.id ? null : p); setCustomTheme('') }}
                      >
                        <span className="my-wall-onboard__prompt-icon">{p.icon}</span>
                        <span className="my-wall-onboard__prompt-name">{p.name}</span>
                        <span className="my-wall-onboard__prompt-desc">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evergreen prompts */}
              {evergreen.length > 0 && (
                <div className="my-wall-onboard__prompt-section">
                  <span className="my-wall-onboard__prompt-section-label">Anytime</span>
                  <div className="my-wall-onboard__prompt-grid">
                    {evergreen.map(p => (
                      <button
                        key={p.id}
                        className={`my-wall-onboard__prompt-card ${selectedPrompt?.id === p.id ? 'my-wall-onboard__prompt-card--selected' : ''}`}
                        onClick={() => { setSelectedPrompt(selectedPrompt?.id === p.id ? null : p); setCustomTheme('') }}
                      >
                        <span className="my-wall-onboard__prompt-icon">{p.icon}</span>
                        <span className="my-wall-onboard__prompt-name">{p.name}</span>
                        <span className="my-wall-onboard__prompt-desc">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom theme */}
              <div className="my-wall-onboard__custom-theme">
                <label className="my-wall-onboard__label">Or write your own</label>
                <input
                  className="my-wall-onboard__theme-input"
                  type="text"
                  maxLength={80}
                  value={customTheme}
                  onChange={e => { setCustomTheme(e.target.value); setSelectedPrompt(null) }}
                  placeholder="e.g. Greatest lefties ever"
                />
              </div>

              {/* Let others contribute toggle */}
              <label className="my-wall-onboard__toggle-row">
                <span className="my-wall-onboard__toggle-label">Let others add picks</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowContribs}
                  className={`my-wall-onboard__toggle ${allowContribs ? 'my-wall-onboard__toggle--on' : ''}`}
                  onClick={() => setAllowContribs(!allowContribs)}
                >
                  <span className="my-wall-onboard__toggle-thumb" />
                </button>
              </label>

              <div className="my-wall-onboard__actions">
                <button
                  className="btn-primary"
                  disabled={loading}
                  onClick={() => handleCreate()}
                >
                  {loading ? 'Building...' : 'Build my wall →'}
                </button>
                <button
                  className="btn-text"
                  disabled={loading}
                  onClick={() => handleCreate({ skipTheme: true })}
                >
                  Skip — just for me
                </button>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ─── My Wall Tile ───────────────────────────────────────────────────────────
// Clean tile: just the number + star for your number. No names in cells.

function MyWallTile({ number, picks, isMyNumber, isSearching, justPlaced, onClick }) {
  const hasPlayer  = picks.length > 0
  const count      = picks.length

  // Use actual tier from TNW data for heat styling
  const fakeEntries = hasPlayer
    ? picks.map(p => ({ tier: p.tier || (p.source === 'tnw' ? 'LEGEND' : 'ACTIVE'), name: p.player_name }))
    : [{ tier: 'UNWRITTEN' }]

  // Detect if any pick is SACRED — pass that through to getHeatStyle
  const hasSacred = hasPlayer && picks.some(p => p.tier === 'SACRED')
  const heat      = getHeatStyle(fakeEntries, hasSacred)
  const textColor = isSearching
    ? SELECTED_TILE.text
    : hasPlayer
      ? getTileTextColor(fakeEntries, hasSacred)
      : 'rgba(255,255,255,0.38)'

  // "My number" — electric blue
  const MY_BLUE = {
    bg:     hasPlayer ? heat.bg : 'rgba(60, 130, 255, 0.10)',
    border: 'rgba(60, 130, 255, 0.50)',
    glow:   '0 0 14px 4px rgba(60, 130, 255, 0.35), 0 0 28px 8px rgba(60, 130, 255, 0.15)',
    text:   hasPlayer ? textColor : 'rgba(100, 170, 255, 0.90)',
  }

  const isMyTile = isMyNumber && !isSearching

  const selectedGlow = heat.glow !== 'none'
    ? `0 0 0 2px rgba(255,255,255,0.45), ${heat.glow}`
    : '0 0 0 2px rgba(255,255,255,0.45)'

  const tileStyle = isSearching
    ? { background: heat.bg, border: '1px solid rgba(255,255,255,0.82)', borderRadius: '4px', boxShadow: selectedGlow }
    : isMyTile
      ? { background: MY_BLUE.bg, border: `1px solid ${MY_BLUE.border}`, borderRadius: '4px', boxShadow: MY_BLUE.glow }
      : { background: heat.bg, border: `1px solid ${heat.border}`, borderRadius: '4px', boxShadow: heat.glow }

  const finalTextColor = isSearching
    ? SELECTED_TILE.text
    : isMyTile
      ? MY_BLUE.text
      : textColor

  return (
    <button
      className={[
        'wall-tile my-wall-tile',
        hasPlayer ? 'my-wall-tile--filled' : '',
        isSearching ? 'wall-tile--active' : '',
        isMyTile ? 'my-wall-tile--mine' : '',
        justPlaced ? 'my-wall-tile--just-placed' : '',
      ].join(' ')}
      style={tileStyle}
      onClick={onClick}
      aria-label={`Number ${number}${isMyNumber ? ' — your number' : ''}${hasPlayer ? ` — ${picks[0].player_name}${count > 1 ? ` +${count - 1}` : ''}` : ''}`}
    >
      <span className="wall-tile__number" style={{ color: finalTextColor }}>{number}</span>
      {count > 1 && <span className="my-wall-tile__count">{count}</span>}
    </button>
  )
}

// ─── Placed Card — shows info for a player already on the wall ──────────────

function PlacedPanel({ picks, number, myNumber, whoElse, onAddWhoElse, onRemove, isOwner }) {
  const isMyNumber = myNumber != null && String(number) === String(myNumber)
  const placedNames = new Set(picks.map(p => p.player_name))

  const filtered = whoElse.filter(p => !placedNames.has(p.name))

  return (
    <div className="placed-panel">
      <div className="placed-panel__header">
        <div className="placed-panel__header-left">
          <span className={`placed-panel__number${isMyNumber ? ' placed-panel__number--mine' : ''}`}>#{number}</span>
        </div>
      </div>

      {/* All placed picks for this number */}
      {picks.map((entry, i) => {
        const hasFact = entry.info_fun_fact && !entry.info_fallback
        return (
          <div key={entry.id || i} className={`placed-card ${i > 0 ? 'placed-card--stacked' : ''}`}>
            <div className="placed-card__row">
              <div className="placed-card__info">
                <h3 className="placed-card__name">{entry.player_name}</h3>
                {entry.sport && (
                  <span className="placed-card__sport">{entry.sport}</span>
                )}
              </div>
              {entry.info_stat && (
                <div className="placed-card__stat">
                  <span className="placed-card__stat-number">{entry.info_stat}</span>
                  <span className="placed-card__stat-label">{entry.info_stat_label}</span>
                </div>
              )}
            </div>
            {hasFact && (
              <p className="placed-card__fact">{entry.info_fun_fact}</p>
            )}
            {entry.info_fallback && (
              <p className="placed-card__fallback">
                This one's yours. No stats on file — but they made your wall, so they made their mark.
              </p>
            )}
            {entry.contributed_by && (
              <span className="placed-card__contributed-by">Added by {entry.contributed_by}</span>
            )}
            {isOwner && picks.length > 1 && (
              <button
                className="btn-text btn-text--danger"
                onClick={() => onRemove(entry.id)}
                aria-label={`Remove ${entry.player_name}`}
              >
                Remove
              </button>
            )}
          </div>
        )
      })}

      {/* Legends who wore this number */}
      {filtered.length > 0 && (
        <div className="placed-panel__who-else">
          <span className="placed-panel__who-else-label">Legends who wore this number</span>
          <ul className="placed-panel__who-else-list">
            {filtered.map((p, i) => (
              <li
                key={i}
                className={`placed-panel__who-else-item ${isOwner && onAddWhoElse ? 'placed-panel__who-else-item--tappable' : ''}`}
                onClick={isOwner && onAddWhoElse ? () => onAddWhoElse(p) : undefined}
                role={isOwner && onAddWhoElse ? 'button' : undefined}
                tabIndex={isOwner && onAddWhoElse ? 0 : undefined}
                onKeyDown={isOwner && onAddWhoElse ? (e) => { if (e.key === 'Enter') onAddWhoElse(p) } : undefined}
              >
                <span className="placed-panel__who-else-name">{p.name}</span>
                <span className="placed-panel__who-else-meta">{p.sport}</span>
                {isOwner && onAddWhoElse && (
                  <span className="placed-panel__who-else-action">+ Add</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── My Wall Page ───────────────────────────────────────────────────────────

export default function MyWallPage() {
  const { slug }    = useParams()
  const navigate     = useNavigate()

  // If no slug in URL but user has a saved wall, use it directly (no redirect flash)
  const savedSlug = !slug && typeof window !== 'undefined' ? localStorage.getItem('tnw_my_wall_slug') : null
  const effectiveSlug = slug || savedSlug

  // All hooks must be called before any early return (rules of hooks)
  const [wall, setWall]                 = useState(null)
  const [entries, setEntries]           = useState(new Map())  // number → entry[]
  const [searchingNumber, setSearching] = useState(null)
  const [loading, setLoading]           = useState(!!effectiveSlug)
  const [notFound, setNotFound]         = useState(false)
  const [justPlaced, setJustPlaced]     = useState(null)
  const [toast, setToast]               = useState(null)       // { message, type }
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [contributorName, setContributorName]   = useState('')  // for collaborative walls

  // Silently update URL to /wall/slug if using saved slug (no remount)
  useEffect(() => {
    if (!slug && savedSlug) {
      navigate(`/wall/${savedSlug}`, { replace: true })
    }
  }, [slug, savedSlug, navigate])

  useEffect(() => {
    document.title = wall
      ? `${wall.owner_name}'s Wall — The Number Wall`
      : 'My Wall — The Number Wall'
  }, [wall])

  // Load existing wall
  useEffect(() => {
    if (!effectiveSlug) return
    setLoading(true)
    loadWall(effectiveSlug).then(result => {
      if (!result) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setWall(result)
      // Track visitor (non-owner) wall views
      const token = localStorage.getItem('tnw_my_wall_token')
      if (!token || token !== result.owner_token) {
        track('wall_visited', { slug, entries: result.entries.length })
      }
      // Group entries by number → array
      const map = new Map()
      for (const e of result.entries) {
        const arr = map.get(e.number) || []
        arr.push(e)
        map.set(e.number, arr)
      }
      setEntries(map)
      setLoading(false)
    })
  }, [effectiveSlug])

  function handleOnboardComplete(newWall) {
    track('wall_created', { slug: newWall.slug })
    setWall(newWall)
    setEntries(new Map())
    localStorage.setItem('tnw_my_wall_id', newWall.id)
    localStorage.setItem('tnw_my_wall_slug', newWall.slug)
    localStorage.setItem('tnw_my_wall_token', newWall.owner_token)
    navigate(`/wall/${newWall.slug}`, { replace: true })
  }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ─── Owner check helper ──────────────────────────────────────────────────
  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem('tnw_my_wall_token') : null

  // ─── Place a player — with dedupe check ──────────────────────────────────
  const handlePlace = useCallback(async (entryData) => {
    if (!wall) return
    // Dedupe: don't add the same player to the same number twice
    const existing = entries.get(entryData.number) || []
    if (existing.some(e => e.player_name === entryData.playerName)) {
      showToast(`${entryData.playerName} is already on #${entryData.number}.`)
      return
    }
    // Tag contributions from non-owners
    const isOwnerUser = ownerToken && wall.owner_token === ownerToken
    if (!isOwnerUser && contributorName.trim()) {
      entryData.contributedBy = contributorName.trim()
    }
    try {
      const saved = await placeEntry(wall.id, entryData, ownerToken)
      setEntries(prev => {
        const next = new Map(prev)
        const arr = [...(next.get(entryData.number) || []), saved]
        next.set(entryData.number, arr)
        return next
      })
      track('wall_entry_placed', { number: entryData.number, player: entryData.playerName, source: entryData.source })
      setSearching(null)
      setJustPlaced(entryData.number)
      setTimeout(() => setJustPlaced(null), 1200)
    } catch (err) {
      console.error('Failed to place entry:', err)
      showToast('Something went wrong. Try again.')
    }
  }, [wall, entries, ownerToken, contributorName, showToast])

  // ─── Remove a specific entry ─────────────────────────────────────────────
  const handleRemove = useCallback(async (entryId, number) => {
    if (!wall) return
    try {
      await removeEntry(wall.id, number, entryId, ownerToken)
      setEntries(prev => {
        const next = new Map(prev)
        const arr = (next.get(number) || []).filter(e => e.id !== entryId)
        if (arr.length === 0) next.delete(number)
        else next.set(number, arr)
        return next
      })
    } catch (err) {
      console.error('Failed to remove entry:', err)
      showToast('Couldn\'t remove that entry. Try again.')
    }
  }, [wall, ownerToken, showToast])

  // ─── Add from who-else list ──────────────────────────────────────────────
  const handleAddWhoElse = useCallback((number, player) => {
    handlePlace({
      number,
      playerName: player.name,
      playerId:   null,
      sport:      player.sport,
      source:     'tnw',
      tier:       player.tier,
      infoSnap: {
        stat:      player.stat,
        statLabel: player.statLabel,
        funFact:   player.funFact,
        fallback:  false,
      },
    })
  }, [handlePlace])

  // ─── Share wall (copy link) ──────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/wall/${wall?.slug}`
    navigator.clipboard.writeText(url).then(() => {
      track('wall_shared', { slug: wall?.slug })
      showToast('Link copied — share your wall!', 'success')
    }).catch(() => {
      showToast('Couldn\'t copy link. Try again.')
    })
  }, [wall, showToast])

  // ─── Delete wall ─────────────────────────────────────────────────────────
  const handleDeleteWall = useCallback(async () => {
    if (!wall) return
    try {
      await deleteWall(wall.id, ownerToken)
      // Clear local state
      localStorage.removeItem('tnw_my_wall_id')
      localStorage.removeItem('tnw_my_wall_slug')
      setShowClearConfirm(false)
      showToast('Wall deleted.', 'success')
      navigate('/my-wall', { replace: true })
    } catch (err) {
      console.error('Failed to delete wall:', err)
      showToast('Couldn\'t delete wall. Try again.')
    }
  }, [wall, ownerToken, showToast, navigate])

  // ─── Claim / unclaim number ──────────────────────────────────────────────
  const handleClaimNumber = useCallback(async (number) => {
    if (!wall) return
    try {
      const updated = await updateWall(wall.id, { my_number: number }, ownerToken)
      setWall(prev => ({ ...prev, my_number: updated.my_number }))
      showToast(`#${number} is yours now.`, 'success')
    } catch (err) {
      console.error('Failed to claim number:', err)
      showToast('Couldn\'t claim that number. Try again.')
    }
  }, [wall, ownerToken, showToast])

  const handleUnclaimNumber = useCallback(async () => {
    if (!wall) return
    try {
      const updated = await updateWall(wall.id, { my_number: null }, ownerToken)
      setWall(prev => ({ ...prev, my_number: updated.my_number }))
      showToast('Number unclaimed.', 'success')
    } catch (err) {
      console.error('Failed to unclaim number:', err)
      showToast('Couldn\'t unclaim. Try again.')
    }
  }, [wall, ownerToken, showToast])

  function handleTileClick(number) {
    // Single entry point: tap tile → panel opens
    if (searchingNumber === number) {
      setSearching(null)
    } else {
      setSearching(number)
    }
  }

  // Close search on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setSearching(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ─── Mobile body scroll lock when panel is open ──────────────────────────
  useEffect(() => {
    if (searchingNumber) {
      const scrollY = window.scrollY
      document.body.classList.add('my-wall-sheet-open')
      document.body.style.top = `-${scrollY}px`
      document.body.dataset.scrollY = scrollY
    } else {
      const savedY = parseInt(document.body.dataset.scrollY || '0', 10)
      document.body.classList.remove('my-wall-sheet-open')
      document.body.style.top = ''
      window.scrollTo(0, savedY)
    }
    return () => {
      const savedY = parseInt(document.body.dataset.scrollY || '0', 10)
      document.body.classList.remove('my-wall-sheet-open')
      document.body.style.top = ''
      window.scrollTo(0, savedY)
    }
  }, [searchingNumber])

  // ─── Not found ────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <AppShell>
        <AppHeader back={{ label: 'The Wall', onClick: () => navigate('/') }} title="MY WALL" />
        <main className="my-wall-page">
          <div className="my-wall-page__not-found">
            <h2>Wall not found.</h2>
            <p>No wall lives at this URL yet.</p>
            <button className="btn-primary" onClick={() => navigate('/my-wall')}>
              Build yours →
            </button>
          </div>
        </main>
        <AppFooter />
      </AppShell>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell>
        <AppHeader title="MY WALL" />
        <main className="my-wall-page">
          <p className="my-wall-page__loading">Loading wall...</p>
        </main>
      </AppShell>
    )
  }

  // ─── Onboarding (no wall yet, no slug in URL) ────────────────────────────
  if (!wall && !effectiveSlug) {
    return (
      <AppShell>
        <AppHeader title="MY WALL" />
        <main className="my-wall-page">
          <Onboarding onComplete={handleOnboardComplete} />
        </main>
        <AppFooter />
      </AppShell>
    )
  }

  // ─── The Wall ─────────────────────────────────────────────────────────────

  const isOwner = ownerToken && wall?.owner_token === ownerToken
  const canEdit = isOwner || (wall?.allow_contributions === true)

  const selectedPicks = searchingNumber ? (entries.get(searchingNumber) || []) : []
  const hasPicks = selectedPicks.length > 0

  // Clean number (strip -add suffix for "add another" mode)
  const cleanNumber = searchingNumber ? searchingNumber.toString().replace('-add', '') : null
  const whoElse = cleanNumber && WHO_ELSE[cleanNumber]
    ? WHO_ELSE[cleanNumber]
    : []

  // Null guard
  if (!wall) return null

  const wallName = wall.owner_name || 'My'
  const isMyNumber = (num) => wall.my_number != null && String(wall.my_number) === String(num)

  // Themed walls: theme is the headline, "by Owner" as tagline
  // Personal walls: owner's name is the headline, short tagline
  const headerTitle = wall.theme
    ? wall.theme.toUpperCase()
    : `${wallName.toUpperCase()}'S WALL`

  const tagline = wall.theme
    ? null
    : (isOwner ? 'Your numbers. Your legends.' : null)

  return (
    <AppShell>
      <AppHeader
        back={{ label: 'My Walls', onClick: () => navigate('/my-wall') }}
        title={headerTitle}
        tagline={tagline}
      />
      <main className="my-wall-page">
        {/* Owner action bar: share + clear */}
        {isOwner && (
          <div className="my-wall-page__actions">
            <button className="btn-micro" onClick={handleShare}>SHARE WALL</button>
            <button className="btn-micro" onClick={() => setShowClearConfirm(true)}>DELETE WALL</button>
          </div>
        )}

        <div className="my-wall-page__body">
          {/* Grid */}
          <div className="my-wall-page__grid-col">
            <div className="wall-grid" role="grid" aria-label="My wall">
              {TILE_NUMBERS.map(num => (
                <MyWallTile
                  key={num}
                  number={num}
                  picks={entries.get(num) || []}
                  isMyNumber={isMyNumber(num)}
                  isSearching={searchingNumber === num}
                  justPlaced={justPlaced === num}
                  onClick={() => handleTileClick(num)}
                />
              ))}
            </div>
          </div>

          {/* Mobile backdrop — tap to close */}
          {searchingNumber && (
            <div
              className="my-wall-page__backdrop"
              onClick={() => setSearching(null)}
              aria-hidden="true"
            />
          )}

          {/* Side panel — bottom sheet on mobile */}
          <div className={`my-wall-page__panel ${searchingNumber ? 'my-wall-page__panel--open' : ''}`}>
            {/* Mobile drag handle */}
            <div className="my-wall-page__sheet-handle" onClick={() => setSearching(null)}>
              <div className="my-wall-page__sheet-handle-bar" />
            </div>

            <div className="my-wall-page__panel-scroll">
            {/* Contributor name bar — for non-owners on collaborative walls */}
            {!isOwner && canEdit && (
              <div className="my-wall-page__contrib-bar">
                <span className="my-wall-page__contrib-label">YOUR NAME</span>
                <input
                  className="my-wall-page__contrib-input"
                  type="text"
                  maxLength={30}
                  value={contributorName}
                  onChange={e => setContributorName(e.target.value)}
                  placeholder="Who's adding picks?"
                />
              </div>
            )}

            {/* Tapped a filled tile → show all picks + who else + option to add more */}
            {searchingNumber && hasPicks ? (
              <>
                <PlacedPanel
                  picks={selectedPicks}
                  number={searchingNumber}
                  myNumber={wall.my_number}
                  whoElse={whoElse}
                  onAddWhoElse={canEdit ? (p) => handleAddWhoElse(searchingNumber, p) : null}
                  onRemove={isOwner ? (id) => handleRemove(id, searchingNumber) : null}
                  isOwner={canEdit}
                />
                {canEdit && (
                  <div className="my-wall-page__add-another">
                    <button
                      className="my-wall-page__add-btn"
                      onClick={() => {
                        setSearching(`${searchingNumber}-add`)
                      }}
                    >
                      + Add another
                    </button>
                  </div>
                )}
              </>
            ) : searchingNumber && canEdit ? (
              /* Editor tapped empty tile or clicked "add another" */
              <div className="my-wall-page__search-panel">
                {/* Big number header — always show for empty tiles */}
                <div className="placed-panel">
                  <div className="placed-panel__header">
                    <div className="placed-panel__header-left">
                      <span className="placed-panel__number">#{cleanNumber}</span>
                    </div>
                  </div>
                  {/* Who else wears this number? — show even before placing */}
                  {whoElse.length > 0 && (
                    <div className="placed-panel__who-else">
                      <span className="placed-panel__who-else-label">Legends who wore this number</span>
                      <ul className="placed-panel__who-else-list">
                        {whoElse.map((p, i) => (
                          <li
                            key={i}
                            className="placed-panel__who-else-item placed-panel__who-else-item--tappable"
                            onClick={() => handleAddWhoElse(cleanNumber, p)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddWhoElse(cleanNumber, p) }}
                          >
                            <span className="placed-panel__who-else-name">{p.name}</span>
                            <span className="placed-panel__who-else-meta">{p.sport}</span>
                            <span className="placed-panel__who-else-action">+ Add</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <PlayerSearch
                  number={cleanNumber}
                  onPlace={handlePlace}
                  onCancel={() => setSearching(null)}
                  hideHeader
                />
              </div>
            ) : searchingNumber && !canEdit ? (
              /* Visitor tapped a tile — read-only panel */
              <div className="placed-panel">
                <div className="placed-panel__header">
                  <div className="placed-panel__header-left">
                    <span className="placed-panel__number">#{cleanNumber}</span>
                  </div>
                </div>
                {whoElse.length > 0 && (
                  <div className="placed-panel__who-else">
                    <span className="placed-panel__who-else-label">Legends who wore this number</span>
                    <ul className="placed-panel__who-else-list">
                      {whoElse.map((p, i) => (
                        <li key={i} className="placed-panel__who-else-item">
                          <span className="placed-panel__who-else-name">{p.name}</span>
                          <span className="placed-panel__who-else-meta">{p.sport}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-wall-page__idle">
                <svg className="my-wall-page__idle-jersey" viewBox="0 0 496 359" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M265.686 351H141.686C137.268 351 133.686 347.418 133.686 343V162.314C133.686 155.186 125.069 151.617 120.029 156.657L77.8431 198.843C74.7189 201.967 69.6536 201.967 66.5294 198.843L10.3431 142.657C7.21894 139.533 7.21894 134.467 10.3431 131.343L131.343 10.3431C132.843 8.84285 134.878 8 137 8H194.873C196.994 8 199.029 8.84286 200.529 10.3431L239.029 48.8431C242.154 51.9673 247.219 51.9673 250.343 48.8431L288.843 10.3431C290.343 8.84285 292.378 8 294.5 8H358.873C360.994 8 363.029 8.84285 364.529 10.3431L485.529 131.343C488.654 134.467 488.654 139.533 485.529 142.657L429.343 198.843C426.219 201.967 421.154 201.967 418.029 198.843L375.843 156.657C370.803 151.617 362.186 155.186 362.186 162.314V343C362.186 347.418 358.605 351 354.186 351H307.186" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M137.186 317H324.686" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                </svg>
                <div className="my-wall-page__idle-headline">
                  {isOwner ? 'YOUR WALL. YOUR CALL.' : `${wallName.toUpperCase()}'S WALL.`}
                </div>
                <p className="my-wall-page__idle-text">
                  {isOwner
                    ? 'Tap any number to place your legend.'
                    : 'Tap a lit tile to see who they picked.'
                  }
                </p>
              </div>
            )}
            </div>{/* end panel-scroll */}
          </div>
        </div>

        {/* Clear wall confirmation modal */}
        {showClearConfirm && (
          <div className="my-wall-modal__overlay" onClick={() => setShowClearConfirm(false)}>
            <div className="my-wall-modal" onClick={e => e.stopPropagation()}>
              <h3 className="my-wall-modal__title">Delete this wall?</h3>
              <p className="my-wall-modal__text">This permanently deletes the wall and all its picks. This can't be undone.</p>
              <div className="my-wall-modal__actions">
                <button className="btn-ghost" onClick={() => setShowClearConfirm(false)}>Keep it</button>
                <button className="btn-primary" style={{ background: '#E8182E', borderColor: '#E8182E' }} onClick={handleDeleteWall}>Delete wall</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={`my-wall-toast ${toast.type === 'success' ? 'my-wall-toast--success' : 'my-wall-toast--error'}`}>
            {toast.message}
          </div>
        )}
      </main>
      <AppFooter />
    </AppShell>
  )
}
