/**
 * HOW WORK HAPPENS — /behindthecurtains/howworkhappens
 *
 * A solo founder's process. Not sprints — cycles. Sketch → build → ship → watch → learn.
 * How Claude fits in as infrastructure. The trade-offs. What went wrong. How problems get fixed.
 *
 * Audience: PMs should understand how work gets done. Senior engineers should see disciplined shipping.
 */

import { Link } from 'react-router-dom'
import {
  Pencil, Layers, Rocket, Eye, BookOpen,
  ArrowRight, AlertTriangle, Wrench, RefreshCw,
} from 'lucide-react'
import './howworkhappens.css'

// ── The rhythm pipeline ────────────────────────────────────────────────────

const RHYTHM_STEPS = [
  {
    icon: Pencil,
    step: 'Sketch',
    desc: 'Idea lives on paper or a GitHub issue. Wireframe. Note. Decide scope.',
  },
  {
    icon: Layers,
    step: 'Build',
    desc: 'Implement in a branch or main. Token discipline. Prefix conventions. Banner comments.',
  },
  {
    icon: Rocket,
    step: 'Ship',
    desc: 'Merge to main. Deploy. Live in 45 seconds. No staging. No approval queue.',
  },
  {
    icon: Eye,
    step: 'Watch',
    desc: 'Pull on mobile. Tap the flows. Check for regressions. Feel for fit.',
  },
  {
    icon: BookOpen,
    step: 'Learn',
    desc: 'What broke? What felt slow? What confused a first-time visitor? File notes.',
  },
]

// ── Claude as infrastructure ────────────────────────────────────────────────

const PAIR_POINTS = [
  {
    title: 'Data transforms, not design decisions',
    desc: 'Claude handles CSV-to-JSON pipelines, boilerplate scaffolding, and repetitive refactors. The editorial voice, the tier assignments, the heat thresholds — those are human.',
  },
  {
    title: 'Pair, not author',
    desc: 'The conversations that matter aren\'t "write me a component." They\'re "here\'s what I\'m trying to do, what am I not seeing?" Architecture emerges from dialogue, not delegation.',
  },
  {
    title: 'Judgment stays human',
    desc: 'Who\'s a legend? What tier? Is this number sacred? Those calls require sports knowledge, editorial instinct, and the conviction to defend a controversial pick. No model has that context.',
  },
]

// ── Trade-offs ──────────────────────────────────────────────────────────────

const TRADEOFFS = [
  {
    chose: 'Static JSON at build time',
    gavup: 'Legends don\'t update until the next deploy. If a stat is wrong, it stays wrong until someone pushes.',
  },
  {
    chose: 'No staging environment',
    gavup: 'If a bug ships, it\'s live. The guardrail is discipline, not infrastructure.',
  },
  {
    chose: 'One CSS file for all tokens',
    gavup: 'Theming or white-labeling would require a rewrite. The system is optimized for one product, not a platform.',
  },
  {
    chose: 'Supabase for user data',
    gavup: 'Vendor lock-in. If Supabase changes pricing or goes down, team walls go with it.',
  },
  {
    chose: 'Solo founder',
    gavup: 'No code review, no second pair of eyes on editorial calls. The upside is speed. The risk is blind spots.',
  },
]

// ── What went wrong ────────────────────────────────────────────────────────

const FAILURES = [
  {
    title: 'The first tile grid was a table',
    desc: 'Early versions used an HTML table for the 0–99 grid. It worked until it didn\'t — no hover states, no transitions, no way to express heat. Rebuilding as CSS grid was the right call but cost a weekend.',
  },
  {
    title: 'Mocked tests that passed while prod broke',
    desc: 'Integration tests hit mocks instead of real data. A migration shipped that the mocks couldn\'t catch. Now the rule is: if the test doesn\'t touch the real data shape, it doesn\'t count.',
  },
  {
    title: 'BC wall that never shipped',
    desc: 'Spent weeks on a Boston College wall that turned out to be the wrong scope. The lesson: validate the audience before building the feature. BC wall data still sits in the repo, unused.',
  },
  {
    title: 'Token drift before the design system',
    desc: 'Before global.css had a formal token scale, every component invented its own rgba values. Three months in, nothing matched. The consolidation into 62 tokens took a full day and touched every file. Now the rule is: no raw values, period.',
  },
]

// ── How problems get fixed ──────────────────────────────────────────────────

const QA_METHODS = [
  {
    icon: AlertTriangle,
    title: 'The design system page is the first test',
    desc: 'If a token drifts, a swatch breaks visibly on /behindthecurtains/design. Living documentation is the canary.',
  },
  {
    icon: Rocket,
    title: 'Push to main, check on phone',
    desc: 'No device lab. Ship it, pull it up on mobile, tap through the flows. If it feels wrong, fix it now — the deploy cycle is 45 seconds.',
  },
  {
    icon: Wrench,
    title: 'Pre-launch QA before any external share',
    desc: 'Before sending a link to anyone outside, run a structured check: dead links, placeholder text, ghost data, tier inconsistencies, responsive breaks.',
  },
  {
    icon: RefreshCw,
    title: 'Respond fast, fix faster',
    desc: 'When something breaks, fix it in the same session. Don\'t file a ticket for yourself. The backlog for a solo founder is "things I haven\'t noticed yet."',
  },
]

// ── Render the page ────────────────────────────────────────────────────────

export default function HowWorkHappens() {
  return (
    <div className="hwh-page">
      {/* Banner */}
      <header className="hwh-banner">
        <div className="hwh-banner__eyebrow">05 · How Work Happens</div>
        <h1 className="hwh-banner__title">HOW WORK HAPPENS</h1>
        <p className="hwh-banner__lede">
          How a solo founder ships a product without a team, a sprint board, or a standup.
          The tools, the rhythm, the judgment calls — and the mistakes that shaped the guardrails.
        </p>
      </header>

      {/* Section 1: The Rhythm */}
      <section className="hwh-section">
        <h2 className="hwh-section__title">
          <Pencil size={20} />
          The Rhythm
        </h2>
        <p className="hwh-section__lede">
          How work actually flows. Not sprints — cycles. Dan ships in short bursts: idea → sketch
          → build → ship → watch. No staging environment, no approval queue. Push to main, it's live.
          The simplicity is intentional — ceremony slows a solo founder down. But guardrails matter:
          token discipline, prefix conventions, banner comments on every file, and a design system
          that breaks visibly when something drifts.
        </p>

        <div className="hwh-pipeline">
          {RHYTHM_STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.step} className="hwh-pipeline__cell">
                <div className="hwh-pipeline__box">
                  <Icon className="hwh-pipeline__icon" size={20} />
                  <div className="hwh-pipeline__step">{step.step}</div>
                  <div className="hwh-pipeline__desc">{step.desc}</div>
                </div>
                {idx < RHYTHM_STEPS.length - 1 && (
                  <ArrowRight className="hwh-pipeline__arrow" size={16} />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 2: The Pair */}
      <section className="hwh-section">
        <h2 className="hwh-section__title">
          <Layers size={20} />
          The Pair
        </h2>
        <p className="hwh-section__lede">
          How Claude fits in. Frame this carefully — NOT "Claude built my product." Claude is
          infrastructure, like Vite or Supabase. A pair that handles the mechanical work so the
          founder can focus on judgment calls.
        </p>

        <div className="hwh-pair">
          {PAIR_POINTS.map(point => (
            <div key={point.title} className="hwh-pair__card">
              <h3 className="hwh-pair__title">{point.title}</h3>
              <p className="hwh-pair__desc">{point.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: The Trade-offs */}
      <section className="hwh-section">
        <h2 className="hwh-section__title">
          <AlertTriangle size={20} />
          The Trade-Offs
        </h2>
        <p className="hwh-section__lede">
          Things this architecture sacrifices. Be honest. Every choice has a cost.
        </p>

        <div className="hwh-tradeoffs">
          {TRADEOFFS.map(trade => (
            <div key={trade.chose} className="hwh-tradeoffs__row">
              <div className="hwh-tradeoffs__chose">
                <span className="hwh-tradeoffs__label">Chose</span>
                <span className="hwh-tradeoffs__value">{trade.chose}</span>
              </div>
              <div className="hwh-tradeoffs__sep">→</div>
              <div className="hwh-tradeoffs__gavup">
                <span className="hwh-tradeoffs__label">Gave up</span>
                <span className="hwh-tradeoffs__value">{trade.gavup}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: What Went Wrong */}
      <section className="hwh-section">
        <h2 className="hwh-section__title">
          <Wrench size={20} />
          What Went Wrong
        </h2>
        <p className="hwh-section__lede">
          Real failures and iterations. This is the section that makes BTC feel human.
        </p>

        <div className="hwh-failures">
          {FAILURES.map(failure => (
            <div key={failure.title} className="hwh-failures__card">
              <h3 className="hwh-failures__title">{failure.title}</h3>
              <p className="hwh-failures__desc">{failure.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: How Problems Get Fixed */}
      <section className="hwh-section">
        <h2 className="hwh-section__title">
          <RefreshCw size={20} />
          How Problems Get Fixed
        </h2>
        <p className="hwh-section__lede">
          Testing and QA philosophy. Not a formal test suite — an honest description of how a solo
          founder catches problems.
        </p>

        <div className="hwh-qa">
          {QA_METHODS.map(method => {
            const Icon = method.icon
            return (
              <div key={method.title} className="hwh-qa__card">
                <div className="hwh-qa__header">
                  <Icon className="hwh-qa__icon" size={18} />
                  <h3 className="hwh-qa__title">{method.title}</h3>
                </div>
                <p className="hwh-qa__desc">{method.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="hwh-footer">
        <p className="hwh-footer__line">
          The process is the product. Ship it, watch it, learn from it, ship again.
        </p>
      </footer>

      {/* Back link */}
      <div className="hwh-back">
        <Link to="/behindthecurtains" className="hwh-back__link">
          ← Behind the curtains
        </Link>
      </div>
    </div>
  )
}
