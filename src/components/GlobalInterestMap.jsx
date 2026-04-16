/**
 * GlobalInterestMap — world map showing "I want my team here" pings.
 *
 * Lightweight demand signal: are there international users who want to
 * contribute? One ping per browser. Dot lights up at their location.
 * CTA button requests geolocation + optional label, stores in Supabase.
 */

import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { MapPin, Check, Loader } from 'lucide-react'
import { track } from '@vercel/analytics'
import {
  fetchInterestPings,
  hasAlreadyPinged,
  submitInterestPing,
  getBrowserLocation,
} from '../lib/interestStore.js'
import './GlobalInterestMap.css'

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function GlobalInterestMap() {
  const [pings, setPings]       = useState([])
  const [alreadyPinged, setAlreadyPinged] = useState(false)
  const [status, setStatus]     = useState('idle') // idle | locating | label | sending | done | error
  const [label, setLabel]       = useState('')
  const [coords, setCoords]     = useState(null)

  // Load existing pings + check if user already pinged
  useEffect(() => {
    fetchInterestPings().then(setPings)
    hasAlreadyPinged().then(setAlreadyPinged)
  }, [])

  async function handlePing() {
    if (alreadyPinged || status !== 'idle') return
    setStatus('locating')

    const loc = await getBrowserLocation()
    if (!loc) {
      // Geolocation denied — fall back to asking for a city/country name
      // and place a pin at 0,0 with the label (we still get the signal)
      setCoords(null)
      setStatus('label')
      return
    }
    setCoords(loc)
    setStatus('label')
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setStatus('sending')

    const lat = coords?.lat ?? 0
    const lng = coords?.lng ?? 0
    const result = await submitInterestPing({
      lat,
      lng,
      label: label.trim() || null,
    })

    if (result.success) {
      setStatus('done')
      setAlreadyPinged(true)
      // Add the new ping to the map immediately
      setPings(prev => [...prev, { lat, lng, label: label.trim() || null, created_at: new Date().toISOString() }])
      track('global_interest_ping', { label: label.trim() || '(none)', hasCoords: Boolean(coords) })
    } else {
      setStatus('error')
    }
  }

  const pingCount = pings.length

  return (
    <div className="global-interest">
      <div className="global-interest__header">
        <span className="global-interest__label">BEYOND THE US</span>
        {pingCount > 0 && (
          <span className="global-interest__count">{pingCount} {pingCount === 1 ? 'ping' : 'pings'}</span>
        )}
      </div>

      <div className="global-interest__stage">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 140, center: [0, 5] }}
          width={780}
          height={380}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={WORLD_TOPO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  className="global-interest__country"
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {pings.map((p, i) => (
            <Marker key={i} coordinates={[p.lng, p.lat]}>
              <circle
                r={4}
                className="global-interest__dot"
              />
              <circle
                r={8}
                className="global-interest__dot-pulse"
              />
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="global-interest__cta-area">
        {status === 'idle' && !alreadyPinged && (
          <button className="tnw-btn tnw-btn--ghost global-interest__btn" onClick={handlePing}>
            <MapPin size={14} /> My team isn't here yet
          </button>
        )}

        {status === 'locating' && (
          <div className="global-interest__status">
            <Loader size={14} className="global-interest__spinner" /> Finding your location…
          </div>
        )}

        {status === 'label' && (
          <form className="global-interest__label-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="tnw-input global-interest__label-input"
              placeholder="Team or city name (optional)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <button type="submit" className="tnw-btn tnw-btn--primary global-interest__submit">
              Drop pin
            </button>
          </form>
        )}

        {status === 'sending' && (
          <div className="global-interest__status">
            <Loader size={14} className="global-interest__spinner" /> Dropping pin…
          </div>
        )}

        {(status === 'done' || alreadyPinged) && status !== 'idle' && (
          <div className="global-interest__status global-interest__status--done">
            <Check size={14} /> You're on the map.
          </div>
        )}

        {alreadyPinged && status === 'idle' && (
          <div className="global-interest__status global-interest__status--done">
            <Check size={14} /> You're on the map.
          </div>
        )}

        {status === 'error' && (
          <div className="global-interest__status global-interest__status--error">
            Something went wrong. Try again later.
          </div>
        )}
      </div>
    </div>
  )
}
