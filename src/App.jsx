import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary  from './components/ErrorBoundary.jsx'
import WallPage       from './pages/WallPage.jsx'
import BostonPage     from './pages/BostonPage.jsx'
import NewYorkPage    from './pages/NewYorkPage.jsx'
import AboutPage      from './pages/AboutPage.jsx'
import MyWallsPage    from './pages/MyWallsPage.jsx'
import MyWallPage     from './pages/MyWallPage.jsx'
import TimelinePage   from './pages/TimelinePage.jsx'
import TeamWallsPage  from './pages/TeamWallsPage.jsx'
import TeamWallPage   from './pages/TeamWallPage.jsx'
import TownWallsPage  from './pages/TownWallsPage.jsx'
import DesignSystem   from './pages/DesignSystem.jsx'
import NotFoundPage   from './pages/NotFoundPage.jsx'

// Behind The Curtains — the internal hub. Hidden from main nav, bookmarkable.
import BehindTheCurtainsLayout from './pages/behindthecurtains/BehindTheCurtainsLayout.jsx'
import BehindTheCurtainsHome   from './pages/behindthecurtains/Home.jsx'
import BehindTheCurtainsStub   from './pages/behindthecurtains/Stub.jsx'
import Sitemap                 from './pages/behindthecurtains/Sitemap.jsx'
import Flows                   from './pages/behindthecurtains/Flows.jsx'
import Engineering             from './pages/behindthecurtains/Engineering.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/"              element={<WallPage />} />
        <Route path="/number/:num"   element={<WallPage />} />
        <Route path="/boston"         element={<BostonPage />} />
        <Route path="/newyork"        element={<NewYorkPage />} />
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/my-wall"   element={<MyWallsPage />} />
        <Route path="/my-wall/new" element={<MyWallsPage />} />
        <Route path="/wall/:slug" element={<MyWallPage />} />
        <Route path="/walls"     element={<TeamWallsPage />} />
        <Route path="/walls/town/:townSlug" element={<TownWallsPage />} />
        <Route path="/walls/:schoolSlug/:sport" element={<TeamWallPage />} />
        <Route path="/timeline/:playerId" element={<TimelinePage />} />
        <Route path="/timeline"  element={<TimelinePage />} />

        {/* Legacy redirect — /design now lives under /behindthecurtains/design */}
        <Route path="/design" element={<Navigate to="/behindthecurtains/design" replace />} />

        {/* Behind The Curtains — internal hub. Bookmark /behindthecurtains. */}
        <Route path="/behindthecurtains" element={<BehindTheCurtainsLayout />}>
          <Route index element={<BehindTheCurtainsHome />} />
          <Route path="design" element={<DesignSystem />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="flows" element={<Flows />} />
          <Route path="engineering" element={<Engineering />}
          />
          <Route
            path="marketing"
            element={
              <BehindTheCurtainsStub
                eyebrow="05 · Marketing"
                title="HOW IT REACHES PEOPLE"
                lede="The audience, the voice, the channels. Subscribers, captured interest, and what we've said out loud."
                plan={[
                  'Kit connection + subscriber list snapshot',
                  'Voice principles (what The Number Wall sounds like)',
                  'Outbound: posts, pitches, pieces written',
                  'Inbound: where traffic comes from, who reached out',
                  'Campaigns: one card per push, with date, channel, and outcome',
                ]}
              />
            }
          />
          <Route
            path="research"
            element={
              <BehindTheCurtainsStub
                eyebrow="06 · Research"
                title="WHAT WE'VE LEARNED"
                lede="Every conversation, test, and reaction that shaped the product. The goal isn't a research library — it's a short, honest record of what users actually did and said, and what we changed as a result."
                plan={[
                  'Log: date, participant shape (fan / alum / parent / cold), format (live / async)',
                  'Key findings, with links to the commits that acted on them',
                  'Patterns: things multiple people said that changed the design',
                  'Open questions: what we still do not know',
                ]}
              />
            }
          />
          <Route
            path="analytics"
            element={
              <BehindTheCurtainsStub
                eyebrow="07 · Analytics"
                title="WHAT IT'S DOING"
                lede="Vercel data rendered the way we think — not the way their default dashboard thinks. Tied into the sitemap so each page shows its own pulse."
                plan={[
                  'Traffic per page, layered onto the sitemap nodes',
                  'First-visit vs returning split',
                  'Top flows actually walked (vs the ones we intended)',
                  'Heat drop-off: where people exit',
                  'Deferred: build this after we have enough traffic to say anything true',
                ]}
              />
            }
          />
        </Route>

        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
