import { Routes, Route } from 'react-router-dom'
import ErrorBoundary  from './components/ErrorBoundary.jsx'
import WallPage       from './pages/WallPage.jsx'
import BostonPage     from './pages/BostonPage.jsx'
// import NewYorkPage    from './pages/NewYorkPage.jsx'  // Disabled until data is vetted
import AboutPage      from './pages/AboutPage.jsx'
import MyWallsPage    from './pages/MyWallsPage.jsx'
import MyWallPage     from './pages/MyWallPage.jsx'
import TimelinePage   from './pages/TimelinePage.jsx'
// import TeamWallsPage  from './pages/TeamWallsPage.jsx'  // Disabled until migration applied
// import TeamWallPage   from './pages/TeamWallPage.jsx'  // Disabled until migration applied
// import TownWallsPage  from './pages/TownWallsPage.jsx'  // Disabled until migration applied
import NotFoundPage   from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/"              element={<WallPage />} />
        <Route path="/number/:num"   element={<WallPage />} />
        <Route path="/boston"         element={<BostonPage />} />
        {/* <Route path="/newyork"       element={<NewYorkPage />} /> — Disabled until data is vetted */}
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/my-wall"   element={<MyWallsPage />} />
        <Route path="/my-wall/new" element={<MyWallsPage />} />
        <Route path="/wall/:slug" element={<MyWallPage />} />
        {/* <Route path="/walls"     element={<TeamWallsPage />} /> — Disabled until migration applied */}
        {/* <Route path="/walls/town/:townSlug" element={<TownWallsPage />} /> — Disabled until migration applied */}
        {/* <Route path="/walls/:schoolSlug/:sport" element={<TeamWallPage />} /> — Disabled until migration applied */}
        <Route path="/timeline/:playerId" element={<TimelinePage />} />
        <Route path="/timeline"  element={<TimelinePage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
