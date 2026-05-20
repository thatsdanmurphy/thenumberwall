#!/usr/bin/env node
/**
 * ds-fix.js — One-time violation sweep
 *
 * Applies all confirmed token substitutions across CSS and JSX files.
 * Run once, verify with ds:lint, then delete this script.
 *
 * Skips:
 *   - src/styles/global.css (source of truth)
 *   - DesignSystem.jsx / DesignSystem.css (demo material)
 *   - FieldView.jsx (intentional dynamic inline colors)
 *   - Large display font sizes (1rem+) — too risky without per-instance review
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC  = path.join(ROOT, 'src')

const SKIP_FILES = new Set([
  'global.css',
  'DesignSystem.jsx',
  'DesignSystem.css',
  'FieldView.jsx',         // intentional dynamic field visualization colors
])

// ── Token substitution maps ────────────────────────────────────────────────

// CSS font-size substitutions (exact match on the rem value in a font-size line)
const FONT_SIZE_MAP = {
  // ── Sub-scale → hard floor (accessibility rule: nothing below --text-micro) ──
  '0.6rem':     'var(--text-micro)',   // 9.6px → 10px floor
  '0.58rem':    'var(--text-micro)',
  '0.56rem':    'var(--text-micro)',
  '0.55rem':    'var(--text-micro)',
  '0.5rem':     'var(--text-micro)',   // 8px → 10px floor
  '0.48rem':    'var(--text-micro)',
  '0.45rem':    'var(--text-micro)',
  '0.44rem':    'var(--text-micro)',
  '0.42rem':    'var(--text-micro)',
  '0.40rem':    'var(--text-micro)',
  '0.4rem':     'var(--text-micro)',   // 6.4px → 10px floor
  '0.4375rem':  'var(--text-micro)',   // 7px → 10px floor

  // ── Token scale ──────────────────────────────────────────────────────────
  '0.9375rem':  'var(--text-body)',
  '0.875rem':   'var(--text-body)',
  '0.9rem':     'var(--text-body)',
  '0.95rem':    'var(--text-body)',
  '0.8125rem':  'var(--text-body-sm)',
  '0.75rem':    'var(--text-caption)',
  '0.6875rem':  'var(--text-label)',
  '0.625rem':   'var(--text-micro)',
  '1.375rem':   'var(--text-h1)',
  '1.125rem':   'var(--text-h2)',
  '1.0rem':     'var(--text-base)',
  '1rem':       'var(--text-base)',
  '1.0625rem':  'var(--text-body-lg)',
  '1.3rem':     'var(--text-h1)',
  '1.25rem':    'var(--text-h3)',
  '1.2rem':     'var(--text-h2)',

  // ── Display scale ─────────────────────────────────────────────────────────
  '1.4rem':     'var(--text-display-xs)',  // 22.4px → 24px
  '1.5rem':     'var(--text-display-xs)',  // exact
  '1.6rem':     'var(--text-display-xs)',  // 25.6px → 24px (snap down, review)
  '1.75rem':    'var(--text-display-sm)',  // exact
  '1.8rem':     'var(--text-display-sm)',  // 28.8px → 28px
  '2rem':       'var(--text-display-md)',  // exact
  '2.2rem':     'var(--text-display-md)',  // 35.2px → 32px (snap down, review)
  '2.25rem':    'var(--text-display-md)',  // 36px → 32px (snap down, review)
  '2.5rem':     'var(--text-display-lg)',  // exact
  '2.75rem':    'var(--text-display-lg)',  // 44px → 40px (snap down, review)
  '3rem':       'var(--text-display-xl)',  // exact
  '4.5rem':     'var(--text-display-hero)', // exact
}

// CSS spacing substitutions (only applied in margin/padding/gap/etc lines)
const SPACING_PROPS = /^\s*(margin|padding|gap|top|right|bottom|left|max-width|min-width|column-gap|row-gap|padding-top|padding-right|padding-bottom|padding-left|margin-top|margin-right|margin-bottom|margin-left|inset|translate|height)\b/
const SPACING_MAP = {
  '48px':  'var(--space-6)',
  '32px':  'var(--space-5)',
  '16px':  'var(--space-3)',
  '8px':   'var(--space-2)',
}

// Hex color substitutions — global, applied to any matching value
const COLOR_MAP = {
  '#E87C2A': 'var(--color-heat)',
  '#e87c2a': 'var(--color-heat)',
  '#E8182E': 'var(--color-team-sox)',
  '#ff6b6b': 'var(--color-error)',
  '#FF6B6B': 'var(--color-error)',
  '#FF4D5E': 'var(--color-timeline-low)',
  '#FFF0B0': 'var(--color-timeline-peak)',
  '#9ED44C': 'var(--color-timeline-pos)',
  '#ff8a8a': 'var(--color-error)',      // light error variant → snap to error token
}

// JSX inline style color substitutions (string literals)
const JSX_COLOR_MAP = {
  "'#080C10'":  "'var(--color-night)'",
  "'#F5F7FA'":  "'var(--color-paper)'",
  "'#e87c2a'":  "'var(--color-heat)'",
  "'#E8182E'":  "'var(--color-team-sox)'",
  '"#080C10"':  '"var(--color-night)"',
  '"#F5F7FA"':  '"var(--color-paper)"',
  '"#e87c2a"':  '"var(--color-heat)"',
  '"#E8182E"':  '"var(--color-team-sox)"',
}

// ── File processing ────────────────────────────────────────────────────────

function processCSS(content, filePath) {
  const lines = content.split('\n')
  let changed = 0

  const result = lines.map(line => {
    let out = line

    // Skip comment lines
    const trimmed = line.trim()
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
      return line
    }

    // ── Color substitutions (global on the line) ───────────────────────
    for (const [hex, token] of Object.entries(COLOR_MAP)) {
      if (out.includes(hex)) {
        out = out.split(hex).join(token)
      }
    }

    // ── Font-size substitutions ────────────────────────────────────────
    if (/font-size\s*:/.test(out)) {
      for (const [rem, token] of Object.entries(FONT_SIZE_MAP)) {
        // Match the exact rem value as the font-size value (not inside another token)
        const re = new RegExp(`(font-size\\s*:\\s*)${rem.replace('.', '\\.')}\\b`)
        if (re.test(out)) {
          out = out.replace(re, `$1${token}`)
          break // only one font-size per line
        }
      }
    }

    // ── Spacing substitutions (only in spacing property lines) ─────────
    if (SPACING_PROPS.test(out)) {
      // Apply largest to smallest to avoid double-replacing (48px before 8px)
      for (const [px, token] of Object.entries(SPACING_MAP)) {
        const re = new RegExp(`\\b${px}\\b`, 'g')
        out = out.replace(re, token)
      }
    }

    if (out !== line) changed++
    return out
  })

  return { content: result.join('\n'), changed }
}

function processJSX(content, filePath) {
  let out = content
  let changed = 0

  for (const [literal, replacement] of Object.entries(JSX_COLOR_MAP)) {
    const count = (out.split(literal).length - 1)
    if (count > 0) {
      out = out.split(literal).join(replacement)
      changed += count
    }
  }

  // Also apply CSS color map for any remaining string hex literals
  for (const [hex, token] of Object.entries(COLOR_MAP)) {
    const quoted = [`'${hex}'`, `"${hex}"`]
    for (const q of quoted) {
      const tokenQ = q[0] + token + q[0]
      if (out.includes(q)) {
        out = out.split(q).join(tokenQ)
        changed++
      }
    }
  }

  return { content: out, changed }
}

// ── File walker ────────────────────────────────────────────────────────────

function walkAndFix(dir) {
  let totalFiles = 0
  let totalChanges = 0

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)

      if (entry.isDirectory()) {
        walk(full)
        continue
      }

      if (SKIP_FILES.has(entry.name)) continue

      const ext = path.extname(entry.name)
      if (!['.css', '.jsx'].includes(ext)) continue

      const original = fs.readFileSync(full, 'utf8')
      let result

      if (ext === '.css') {
        result = processCSS(original, full)
      } else {
        result = processJSX(original, full)
      }

      if (result.changed > 0) {
        fs.writeFileSync(full, result.content, 'utf8')
        const rel = full.replace(ROOT + '/', '')
        console.log(`  ✓ ${rel}  (${result.changed} substitution${result.changed === 1 ? '' : 's'})`)
        totalFiles++
        totalChanges += result.changed
      }
    }
  }

  walk(dir)
  return { totalFiles, totalChanges }
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log('\nTNW Design System — Violation Fix Sweep\n')
const { totalFiles, totalChanges } = walkAndFix(SRC)
console.log(`\nDone. ${totalChanges} substitutions across ${totalFiles} files.`)
console.log('Run npm run ds:lint to verify.\n')
