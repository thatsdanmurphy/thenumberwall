import { Component } from 'react'

/**
 * Top-level error boundary — catches any render error and shows a
 * minimal fallback that matches the site aesthetic instead of a
 * blank white crash screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Could send to an error reporting service here
    console.error('[NumberWall] Runtime error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:       '100dvh',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          background:      '#080C10',
          color:           '#F5F7FA',
          fontFamily:      '"IBM Plex Mono", monospace',
          gap:             '16px',
          padding:         '32px',
          textAlign:       'center',
        }}>
          <div style={{ fontSize: '3rem', lineHeight: 1, opacity: 0.12, letterSpacing: '0.04em' }}>—</div>
          <div style={{ fontSize: '0.625rem', letterSpacing: '0.2em' }}>
            THE WALL WENT DARK
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', maxWidth: '280px', fontStyle: 'italic' }}>
            Something broke. Try reloading.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop:      '8px',
              background:     'none',
              border:         '1px solid rgba(255,255,255,0.20)',
              borderRadius:   '4px',
              color:          'rgba(255,255,255,0.62)',
              fontFamily:     '"IBM Plex Mono", monospace',
              fontSize:       '0.5625rem',
              letterSpacing:  '0.14em',
              padding:        '6px 14px',
              cursor:         'pointer',
            }}
          >
            RELOAD
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
