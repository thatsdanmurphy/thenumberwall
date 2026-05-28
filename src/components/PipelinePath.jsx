/**
 * PipelinePath — expand/collapse disclosure showing a legend's
 * High School → College → Pro path. Lives inside PlayerCard.
 *
 * Collapsed: single filled row "Serra HS → Michigan → NFL" + chevron-down.
 * Expanded: one row per stop (44px tap target, 20px icon), plus career
 * timeline row if available. Chevron trail = wall exists, plus trail = no wall.
 *
 * Props:
 *   highSchool         — e.g. "Junipero Serra High School"
 *   highSchoolLocation — e.g. "San Mateo, CA"
 *   college            — e.g. "University of Michigan"
 *   collegeLocation    — e.g. "Ann Arbor, MI"
 *   team               — pro team display name (from entry.team)
 *   timelineId         — slug if a career timeline exists (e.g. "brady_tom")
 *   onStartWall        — callback({ school, location, type }) when plus icon tapped
 *   onVisitWall        — callback({ schoolSlug, sport }) when chevron tapped
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackEvent } from '../lib/analytics.js'
import { ChevronDown, ChevronUp, ChevronRight, Plus, ArrowRight } from 'lucide-react'
import './PipelinePath.css'

// Icons as inline SVGs for consistent 20px rendering at 1.5 stroke weight
function HighSchoolIcon() {
  return (
    <svg className="pipeline__icon-svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  )
}

function CollegeIcon() {
  return (
    <svg className="pipeline__icon-svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" />
    </svg>
  )
}

function ProIcon() {
  return (
    <svg className="pipeline__icon-svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10M2 12h20" />
    </svg>
  )
}

function TimelineIcon() {
  return (
    <svg className="pipeline__icon-svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h4l3-9 4 18 3-9h6" />
    </svg>
  )
}

// Seeded team wall slugs — colleges/clubs with walls in Supabase.
// PipelinePath shows chevron (visit) for these, plus (start wall) for others.
// Keep in sync with seed_pilot_walls.sql. Will be replaced by a live
// Supabase lookup once wall count grows beyond the pilot set.
const SEEDED_WALL_SLUGS = new Set([
  'university-of-southern-california',
  'ucla',
  'university-of-miami',
  'university-of-pittsburgh',
  'arizona-state-university',
  'georgetown-university',
  'university-of-connecticut',
  'university-of-kansas',
  'university-of-tennessee',
  // boston-university dropped — only Poulin after Hughes correction (below 2-legend threshold)
  // Pro clubs removed from pilot — they're destinations, not pipelines.
  // Academies (ac-milan-academy, west-ham-united-academy) stay.
  'oshawa-generals',
  'st-michaels-majors',
  'london-knights',
  'ac-milan-academy',
  'west-ham-united-academy',
  'kansas-state', // K-State pilot wall
])

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Shorten school names for the collapsed route view
function shortName(name) {
  if (!name) return ''
  // Strip parenthetical annotations first — "Filathlitikos (youth club)" → "Filathlitikos",
  // "University of Oklahoma (never attended)" → "University of Oklahoma". Without this,
  // the length-truncation fallback below grabs the last word and produces orphans like
  // "club)" or "(USP)" in the route display.
  let s = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  // "University of Michigan" → "Michigan"
  // "Junipero Serra High School" → "Serra HS"
  s = s
    .replace(/^(University|Univ\.?) of /i, '')
    .replace(/^The /i, '')
    .replace(/ University$/i, '')
    .replace(/ High School$/i, ' HS')
    .replace(/ Academy$/i, '')
  // If still long, take last word before any suffix
  if (s.length > 18) {
    const parts = s.split(' ')
    if (parts.length > 1) s = parts.slice(-1)[0]
  }
  return s
}

export default function PipelinePath({
  highSchool,
  highSchoolLocation,
  college,
  collegeLocation,
  team,
  timelineId,
  onStartWall,
  onVisitWall,
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  // Don't render if there's no pipeline data at all
  const hasHS = Boolean(highSchool)
  const hasCollege = Boolean(college)
  if (!hasHS && !hasCollege) return null

  const toggle = useCallback(() => {
    setExpanded(prev => {
      if (!prev) {
        trackEvent('pipeline_expand', { college, highSchool })
      }
      return !prev
    })
  }, [college, highSchool])

  // Check if the school has a seeded wall in Supabase
  const collegeSlug = hasCollege ? slugify(college) : ''
  const hsSlug = hasHS ? slugify(highSchool) : ''
  const collegeHasWall = SEEDED_WALL_SLUGS.has(collegeSlug)
  const hsHasWall = SEEDED_WALL_SLUGS.has(hsSlug)

  function handleHSTap() {
    if (onStartWall) {
      onStartWall({ school: highSchool, location: highSchoolLocation, type: 'highSchool' })
    }
  }

  function handleCollegeTap() {
    if (collegeHasWall && onVisitWall) {
      onVisitWall({ school: college, location: collegeLocation })
    } else if (onStartWall) {
      onStartWall({ school: college, location: collegeLocation, type: 'college' })
    }
  }

  function handleTimelineTap() {
    if (timelineId) {
      trackEvent('timeline_open_from_pipeline', { timelineId })
      navigate(`/timeline/${timelineId}`)
    }
  }

  // Build collapsed route text
  const stops = []
  if (hasHS) stops.push({ label: shortName(highSchool), hasWall: hsHasWall })
  if (hasCollege) stops.push({ label: shortName(college), hasWall: collegeHasWall })
  if (team) stops.push({ label: 'Pro', hasWall: false, dimmed: true })

  if (!expanded) {
    return (
      <div className="pipeline pipeline--collapsed" onClick={toggle} role="button" tabIndex={0} aria-expanded="false">
        <div className="pipeline__route">
          {stops.map((stop, i) => (
            <span key={i}>
              {i > 0 && <span className="pipeline__arrow" aria-hidden="true">&rarr;</span>}
              <span className={`pipeline__stop${stop.hasWall ? ' pipeline__stop--link' : ''}${stop.dimmed ? ' pipeline__stop--dim' : ''}`}>
                {stop.label}
              </span>
            </span>
          ))}
        </div>
        <div className="pipeline__trail">
          <ChevronDown size={16} />
        </div>
      </div>
    )
  }

  return (
    <div className="pipeline pipeline--expanded">
      <button className="pipeline__collapse-bar" onClick={toggle} aria-label="Collapse path">
        <ChevronUp size={16} />
      </button>

      {hasHS && (
        <div className="pipeline__row" onClick={handleHSTap} role="button" tabIndex={0}>
          <div className="pipeline__icon"><HighSchoolIcon /></div>
          <div className="pipeline__text">
            <div className="pipeline__school">{highSchool}</div>
            {highSchoolLocation && <div className="pipeline__loc">{highSchoolLocation}</div>}
          </div>
          <div className="pipeline__trail">
            {hsHasWall ? <ChevronRight size={14} /> : <Plus size={14} />}
          </div>
        </div>
      )}

      {hasCollege && (
        <div className="pipeline__row" onClick={handleCollegeTap} role="button" tabIndex={0}>
          <div className="pipeline__icon"><CollegeIcon /></div>
          <div className="pipeline__text">
            <div className={`pipeline__school${collegeHasWall ? ' pipeline__school--link' : ''}`}>{college}</div>
            {collegeLocation && <div className="pipeline__loc">{collegeLocation}</div>}
          </div>
          <div className="pipeline__trail">
            {collegeHasWall ? <ChevronRight size={14} /> : <Plus size={14} />}
          </div>
        </div>
      )}

      {team && (
        <div className="pipeline__row pipeline__row--dim">
          <div className="pipeline__icon"><ProIcon /></div>
          <div className="pipeline__text">
            <div className="pipeline__school">Pro</div>
            <div className="pipeline__loc">{team}</div>
          </div>
        </div>
      )}

      {timelineId && (
        <div className="pipeline__row pipeline__row--timeline" onClick={handleTimelineTap} role="button" tabIndex={0}>
          <div className="pipeline__icon"><TimelineIcon /></div>
          <div className="pipeline__text">
            <div className="pipeline__school pipeline__school--link">Career timeline</div>
          </div>
          <div className="pipeline__trail"><ChevronRight size={14} /></div>
        </div>
      )}
    </div>
  )
}
