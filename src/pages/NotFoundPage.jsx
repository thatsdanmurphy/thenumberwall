import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <AppShell>
      <AppHeader />
      <main className="not-found-page">
        <div className="not-found-page__number">404</div>
        <div className="not-found-page__label">PAGE NOT FOUND</div>
        <Link to="/" className="tnw-btn tnw-btn--secondary not-found-page__cta"><ArrowLeft size={14} /> BACK TO THE WALL</Link>
      </main>
      <AppFooter />
    </AppShell>
  )
}
