import { useMemo, useState, useEffect } from 'react'
import './FieldView.css'

// ── Field position → SVG coordinate [x, y] ──────────────────────────────────
const POS_XY = {
  P:    [280, 330],
  C:    [280, 418],
  '1B': [398, 302],
  '2B': [338, 232],
  SS:   [224, 238],
  '3B': [164, 302],
  LF:   [115, 182],
  CF:   [280, 108],
  RF:   [450, 182],
}

// ── Base bag positions ────────────────────────────────────────────────────────
const BASE_XY = {
  '1B': [375, 315],
  '2B': [280, 220],
  '3B': [185, 315],
  home: [280, 412],
}

// ── Prototype lineups (prototype: pitcher from play data, rest approximated) ──
// These reflect the typical starters for this series.
const NYY_FIELD = {
  C:    { number: '20', name: 'Posada'    },
  '1B': { number: '3',  name: 'Clark'     },
  '2B': { number: '12', name: 'Cairo'     },
  SS:   { number: '2',  name: 'Jeter'     },
  '3B': { number: '13', name: 'A-Rod'     },
  LF:   { number: '55', name: 'Matsui'    },
  CF:   { number: '51', name: 'Williams'  },
  RF:   { number: '11', name: 'Sheffield' },
}

const BOS_FIELD = {
  C:    { number: '33', name: 'Varitek'  },
  '1B': { number: '15', name: 'Millar'   },
  '2B': { number: '12', name: 'Bellhorn' },
  SS:   { number: '44', name: 'Cabrera'  },
  '3B': { number: '11', name: 'Mueller'  },
  LF:   { number: '24', name: 'Ramirez'  },
  CF:   { number: '18', name: 'Damon'    },
  RF:   { number: '7',  name: 'Nixon'    },
}

// ── Team accent colors ────────────────────────────────────────────────────────
const TEAM_COLOR = {
  BOS: { fill: 'rgba(210,50,60,0.92)',   glow: '0 0 16px rgba(240,65,75,0.95), 0 0 40px rgba(200,40,50,0.60)', text: '#FFE8E8', dim: 'rgba(180,40,50,0.28)', dimText: 'rgba(255,140,145,0.65)' },
  NYY: { fill: 'rgba(18,48,105,0.92)',   glow: '0 0 16px rgba(85,125,200,0.95), 0 0 40px rgba(50,90,180,0.55)', text: '#DFF0FF', dim: 'rgba(12,35,80,0.32)',  dimText: 'rgba(140,180,230,0.65)' },
}
const OFF_STYLE = { fill: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.18)' }

// ── Where should the ball travel for this result? ─────────────────────────────
function getBallTarget(play) {
  if (!play || !play.pitcher) return null
  const { result, fielders } = play

  // No ball travel
  if (['SB','CS','DI','BK','WP','PB','NP','?'].includes(result)) return null

  // Strikeout / walk / hit-by-pitch → catcher
  if (['K','W','IW','HP'].includes(result)) return POS_XY.C

  // HR → deep center (over fence)
  if (result === 'HR') return [280, 58]

  // If we have fielder position data, use it
  if (fielders && fielders.length > 0) {
    const pos = fielders[0].pos
    if (POS_XY[pos]) return POS_XY[pos]
  }

  // Fallback
  return POS_XY.C
}

// ── Is this play an arc (fly ball) or line (grounder/liner)? ─────────────────
function isArcPlay(play) {
  const { result, fielders } = play
  if (result === 'HR') return true
  if (['D','T','OUT','SF'].includes(result) && fielders?.length > 0) {
    const pos = fielders[0].pos
    return ['LF','CF','RF'].includes(pos)
  }
  return false
}

// ── Position tile component ───────────────────────────────────────────────────
function PosTile({ x, y, number, name, team, active, appeared, isHot }) {
  if (!number) return null
  const tc = TEAM_COLOR[team]
  const fill   = active && isHot ? tc.fill : appeared ? tc.dim  : OFF_STYLE.fill
  const text   = active && isHot ? tc.text : appeared ? tc.dimText : OFF_STYLE.text
  const shadow = active && isHot ? tc.glow : 'none'

  return (
    <g className={`field-pos${active && isHot ? ' field-pos--active' : ''}`} transform={`translate(${x},${y})`}>
      {/* Glow halo */}
      {active && isHot && (
        <circle r={22} fill={tc.fill} opacity={0.22} />
      )}
      {/* Tile */}
      <circle
        r={17}
        fill={fill}
        stroke={active && isHot ? tc.text : 'rgba(255,255,255,0.12)'}
        strokeWidth={active && isHot ? 1.5 : 0.8}
        style={{ filter: active && isHot ? `drop-shadow(0 0 8px ${tc.fill})` : 'none' }}
      />
      {/* Number */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="field-pos__num"
        fill={text}
        fontSize={number.length > 2 ? 9 : 11}
        fontWeight="700"
      >
        #{number}
      </text>
    </g>
  )
}

// ── Ball component ────────────────────────────────────────────────────────────
function Ball({ x, y, visible, arc, intensity }) {
  if (!visible) return null
  const color = intensity === 'hr' || intensity === 'big' ? '#FFDD55'
    : intensity === 'k' ? '#AACCFF'
    : '#FFFFFF'
  return (
    <g
      className="field-ball"
      style={{ transform: `translate(${x}px,${y}px)` }}
    >
      <circle r={5} fill={color} opacity={0.92}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </g>
  )
}

// ── Batter tile (at plate) ────────────────────────────────────────────────────
function BatterTile({ batter, active }) {
  if (!batter) return null
  const team = batter.team
  const tc   = TEAM_COLOR[team]
  return (
    <g className={`field-pos${active ? ' field-pos--active' : ''}`} transform="translate(280,442)">
      {active && <circle r={22} fill={tc.fill} opacity={0.20} />}
      <circle
        r={17}
        fill={active ? tc.fill : 'rgba(255,255,255,0.07)'}
        stroke={active ? tc.text : 'rgba(255,255,255,0.12)'}
        strokeWidth={active ? 1.5 : 0.8}
        style={{ filter: active ? `drop-shadow(0 0 8px ${tc.fill})` : 'none' }}
      />
      <text textAnchor="middle" dominantBaseline="central"
        className="field-pos__num"
        fill={active ? tc.text : 'rgba(255,255,255,0.18)'}
        fontSize={String(batter.number).length > 2 ? 9 : 11}
        fontWeight="700"
      >
        #{batter.number}
      </text>
    </g>
  )
}

// ── Zone label ────────────────────────────────────────────────────────────────
function ZoneLabel({ x, y, label }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="field-zone-label" fill="rgba(255,255,255,0.08)" fontSize={10} letterSpacing={1}>
      {label}
    </text>
  )
}

// ── Main FieldView ────────────────────────────────────────────────────────────
export default function FieldView({ play, position, appearedNumbers }) {
  const [ballX, setBallX]       = useState(280)
  const [ballY, setBallY]       = useState(330)
  const [ballVisible, setBallVisible] = useState(false)
  const [ballArc, setBallArc]   = useState(false)

  // Animate ball on every play change
  useEffect(() => {
    if (!play || !play.pitcher) return
    const target = getBallTarget(play)
    if (!target) { setBallVisible(false); return }

    const arc = isArcPlay(play)
    // Snap to pitcher
    setBallX(280); setBallY(330)
    setBallVisible(true); setBallArc(arc)

    // Animate to target after a brief frame
    const t1 = setTimeout(() => { setBallX(target[0]); setBallY(target[1]) }, 60)
    // Hide
    const t2 = setTimeout(() => setBallVisible(false), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [position])  // eslint-disable-line

  if (!play) return null

  const battingTeam  = play.batter?.team ?? 'BOS'
  const fieldingTeam = battingTeam === 'BOS' ? 'NYY' : 'BOS'
  const lineup = fieldingTeam === 'NYY' ? NYY_FIELD : BOS_FIELD

  // Active fielder positions (from this play's fielder data)
  const activePositions = new Set(play.fielders?.map(f => f.pos) ?? [])
  // Pitcher is always "active" in terms of lighting up
  const pitcherActive = !!play.pitcher

  // Appeared numbers for the fielding team (for dim glow)
  const fieldAppearedNums = appearedNumbers[fieldingTeam] ?? new Set()

  // Build the active set from the play
  const activeFielderNums = new Set(play.fielders?.map(f => String(f.number)) ?? [])
  const pitcherNum = play.pitcher ? String(play.pitcher.number) : null

  const intensity = play.result === 'HR' ? 'hr'
    : (play.note && (play.note.includes('WALKOFF') || play.note.includes('GRAND SLAM'))) ? 'big'
    : play.result === 'K' ? 'k'
    : 'normal'

  return (
    <div className="field-view">
      <svg viewBox="0 0 560 480" className="field-view__svg" aria-label="Baseball field">

        {/* ── Filters / defs ──────────────────────────────────────────── */}
        <defs>
          <clipPath id="fv-fair">
            <path d="M 280 415 L 42 360 Q 280 28 518 360 Z" />
          </clipPath>
          <radialGradient id="fv-mound-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2E1E12" />
            <stop offset="100%" stopColor="#221510" />
          </radialGradient>
        </defs>

        {/* ── Dark canvas background ──────────────────────────────────── */}
        <rect width="560" height="480" fill="#080E0A" />

        {/* ── Outfield grass ──────────────────────────────────────────── */}
        <path
          d="M 280 415 L 42 360 Q 280 28 518 360 Z"
          fill="#0B2016"
        />

        {/* ── Outfield zone bands (subtle) ─────────────────────────────  */}
        <path d="M 280 415 L 42 360 Q 280 28 518 360 Z"
          fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"
        />

        {/* ── Foul lines ──────────────────────────────────────────────── */}
        <line x1="280" y1="415" x2="40" y2="355" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <line x1="280" y1="415" x2="520" y2="355" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />

        {/* ── Outfield fence arc ──────────────────────────────────────── */}
        <path d="M 42 360 Q 280 28 518 360" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeDasharray="4 3" />

        {/* ── Infield dirt ────────────────────────────────────────────── */}
        <circle cx="280" cy="315" r="108" fill="#221510" clipPath="url(#fv-fair)" />

        {/* ── Infield grass diamond ───────────────────────────────────── */}
        <path d="M 280 415 L 375 315 L 280 220 L 185 315 Z" fill="#0D2419" />

        {/* ── Base paths ──────────────────────────────────────────────── */}
        <line x1="280" y1="415" x2="375" y2="315" stroke="#2A1710" strokeWidth="12" />
        <line x1="375" y1="315" x2="280" y2="220" stroke="#2A1710" strokeWidth="12" />
        <line x1="280" y1="220" x2="185" y2="315" stroke="#2A1710" strokeWidth="12" />
        <line x1="185" y1="315" x2="280" y2="415" stroke="#2A1710" strokeWidth="12" />

        {/* ── Diamond outline ──────────────────────────────────────────── */}
        <path d="M 280 415 L 375 315 L 280 220 L 185 315 Z"
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* ── Pitcher's mound ─────────────────────────────────────────── */}
        <circle cx="280" cy="330" r="10" fill="url(#fv-mound-grad)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />

        {/* ── Bases ───────────────────────────────────────────────────── */}
        {[['1B',375,315],['2B',280,220],['3B',185,315]].map(([b,bx,by]) => (
          <rect key={b} x={bx-5} y={by-5} width={10} height={10}
            fill="rgba(255,255,255,0.50)" transform={`rotate(45,${bx},${by})`}
            rx="1"
          />
        ))}
        {/* Home plate */}
        <polygon points="280,418 286,412 286,406 274,406 274,412"
          fill="rgba(255,255,255,0.60)" />

        {/* ── Zone labels ─────────────────────────────────────────────── */}
        <ZoneLabel x={115} y={250} label="LF" />
        <ZoneLabel x={280} y={168} label="CF" />
        <ZoneLabel x={450} y={250} label="RF" />
        <ZoneLabel x={210} y={300} label="3B" />
        <ZoneLabel x={350} y={300} label="1B" />
        <ZoneLabel x={240} y={260} label="SS" />
        <ZoneLabel x={320} y={258} label="2B" />

        {/* ── Fielder position tiles ───────────────────────────────────── */}
        {/* Pitcher */}
        {play.pitcher && (
          <PosTile
            x={POS_XY.P[0]} y={POS_XY.P[1]}
            number={play.pitcher.number}
            name={play.pitcher.name}
            team={fieldingTeam}
            active={pitcherActive}
            appeared={fieldAppearedNums.has(pitcherNum)}
            isHot={pitcherActive}
          />
        )}

        {/* Other 8 fielding positions */}
        {Object.entries(lineup).map(([pos, player]) => {
          const [px, py] = POS_XY[pos] ?? [0, 0]
          const isActive  = activePositions.has(pos)
          const appeared  = fieldAppearedNums.has(player.number)
          return (
            <PosTile
              key={pos}
              x={px} y={py}
              number={player.number}
              name={player.name}
              team={fieldingTeam}
              active={isActive}
              appeared={appeared}
              isHot={isActive}
            />
          )
        })}

        {/* ── Batter tile ──────────────────────────────────────────────── */}
        <BatterTile batter={play.batter} active={true} />

        {/* ── Ball ────────────────────────────────────────────────────── */}
        <Ball
          x={ballX} y={ballY}
          visible={ballVisible}
          arc={ballArc}
          intensity={intensity}
        />

        {/* ── HR arc path (shown while ball is in HR play) ─────────────  */}
        {ballVisible && play.result === 'HR' && (
          <path
            d={`M 280 330 Q 370 100 ${ballX} ${ballY}`}
            fill="none"
            stroke="rgba(255,221,85,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

      </svg>

      {/* ── Play caption ─────────────────────────────────────────────── */}
      <div className="field-view__caption">
        <span className="field-view__batter">
          #{play.batter?.number} {play.batter?.name}
        </span>
        {play.pitcher && (
          <>
            <span className="field-view__sep">vs</span>
            <span className="field-view__pitcher">
              #{play.pitcher.number} {play.pitcher.name}
            </span>
          </>
        )}
        {play.resultText && (
          <span className="field-view__result">{play.resultText}</span>
        )}
      </div>
    </div>
  )
}
