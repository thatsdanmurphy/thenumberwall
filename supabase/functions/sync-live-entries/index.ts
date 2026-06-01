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

// ── NHL ───────────────────────────────────────────────────────────────────────

async function syncNHL(entry: Record<string, unknown>): Promise<Record<string, unknown>> {
  const playerId = entry.sport_player_id as string
  const team     = entry.team as string

  const [playerData, scoreData] = await Promise.all([
    fetchJSON(`https://api-web.nhle.com/v1/player/${playerId}/landing`),
    fetchJSON('https://api-web.nhle.com/v1/score/now'),
  ])

  // Series points from playoff totals
  const playoffTotals = (playerData.seasonTotals ?? [])
    .find((s: Record<string, unknown>) => s.gameTypeId === 3)
  const currentStat = playoffTotals?.points ?? entry.current_stat ?? null

  // Tonight's stats from most recent game
  const latestGame = (playerData.last5Games ?? [])[0]
  const tonightStat = latestGame
    ? `${latestGame.goals}G, ${latestGame.assists}A tonight`
    : null

  // Find today's game for this team
  const todayGame = (scoreData.games ?? []).find((g: Record<string, unknown>) => {
    const home = (g.homeTeam as Record<string, unknown>)?.abbrev
    const away = (g.awayTeam as Record<string, unknown>)?.abbrev
    return home === team || away === team
  })

  if (!todayGame) return { current_stat: currentStat, tonight_stat: tonightStat }

  const home   = todayGame.homeTeam as Record<string, unknown>
  const away   = todayGame.awayTeam as Record<string, unknown>
  const state  = todayGame.gameState as string
  const isLive = state === 'LIVE' || state === 'CRIT'
  const isFinal = state === 'FINAL' || state === 'OFF'
  const pd     = todayGame.periodDescriptor as Record<string, unknown> | null

  return {
    current_stat:  currentStat,
    tonight_stat:  tonightStat,
    home_team:     home.abbrev,
    away_team:     away.abbrev,
    home_score:    home.score ?? 0,
    away_score:    away.score ?? 0,
    period:        isLive ? ordinal(pd?.number as number) : isFinal ? 'Final' : null,
    game_status:   isLive ? 'live' : isFinal ? 'final' : 'upcoming',
    game_date:     'Tonight',
    game_time:     todayGame.startTimeUTC
      ? formatETTime(todayGame.startTimeUTC as string) : null,
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

  if (!todayGame) return { current_stat: currentStat, tonight_stat: tonightStat }

  const home   = todayGame.homeTeam as Record<string, unknown>
  const away   = todayGame.awayTeam as Record<string, unknown>
  const status = Number(todayGame.gameStatus)  // 1=pre, 2=live, 3=final

  return {
    current_stat:  currentStat,
    tonight_stat:  tonightStat,
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
  const playerId = entry.sport_player_id as string
  const team     = entry.team as string
  const today    = new Date().toISOString().split('T')[0]

  const [statsData, schedData] = await Promise.all([
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&group=pitching&season=2026`
    ).catch(() => null),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
    ).catch(() => null),
  ])

  const seasonStat = statsData?.stats?.[0]?.splits?.[0]?.stat
  const era = seasonStat?.era ? parseFloat(seasonStat.era) : null

  const todayGame = (schedData?.dates?.[0]?.games ?? []).find((g: Record<string, unknown>) => {
    const teams = g.teams as Record<string, Record<string, Record<string, string>>>
    return teams?.home?.team?.abbreviation === team ||
           teams?.away?.team?.abbreviation === team
  })

  if (!todayGame) return { current_stat: era ?? entry.current_stat }

  const teams  = todayGame.teams as Record<string, Record<string, unknown>>
  const code   = (todayGame.status as Record<string, string>)?.abstractGameCode
  const ls     = todayGame.linescore as Record<string, unknown> | null
  const inning = ls?.currentInning as number | null
  const isTop  = ls?.isTopInning as boolean | null

  return {
    current_stat:  era ?? entry.current_stat,
    tonight_stat:  era ? `${era} ERA tonight` : null,
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

    console.log(`sync-live-entries: ${ok} synced, ${fail} failed`)
    return new Response(`OK — ${ok} synced, ${fail} failed`, { status: 200 })

  } catch (err) {
    console.error('sync-live-entries fatal:', err)
    return new Response(String(err), { status: 500 })
  }
})
