import { Routes, Route } from 'react-router-dom'
import ErrorBoundary  from './components/ErrorBoundary.jsx'
import WallPage       from './pages/WallPage.jsx'
import BostonPage     from './pages/BostonPage.jsx'
import AboutPage      from './pages/AboutPage.jsx'
import MyWallsPage    from './pages/MyWallsPage.jsx'
import MyWallPage     from './pages/MyWallPage.jsx'
import TimelinePage   from './pages/TimelinePage.jsx'
import NotFoundPage   from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/"              element={<WallPage />} />
        <Route path="/number/:num"   element={<WallPage />} />
        <Route path="/boston"         element={<BostonPage />} />
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/my-wall"   element={<MyWallsPage />} />
        <Route path="/my-wall/new" element={<MyWallsPage />} />
        <Route path="/wall/:slug" element={<MyWallPage />} />
        <Route path="/timeline/:playerId" element={<TimelinePage />} />
        <Route path="/timeline"  element={<TimelinePage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
