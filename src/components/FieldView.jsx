import { useState, useMemo, useEffect } from 'react'
import './FieldView.css'

// ── Field geometry ────────────────────────────────────────────────────────────
const POS_XY = {
  P:    [280, 330],
  C:    [280, 452],
  '1B': [398, 302],
  '2B': [338, 232],
  SS:   [224, 238],
  '3B': [164, 302],
  LF:   [115, 182],
  CF:   [280, 108],
  RF:   [452, 182],
}

const BASE_XY = {
  '1B': [375, 315],
  '2B': [280, 220],
  '3B': [185, 315],
}

const NYY_FIELD = {
  C:    { number: '20', name: 'Jorge Posada',   pid: 'posaj001' },
  '1B': { number: '3',  name: 'Tony Clark',     pid: 'clart002' },
  '2B': { number: '12', name: 'Miguel Cairo',   pid: 'cairm001' },
  SS:   { number: '2',  name: 'Derek Jeter',    pid: 'jeted001' },
  '3B': { number: '13', name: 'Alex Rodriguez', pid: 'rodra001' },
  LF:   { number: '55', name: 'Hideki Matsui',  pid: 'matsh001' },
  CF:   { number: '51', name: 'Bernie Williams', pid: 'willb002' },
  RF:   { number: '11', name: 'Gary Sheffield', pid: 'shefg001' },
}

const BOS_FIELD = {
  C:    { number: '33', name: 'Jason Varitek',    pid: 'varij001' },
  '1B': { number: '15', name: 'Kevin Millar',     pid: 'millk005' },
  '2B': { number: '12', name: 'Mark Bellhorn',    pid: 'bellm002' },
  SS:   { number: '44', name: 'Orlando Cabrera',  pid: 'cabro001' },
  '3B': { number: '11', name: 'Bill Mueller',     pid: 'muelb001' },
  LF:   { number: '24', name: 'Manny Ramirez',    pid: 'ramim002' },
  CF:   { number: '18', name: 'Johnny Damon',     pid: 'damoj001' },
  RF:   { number: '7',  name: 'Trot Nixon',       pid: 'nixot001' },
}

// ── Heat ramps ────────────────────────────────────────────────────────────────
const RAMP = {
  BOS: [
    { fill:'rgba(255,255,255,0.06)', stroke:'rgba(255,255,255,0.10)', text:'rgba(255,255,255,0.18)', filter:'none' },
    { fill:'rgba(145,30,42,0.25)',   stroke:'rgba(185,50,62,0.38)',   text:'rgba(255,140,148,0.60)', filter:'none' },
    { fill:'rgba(185,42,55,0.50)',   stroke:'rgba(215,68,80,0.72)',   text:'rgba(255,190,196,0.85)', filter:'drop-shadow(0 0 4px rgba(210,50,62,0.50))' },
    { fill:'rgba(215,50,62,0.82)',   stroke:'rgba(245,85,98,0.95)',   text:'#FFE8EA',                filter:'drop-shadow(0 0 8px rgba(235,58,70,0.90)) drop-shadow(0 0 20px rgba(200,38,52,0.55))' },
    { fill:'rgba(240,55,68,1.0)',    stroke:'rgba(255,130,140,1.0)',  text:'#FFF0F1',                filter:'drop-shadow(0 0 12px rgba(255,70,82,1.0)) drop-shadow(0 0 30px rgba(215,42,55,0.80))' },
  ],
  NYY: [
    { fill:'rgba(255,255,255,0.06)', stroke:'rgba(255,255,255,0.10)', text:'rgba(255,255,255,0.18)', filter:'none' },
    { fill:'rgba(12,32,80,0.28)',    stroke:'rgba(48,75,148,0.38)',   text:'rgba(138,172,228,0.60)', filter:'none' },
    { fill:'rgba(14,40,100,0.52)',   stroke:'rgba(70,108,188,0.72)',  text:'rgba(190,215,255,0.85)', filter:'drop-shadow(0 0 4px rgba(55,95,185,0.50))' },
    { fill:'rgba(18,50,118,0.84)',   stroke:'rgba(100,148,235,0.95)', text:'#DFF0FF',                filter:'drop-shadow(0 0 8px rgba(82,128,215,0.90)) drop-shadow(0 0 20px rgba(45,85,180,0.55))' },
    { fill:'rgba(22,58,135,1.0)',    stroke:'rgba(130,175,255,1.0)',  text:'#EAF4FF',                filter:'drop-shadow(0 0 12px rgba(100,155,255,1.0)) drop-shadow(0 0 30px rgba(55,100,210,0.80))' },
  ],
}

function heatLevel(heatVal, isActive, intensity) {
  if (isActive && (intensity === 'big' || intensity === 'hr' || intensity === 'win')) return 4
  if (isActive) return 3
  if (heatVal >= 0.65) return 3
  if (heatVal >= 0.35) return 2
  if (heatVal >= 0.10) return 1
  return 0
}

function computePlayerHeat(plays, upToIdx) {
  const heat = {}
  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]; if (!p) break
    if (i > 0 && i % 15 === 0) {
      for (const k in heat) heat[k] = Math.max(0, heat[k] * 0.90)
    }
    const bid = p.batter?.pid
    const pid = p.pitcher?.pid
    if (bid) {
      if (!heat[bid]) heat[bid] = 0
      if      (p.result === 'HR')                  heat[bid] = Math.min(1, heat[bid] + 0.42)
      else if (p.result === 'T')                   heat[bid] = Math.min(1, heat[bid] + 0.28)
      else if (p.result === 'D')                   heat[bid] = Math.min(1, heat[bid] + 0.18)
      else if (p.result === 'S')                   heat[bid] = Math.min(1, heat[bid] + 0.11)
      else if (['W','HP','IW'].includes(p.result)) heat[bid] = Math.min(1, heat[bid] + 0.05)
      else if (p.result === 'K')                   heat[bid] = Math.max(0, heat[bid] - 0.03)
    }
    if (pid && !['SB','CS','BK','WP','PB','DI','NP'].includes(p.result)) {
      if (!heat[pid]) heat[pid] = 0
      if      (p.result === 'K')              heat[pid] = Math.min(1, heat[pid] + 0.22)
      else if (p.result === 'HR')             heat[pid] = Math.max(0, heat[pid] - 0.22)
      else if (['D','T'].includes(p.result))  heat[pid] = Math.max(0, heat[pid] - 0.12)
      else if (p.result === 'S')             heat[pid] = Math.max(0, heat[pid] - 0.06)
      else if (['W','IW'].includes(p.result)) heat[pid] = Math.max(0, heat[pid] - 0.05)
    }
  }
  return heat
}

function computeBaseState(plays, upToIdx) {
  let bases = { '1B': null, '2B': null, '3B': null }
  let outs = 0
  let lastHalf = null

  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]; if (!p || !p.batter) continue
    const hk = `${p.game}-${p.inning}-${p.half}`
    if (hk !== lastHalf) { bases = { '1B': null, '2B': null, '3B': null }; outs = 0; lastHalf = hk }
    const b = { pid: p.batter.pid, number: p.batter.number, name: p.batter.name, team: p.batter.team }

    switch (p.result) {
      case 'K': case 'OUT': outs++; break
      case 'DP': outs += 2; bases = { '1B': null, '2B': bases['3B'] ?? null, '3B': null }; break
      case 'SF': case 'SH': outs++; bases = { '1B': bases['2B'] ?? bases['1B'] ?? null, '2B': bases['3B'] ? bases['2B'] : null, '3B': null }; break
      case 'W': case 'HP': case 'IW':
        if (bases['1B'] && bases['2B']) bases['3B'] = bases['2B']
        if (bases['1B']) bases['2B'] = bases['1B']
        bases['1B'] = b; break
      case 'S': bases = { '1B': b, '2B': bases['1B'], '3B': null }; break
      case 'D': bases = { '1B': null, '2B': b, '3B': bases['1B'] ?? bases['2B'] ?? null }; break
      case 'T': bases = { '1B': null, '2B': null, '3B': b }; break
      case 'HR': bases = { '1B': null, '2B': null, '3B': null }; break
      case 'FC': case 'E':
        bases = { '1B': b, '2B': bases['1B'], '3B': bases['2B'] }
        if (p.result === 'FC') outs++; break
      case 'SB':
        if (bases['2B']) { bases['3B'] = bases['2B']; bases['2B'] = null }
        else if (bases['1B']) { bases['2B'] = bases['1B']; bases['1B'] = null }
        break
      case 'CS':
        if (bases['2B']) bases['2B'] = null
        else if (bases['1B']) bases['1B'] = null
        outs++; break
      default: break
    }
    if (outs >= 3) { bases = { '1B': null, '2B': null, '3B': null }; outs = 0 }
  }
  return bases
}

function getBallTargets(play) {
  const { result, fielders } = play
  if (!play.pitcher) return []
  if (['SB','CS','DI','BK','WP','PB','NP','?'].includes(result)) return []
  if (result === 'HR') return [[280, 46]]
  if (['K','W','IW','HP'].includes(result)) return [POS_XY.C]
  const targets = (fielders || []).map(f => POS_XY[f.pos]).filter(Boolean)
  return targets.length ? targets : [POS_XY.C]
}

function playIntensity(play) {
  if (!play) return 'normal'
  if (play.isSeriesEnd) return 'win'
  if (play.note && (play.note.includes('WALKOFF') || play.note.includes('GRAND SLAM'))) return 'big'
  if (play.result === 'HR') return 'hr'
  if (play.result === 'K')  return 'k'
  if (play.result === 'DP') return 'dp'
  if (play.result === 'SB') return 'sb'
  return 'normal'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PosTile({ x, y, number, team, pid, heatVal, isActive, intensity, r = 22, onClick, isSelected }) {
  if (!number) return null
  const lvl   = heatLevel(heatVal, isActive, intensity)
  const style = RAMP[team][lvl]
  const pulse = isActive && ['hr','big','win','dp'].includes(intensity)

  return (
    <g
      className={`fv-tile${pulse ? ' fv-tile--pulse' : ''}${onClick ? ' fv-tile--clickable' : ''}`}
      transform={`translate(${x},${y})`}
      onClick={onClick}
    >
      {lvl >= 2 && <circle r={r + 9} fill={style.fill} opacity={0.16} />}
      <circle r={r} fill={style.fill} stroke={style.stroke}
        strokeWidth={lvl >= 3 ? 1.8 : 0.9} style={{ filter: style.filter }} />
      <text textAnchor="middle" dominantBaseline="central"
        className="fv-tile__num" fill={style.text}
        fontSize={String(number).length > 2 ? 9 : 12} fontWeight="700">
        #{number}
      </text>
      {isSelected && (
        <circle r={r + 6} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.75))' }} />
      )}
    </g>
  )
}

function RunnerTile({ base, runner }) {
  if (!runner) return null
  const [x, y] = BASE_XY[base]
  const style  = RAMP[runner.team][3]
  return (
    <g className="fv-runner" transform={`translate(${x},${y})`}>
      <circle r={13} fill={style.fill} stroke={style.stroke} strokeWidth={1.2}
        style={{ filter: style.filter }} />
      <text textAnchor="middle" dominantBaseline="central"
        className="fv-tile__num" fill={style.text}
        fontSize={String(runner.number).length > 2 ? 8 : 10} fontWeight="700">
        #{runner.number}
      </text>
    </g>
  )
}

function FieldBall({ x, y, visible, color, size = 5 }) {
  if (!visible) return null
  return (
    <g className="fv-ball" style={{ transform: `translate(${x}px,${y}px)` }}>
      <circle r={size + 3} fill={color} opacity={0.20} />
      <circle r={size} fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </g>
  )
}

// ── Main FieldView — selectedTile and onTileSelect are lifted to ShowdownPage ─

export default function FieldView({ play, plays, position, selectedTile, onTileSelect }) {

  const heatMap = useMemo(() => computePlayerHeat(plays, position), [plays, position])
  const bases   = useMemo(() => computeBaseState(plays, position),  [plays, position])

  const [ball1, setBall1] = useState({ x: 280, y: 330, vis: false })
  const [ball2, setBall2] = useState({ x: 280, y: 330, vis: false })

  useEffect(() => {
    if (!play?.pitcher) { setBall1(b => ({ ...b, vis: false })); return }
    const targets = getBallTargets(play)
    if (!targets.length) { setBall1(b => ({ ...b, vis: false })); return }

    setBall1({ x: 280, y: 330, vis: true })
    setBall2(b => ({ ...b, vis: false }))
    const t1 = setTimeout(() => setBall1({ x: targets[0][0], y: targets[0][1], vis: true }), 60)

    if (targets.length > 1) {
      const t2 = setTimeout(() => setBall2({ x: targets[0][0], y: targets[0][1], vis: true }), 380)
      const t3 = setTimeout(() => setBall2({ x: targets[1][0], y: targets[1][1], vis: true }), 440)
      const t4 = setTimeout(() => { setBall1(b => ({ ...b, vis: false })); setBall2(b => ({ ...b, vis: false })) }, 950)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
    }

    const t2 = setTimeout(() => setBall1(b => ({ ...b, vis: false })), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [position]) // eslint-disable-line

  if (!play) return null

  const battingTeam  = play.batter?.team ?? 'BOS'
  const fieldingTeam = battingTeam === 'BOS' ? 'NYY' : 'BOS'
  const lineup       = fieldingTeam === 'NYY' ? NYY_FIELD : BOS_FIELD
  const intensity    = playIntensity(play)
  const activePositionSet = new Set(play.fielders?.map(f => f.pos) ?? [])

  const hrColor   = battingTeam === 'BOS' ? '#FF4D5E' : '#7AAEFF'
  const ballColor = intensity === 'hr'  ? hrColor
    : intensity === 'big'  ? hrColor
    : intensity === 'win'  ? '#FFD84A'
    : intensity === 'k'    ? '#AACCFF'
    : '#FFFFFF'
  const isHR = play.result === 'HR'

  function makeTileClick(player, pos) {
    const tile = { pid: player.pid, number: player.number, name: player.name, pos, team: player.team ?? fieldingTeam }
    return () => onTileSelect?.(selectedTile?.pid === player.pid ? null : tile)
  }

  return (
    <div className="fv-wrap">

      {/* ── Caption ─────────────────────────────────────────────────── */}
      <div className="fv-caption">
        <span className="fv-caption__batter">
          #{play.batter?.number} {play.batter?.name}
        </span>
        {play.pitcher && (
          <>
            <span className="fv-caption__sep">vs</span>
            <span className="fv-caption__pitcher">
              #{play.pitcher.number} {play.pitcher.name}
            </span>
          </>
        )}
        {play.resultText && (
          <span className="fv-caption__result">{play.resultText}</span>
        )}
        {play.note && (
          <span className="fv-caption__note">{play.note}</span>
        )}
      </div>

      {/* ── Field ───────────────────────────────────────────────────── */}
      <div className="fv-field-container">
        <svg viewBox="0 45 560 425" className="fv-svg">
          <defs>
            {/* Clips the outfield fence path for the infield circle */}
            <clipPath id="fv-fair-clip">
              <path d="M 280 416 L 40 356 Q 280 22 520 356 Z" />
            </clipPath>
            {/* Clips ALL static field elements to the viewBox (y ≥ 45)
                so the dark background rect never bleeds above the SVG box */}
            <clipPath id="fv-view-clip">
              <rect x="0" y="45" width="560" height="425" />
            </clipPath>
            <radialGradient id="fv-bg-grad" cx="50%" cy="70%" r="65%">
              <stop offset="0%" stopColor="#0E1018" />
              <stop offset="100%" stopColor="#07080D" />
            </radialGradient>
          </defs>

          {/* Static field — clipped to viewBox so nothing bleeds into caption */}
          <g clipPath="url(#fv-view-clip)">
            <rect width="560" height="470" fill="url(#fv-bg-grad)" />
            <path d="M 280 416 L 40 356 Q 280 22 520 356 Z" fill="#0C0F18" />
            <circle cx="280" cy="316" r="112" fill="#0E1120" clipPath="url(#fv-fair-clip)" />
            <path d="M 280 416 L 375 316 L 280 220 L 185 316 Z" fill="#0A0D19" />

            {[[[280,416],[375,316]],[[375,316],[280,220]],[[280,220],[185,316]],[[185,316],[280,416]]].map(([[x1,y1],[x2,y2]],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A1D2E" strokeWidth={10} />
            ))}

            <path d="M 280 416 L 375 316 L 280 220 L 185 316 Z"
              fill="none" stroke="rgba(160,185,235,0.14)" strokeWidth={1} />
            <line x1="280" y1="416" x2="38"  y2="354" stroke="rgba(160,185,235,0.16)" strokeWidth={1} />
            <line x1="280" y1="416" x2="522" y2="354" stroke="rgba(160,185,235,0.16)" strokeWidth={1} />
            <path d="M 40 356 Q 280 22 520 356"
              fill="none" stroke="rgba(160,185,235,0.22)" strokeWidth={2} strokeDasharray="5 4" />

            {[['LF',115,250],['CF',280,165],['RF',447,250]].map(([l,x,y]) => (
              <text key={l} x={x} y={y} textAnchor="middle" fill="rgba(160,185,235,0.07)"
                fontSize={9} letterSpacing={2} fontFamily="var(--font-scoreboard)">{l}</text>
            ))}

            <circle cx="280" cy="330" r="9" fill="#13162A" stroke="rgba(160,185,235,0.12)" strokeWidth={0.6} />

            {Object.entries(BASE_XY).map(([base, [bx,by]]) => (
              <rect key={base} x={bx-5} y={by-5} width={10} height={10}
                fill="rgba(210,225,255,0.55)" transform={`rotate(45,${bx},${by})`} rx={1} />
            ))}
            <polygon points="280,420 286,414 286,408 274,408 274,414"
              fill="rgba(210,225,255,0.60)" />
          </g>

          {Object.entries(bases).map(([base, runner]) => (
            <RunnerTile key={base} base={base} runner={runner} />
          ))}

          {play.pitcher && (
            <PosTile
              x={POS_XY.P[0]} y={POS_XY.P[1]}
              number={play.pitcher.number} team={fieldingTeam} pid={play.pitcher.pid}
              heatVal={heatMap[play.pitcher.pid] ?? 0} isActive={true} intensity={intensity}
              isSelected={selectedTile?.pid === play.pitcher.pid}
              onClick={makeTileClick(play.pitcher, 'P')}
            />
          )}

          {Object.entries(lineup).map(([pos, player]) => {
            const [px, py] = POS_XY[pos]
            return (
              <PosTile key={pos}
                x={px} y={py}
                number={player.number} team={fieldingTeam} pid={player.pid}
                heatVal={heatMap[player.pid] ?? 0}
                isActive={activePositionSet.has(pos)} intensity={intensity}
                isSelected={selectedTile?.pid === player.pid}
                onClick={makeTileClick(player, pos)}
              />
            )
          })}

          {play.batter && (
            <PosTile
              x={280} y={418}
              number={play.batter.number} team={battingTeam} pid={play.batter.pid}
              heatVal={heatMap[play.batter.pid] ?? 0} isActive={true} intensity={intensity} r={24}
              isSelected={selectedTile?.pid === play.batter.pid}
              onClick={makeTileClick(play.batter, play.batter.pos ?? 'DH')}
            />
          )}

          <FieldBall x={ball1.x} y={ball1.y} visible={ball1.vis} color={ballColor} size={isHR ? 6 : 5} />
          <FieldBall x={ball2.x} y={ball2.y} visible={ball2.vis} color={ballColor} size={4} />

          {ball1.vis && isHR && (
            <g key={`hr-ripple-${position}`}>
              {[0,1,2,3].map(i => (
                <circle key={i} cx={ball1.x} cy={ball1.y} r={15}
                  fill="none" stroke={hrColor} strokeWidth={2}
                  className={`fv-ripple fv-ripple--${i}`} />
              ))}
            </g>
          )}

          {intensity === 'win' && (
            <g key={`win-ripple-${position}`}>
              {[0,1,2,3].map(i => (
                <circle key={i} cx={280} cy={416} r={22}
                  fill="none" stroke="rgba(255,210,70,0.68)" strokeWidth={2.5}
                  className={`fv-ripple-win fv-ripple-win--${i}`} />
              ))}
            </g>
          )}
        </svg>
      </div>

    </div>
  )
}
