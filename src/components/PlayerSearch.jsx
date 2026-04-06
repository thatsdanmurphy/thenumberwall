import { useState, useRef, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { wallData, bostonLegends } from '../data/index.js'
import './PlayerSearch.css'

/**
 * PlayerSearch — search TNW database or enter a custom player name.
 * Shows autocomplete results from the global + Boston datasets.
 * If no match, allows free-text entry with sport picker.
 */

// Build a flat search index from all TNW players
function buildSearchIndex() {
  const seen = new Set()
  const players = []

  for (const entry of [...wallData, ...bostonLegends]) {
    if (entry.tier === 'UNWRITTEN' || !entry.name) continue
    const key = `${entry.name}|${entry.sport}|${entry.number}`
    if (seen.has(key)) continue
    seen.add(key)
    players.push({
      name:      entry.name,
      sport:     entry.sport,
      number:    entry.number,
      tier:      entry.tier,
      team:      entry.team,
      stat:      entry.stat,
      statLabel: entry.statLabel,
      funFact:   entry.funFact,
      source:    'tnw',
    })
  }

  return players
}

const SPORTS = ['Basketball', 'Baseball', 'Hockey', 'Football', 'Soccer']

export default function PlayerSearch({ number, onPlace, onCancel, hideHeader = false }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [showCustom, setShowCustom] = useState(false)
  const [customSport, setCustomSport] = useState('')
  const inputRef = useRef(null)

  const searchIndex = useMemo(() => buildSearchIndex(), [])

  // Focus input on mount — desktop only, skip on touch devices to avoid keyboard pop
  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      inputRef.current?.focus()
    }
  }, [])

  // Search as user types
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setShowCustom(false)
      return
    }

    const q = query.toLowerCase()
    const matches = searchIndex
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 8)

    setResults(matches)
    // Show custom option after typing 3+ chars with few TNW results
    setShowCustom(query.length >= 3)
  }, [query, searchIndex])

  function handleSelectTNW(player) {
    onPlace({
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
  }

  function handleCustomPlace() {
    if (!query.trim()) return
    onPlace({
      number,
      playerName: query.trim(),
      playerId:   null,
      sport:      customSport || null,
      source:     'custom',
      infoSnap: {
        stat:      null,
        statLabel: null,
        funFact:   null,
        fallback:  true,
      },
    })
  }

  return (
    <div className="player-search">
      {!hideHeader && (
        <div className="player-search__header">
          <span className="player-search__number">#{number}</span>
          <span className="player-search__prompt">Who owns this number?</span>
        </div>
      )}

      <div className="player-search__input-row">
        <input
          ref={inputRef}
          className="player-search__input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Someone else? Search or type a name..."
          onKeyDown={e => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter' && results.length === 0 && query.length >= 2) {
              handleCustomPlace()
            }
          }}
        />
        <button className="player-search__cancel" onClick={onCancel}><X size={16} /></button>
      </div>

      {/* TNW results */}
      {results.length > 0 && (
        <ul className="player-search__results">
          {results.map((p, i) => (
            <li key={i}>
              <button
                className="player-search__result"
                onClick={() => handleSelectTNW(p)}
              >
                <span className="player-search__result-name">{p.name}</span>
                <span className="player-search__result-meta">
                  {p.sport} · #{p.number} · {p.tier}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Custom entry option */}
      {showCustom && (
        <div className="player-search__custom">
          <p className="player-search__custom-label">
            Don't see them? Add <strong>{query}</strong> to your wall.
          </p>
          <div className="player-search__sport-pills">
            {SPORTS.map(s => (
              <button
                key={s}
                className={`player-search__sport-pill ${customSport === s ? 'player-search__sport-pill--active' : ''}`}
                onClick={() => setCustomSport(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            className="player-search__place-btn"
            onClick={handleCustomPlace}
          >
            Place on wall
          </button>
        </div>
      )}
    </div>
  )
}
