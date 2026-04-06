/**
 * MyWallsPage — hub route for /my-wall
 *
 * If the user has walls → show MyWallsHub (wall list + identity + build CTA)
 * If the user has no walls and no token → show Onboarding (first-time experience)
 *
 * /my-wall/new → always shows Onboarding for creating a new wall
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppShell   from '../components/AppShell.jsx'
import AppHeader  from '../components/AppHeader.jsx'
import AppFooter  from '../components/AppFooter.jsx'
import MyWallsHub from '../components/MyWallsHub.jsx'
import { listMyWalls, createWall, isSlugAvailable } from '../lib/myWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import { getActivePrompts } from '../data/seasonalPrompts.js'
import { track } from '@vercel/analytics'
import './MyWallPage.css'

// ─── Onboarding (2 steps for hub: name → theme) ───────────────────────────

function Onboarding({ onComplete, preselectedPrompt }) {
  const [step, setStep]           = useState('name')  // 'name' → 'theme'
  const [ownerName, setOwnerName] = useState('')
  const [resolvedSlug, setResolvedSlug] = useState('')
  const [slugStatus, setSlugStatus]     = useState('idle')
  const [loading, setLoading]     = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(preselectedPrompt || null)
  const [customTheme, setCustomTheme]       = useState('')
  const [allowContribs, setAllowContribs]   = useState(!!preselectedPrompt)

  const derivedSlug = ownerName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const profanityResult = checkProfanity(ownerName)
  const nameBlocked = !profanityResult.clean

  useEffect(() => {
    if (nameBlocked) { setSlugStatus('idle'); setResolvedSlug(''); return }
    if (!derivedSlug || derivedSlug.length < 2) { setSlugStatus('idle'); setResolvedSlug(''); return }
    let cancelled = false
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      const baseOk = await isSlugAvailable(derivedSlug)
      if (cancelled) return
      if (baseOk) { setResolvedSlug(derivedSlug); setSlugStatus('ok'); return }
      for (let i = 2; i <= 20; i++) {
        if (cancelled) return
        const candidate = `${derivedSlug}-${i}`
        const ok = await isSlugAvailable(candidate)
        if (ok && !cancelled) { setResolvedSlug(candidate); setSlugStatus('ok'); return }
      }
      if (!cancelled) { setResolvedSlug(''); setSlugStatus('exhausted') }
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
        myNumber: null,  // number now lives in identity, not on wall
        theme: themeLabel,
        themeDescription: themeDesc,
        allowContributions: contribs,
      })
      track('wall_created', { slug: wall.slug, theme: themeLabel })
      onComplete(wall)
    } catch (err) {
      console.error('Failed to create wall:', err)
      setLoading(false)
    }
  }

  // If we came in with a preselected prompt, go straight to name step
  // (theme is already decided)

  return (
    <div className="my-wall-onboard">
      <div className="my-wall-onboard__card">

        {step === 'name' && (
          <>
            <div className="my-wall-onboard__top">
              {selectedPrompt && (
                <span className="my-wall-onboard__new-badge">{selectedPrompt.name.toUpperCase()}</span>
              )}
              <h2 className="my-wall-onboard__headline">Name Your Wall</h2>
            </div>
            <p className="my-wall-onboard__intro">
              {selectedPrompt
                ? selectedPrompt.description
                : 'Give it a name. This becomes your link.'
              }
            </p>
            <input
              className="my-wall-onboard__name-input"
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="Wall name"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && ownerName.trim() && slugStatus === 'ok') {
                  selectedPrompt ? handleCreate() : setStep('theme')
                }
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
              <p className="my-wall-onboard__slug-taken">{profanityResult.reason}</p>
            )}
            {slugStatus === 'exhausted' && !nameBlocked && (
              <p className="my-wall-onboard__slug-taken">That name's popular — try a different one.</p>
            )}
            <button
              className="btn-primary"
              disabled={!ownerName.trim() || slugStatus !== 'ok' || nameBlocked}
              onClick={() => selectedPrompt ? handleCreate() : setStep('theme')}
            >
              {selectedPrompt
                ? (loading ? 'Building...' : 'Build my wall →')
                : 'Next →'
              }
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
                        <span className="my-wall-onboard__prompt-name">{p.name}</span>
                        <span className="my-wall-onboard__prompt-desc">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        <span className="my-wall-onboard__prompt-name">{p.name}</span>
                        <span className="my-wall-onboard__prompt-desc">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                <button className="btn-primary" disabled={loading} onClick={() => handleCreate()}>
                  {loading ? 'Building...' : 'Build my wall →'}
                </button>
                <button className="btn-text" disabled={loading} onClick={() => handleCreate({ skipTheme: true })}>
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

// ─── My Walls Page ─────────────────────────────────────────────────────────

export default function MyWallsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isNewRoute = location.pathname === '/my-wall/new'
  const preselectedPrompt = location.state?.prompt || null

  const [hasWalls, setHasWalls] = useState(null)  // null = loading
  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem('tnw_my_wall_token') : null

  useEffect(() => {
    if (isNewRoute) { setHasWalls(true); return }  // skip check on /new
    if (!ownerToken) { setHasWalls(false); return }
    listMyWalls(ownerToken).then(walls => {
      setHasWalls(walls.length > 0)
    }).catch(() => setHasWalls(false))
  }, [ownerToken, isNewRoute])

  function handleOnboardComplete(newWall) {
    localStorage.setItem('tnw_my_wall_id', newWall.id)
    localStorage.setItem('tnw_my_wall_slug', newWall.slug)
    localStorage.setItem('tnw_my_wall_token', newWall.owner_token)
    navigate(`/wall/${newWall.slug}`, { replace: true })
  }

  // Creating a new wall
  if (isNewRoute) {
    return (
      <AppShell>
        <AppHeader back={{ label: 'My Walls', onClick: () => navigate('/my-wall') }} title="NEW WALL" />
        <main className="my-wall-page">
          <Onboarding onComplete={handleOnboardComplete} preselectedPrompt={preselectedPrompt} />
        </main>
        <AppFooter />
      </AppShell>
    )
  }

  // Still checking
  if (hasWalls === null) {
    return (
      <AppShell>
        <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} title="MY WALLS" tagline="Track your numbers." />
        <main className="my-wall-page">
          <p className="my-wall-page__loading">Loading...</p>
        </main>
      </AppShell>
    )
  }

  // Always show the hub — whether you have walls or not.
  // First-time users see the welcome placemat + empty identity row + build CTA.
  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} title="MY WALLS" tagline="Track your numbers." />
      <main className="my-wall-page">
        <MyWallsHub />
      </main>
      <AppFooter />
    </AppShell>
  )
}
