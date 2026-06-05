/**
 * sync-live-entries — Supabase Edge Function
 *
 * Runs on cron every 60s during game windows (6 PM–1 AM ET).
 * Fetches current stats from NHL, NBA, and MLB free APIs.
 * Writes updated live data back to live_entries table.
 * Supabase Realtime pushes changes to connected browsers instantly.
 *
 * Key fix: createClient is inside the handler, not at module level.
 * Env vars are only available at request time in Edge Functions.
 *
 * NHL stat tracking:
 *   - If entry.playoff_round is set, counts only points from that round
 *     (e.g., playoff_round=4 = Cup Finals only, chasing series records)
 *   - If null, counts total playoff points
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isGameWindow(): boolean {
  const utcHour = new Date().getUTCHours()
  const etHour  = (utcHour - 4 + 24) % 24  // EDT (UTC-4 in summer)
  return etHour >= 18 || etHour <= 1
}

async function fetchJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function formatETTime(utcString: string): string {
  try {
    return new Date(utcString).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }) + ' ET'
  } catch { return '' }
}

// Current NHL season string, e.g. "20252026"
// Season starts in October; use year-1 if before July
function currentNHLSeason(): string {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  const start = month >= 7 ? year : year - 1
  return `${start}${start + 1}`
}

// ── Helpers: remaining + games_ahead ─────────────────────────────────────────

// Dynamically compute remaining (target - current) so the "X to go" display
// always reflects the actual gap. Returns null if no target or lower-is-better.
function computeRemaining(
  currentStat: number | null,
  entry: Record<string, unknown>
): number | null {
  const target = entry.target as number | null
  if (target == null || currentStat == null) return null
  if (entry.lower_is_better) return null  // ERA etc — "to go" doesn't apply
  return Math.max(0, target - currentStat)
}

// Build games_ahead from NHL club schedule API response.
// Returns up to 3 upcoming games in the component's expected shape.
function buildNHLGamesAhead(
  schedData: Record<string, unknown>,
  team: string
): Record<string, unknown>[] {
  const games = (schedData.games ?? []) as Record<string, unknown>[]
  const upcoming = games
    .filter(g => (g.gameState as string) === 'FUT' || (g.gameState as string) === 'PRE')
    .slice(0, 3)

  return upcoming.map((g, i) => {
    const home = (g.homeTeam as Record<string, unknown>)?.abbrev as string
    const away = (g.awayTeam as Record<string, unknown>)?.abbrev as string
    const opponent = home === team ? away : home
    const isHome   = home === team
    const series   = g.seriesStatus as Record<string, unknown> | null
    const gameNum  = series?.gameNumberOfSeries as number | null

    // Format date: gameDate is "2026-06-06", show "Jun 6"
    const dateStr = g.gameDate as string
    let label = 'TBD'
    if (dateStr) {
      const d = new Date(dateStr + 'T12:00:00')
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return {
      id:      `g${i + 1}`,
      date:    label,
      matchup: isHome ? `vs ${opponent}` : `@ ${opponent}`,
      note:    gameNum ? `Game ${gameNum}` : null,
    }
  })
}

// ── NHL ───────────────────────────────────────────────────────────────────────

async function syncNHL(entry: Record<string, unknown>): Promise<Record<string, unknown>> {
  const playerId    = entry.sport_player_id as string
  const team        = entry.team as string
  const roundFilter = entry.playoff_round as number | null

  // Fetch in parallel: game-log (stats) + live scores + club schedule (games_ahead)
  const season = currentNHLSeason()
  const [logData, scoreData, schedData] = await Promise.all([
    fetchJSON(`https://api-web.nhle.com/v1/player/${playerId}/game-log/${season}/3`).catch(() => null),
    fetchJSON('https://api-web.nhle.com/v1/score/now'),
    fetchJSON(`https://api-web.nhle.com/v1/club-schedule/${team}/week/now`).catch(() => null),
  ])

  // ── Current stat ──────────────────────────────────────────────────────────
  let currentStat: number | null = entry.current_stat as number | null

  if (logData?.gameLog) {
    const allGames = logData.gameLog as Record<string, unknown>[]

    if (roundFilter) {
      // Filter to specific playoff round: SSSS TT RR GG (e.g., 2025030412 = round 4 game 12)
      const roundStr = String(roundFilter).padStart(2, '0')
      const roundGames = allGames.filter(g => {
        const gid = String(g.gameId)
        return gid.slice(4, 6) === '03' && gid.slice(6, 8) === roundStr
      })
      if (roundGames.length > 0) {
        currentStat = roundGames.reduce((sum: number, g: Record<string, unknown>) => {
          return sum + ((g.goals as number) || 0) + ((g.assists as number) || 0)
        }, 0)
      }
    } else {
      const totalPoints = allGames.reduce((sum: number, g: Record<string, unknown>) => {
        return sum + ((g.goals as number) || 0) + ((g.assists as number) || 0)
      }, 0)
      if (totalPoints > 0) currentStat = totalPoints
    }
  }

  // ── Tonight's stat — from most recent game-log entry ─────────────────────
  const latestGame = logData?.gameLog?.[0] as Record<string, unknown> | null
  const tonightStat = latestGame
    ? `${latestGame.goals}G, ${latestGame.assists}A tonight`
    : null

  // ── games_ahead — from club schedule ─────────────────────────────────────
  const gamesAhead = schedData ? buildNHLGamesAhead(schedData, team) : null

  // ── Live game data ────────────────────────────────────────────────────────
  const todayGame = (scoreData.games ?? []).find((g: Record<string, unknown>) => {
    const home = (g.homeTeam as Record<string, unknown>)?.abbrev
    const away = (g.awayTeam as Record<string, unknown>)?.abbrev
    return home === team || away === team
  })

  const remaining = computeRemaining(currentStat, entry)

  if (!todayGame) {
    return {
      current_stat: currentStat,
      tonight_stat: tonightStat,
      remaining,
      ...(gamesAhead?.length ? { games_ahead: gamesAhead } : {}),
    }
  }

  const home    = todayGame.homeTeam as Record<string, unknown>
  const away    = todayGame.awayTeam as Record<string, unknown>
  const state   = todayGame.gameState as string
  const isLive  = state === 'LIVE' || state === 'CRIT'
  const isFinal = state === 'FINAL' || state === 'OFF'
  const pd      = todayGame.periodDescriptor as Record<string, unknown> | null

  return {
    current_stat: currentStat,
    tonight_stat: tonightStat,
    remaining,
    home_team:    home.abbrev,
    away_team:    away.abbrev,
    home_score:   home.score ?? 0,
    away_score:   away.score ?? 0,
    period:       isLive ? ordinal(pd?.number as number) : isFinal ? 'Final' : null,
    game_status:  isLive ? 'live' : isFinal ? 'final' : 'upcoming',
    game_date:    'Tonight',
    game_time:    todayGame.startTimeUTC
      ? formatETTime(todayGame.startTimeUTC as string) : null,
    ...(gamesAhead?.length ? { games_ahead: gamesAhead } : {}),
  }
}

// ── NBA ───────────────────────────────────────────────────────────────────────

async function syncNBA(entry: Record<string, unknown>): Promise<Record<string, unknown>> {
  const playerId = entry.sport_player_id as string
  const team     = entry.team as string
  const nbaHeaders = { 'Referer': 'https://www.nba.com', 'User-Agent': 'Mozilla/5.0' }

  const [scoreData, logData] = await Promise.all([
    fetchJSON(
      'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json',
      nbaHeaders
    ).catch(() => null),
    fetchJSON(
      `https://stats.nba.com/stats/playergamelog?PlayerID=${playerId}&Season=2025-26&SeasonType=Playoffs`,
      nbaHeaders
    ).catch(() => null),
  ])

  // Series total points (sum of column index 26 = PTS across all playoff games)
  const games = logData?.resultSets?.[0]?.rowSet ?? []
  const currentStat = games.length > 0
    ? games.reduce((sum: number, g: unknown[]) => sum + (Number(g[26]) || 0), 0)
    : entry.current_stat

  const latest = games[0]
  const tonightStat = latest ? `${latest[26]} PTS tonight` : null

  const todayGame = (scoreData?.scoreboard?.games ?? []).find((g: Record<string, unknown>) => {
    const h = (g.homeTeam as Record<string, unknown>)?.teamTricode
    const a = (g.awayTeam as Record<string, unknown>)?.teamTricode
    return h === team || a === team
  })

  const remaining = computeRemaining(currentStat as number | null, entry)

  if (!todayGame) return { current_stat: currentStat, tonight_stat: tonightStat, remaining }

  const home   = todayGame.homeTeam as Record<string, unknown>
  const away   = todayGame.awayTeam as Record<string, unknown>
  const status = Number(todayGame.gameStatus)  // 1=pre, 2=live, 3=final

  return {
    current_stat:  currentStat,
    tonight_stat:  tonightStat,
    remaining,
    home_team:     home.teamTricode,
    away_team:     away.teamTricode,
    home_score:    home.score ?? 0,
    away_score:    away.score ?? 0,
    period:        status === 2 ? ordinal(Number(todayGame.period)) : status === 3 ? 'Final' : null,
    game_status:   status === 2 ? 'live' : status === 3 ? 'final' : 'upcoming',
    game_date:     'Tonight',
    game_time:     todayGame.gameTimeUTC
      ? formatETTime(todayGame.gameTimeUTC as string) : null,
  }
}

// ── MLB ───────────────────────────────────────────────────────────────────────

async function syncMLB(entry: Record<string, unknown>): Promise<Record<string, unknown>> {
  const playerId  = entry.sport_player_id as string
  const team      = entry.team as string
  const statName  = (entry.stat_name as string ?? '').toLowerCase()
  const today     = new Date().toISOString().split('T')[0]

  // Determine stat group and type from entry metadata
  // Pitching stats: ERA, WHIP, K/9. Everything else treated as hitting.
  const isPitching = ['era', 'whip', 'k/9', 'so', 'strikeouts'].some(s => statName.includes(s))
  const isCareer   = entry.lens === 'CAREER'
  const statsType  = isCareer ? 'career' : 'season'
  const group      = isPitching ? 'pitching' : 'hitting'
  const seasonParam = isCareer ? '' : `&season=2026`

  const [statsData, schedData] = await Promise.all([
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=${statsType}&group=${group}${seasonParam}`
    ).catch(() => null),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
    ).catch(() => null),
  ])

  const statSplit = statsData?.stats?.[0]?.splits?.[0]?.stat

  // Resolve current stat value based on what we're tracking
  let currentStatValue: number | null = entry.current_stat as number | null
  if (statSplit) {
    if (isPitching && statSplit.era) {
      currentStatValue = parseFloat(statSplit.era)
    } else if (!isPitching) {
      // Map common hitting stat names to API field names
      const fieldMap: Record<string, string> = {
        'home runs': 'homeRuns', 'hr': 'homeRuns', 'career hr': 'homeRuns',
        'hits': 'hits', 'rbi': 'rbi', 'stolen bases': 'stolenBases', 'sb': 'stolenBases',
        'doubles': 'doubles', 'runs': 'runs',
      }
      const field = Object.entries(fieldMap).find(([k]) => statName.includes(k))?.[1]
      if (field && statSplit[field] != null) currentStatValue = Number(statSplit[field])
    }
  }

  // Tonight's stat label
  const tonightStat = isPitching && currentStatValue != null
    ? `${currentStatValue} ERA tonight`
    : null

  const era = isPitching ? currentStatValue : null

  const todayGame = (schedData?.dates?.[0]?.games ?? []).find((g: Record<string, unknown>) => {
    const teams = g.teams as Record<string, Record<string, Record<string, string>>>
    return teams?.home?.team?.abbreviation === team ||
           teams?.away?.team?.abbreviation === team
  })

  const mlbCurrent = currentStatValue
  const remaining  = computeRemaining(mlbCurrent, entry)

  if (!todayGame) return { current_stat: mlbCurrent, remaining }

  const teams  = todayGame.teams as Record<string, Record<string, unknown>>
  const code   = (todayGame.status as Record<string, string>)?.abstractGameCode
  const ls     = todayGame.linescore as Record<string, unknown> | null
  const inning = ls?.currentInning as number | null
  const isTop  = ls?.isTopInning as boolean | null

  return {
    current_stat:  mlbCurrent,
    remaining,
    tonight_stat:  tonightStat,
    home_team:     (teams.home?.team as Record<string, string>)?.abbreviation,
    away_team:     (teams.away?.team as Record<string, string>)?.abbreviation,
    home_score:    teams.home?.score ?? 0,
    away_score:    teams.away?.score ?? 0,
    period:        code === 'I' && inning
      ? `${isTop ? 'Top' : 'Bot'} ${inning}` : code === 'F' ? 'Final' : null,
    game_status:   code === 'I' ? 'live' : code === 'F' ? 'final' : 'upcoming',
    game_date:     'Tonight',
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  try {
    // createClient MUST be inside the handler — env vars not available at module level
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!isGameWindow()) {
      return new Response('Outside game window — skipping', { status: 200 })
    }

    const { data: entries, error } = await supabase
      .from('live_entries')
      .select('*')
      .eq('active', true)
      .not('sport_player_id', 'is', null)

    if (error) throw error
    if (!entries?.length) return new Response('No active entries', { status: 200 })

    const results = await Promise.allSettled(
      entries.map(async (entry: Record<string, unknown>) => {
        let update: Record<string, unknown> = {}

        if (entry.sport === 'nhl')      update = await syncNHL(entry)
        else if (entry.sport === 'nba') update = await syncNBA(entry)
        else if (entry.sport === 'mlb') update = await syncMLB(entry)
        else return

        const { error: updateError } = await supabase
          .from('live_entries')
          .update(update)
          .eq('id', entry.id as string)

        if (updateError) throw updateError
        return entry.id
      })
    )

    const ok   = results.filter(r => r.status === 'fulfilled').length
    const fail = results.filter(r => r.status === 'rejected').length

    // Log failures for debugging
    results
      .filter(r => r.status === 'rejected')
      .forEach(r => console.error('sync failed:', (r as PromiseRejectedResult).reason))

    console.log(`sync-live-entries: ${ok} synced, ${fail} failed`)
    return new Response(`OK — ${ok} synced, ${fail} failed`, { status: 200 })

  } catch (err) {
    console.error('sync-live-entries fatal:', err)
    return new Response(String(err), { status: 500 })
  }
})
