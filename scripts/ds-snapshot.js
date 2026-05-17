#!/usr/bin/env node
/**
 * ds-snapshot.js — Design System Snapshot
 *
 * Reads global.css and the component/page tree, then writes
 * design-snapshot.md — a compact, machine-readable reference that
 * Claude reads at the start of any build session before touching UI code.
 *
 * Usage:  npm run ds:snapshot
 * Output: design-snapshot.md (project root)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const SRC       = path.join(ROOT, 'src')
const CSS_PATH  = path.join(SRC, 'styles', 'global.css')
const OUT_PATH  = path.join(ROOT, 'design-snapshot.md')

// ── 1. Parse global.css for all CSS custom properties ─────────────────────

function parseTokens(css) {
  const tokens = []
  // Match lines like:  --token-name: value;  (inside :root or anywhere)
  const re = /^\s*(--[\w-]+)\s*:\s*(.+?);/gm
  let m
  while ((m = re.exec(css)) !== null) {
    tokens.push({ name: m[1].trim(), value: m[2].trim() })
  }
  return tokens
}

// ── 2. Extract global primitive CSS class names from global.css ────────────

function parsePrimitiveClasses(css) {
  const classes = new Set()
  // Match .class-name { or .class-name:hover { etc (not inside :root)
  // We only want class names that look like product primitives (.tnw-*, .page-*)
  const re = /\.(tnw-[\w-]+|page-[\w-]+)(?:[:\s{,])/g
  let m
  while ((m = re.exec(css)) !== null) {
    classes.add('.' + m[1])
  }
  return [...classes].sort()
}

// ── 3. List component and page files ──────────────────────────────────────

function listJsx(dir, label) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.jsx'))
    .map(e => ({
      name: e.name.replace('.jsx', ''),
      rel:  `src/${label}/${e.name}`,
    }))
}

function listJsxRecursive(dir, baseLabel) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...listJsxRecursive(fullPath, `${baseLabel}/${entry.name}`))
    } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
      results.push({
        name: entry.name.replace('.jsx', ''),
        rel:  `src/${baseLabel}/${entry.name}`,
      })
    }
  }
  return results
}

// ── 4. Group tokens by category (inferred from common prefixes) ────────────

function groupTokens(tokens) {
  const groups = {
    Color:      [],
    Typography: [],
    Spacing:    [],
    Grid:       [],
    Panel:      [],
    Motion:     [],
    Text:       [],
    Tracking:   [],
    Surface:    [],
    Ink:        [],
    Radius:     [],
    Other:      [],
  }
  for (const t of tokens) {
    if (t.name.startsWith('--color-') || t.name.startsWith('--color'))
      groups.Color.push(t)
    else if (t.name.startsWith('--font-'))
      groups.Typography.push(t)
    else if (t.name.startsWith('--space-'))
      groups.Spacing.push(t)
    else if (t.name.startsWith('--grid-'))
      groups.Grid.push(t)
    else if (t.name.startsWith('--panel-'))
      groups.Panel.push(t)
    else if (t.name.startsWith('--motion-'))
      groups.Motion.push(t)
    else if (t.name.startsWith('--text-'))
      groups.Text.push(t)
    else if (t.name.startsWith('--tracking-'))
      groups.Tracking.push(t)
    else if (t.name.startsWith('--surface-') || t.name.startsWith('--border-'))
      groups.Surface.push(t)
    else if (t.name.startsWith('--ink-'))
      groups.Ink.push(t)
    else if (t.name.startsWith('--radius-'))
      groups.Radius.push(t)
    else
      groups.Other.push(t)
  }
  return groups
}

// ── 5. Build the snapshot markdown ────────────────────────────────────────

function buildSnapshot(tokens, primitives, components, pages) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
  const groups = groupTokens(tokens)

  const lines = [
    `# TNW Design System Snapshot`,
    `Generated: ${now} — run \`npm run ds:snapshot\` to refresh`,
    ``,
    `> Read this before writing any component or style. If this file is`,
    `> from a previous session, regenerate before building.`,
    ``,
    `---`,
    ``,
    `## Token Inventory`,
    ``,
  ]

  for (const [group, toks] of Object.entries(groups)) {
    if (toks.length === 0) continue
    lines.push(`### ${group}`)
    for (const t of toks) {
      lines.push(`\`${t.name}\`: ${t.value}`)
    }
    lines.push('')
  }

  lines.push(`---`, ``)
  lines.push(`## Global Primitive Classes`)
  lines.push(``)
  lines.push(`These exist in global.css. Reach for them before writing component-local CSS.`)
  lines.push(``)
  // Group by base class
  const bases = {}
  for (const cls of primitives) {
    const base = cls.replace(/--[\w-]+$/, '').replace(/(:hover|:focus|:disabled|::after|::before)$/, '')
    if (!bases[base]) bases[base] = []
    bases[base].push(cls)
  }
  for (const [base, variants] of Object.entries(bases)) {
    lines.push(variants.join('  '))
  }
  lines.push('')

  lines.push(`---`, ``)
  lines.push(`## Components (${components.length})`)
  lines.push(``)
  lines.push(`Import from src/components/ — don't recreate what already exists.`)
  lines.push(``)
  for (const c of components) {
    lines.push(`- **${c.name}** — \`${c.rel}\``)
  }
  lines.push('')

  lines.push(`---`, ``)
  lines.push(`## Pages (${pages.length})`)
  lines.push(``)
  for (const p of pages) {
    lines.push(`- **${p.name}** — \`${p.rel}\``)
  }
  lines.push('')

  lines.push(`---`, ``)
  lines.push(`## Rules for Claude`)
  lines.push(``)
  lines.push(`1. Use \`var(--token-name)\` — never hardcode values that exist as tokens`)
  lines.push(`2. Import and reuse components from src/components/ before creating new ones`)
  lines.push(`3. Use primitive classes (.tnw-btn, .tnw-input, .tnw-tab, etc.) before writing new CSS`)
  lines.push(`4. If you need a value not in the token inventory, flag it — don't silently invent it`)
  lines.push(`5. Run \`npm run ds:lint\` at end of any session that touched UI code`)
  lines.push(``)

  return lines.join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────

const css        = fs.readFileSync(CSS_PATH, 'utf8')
const tokens     = parseTokens(css)
const primitives = parsePrimitiveClasses(css)
const components = listJsx(path.join(SRC, 'components'), 'components')
const pages      = listJsxRecursive(path.join(SRC, 'pages'), 'pages')

const snapshot = buildSnapshot(tokens, primitives, components, pages)
fs.writeFileSync(OUT_PATH, snapshot, 'utf8')

console.log(`✓ design-snapshot.md written`)
console.log(`  ${tokens.length} tokens · ${primitives.length} primitive classes · ${components.length} components · ${pages.length} pages`)
console.log(`  → ${OUT_PATH}`)
