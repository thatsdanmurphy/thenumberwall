#!/usr/bin/env node
/**
 * ds-lint.js — Design System Lint
 *
 * Scans all JSX and CSS files for:
 *   VIOLATIONS  — hardcoded values that should be tokens (fix before closing session)
 *   OPPORTUNITIES — underused tokens, near-duplicates, one-offs (your call)
 *
 * Excludes DesignSystem.jsx/.css (demo material, not product code)
 * Excludes global.css (source of truth, not subject to its own rules)
 *
 * Usage:  npm run ds:lint
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT     = path.join(__dirname, '..')
const SRC      = path.join(ROOT, 'src')
const CSS_PATH = path.join(SRC, 'styles', 'global.css')

const EXCLUDE_FILES = new Set([
  'DesignSystem.jsx',
  'DesignSystem.css',
  'FieldView.jsx',   // intentional dynamic field-zone visualization colors
])

// ── Token parsing ──────────────────────────────────────────────────────────

function parseTokens(css) {
  const tokens = []       // { name, value }
  const hexMap = {}       // '#HEX' → '--token-name'
  const remMap = {}       // '0.9rem' → '--token-name'
  const pxMap  = {}       // '16px' → '--token-name'

  const re = /^\s*(--[\w-]+)\s*:\s*(.+?);/gm
  let m
  while ((m = re.exec(css)) !== null) {
    const name  = m[1].trim()
    const value = m[2].trim()
    tokens.push({ name, value })

    // Build reverse lookup maps for violation detection
    const hexMatch = value.match(/^(#[0-9A-Fa-f]{3,8})$/)
    if (hexMatch) hexMap[hexMatch[1].toUpperCase()] = name

    const remMatch = value.match(/^([0-9.]+rem)$/)
    if (remMatch) remMap[remMatch[1]] = name

    const pxMatch = value.match(/^([0-9]+px)$/)
    if (pxMatch) pxMap[pxMatch[1]] = name
  }

  return { tokens, hexMap, remMap, pxMap }
}

// ── File collection ────────────────────────────────────────────────────────

function collectFiles(dir, exts) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts))
    } else if (entry.isFile() && exts.includes(path.extname(entry.name))) {
      if (!EXCLUDE_FILES.has(entry.name)) results.push(full)
    }
  }
  return results
}

// ── Font-size range constants ──────────────────────────────────────────────
// The full token scale now covers everything from micro (0.625rem) through
// display-hero (4.5rem). Any font-size outside this range is a violation
// unless explicitly marked /* ds:intentional */ with a reason.
//
// Hard accessibility floor: --text-micro (0.625rem / 10px).
// Nothing below this is permitted. Sub-scale text must come up to the floor
// or be aria-hidden="true" if purely decorative.

const REM_SCALE_FLOOR   = 0.625  // --text-micro (10px) — hard accessibility floor
const REM_SCALE_CEILING = 4.5    // --text-display-hero (72px)

// ── Violation detection ────────────────────────────────────────────────────

function scanCssFile(filePath, hexMap, remMap, pxMap) {
  const violations = []
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  const rel = filePath.replace(ROOT + '/', '')

  const SPACING_PROPS = /^\s*(margin|padding|gap|top|right|bottom|left|max-width|min-width|column-gap|row-gap|padding-top|padding-right|padding-bottom|padding-left|margin-top|margin-right|margin-bottom|margin-left|inset)\b/

  lines.forEach((line, i) => {
    const lineNum = i + 1
    const trimmed = line.trim()

    // Skip comments, empty lines, and intentionally-marked lines
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return
    if (line.includes('ds:intentional')) return

    // Strip existing var() references so we don't double-flag
    const cleanLine = line.replace(/var\(--[\w-]+\)/g, 'VAR_TOKEN')

    // ── Hardcoded hex colors ─────────────────────────────────────────────
    const hexMatches = [...cleanLine.matchAll(/#([0-9A-Fa-f]{3,8})\b/g)]
    for (const hm of hexMatches) {
      const hex = ('#' + hm[1]).toUpperCase()
      const known = hexMap[hex]
      violations.push({
        type: 'HARDCODED_COLOR',
        file: rel,
        line: lineNum,
        found: '#' + hm[1],
        suggestion: known
          ? `Use var(${known})`
          : `Unknown color — add to tokens or remove`,
      })
    }

    // ── Raw rem font-size values ─────────────────────────────────────────
    // Only flag values within the defined token scale range.
    // Outside the range = intentional display or sub-scale text, skip silently.
    if (/font-size\s*:/.test(cleanLine)) {
      const remMatch = cleanLine.match(/font-size\s*:\s*([0-9.]+rem)/)
      if (remMatch) {
        const rem = remMatch[1]
        const remVal = parseFloat(rem)
        const inRange = remVal >= REM_SCALE_FLOOR && remVal <= REM_SCALE_CEILING
        const belowFloor = remVal < REM_SCALE_FLOOR
        const aboveCeiling = remVal > REM_SCALE_CEILING
        if (belowFloor) {
          violations.push({
            type: 'BELOW_ACCESSIBILITY_FLOOR',
            file: rel,
            line: lineNum,
            found: rem,
            suggestion: `${rem} is below the 10px floor. Use var(--text-micro) or mark aria-hidden="true" if decorative.`,
          })
        } else if (aboveCeiling) {
          violations.push({
            type: 'ABOVE_DISPLAY_SCALE',
            file: rel,
            line: lineNum,
            found: rem,
            suggestion: `${rem} exceeds --text-display-hero (4.5rem). Add /* ds:intentional */ with a reason if this is deliberate.`,
          })
        } else if (inRange) {
          const known = remMap[rem]
          violations.push({
            type: 'HARDCODED_FONT_SIZE',
            file: rel,
            line: lineNum,
            found: rem,
            suggestion: known
              ? `Use font-size: var(${known})`
              : `In token range but off-scale — snap to nearest token or add a new one. Add /* ds:intentional */ if deliberate.`,
          })
        }
      }
    }

    // ── Raw px spacing values ────────────────────────────────────────────
    if (SPACING_PROPS.test(cleanLine)) {
      const pxMatches = [...cleanLine.matchAll(/\b([0-9]+px)\b/g)]
      for (const pm of pxMatches) {
        const px = pm[1]
        if (['0px', '1px', '2px', '3px'].includes(px)) continue
        const known = pxMap[px]
        if (known && known.startsWith('--space-')) {
          violations.push({
            type: 'HARDCODED_SPACING',
            file: rel,
            line: lineNum,
            found: px,
            suggestion: `Use var(${known})`,
          })
        }
      }
    }
  })

  return violations
}

function scanJsxFile(filePath, hexMap) {
  const violations = []
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  const rel = filePath.replace(ROOT + '/', '')

  lines.forEach((line, i) => {
    const lineNum = i + 1
    const trimmed = line.trim()

    // Skip comments and import lines
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import ')) return

    // Look for hex string literals — these are inline style values
    const hexMatches = [...line.matchAll(/['"]#([0-9A-Fa-f]{3,8})['"]/g)]
    for (const hm of hexMatches) {
      const hex = ('#' + hm[1]).toUpperCase()
      const known = hexMap[hex]
      violations.push({
        type: 'INLINE_STYLE_COLOR',
        file: rel,
        line: lineNum,
        found: `'#${hm[1]}'`,
        suggestion: known
          ? `Use var(${known}) via className or CSS module`
          : `Unknown color — add to tokens or use existing token`,
      })
    }
  })

  return violations
}

// ── Token usage counting ───────────────────────────────────────────────────

function countTokenUsage(files, tokens) {
  const usage = {}
  for (const t of tokens) usage[t.name] = { count: 0, files: new Set() }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    for (const t of tokens) {
      const re = new RegExp(`var\\(${t.name.replace(/-/g, '\\-')}\\)`, 'g')
      const matches = content.match(re)
      if (matches) {
        usage[t.name].count += matches.length
        usage[t.name].files.add(filePath.replace(ROOT + '/', ''))
      }
    }
  }

  return usage
}

// ── Opportunity detection ──────────────────────────────────────────────────

function findOpportunities(tokens, usage) {
  const opportunities = []

  // 1. Underused tokens (used fewer than 3 times, across product code)
  //    Exclude tokens that are definitionally rare (personal, team colors)
  const ALLOWED_RARE = [
    '--color-personal',   // identity system — by definition rare
    '--color-team-',      // team colors — one per team
    '--panel-',           // panel layout ratios
    '--grid-',            // grid tokens (grid-margin is responsive, not a spacing token)
    '--tracking-',        // letter-spacing scale — used in global.css primitives, not counted
    '--color-timeline-',  // glow system — 3 semantic colors, single-use by design
    '--motion-heat',      // heat-specific motion — used only on WallTile
    '--motion-color',     // color-transition motion — used only on WallTile
    '--text-display-',    // display scale — only appears where hero text is needed
  ]
  const isAllowedRare = name => ALLOWED_RARE.some(prefix => name.startsWith(prefix))

  for (const t of tokens) {
    const u = usage[t.name]
    if (!u) continue
    if (isAllowedRare(t.name)) continue
    if (u.count < 3) {
      opportunities.push({
        type: 'UNDERUSED_TOKEN',
        token: t.name,
        value: t.value,
        count: u.count,
        files: [...u.files],
        question: u.count === 0
          ? `Never used in product code. Dead token — remove from global.css?`
          : `Used only ${u.count} time${u.count === 1 ? '' : 's'}. Intentional or eliminate?`,
      })
    }
  }

  // 2. Near-duplicate token values (same resolved value, different names)
  // Only flag duplicates within the same token category — cross-category
  // matches (e.g. --space-1 and --radius-sm both being 4px) are intentional
  // coincidences, not consolidation candidates.

  // Pairs confirmed intentional — different semantic roles, same computed value by coincidence.
  // Adding a pair here suppresses it permanently. Document the reason.
  const KNOWN_DUPLICATE_PAIRS = new Set([
    // --color-border = border hairlines; --surface-3 = hover fill surface.
    // Same rgba value but conceptually distinct — one draws edges, one fills backgrounds.
    '--color-border,--surface-3',
    // --space-4 is fixed 24px spacing. --grid-margin is the responsive grid margin —
    // overridden at 768/1024/1440px breakpoints. Same base, totally different lifecycle.
    '--grid-margin,--space-4',
  ])

  const getCategory = name => name.replace(/^--/, '').split('-')[0]
  const valueGroups = {}
  for (const t of tokens) {
    const normalized = t.value.toLowerCase().replace(/\s+/g, ' ')
    if (!valueGroups[normalized]) valueGroups[normalized] = []
    valueGroups[normalized].push(t.name)
  }
  for (const [value, names] of Object.entries(valueGroups)) {
    if (names.length < 2) continue
    // Suppress known-intentional pairs
    const pairKey = [...names].sort().join(',')
    if (KNOWN_DUPLICATE_PAIRS.has(pairKey)) continue
    // Check if all names share the same category
    const categories = new Set(names.map(getCategory))
    // Allow cross-category only if they're clearly related (e.g. color + border, surface + border)
    const sameCategory = categories.size === 1
    const relatedCategories = categories.size === 2 && (
      (categories.has('color') && categories.has('surface')) ||
      (categories.has('color') && categories.has('border')) ||
      (categories.has('surface') && categories.has('border')) ||
      (categories.has('space') && categories.has('grid'))
    )
    if (!sameCategory && !relatedCategories) continue
    const usages = names.map(n => `${n} (${usage[n]?.count ?? 0} uses)`)
    opportunities.push({
      type: 'DUPLICATE_VALUE',
      value,
      tokens: names,
      question: `These tokens share the same value. Two distinct roles, or can one be eliminated?\n    ${usages.join('\n    ')}`,
    })
  }

  // 3. Token clustering — text scale tokens that are very close in value

  // Pairs confirmed intentional — TNW uses a dense scoreboard type ladder where
  // adjacent steps are intentionally close. Add a pair here to suppress permanently.
  const KNOWN_CLUSTER_PAIRS = new Set([
    // label (11px) vs small (12px): label is all-caps eyebrow, small is secondary body.
    // Different typographic roles — not redundant.
    '--text-label,--text-small',
    // small (12px) vs body-sm (13px): body-sm is dense UI copy, small is captions/pills.
    '--text-body-sm,--text-small',
    // micro (10px) vs label (11px): micro is the accessibility floor for decorative tags,
    // label is the minimum for readable all-caps. Both steps are load-bearing.
    '--text-label,--text-micro',
  ])

  const textTokens = tokens.filter(t => t.name.startsWith('--text-'))
  const remValues = textTokens.map(t => {
    const m = t.value.match(/^([0-9.]+)rem$/)
    return m ? { name: t.name, rem: parseFloat(m[1]) } : null
  }).filter(Boolean)

  for (let i = 0; i < remValues.length; i++) {
    for (let j = i + 1; j < remValues.length; j++) {
      const diff = Math.abs(remValues[i].rem - remValues[j].rem)
      if (diff > 0 && diff <= 0.0625) { // within ~1px of each other
        const pairKey = [remValues[i].name, remValues[j].name].sort().join(',')
        if (KNOWN_CLUSTER_PAIRS.has(pairKey)) continue
        opportunities.push({
          type: 'CLUSTERING',
          tokens: [remValues[i].name, remValues[j].name],
          values: [remValues[i].rem + 'rem', remValues[j].rem + 'rem'],
          question: `Text tokens within 1px of each other. Do both steps need to exist?`,
        })
      }
    }
  }

  return opportunities
}

// ── Report formatting ──────────────────────────────────────────────────────

function groupViolations(violations) {
  // Group by type + found value so we see "0.6rem used in 8 places" not 8 entries
  const groups = {}
  for (const v of violations) {
    const key = `${v.type}::${v.found}`
    if (!groups[key]) {
      groups[key] = { ...v, locations: [] }
    }
    groups[key].locations.push(`${v.file}:${v.line}`)
  }
  return Object.values(groups)
}

function formatReport(violations, opportunities) {
  const divider = '─'.repeat(56)
  const lines = [
    ``,
    `TNW Design System Lint — ${new Date().toISOString().slice(0, 10)}`,
    ``,
  ]

  // ── Violations ──────────────────────────────────────────────────────────
  const grouped = groupViolations(violations)
  if (grouped.length === 0) {
    lines.push(`✓ VIOLATIONS  No hardcoded values found.`)
  } else {
    lines.push(`✗ VIOLATIONS  ${violations.length} instances across ${grouped.length} unique patterns — fix before closing session`)
    lines.push(divider)
    grouped.forEach((v, i) => {
      lines.push(``)
      lines.push(`[${i + 1}] ${v.type}  ×${v.locations.length}`)
      lines.push(`    Found: ${v.found}`)
      lines.push(`    Fix:   ${v.suggestion}`)
      // Show first 3 locations, then summarize
      const shown = v.locations.slice(0, 3)
      const rest  = v.locations.length - shown.length
      shown.forEach(loc => lines.push(`    → ${loc}`))
      if (rest > 0) lines.push(`    → …and ${rest} more`)
    })
  }

  lines.push(``)
  lines.push(divider)
  lines.push(``)

  // ── Opportunities ────────────────────────────────────────────────────────
  if (opportunities.length === 0) {
    lines.push(`✓ OPPORTUNITIES  System looks lean. No consolidation candidates.`)
  } else {
    lines.push(`◐ OPPORTUNITIES  ${opportunities.length} items — your call on each`)
    lines.push(divider)
    opportunities.forEach((o, i) => {
      lines.push(``)
      lines.push(`[${i + 1}] ${o.type}`)
      if (o.token) {
        lines.push(`    Token: ${o.token}  (${o.value})`)
        if (o.files?.length) lines.push(`    Used in: ${o.files.join(', ')}`)
      }
      if (o.tokens) {
        lines.push(`    Tokens: ${o.tokens.join(', ')}`)
      }
      if (o.values) {
        lines.push(`    Values: ${o.values.join(' vs ')}`)
      }
      lines.push(`    ? ${o.question}`)
    })
  }

  lines.push(``)
  lines.push(divider)
  lines.push(``)
  lines.push(`SUMMARY  Violations: ${violations.length}  Opportunities: ${opportunities.length}`)
  lines.push(``)

  return lines.join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────

const css = fs.readFileSync(CSS_PATH, 'utf8')
const { tokens, hexMap, remMap, pxMap } = parseTokens(css)

// Collect all product CSS and JSX files
const cssFiles = collectFiles(path.join(SRC, 'components'), ['.css'])
              .concat(collectFiles(path.join(SRC, 'pages'), ['.css']))

const jsxFiles = collectFiles(path.join(SRC, 'components'), ['.jsx'])
              .concat(collectFiles(path.join(SRC, 'pages'), ['.jsx']))

// All files for token usage counting (includes JSX and CSS)
const allProductFiles = [...cssFiles, ...jsxFiles]

// Scan for violations
const violations = []
for (const f of cssFiles) violations.push(...scanCssFile(f, hexMap, remMap, pxMap))
for (const f of jsxFiles) violations.push(...scanJsxFile(f, hexMap))

// Count token usage and find opportunities
const usage = countTokenUsage(allProductFiles, tokens)
const opportunities = findOpportunities(tokens, usage)

// Output
const report = formatReport(violations, opportunities)
console.log(report)
