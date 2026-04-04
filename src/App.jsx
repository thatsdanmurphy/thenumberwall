import { Routes, Route } from 'react-router-dom'
import ErrorBoundary  from './components/ErrorBoundary.jsx'
import WallPage       from './pages/WallPage.jsx'
import BostonPage     from './pages/BostonPage.jsx'
import AboutPage      from './pages/AboutPage.jsx'
import MyWallPage     from './pages/MyWallPage.jsx'
import NotFoundPage   from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/"          element={<WallPage />} />
        <Route path="/boston"     element={<BostonPage />} />
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/my-wall"   element={<MyWallPage />} />
        <Route path="/wall/:slug" element={<MyWallPage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
