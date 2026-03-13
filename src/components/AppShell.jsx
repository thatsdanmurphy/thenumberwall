import './AppShell.css'

/**
 * AppShell — Page structure wrapper.
 * Provides full-height column layout, max-width container, and responsive margins.
 * Every page renders inside this. No color, no chrome — pure structure.
 */
export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        {children}
      </div>
    </div>
  )
}
