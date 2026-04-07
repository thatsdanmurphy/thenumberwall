import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { track } from '@vercel/analytics'
import { wallData, bostonLegends, globalIndex } from '../data/index.js'
import './HeroSearch.css'

/**
 * HeroSearch — unified number + name search for the homepage hero.
 *
 * Smart input: detects if the query is numeric or text.
 *   • Number → shows that number's legends as suggestions
 *   • Name   → searches player names across all datasets
 *
 * Selecting a result fires onSelect({ number, entries }) to jump
 * the WallGrid to that tile.
 */

const SPORT_ICON = {
  Basketball: '\u{1F3C0}',
  Football:   '\u{1F3C8}',
  Baseball:   '\u26BE',
  Hockey:     '\u{1F3D2}',
  Soccer:     '\u26BD',
}

function buildNameIndex() {
  const seen = new Set()
  const players = []

  for (const entry of [...wallData, ...bostonLegends]) {
    if (entry.tier === 'UNWRITTEN' || !entry.name) continue
    const key = `${entry.name}|${entry.sport}|${entry.number}`
    if (seen.has(key)) continue
    seen.add(key)
    players.push(entry)
  }
  return players
}

export default function HeroSearch({ onSelect, index }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [isOpen, setIsOpen]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)

  const nameIndex = useMemo(() => buildNameIndex(), [])

  // The index to use for number lookups — use passed index or fallback to global
  const numberIndex = index ?? globalIndex

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Search logic — runs on every keystroke
  useEffect(() => {
    const q = query.trim()
    if (q.length === 0) {
      setResults([])
      setIsOpen(false)
      return
    }

    const isNumeric = /^\d{1,2}$/.test(q)

    if (isNumeric) {
      // Number search — find matching tile numbers
      const matchingNumbers = []

      // Exact match first
      const exact = numberIndex.get(q)
      if (exact) {
        const legends = exact.filter(e => e.tier !== 'UNWRITTEN')
        matchingNumbers.push({
          type: 'number',
          number: q,
          legends,
          label: legends.length > 0
            ? legends.map(e => e.name).join(', ')
            : 'No legends yet',
          count: legends.length,
        })
      }

      // Then prefix matches (e.g. "2" → 2, 20, 21, 22...)
      if (q.length === 1) {
        for (const [num, entries] of numberIndex) {
          if (num === q) continue // skip exact (already added)
          if (num.startsWith(q) && num !== '00') {
            const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
            if (legends.length > 0) {
              matchingNumbers.push({
                type: 'number',
                number: num,
                legends,
                label: legends.map(e => e.name).slice(0, 2).join(', '),
                count: legends.length,
              })
            }
          }
        }
        // Sort prefix matches numerically
        matchingNumbers.sort((a, b) => {
          // Keep exact match first
          if (a.number === q) return -1
          if (b.number === q) return 1
          return Number(a.number) - Number(b.number)
        })
      }

      setResults(matchingNumbers.slice(0, 8))
      setIsOpen(matchingNumbers.length > 0)
    } else if (q.length >= 2) {
      // Name search
      const lower = q.toLowerCase()
      const matches = nameIndex
        .filter(p => p.name.toLowerCase().includes(lower))
        .slice(0, 8)
        .map(p => ({
          type: 'player',
          number: p.number,
          name: p.name,
          sport: p.sport,
          tier: p.tier,
        }))

      setResults(matches)
      setIsOpen(matches.length > 0)
    } else {
      setResults([])
      setIsOpen(false)
    }

    setActiveIdx(-1)
  }, [query, numberIndex, nameIndex])

  function selectResult(result) {
    const num = String(result.number)
    const entries = numberIndex.get(num) ?? []
    onSelect({ number: num, entries })
    track('hero_search', {
      query: query.trim(),
      type: result.type,
      number: num,
    })
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setQuery('')
        setIsOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) {
        selectResult(results[activeIdx])
      } else if (results.length === 1) {
        selectResult(results[0])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="hero-search" ref={wrapRef}>
      <div className="hero-search__input-wrap">
        <Search size={14} className="hero-search__icon" />
        <input
          ref={inputRef}
          className="hero-search__input"
          type="text"
          inputMode="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by number or name..."
          aria-label="Search players by jersey number or name"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {query && (
          <button className="hero-search__clear" onClick={handleClear} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="hero-search__dropdown" role="listbox">
          {results.map((r, i) => (
            <li key={r.type === 'number' ? `n-${r.number}` : `p-${r.name}-${r.number}`}>
              <button
                className={`hero-search__result ${i === activeIdx ? 'hero-search__result--active' : ''}`}
                onClick={() => selectResult(r)}
                role="option"
                aria-selected={i === activeIdx}
              >
                {r.type === 'number' ? (
                  <>
                    <span className="hero-search__result-number">#{r.number}</span>
                    <span className="hero-search__result-legends">
                      {r.count > 0
                        ? `${r.label}${r.count > 2 ? ` +${r.count - 2} more` : ''}`
                        : 'Unwritten'}
                    </span>
                    {r.count > 0 && (
                      <span className="hero-search__result-count">
                        {r.count} {r.count === 1 ? 'legend' : 'legends'}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="hero-search__result-sport">{SPORT_ICON[r.sport] ?? ''}</span>
                    <span className="hero-search__result-name">{r.name}</span>
                    <span className="hero-search__result-meta">
                      #{r.number} · {r.sport} · {r.tier}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
