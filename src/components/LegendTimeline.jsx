import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import './LegendTimeline.css'

// ─── Brady Career Eras ──────────────────────────────────────────────────────
// Narrative chapters that give the timeline structure and story.

const BRADY_ERAS = [
  { id: 'origin',    label: 'The Origin',       seasons: [2000],             tagline: '6th round. 199th pick.' },
  { id: 'upset',     label: 'The Upset',        seasons: [2001],             tagline: 'Nobody believed.' },
  { id: 'dynasty',   label: 'Dynasty',          seasons: [2002, 2003, 2004], tagline: '3 rings in 4 years.' },
  { id: 'hunt',      label: 'The Hunt',         seasons: [2005, 2006, 2007], tagline: 'Chasing perfection.' },
  { id: 'dark',      label: 'The Void',         seasons: [2008, 2009, 2010], tagline: 'ACL. Torn down. Built back.' },
  { id: 'rise',      label: 'The Second Rise',  seasons: [2011, 2012, 2013], tagline: 'Back to the mountaintop.' },
  { id: 'defiance',  label: 'Defiance',         seasons: [2014, 2015, 2016], tagline: 'Suspended. Doubted. 28-3.' },
  { id: 'twilight',  label: 'Twilight',         seasons: [2017, 2018, 2019], tagline: 'The last Patriot years.' },
  { id: 'tampa',     label: 'Tampa',            seasons: [2020, 2021, 2022], tagline: 'Ring seven. New coast.' },
]

function getErasForGames(games) {
  return BRADY_ERAS.map(era => {
    const eraGames = games.filter(g => era.seasons.includes(g.season))
    if (eraGames.length === 0) return null

    const playedGames = eraGames.filter(g => !g.is_bye && !g.is_dnp)
    const avgGlow = playedGames.length > 0
      ? playedGames.reduce((s, g) => s + (g.glow_score || 0), 0) / playedGames.length
      : 0
    const maxGlow = playedGames.length > 0
      ? Math.max(...playedGames.map(g => g.glow_score || 0))
      : 0
    const hasSacred = eraGames.some(g => g.moments?.some(m => m.use_sacred_color))
    const wins = playedGames.filter(g => g.result === 'W').length
    const losses = playedGames.filter(g => g.result === 'L').length
    const moments = eraGames.flatMap(g => (g.moments || []).map(m => ({ ...m, game: g })))
    const seasonRange = era.seasons.length === 1
      ? String(era.seasons[0])
      : `${era.seasons[0]}–${era.seasons[era.seasons.length - 1]}`

    return {
      ...era,
      games: eraGames,
      avgGlow,
      maxGlow,
      hasSacred,
      wins,
      losses,
      moments,
      seasonRange,
      gameCount: playedGames.length,
    }
  }).filter(Boolean)
}


// ─── Gem Color Palette ──────────────────────────────────────────────────────
// Cool sapphire base → warm amber → sacred gold.
// Like a gemstone in shadow catching light.

function glowToColor(score) {
  const linear = (score + 10) / 20
  const t = Math.pow(linear, 1.6)

  // Gem palette: deep indigo base → teal → amber → gold
  const stops = [
    { t: 0.00, r: 8,   g: 10,  b: 20  },  // void indigo
    { t: 0.10, r: 14,  g: 16,  b: 32  },  // deep sapphire
    { t: 0.22, r: 20,  g: 28,  b: 48  },  // midnight blue
    { t: 0.34, r: 30,  g: 40,  b: 58  },  // slate blue
    { t: 0.46, r: 52,  g: 50,  b: 55  },  // cool grey — transition
    { t: 0.56, r: 90,  g: 60,  b: 35  },  // first warmth
    { t: 0.66, r: 145, g: 82,  b: 28  },  // amber
    { t: 0.76, r: 200, g: 120, b: 40  },  // warm amber
    { t: 0.85, r: 232, g: 164, b: 50  },  // golden
    { t: 0.93, r: 250, g: 210, b: 80  },  // bright gold
    { t: 1.00, r: 255, g: 235, b: 140 },  // sacred gold
  ]

  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }

  const range = hi.t - lo.t || 1
  const f = (t - lo.t) / range
  const r = Math.round(lo.r + (hi.r - lo.r) * f)
  const g = Math.round(lo.g + (hi.g - lo.g) * f)
  const b = Math.round(lo.b + (hi.b - lo.b) * f)

  return { r, g, b }
}

function colorToCSS({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`
}


// ─── Gaussian Smoothing ─────────────────────────────────────────────────────

function smoothGlowScores(games, radius = 3) {
  const n = games.length
  const raw = games.map(g => g.glow_score || 0)
  const smoothed = new Float64Array(n)

  const sigma = radius / 2
  const kernel = []
  for (let k = -radius; k <= radius; k++) {
    kernel.push(Math.exp(-(k * k) / (2 * sigma * sigma)))
  }

  for (let i = 0; i < n; i++) {
    if (games[i].is_dnp) { smoothed[i] = raw[i]; continue }

    let sum = 0, wSum = 0
    for (let k = -radius; k <= radius; k++) {
      const j = i + k
      if (j < 0 || j >= n) continue
      if (games[j].is_dnp && k !== 0) continue
      const w = kernel[k + radius]
      sum += raw[j] * w
      wSum += w
    }
    let value = wSum > 0 ? sum / wSum : raw[i]
    if (games[i].moments?.length > 0) {
      value = value * 0.4 + raw[i] * 0.6  // moments resist smoothing more
    }
    smoothed[i] = value
  }
  return smoothed
}


// ─── Era Canvas Renderer ────────────────────────────────────────────────────
// Draws the waveform for a single era's games into a canvas.

function drawEraWaveform(canvas, games, hoveredIndex, breathPhase = 0, isExpanded = false) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const n = games.length
  if (n === 0 || w === 0) return

  // Clear
  ctx.clearRect(0, 0, w, h)

  const smoothed = smoothGlowScores(games, isExpanded ? 2 : 3)

  const minAmp = 0.15
  const maxAmp = 1.0
  const midY = h / 2

  // ── Dock magnification (only when expanded) ──
  const magRadius = Math.min(20, Math.floor(n * 0.3))
  const magStrength = isExpanded ? 1.6 : 1.0
  const ampBoost = isExpanded ? 0.2 : 0

  const scales = new Float64Array(n)
  let totalScale = 0
  for (let i = 0; i < n; i++) {
    let s = 1.0
    if (hoveredIndex !== null && magStrength > 1) {
      const dist = Math.abs(i - hoveredIndex)
      if (dist < magRadius) {
        const t = dist / magRadius
        s = 1.0 + (magStrength - 1.0) * 0.5 * (1 + Math.cos(Math.PI * t))
      }
    }
    scales[i] = s
    totalScale += s
  }
  const gameX = new Float64Array(n + 1)
  gameX[0] = 0
  for (let i = 0; i < n; i++) {
    gameX[i + 1] = gameX[i] + (scales[i] / totalScale) * w
  }

  function getVisuals(gameFloat) {
    const i0 = Math.min(Math.max(Math.floor(gameFloat), 0), n - 1)
    const i1 = Math.min(i0 + 1, n - 1)
    const frac = gameFloat - i0
    const glow = smoothed[i0] * (1 - frac) + smoothed[i1] * frac
    const color = glowToColor(glow)
    const normGlow = (glow + 10) / 20
    let amp = minAmp + (maxAmp - minAmp) * Math.pow(normGlow, 0.65)
    if (hoveredIndex !== null && ampBoost > 0) {
      const dist = Math.abs(gameFloat - hoveredIndex)
      if (dist < magRadius) {
        const t = dist / magRadius
        amp = Math.min(1.0, amp + ampBoost * 0.5 * (1 + Math.cos(Math.PI * t)))
      }
    }
    return { glow, color, amp }
  }

  // ── Draw waveform columns ──
  const pixelW = Math.ceil(w)
  for (let px = 0; px < pixelW; px++) {
    let lo = 0, hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (gameX[mid + 1] <= px) lo = mid + 1
      else hi = mid
    }
    const idx = lo
    const gs = gameX[idx], ge = gameX[idx + 1]
    const gw = ge - gs
    const frac = gw > 0 ? (px - gs) / gw : 0
    const gf = idx + frac

    const { color, amp } = getVisuals(gf)
    const barH = h * amp
    const y0 = midY - barH / 2

    ctx.fillStyle = colorToCSS(color)
    ctx.fillRect(px, y0, 1.5, barH)
  }

  // ── Bloom layer ──
  ctx.globalCompositeOperation = 'screen'
  for (let px = 0; px < pixelW; px += 2) {
    let lo = 0, hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (gameX[mid + 1] <= px) lo = mid + 1
      else hi = mid
    }
    const idx = lo
    const gs = gameX[idx], ge = gameX[idx + 1]
    const gw = ge - gs
    const frac = gw > 0 ? (px - gs) / gw : 0
    const gf = idx + frac

    const { glow, color, amp } = getVisuals(gf)
    if (glow < 3) continue
    const strength = ((glow - 3) / 7) * 0.25
    const barH = h * amp * 1.3
    const y0 = midY - barH / 2
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${strength})`
    ctx.fillRect(px - 1, y0, 4, barH)
  }
  ctx.globalCompositeOperation = 'source-over'

  // ── Sacred glow halos with breathing ──
  for (let i = 0; i < n; i++) {
    const game = games[i]
    if (!game.moments?.some(m => m.use_sacred_color)) continue
    const cx = (gameX[i] + gameX[i + 1]) / 2
    const radius = Math.max(w * 0.15, 40)
    const breath = 0.82 + 0.18 * Math.sin(breathPhase + i * 0.5)
    const grad = ctx.createRadialGradient(cx, midY, 0, cx, midY, radius)
    grad.addColorStop(0, `rgba(255, 235, 140, ${0.5 * breath})`)
    grad.addColorStop(0.2, `rgba(250, 210, 80, ${0.25 * breath})`)
    grad.addColorStop(0.5, `rgba(200, 120, 40, ${0.08 * breath})`)
    grad.addColorStop(1, 'rgba(200, 120, 40, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(Math.max(0, cx - radius), 0, radius * 2, h)
  }

  // ── Vignette ──
  const vg = ctx.createLinearGradient(0, 0, 0, h)
  vg.addColorStop(0, 'rgba(8, 10, 20, 0.45)')
  vg.addColorStop(0.25, 'rgba(8, 10, 20, 0)')
  vg.addColorStop(0.75, 'rgba(8, 10, 20, 0)')
  vg.addColorStop(1, 'rgba(8, 10, 20, 0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  // ── Soft blur pass ──
  ctx.filter = 'blur(1.5px)'
  ctx.globalAlpha = 0.3
  ctx.drawImage(canvas, 0, 0, w, h)
  ctx.filter = 'none'
  ctx.globalAlpha = 1.0

  // ── Hover highlight ──
  if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < n) {
    const x0 = gameX[hoveredIndex]
    const x1 = gameX[hoveredIndex + 1]
    const grad = ctx.createLinearGradient(x0, 0, x1, 0)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)')
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(x0 - 1, 0, (x1 - x0) + 2, h)
  }
}


// ─── Game Tooltip ───────────────────────────────────────────────────────────

function TimelineTooltip({ game, x, y }) {
  if (!game) return null
  const isBye = game.is_bye
  const isDNP = game.is_dnp

  return (
    <div className="timeline-tooltip" style={{ left: `${x}px`, top: `${y}px` }}>
      {isBye ? (
        <div className="timeline-tooltip__bye">Bye Week</div>
      ) : isDNP ? (
        <>
          <div className="timeline-tooltip__dnp">DID NOT PLAY</div>
          {game.dnp_reason && <div className="timeline-tooltip__reason">{game.dnp_reason}</div>}
        </>
      ) : (
        <>
          <div className="timeline-tooltip__header">
            <span className="timeline-tooltip__week">{game.week}</span>
            <span className="timeline-tooltip__type">
              {game.game_type !== 'regular' ? game.game_type.toUpperCase() : ''}
            </span>
          </div>
          <div className="timeline-tooltip__matchup">
            <span className={`timeline-tooltip__result timeline-tooltip__result--${game.result?.toLowerCase()}`}>
              {game.result}
            </span>
            {' '}{game.score}{' vs '}
            <span className="timeline-tooltip__opponent">{game.opponent}</span>
          </div>
          {game.stats?.pass_yards != null && (
            <div className="timeline-tooltip__stats">
              {game.stats.pass_yards} yds, {game.stats.pass_td || 0} TD, {game.stats.interceptions || 0} INT
              {game.stats.passer_rating ? ` — ${game.stats.passer_rating.toFixed(1)} rtg` : ''}
            </div>
          )}
          {game.moments?.length > 0 && (
            <div className="timeline-tooltip__moment">
              {game.moments[0].moment_name}
              {game.moments[0].use_sacred_color && <span className="timeline-tooltip__sacred"> ★</span>}
            </div>
          )}
        </>
      )}
      <div className="timeline-tooltip__glow">Glow: {game.glow_score?.toFixed(1)}</div>
    </div>
  )
}


// ─── Era Card Component ─────────────────────────────────────────────────────

function EraCard({ era, isExpanded, onToggle, breathPhase }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [containerWidth, setContainerWidth] = useState(0)

  const games = era.games
  const hoveredGame = hoveredIndex !== null ? games[hoveredIndex] : null

  // Resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setContainerWidth(e.contentRect.width)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerWidth) return
    drawEraWaveform(canvas, games, hoveredIndex, breathPhase, isExpanded)
  }, [games, hoveredIndex, containerWidth, breathPhase, isExpanded])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const idx = Math.floor((x / rect.width) * games.length)
    if (idx >= 0 && idx < games.length) {
      setHoveredIndex(idx)
      setTooltipPos({ x: Math.min(Math.max(x, 80), rect.width - 80), y: -8 })
    }
  }, [games.length])

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  // Era glow intensity for the container border
  const glowIntensity = (era.avgGlow + 10) / 20
  const eraColor = glowToColor(era.maxGlow)
  const borderAlpha = 0.15 + glowIntensity * 0.35

  return (
    <div
      className={`era-card ${isExpanded ? 'era-card--expanded' : ''} ${era.hasSacred ? 'era-card--sacred' : ''}`}
      style={{
        '--era-glow-r': eraColor.r,
        '--era-glow-g': eraColor.g,
        '--era-glow-b': eraColor.b,
        '--era-border-alpha': borderAlpha,
      }}
    >
      {/* Era header — always visible, clickable */}
      <button className="era-card__header" onClick={onToggle}>
        <div className="era-card__title-row">
          <h3 className="era-card__label">{era.label}</h3>
          <span className="era-card__years">{era.seasonRange}</span>
        </div>
        <p className="era-card__tagline">{era.tagline}</p>
        <div className="era-card__stats">
          <span className="era-card__record">{era.wins}–{era.losses}</span>
          <span className="era-card__games">{era.gameCount} games</span>
          {era.moments.length > 0 && (
            <span className="era-card__moment-count">
              {era.moments.length} moment{era.moments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {/* Waveform bar — compact or expanded */}
      <div className="era-card__waveform" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="era-card__canvas"
          onMouseMove={isExpanded ? handleMouseMove : undefined}
          onMouseLeave={isExpanded ? handleMouseLeave : undefined}
        />

        {/* Tooltip only in expanded view */}
        {isExpanded && hoveredGame && (
          <TimelineTooltip game={hoveredGame} x={tooltipPos.x} y={tooltipPos.y} />
        )}
      </div>

      {/* Moment badges — show in expanded view */}
      {isExpanded && era.moments.length > 0 && (
        <div className="era-card__moments">
          {era.moments.map((m, i) => (
            <span
              key={i}
              className={`era-card__moment-badge ${m.use_sacred_color ? 'era-card__moment-badge--sacred' : ''}`}
            >
              {m.moment_name}
            </span>
          ))}
        </div>
      )}

      {/* Expand indicator */}
      <div className="era-card__expand-hint">
        {isExpanded ? '▾ collapse' : '▸ game by game'}
      </div>
    </div>
  )
}


// ─── Main Component ─────────────────────────────────────────────────────────

export default function LegendTimeline({ timeline }) {
  const [expandedEra, setExpandedEra] = useState(null)
  const [breathPhase, setBreathPhase] = useState(0)
  const rafRef = useRef(null)

  const games = timeline?.games || []
  const eras = useMemo(() => getErasForGames(games), [games])

  // Global breathing animation
  useEffect(() => {
    let running = true
    function tick(time) {
      if (!running) return
      setBreathPhase((time / 2000) % (Math.PI * 2))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const handleToggle = useCallback((eraId) => {
    setExpandedEra(prev => prev === eraId ? null : eraId)
  }, [])

  if (!timeline) return null
  const draft = timeline.draft || {}

  return (
    <div className="legend-timeline">
      {/* Header */}
      <div className="legend-timeline__header">
        <div className="legend-timeline__number">
          #{timeline.player_id?.includes('brady') ? '12' : ''}
        </div>
        <div className="legend-timeline__info">
          <h1 className="legend-timeline__name">{timeline.player_name}</h1>
          <p className="legend-timeline__meta">
            {timeline.position} · {timeline.career_span} · {timeline.total_games} games
          </p>
          <p className="legend-timeline__voice">{timeline.voice_line}</p>
        </div>
        <div className="legend-timeline__draft">
          <div className="legend-timeline__draft-pick">#{draft.pick}</div>
          <div className="legend-timeline__draft-label">Rd {draft.round} · {draft.year}</div>
        </div>
      </div>

      {/* Era containers */}
      <div className="legend-timeline__eras">
        {eras.map(era => (
          <EraCard
            key={era.id}
            era={era}
            isExpanded={expandedEra === era.id}
            onToggle={() => handleToggle(era.id)}
            breathPhase={breathPhase}
          />
        ))}
      </div>

      {/* Color key */}
      <div className="legend-timeline__key">
        <div className="legend-timeline__key-gradient">
          <span className="legend-timeline__key-label">Darkness</span>
          <div className="legend-timeline__key-bar" />
          <span className="legend-timeline__key-label">Sacred Gold</span>
        </div>
      </div>
    </div>
  )
}
