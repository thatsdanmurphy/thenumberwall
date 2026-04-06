import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Trophy, Star, Zap, HeartCrack, Cross, Circle } from 'lucide-react'
import './LegendTimeline.css'

// ─── Brady Career Eras (overlaid chapter labels, not hard boundaries) ───────

const BRADY_ERAS = [
  { id: 'origin',   label: 'The Origin',      seasons: [2000],             tagline: '6th round. 199th pick.' },
  { id: 'upset',    label: 'The Upset',       seasons: [2001],             tagline: 'Nobody believed.' },
  { id: 'dynasty',  label: 'Dynasty',         seasons: [2002, 2003, 2004], tagline: '3 rings in 4 years.' },
  { id: 'hunt',     label: 'The Hunt',        seasons: [2005, 2006, 2007], tagline: 'Chasing perfection.' },
  { id: 'dark',     label: 'The Void',        seasons: [2008, 2009, 2010], tagline: 'ACL. Torn down. Built back.' },
  { id: 'rise',     label: 'Second Rise',     seasons: [2011, 2012, 2013], tagline: 'Back to the mountaintop.' },
  { id: 'defiance', label: 'Defiance',        seasons: [2014, 2015, 2016], tagline: 'Suspended. Doubted. 28-3.' },
  { id: 'twilight', label: 'Twilight',        seasons: [2017, 2018, 2019], tagline: 'The last Patriot years.' },
  { id: 'tampa',    label: 'Tampa',           seasons: [2020, 2021, 2022], tagline: 'Ring seven. New coast.' },
]

function buildEras(games) {
  let offset = 0
  return BRADY_ERAS.map(era => {
    const eraGames = games.filter(g => era.seasons.includes(g.season))
    if (eraGames.length === 0) return null
    const start = offset
    offset += eraGames.length
    return { ...era, startIdx: start, endIdx: offset, gameCount: eraGames.length }
  }).filter(Boolean)
}


// ─── Gem Palette — extreme contrast ─────────────────────────────────────────
// Deep indigo void → rich sapphire → warm amber → blazing white-gold.
// The dark end is DEEP. The bright end BURNS.

function glowToColor(score) {
  const linear = (score + 10) / 20
  const t = Math.pow(linear, 1.8)

  const stops = [
    { t: 0.00, r: 3,   g: 3,   b: 12  },  // absolute void
    { t: 0.06, r: 6,   g: 8,   b: 22  },  // near-black
    { t: 0.14, r: 10,  g: 16,  b: 38  },  // deep indigo
    { t: 0.24, r: 16,  g: 24,  b: 52  },  // midnight sapphire
    { t: 0.34, r: 24,  g: 32,  b: 56  },  // slate
    { t: 0.44, r: 48,  g: 38,  b: 42  },  // crossing point
    { t: 0.54, r: 100, g: 55,  b: 18  },  // first ember
    { t: 0.64, r: 170, g: 90,  b: 15  },  // amber
    { t: 0.74, r: 230, g: 140, b: 25  },  // hot gold
    { t: 0.83, r: 255, g: 195, b: 45  },  // blazing
    { t: 0.91, r: 255, g: 230, b: 100 },  // bright gold
    { t: 0.96, r: 255, g: 245, b: 160 },  // sacred
    { t: 1.00, r: 255, g: 252, b: 220 },  // white-gold
  ]

  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lo = stops[i]; hi = stops[i + 1]; break
    }
  }
  const range = hi.t - lo.t || 1
  const f = (t - lo.t) / range
  return {
    r: Math.round(lo.r + (hi.r - lo.r) * f),
    g: Math.round(lo.g + (hi.g - lo.g) * f),
    b: Math.round(lo.b + (hi.b - lo.b) * f),
  }
}

function colorToCSS({ r, g, b }) { return `rgb(${r}, ${g}, ${b})` }


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
      if (j < 0 || j >= n || (games[j].is_dnp && k !== 0)) continue
      sum += raw[j] * kernel[k + radius]
      wSum += kernel[k + radius]
    }
    let v = wSum > 0 ? sum / wSum : raw[i]
    // Moments resist smoothing heavily — they should spike
    if (games[i].moments?.length > 0) v = v * 0.25 + raw[i] * 0.75
    smoothed[i] = v
  }
  return smoothed
}


// ─── The One Bar — Canvas Renderer ──────────────────────────────────────────

// Returns gameX positions array for icon overlay positioning
function drawTimeline(canvas, games, hoveredIndex, breathPhase, shimmerPhase) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width, h = rect.height, n = games.length
  if (n === 0 || w === 0) return

  // Deep void background
  ctx.fillStyle = 'rgb(3, 3, 12)'
  ctx.fillRect(0, 0, w, h)

  const smoothed = smoothGlowScores(games, 3)
  const midY = h / 2
  const minAmp = 0.08  // really thin for void games
  const maxAmp = 1.0

  // ── Gravitational weight: moments are physically wider in the bar ──
  // Sacred moments get 5x width. Strong negative moments get 3x.
  // This creates a visual "pull" — they take up more space.
  const magRadius = Math.min(25, Math.floor(n * 0.08))
  const magStrength = 1.6
  const scales = new Float64Array(n)
  let totalScale = 0
  for (let i = 0; i < n; i++) {
    let s = 1.0
    // Permanent gravitational weight for moments
    const mom = games[i].moments
    if (mom?.length > 0) {
      const isSacred = mom.some(m => m.use_sacred_color)
      const maxAbs = Math.max(...mom.map(m => Math.abs(m.intensity || 0)))
      if (isSacred) {
        s = 5.0  // sacred moments are massive
      } else if (maxAbs >= 7) {
        s = 3.5  // big heartbreaks/injuries
      } else if (maxAbs >= 3) {
        s = 2.0  // notable moments
      }
    }
    // Dock magnification on hover (additive)
    if (hoveredIndex !== null) {
      const dist = Math.abs(i - hoveredIndex)
      if (dist < magRadius) {
        s += (magStrength - 1.0) * 0.5 * (1 + Math.cos(Math.PI * dist / magRadius))
      }
    }
    scales[i] = s; totalScale += s
  }
  const gameX = new Float64Array(n + 1)
  gameX[0] = 0
  for (let i = 0; i < n; i++) gameX[i + 1] = gameX[i] + (scales[i] / totalScale) * w

  // ── Helper: get visuals for fractional game position ──
  function vis(gf) {
    const i0 = Math.min(Math.max(Math.floor(gf), 0), n - 1)
    const i1 = Math.min(i0 + 1, n - 1)
    const frac = gf - i0
    const glow = smoothed[i0] * (1 - frac) + smoothed[i1] * frac
    const color = glowToColor(glow)
    const norm = (glow + 10) / 20
    let amp = minAmp + (maxAmp - minAmp) * Math.pow(norm, 0.55)
    // Dock amp boost
    if (hoveredIndex !== null) {
      const dist = Math.abs(gf - hoveredIndex)
      if (dist < magRadius) {
        amp = Math.min(1.0, amp + 0.18 * 0.5 * (1 + Math.cos(Math.PI * dist / magRadius)))
      }
    }
    return { glow, color, amp }
  }

  // ── Pass 1: Main waveform ──
  const pixelW = Math.ceil(w)
  for (let px = 0; px < pixelW; px++) {
    // Binary search pixel → game
    let lo = 0, hi = n - 1
    while (lo < hi) { const m = (lo + hi) >> 1; if (gameX[m + 1] <= px) lo = m + 1; else hi = m }
    const idx = lo, gs = gameX[idx], ge = gameX[idx + 1], gw = ge - gs
    const gf = idx + (gw > 0 ? (px - gs) / gw : 0)

    const { color, amp } = vis(gf)
    const barH = h * amp
    const y0 = midY - barH / 2

    // Vertical gradient within each column — brighter center, darker edges
    const grad = ctx.createLinearGradient(0, y0, 0, y0 + barH)
    const { r, g, b } = color
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`)
    grad.addColorStop(0.35, `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 15)}, ${Math.min(255, b + 10)}, 1)`)
    grad.addColorStop(0.5, `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 10)}, 1)`)
    grad.addColorStop(0.65, `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 15)}, ${Math.min(255, b + 10)}, 1)`)
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.5)`)
    ctx.fillStyle = grad
    ctx.fillRect(px, y0, 1.5, barH)
  }

  // ── Pass 2: Bloom (additive glow for bright games) ──
  ctx.globalCompositeOperation = 'screen'
  for (let px = 0; px < pixelW; px += 2) {
    let lo = 0, hi = n - 1
    while (lo < hi) { const m = (lo + hi) >> 1; if (gameX[m + 1] <= px) lo = m + 1; else hi = m }
    const idx = lo, gs = gameX[idx], ge = gameX[idx + 1], gw = ge - gs
    const gf = idx + (gw > 0 ? (px - gs) / gw : 0)
    const { glow, color, amp } = vis(gf)
    if (glow < 2) continue
    const str = ((glow - 2) / 8) * 0.3
    const barH = h * amp * 1.4
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${str})`
    ctx.fillRect(px - 2, midY - barH / 2, 5, barH)
  }
  ctx.globalCompositeOperation = 'source-over'

  // ── Pass 3: Sacred moment SUNBURSTS ──
  // These should be unmistakable. Super Bowl wins BURN.
  for (let i = 0; i < n; i++) {
    if (!games[i].moments?.some(m => m.use_sacred_color)) continue
    const cx = (gameX[i] + gameX[i + 1]) / 2
    const breath = 0.7 + 0.3 * Math.sin(breathPhase + i * 0.5)

    // Layer 1: Massive outer glow — floods surrounding area with warmth
    const floodR = Math.max(w * 0.14, 90)
    const flood = ctx.createRadialGradient(cx, midY, 0, cx, midY, floodR)
    flood.addColorStop(0, `rgba(255, 245, 180, ${0.55 * breath})`)
    flood.addColorStop(0.1, `rgba(255, 230, 100, ${0.45 * breath})`)
    flood.addColorStop(0.25, `rgba(255, 195, 45, ${0.25 * breath})`)
    flood.addColorStop(0.5, `rgba(230, 140, 25, ${0.1 * breath})`)
    flood.addColorStop(0.75, `rgba(170, 90, 15, ${0.03 * breath})`)
    flood.addColorStop(1, 'rgba(100, 55, 10, 0)')
    ctx.fillStyle = flood
    ctx.fillRect(Math.max(0, cx - floodR), 0, floodR * 2, h)

    // Layer 2: Hot core — near-white center
    const coreR = Math.max(w * 0.025, 14)
    const core = ctx.createRadialGradient(cx, midY, 0, cx, midY, coreR)
    core.addColorStop(0, `rgba(255, 255, 250, ${0.9 * breath})`)
    core.addColorStop(0.3, `rgba(255, 250, 200, ${0.7 * breath})`)
    core.addColorStop(0.6, `rgba(255, 230, 100, ${0.4 * breath})`)
    core.addColorStop(1, 'rgba(255, 195, 45, 0)')
    ctx.fillStyle = core
    ctx.fillRect(cx - coreR, midY - coreR, coreR * 2, coreR * 2)

    // Layer 3: Vertical light rays — sacred moments pierce the bar top to bottom
    ctx.globalCompositeOperation = 'screen'
    const rayW = 6
    const rayGrad = ctx.createLinearGradient(0, 0, 0, h)
    rayGrad.addColorStop(0, `rgba(255, 248, 200, ${0.35 * breath})`)
    rayGrad.addColorStop(0.15, `rgba(255, 240, 160, ${0.15 * breath})`)
    rayGrad.addColorStop(0.4, `rgba(255, 240, 160, ${0.05 * breath})`)
    rayGrad.addColorStop(0.5, `rgba(255, 255, 240, ${0.5 * breath})`)
    rayGrad.addColorStop(0.6, `rgba(255, 240, 160, ${0.05 * breath})`)
    rayGrad.addColorStop(0.85, `rgba(255, 240, 160, ${0.15 * breath})`)
    rayGrad.addColorStop(1, `rgba(255, 248, 200, ${0.35 * breath})`)
    ctx.fillStyle = rayGrad
    ctx.fillRect(cx - rayW / 2, 0, rayW, h)

    // Layer 4: Secondary thin rays for sparkle
    const rayW2 = 2
    ctx.fillRect(cx - rayW2 / 2 - 4, 0, rayW2, h)
    ctx.fillRect(cx - rayW2 / 2 + 4, 0, rayW2, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── Pass 3b: Positive (non-sacred) moment highlights ──
  for (let i = 0; i < n; i++) {
    if (!games[i].moments?.length) continue
    if (games[i].moments.some(m => m.use_sacred_color)) continue  // handled above
    const maxInt = Math.max(...games[i].moments.map(m => m.intensity || 0))
    if (maxInt <= 0) continue
    const cx = (gameX[i] + gameX[i + 1]) / 2
    const glowR = Math.max(w * 0.04, 25)
    const alpha = (maxInt / 10) * 0.35
    const grad = ctx.createRadialGradient(cx, midY, 0, cx, midY, glowR)
    grad.addColorStop(0, `rgba(255, 230, 100, ${alpha})`)
    grad.addColorStop(0.5, `rgba(230, 140, 25, ${alpha * 0.3})`)
    grad.addColorStop(1, 'rgba(170, 90, 15, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(cx - glowR, 0, glowR * 2, h)
  }

  // ── Pass 4: Negative moment CRATERS ──
  // Heartbreak and injury should punch genuine holes in the bar.
  for (let i = 0; i < n; i++) {
    if (!games[i].moments?.length) continue
    const minInt = Math.min(...games[i].moments.map(m => m.intensity || 0))
    if (minInt >= 0) continue
    const cx = (gameX[i] + gameX[i + 1]) / 2
    const severity = Math.abs(minInt) / 10  // 0..1

    // Wide void wash — eats surrounding light
    const voidR = Math.max(w * 0.06 * severity, 30)
    const voidGrad = ctx.createRadialGradient(cx, midY, 0, cx, midY, voidR)
    voidGrad.addColorStop(0, `rgba(0, 0, 4, ${0.9 * severity})`)
    voidGrad.addColorStop(0.3, `rgba(2, 2, 10, ${0.6 * severity})`)
    voidGrad.addColorStop(0.6, `rgba(3, 3, 12, ${0.3 * severity})`)
    voidGrad.addColorStop(1, 'rgba(3, 3, 12, 0)')
    ctx.fillStyle = voidGrad
    ctx.fillRect(cx - voidR, 0, voidR * 2, h)

    // Dark vertical crack for severe moments (Helmet Catch, ACL)
    if (severity > 0.7) {
      const crackW = 3
      const crackGrad = ctx.createLinearGradient(0, 0, 0, h)
      crackGrad.addColorStop(0, `rgba(0, 0, 4, ${0.5 * severity})`)
      crackGrad.addColorStop(0.3, `rgba(0, 0, 4, ${0.15 * severity})`)
      crackGrad.addColorStop(0.5, `rgba(0, 0, 4, ${0.7 * severity})`)
      crackGrad.addColorStop(0.7, `rgba(0, 0, 4, ${0.15 * severity})`)
      crackGrad.addColorStop(1, `rgba(0, 0, 4, ${0.5 * severity})`)
      ctx.fillStyle = crackGrad
      ctx.fillRect(cx - crackW / 2, 0, crackW, h)
    }
  }

  // ── Pass 5: Ambient shimmer — slow light scan across the bar ──
  const shimmerX = ((shimmerPhase % 1) * (w + 200)) - 100
  const shimmerW = 120
  const shimmerGrad = ctx.createLinearGradient(shimmerX, 0, shimmerX + shimmerW, 0)
  shimmerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
  shimmerGrad.addColorStop(0.4, 'rgba(255, 245, 200, 0.02)')
  shimmerGrad.addColorStop(0.5, 'rgba(255, 245, 200, 0.04)')
  shimmerGrad.addColorStop(0.6, 'rgba(255, 245, 200, 0.02)')
  shimmerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = shimmerGrad
  ctx.fillRect(shimmerX, 0, shimmerW, h)

  // ── Vignette ──
  const vg = ctx.createLinearGradient(0, 0, 0, h)
  vg.addColorStop(0, 'rgba(3, 3, 12, 0.55)')
  vg.addColorStop(0.2, 'rgba(3, 3, 12, 0)')
  vg.addColorStop(0.8, 'rgba(3, 3, 12, 0)')
  vg.addColorStop(1, 'rgba(3, 3, 12, 0.55)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  // ── Soft blur pass ──
  ctx.filter = 'blur(1px)'
  ctx.globalAlpha = 0.2
  ctx.drawImage(canvas, 0, 0, w, h)
  ctx.filter = 'none'
  ctx.globalAlpha = 1.0

  // ── Hover glow ──
  if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < n) {
    const x0 = gameX[hoveredIndex], x1 = gameX[hoveredIndex + 1]
    const gw = x1 - x0
    // Soft white glow
    const hg = ctx.createRadialGradient(x0 + gw / 2, midY, 0, x0 + gw / 2, midY, Math.max(gw * 2, 12))
    hg.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
    hg.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)')
    hg.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = hg
    ctx.fillRect(x0 - gw * 2, 0, gw * 5, h)
  }

  return gameX
}


// ─── Tooltip ────────────────────────────────────────────────────────────────

function TimelineTooltip({ game, x, y, pinned }) {
  if (!game) return null
  return (
    <div className={`timeline-tooltip ${pinned ? 'timeline-tooltip--pinned' : ''}`} style={{ left: `${x}px`, top: `${y}px` }}>
      {game.is_bye ? (
        <div className="timeline-tooltip__bye">Bye Week</div>
      ) : game.is_dnp ? (
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


// ─── Main Component ─────────────────────────────────────────────────────────

// ─── Moment icon mapping ────────────────────────────────────────────────────

function getMomentIcon(moment) {
  const size = 14
  const strokeWidth = 1.5
  if (moment.use_sacred_color) return <Trophy size={size} strokeWidth={strokeWidth} />
  switch (moment.moment_type) {
    case 'injury': return <Cross size={size} strokeWidth={strokeWidth} />
    case 'heartbreak': return <HeartCrack size={size} strokeWidth={strokeWidth} />
    case 'controversy': return <Zap size={size} strokeWidth={strokeWidth} />
    case 'origin': return <Star size={size} strokeWidth={strokeWidth} />
    default: return moment.intensity > 0
      ? <Star size={size} strokeWidth={strokeWidth} />
      : <Circle size={size} strokeWidth={strokeWidth} />
  }
}


export default function LegendTimeline({ timeline }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [pinnedIndex, setPinnedIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [containerWidth, setContainerWidth] = useState(0)
  const [breathPhase, setBreathPhase] = useState(0)
  const [shimmerPhase, setShimmerPhase] = useState(0)
  const [gamePositions, setGamePositions] = useState(null)

  const games = timeline?.games || []
  const eras = useMemo(() => buildEras(games), [games])

  // Build moment markers list with collision-avoidance tiers
  const momentMarkers = useMemo(() => {
    const markers = []
    games.forEach((g, i) => {
      if (g.moments?.length > 0) {
        const primary = g.moments[0]
        markers.push({
          gameIdx: i,
          icon: getMomentIcon(primary),
          label: primary.moment_name,
          isSacred: !!primary.use_sacred_color,
          isNegative: primary.intensity < 0,
          intensity: primary.intensity,
          tier: 0,
        })
      }
    })
    return markers
  }, [games])

  // Assign tiers once we know pixel positions — avoids label overlap
  const tieredMarkers = useMemo(() => {
    if (!gamePositions || momentMarkers.length === 0) return momentMarkers
    const MIN_GAP = 100 // px minimum horizontal distance before staggering
    const placed = []
    return momentMarkers.map(m => {
      const cx = (gamePositions[m.gameIdx] + gamePositions[m.gameIdx + 1]) / 2
      // Find lowest tier that doesn't collide with already-placed markers
      let tier = 0
      for (let t = 0; t < 3; t++) {
        const conflict = placed.some(p => p.tier === t && Math.abs(p.cx - cx) < MIN_GAP)
        if (!conflict) { tier = t; break }
        tier = t + 1
      }
      const entry = { ...m, tier, cx }
      placed.push(entry)
      return entry
    })
  }, [momentMarkers, gamePositions])

  // Animation loop
  useEffect(() => {
    let running = true
    function tick(time) {
      if (!running) return
      setBreathPhase((time / 2200) % (Math.PI * 2))
      setShimmerPhase((time / 12000) % 1)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

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

  // The "active" index is pinned if set, otherwise hovered
  const activeIndex = pinnedIndex !== null ? pinnedIndex : hoveredIndex

  // Draw — captures gameX positions for icon overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerWidth) return
    const gx = drawTimeline(canvas, games, activeIndex, breathPhase, shimmerPhase)
    if (gx) setGamePositions(gx)
  }, [games, activeIndex, containerWidth, breathPhase, shimmerPhase])

  // Mouse hover on canvas — only updates if nothing is pinned
  const handleMouseMove = useCallback((e) => {
    if (pinnedIndex !== null) return  // pinned tooltip takes priority
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !gamePositions) return
    const x = e.clientX - rect.left
    const n = games.length
    let lo = 0, hi = n - 1
    while (lo < hi) {
      const m = (lo + hi) >> 1
      if (gamePositions[m + 1] <= x) lo = m + 1; else hi = m
    }
    const idx = lo
    if (idx >= 0 && idx < n) {
      setHoveredIndex(idx)
      setTooltipPos({ x: Math.min(Math.max(x, 100), rect.width - 100), y: -10 })
    }
  }, [games.length, gamePositions, pinnedIndex])

  const handleMouseLeave = useCallback(() => {
    if (pinnedIndex === null) setHoveredIndex(null)
  }, [pinnedIndex])

  // Click on canvas dismisses pin
  const handleCanvasClick = useCallback(() => {
    if (pinnedIndex !== null) setPinnedIndex(null)
  }, [pinnedIndex])

  // Click on a moment marker — pin tooltip to that game
  const handleMomentClick = useCallback((gameIdx) => {
    if (pinnedIndex === gameIdx) {
      setPinnedIndex(null)
    } else {
      setPinnedIndex(gameIdx)
      setHoveredIndex(gameIdx)
      if (gamePositions) {
        const cx = (gamePositions[gameIdx] + gamePositions[gameIdx + 1]) / 2
        const barRect = canvasRef.current?.getBoundingClientRect()
        const w = barRect?.width || 800
        setTooltipPos({ x: Math.min(Math.max(cx, 100), w - 100), y: -10 })
      }
    }
  }, [pinnedIndex, gamePositions])

  // Click on an era label — pin to the best game in that era (highest glow)
  const handleEraClick = useCallback((era) => {
    // Find the peak game in this era
    let bestIdx = era.startIdx
    let bestGlow = -Infinity
    for (let i = era.startIdx; i < era.endIdx; i++) {
      const g = games[i]?.glow_score ?? 0
      if (g > bestGlow) { bestGlow = g; bestIdx = i }
    }
    if (pinnedIndex === bestIdx) {
      setPinnedIndex(null)
    } else {
      setPinnedIndex(bestIdx)
      setHoveredIndex(bestIdx)
      if (gamePositions) {
        const cx = (gamePositions[bestIdx] + gamePositions[bestIdx + 1]) / 2
        const barRect = canvasRef.current?.getBoundingClientRect()
        const w = barRect?.width || 800
        setTooltipPos({ x: Math.min(Math.max(cx, 100), w - 100), y: -10 })
      }
    }
  }, [games, pinnedIndex, gamePositions])

  if (!timeline) return null
  const draft = timeline.draft || {}
  const activeGame = activeIndex !== null ? games[activeIndex] : null

  const activeEra = activeIndex !== null
    ? eras.find(e => activeIndex >= e.startIdx && activeIndex < e.endIdx)
    : null

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

      {/* The Bar */}
      <div className="legend-timeline__bar-wrap" ref={containerRef}>

        {/* Era labels — above the bar */}
        <div className="legend-timeline__era-labels">
          {eras.map(era => {
            const left = (era.startIdx / games.length) * 100
            const width = (era.gameCount / games.length) * 100
            const isActive = activeEra?.id === era.id
            return (
              <div
                key={era.id}
                className={`era-label ${isActive ? 'era-label--active' : ''}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onClick={() => handleEraClick(era)}
              >
                <span className="era-label__name">{era.label}</span>
                {isActive && <span className="era-label__tagline">{era.tagline}</span>}
              </div>
            )
          })}
        </div>

        {/* Canvas */}
        <div className="legend-timeline__bar">
          <canvas
            ref={canvasRef}
            className="legend-timeline__canvas"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Moment icon markers — below the bar, icons only, labels on hover/click */}
        <div className="legend-timeline__markers">
          {gamePositions && tieredMarkers.map((m, i) => {
            if (m.cx === undefined) return null
            const isPinned = pinnedIndex === m.gameIdx
            return (
              <div
                key={i}
                className={`moment-marker ${m.isSacred ? 'moment-marker--sacred' : ''} ${m.isNegative ? 'moment-marker--negative' : ''} ${isPinned ? 'moment-marker--pinned' : ''}`}
                style={{ left: `${m.cx}px` }}
                onClick={() => handleMomentClick(m.gameIdx)}
              >
                <div className="moment-marker__line" />
                <span className="moment-marker__icon">{m.icon}</span>
                <span className="moment-marker__label">{m.label}</span>
              </div>
            )
          })}
        </div>

        {/* Year labels — consolidated so narrow eras don't cram */}
        <div className="legend-timeline__years">
          {(() => {
            // Merge adjacent single-season eras into combined year ranges
            const groups = []
            let current = null
            for (const era of eras) {
              const isNarrow = era.seasons.length <= 1
              if (isNarrow && current?.isNarrow) {
                // Merge into existing group
                current.endIdx = era.endIdx
                current.seasons = [...current.seasons, ...era.seasons]
              } else {
                current = { startIdx: era.startIdx, endIdx: era.endIdx, seasons: [...era.seasons], isNarrow, id: era.id }
                groups.push(current)
              }
            }
            return groups.map(g => {
              const left = (g.startIdx / games.length) * 100
              const width = ((g.endIdx - g.startIdx) / games.length) * 100
              const yr = g.seasons.length === 1
                ? String(g.seasons[0])
                : `${g.seasons[0]}–${g.seasons[g.seasons.length - 1]}`
              return (
                <div key={g.id} className="year-tick" style={{ left: `${left}%`, width: `${width}%` }}>
                  {yr}
                </div>
              )
            })
          })()}
        </div>

        {/* Tooltip — stays visible when pinned */}
        {activeGame && (
          <TimelineTooltip game={activeGame} x={tooltipPos.x} y={tooltipPos.y} pinned={pinnedIndex !== null} />
        )}
      </div>

      {/* Key */}
      <div className="legend-timeline__key">
        <span className="legend-timeline__key-label">The quiet weeks</span>
        <div className="legend-timeline__key-bar" />
        <span className="legend-timeline__key-label">The moments that mattered</span>
      </div>
    </div>
  )
}
