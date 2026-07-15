import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ModuleHome from './components/ModuleHome.jsx'
import { useProfile } from './context/ProfileContext.jsx'

import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Progress from './pages/Progress.jsx'

import FocusTimer from './modules/adhd/FocusTimer.jsx'
import GoNoGo from './modules/adhd/GoNoGo.jsx'
import TaskBreakdown from './modules/adhd/TaskBreakdown.jsx'

import ReadingAssist from './modules/dyslexia/ReadingAssist.jsx'
import Phonics from './modules/dyslexia/Phonics.jsx'
import LetterFlip from './modules/dyslexia/LetterFlip.jsx'

import CheckIn from './modules/brainfog/CheckIn.jsx'
import ClarityPuzzle from './modules/brainfog/ClarityPuzzle.jsx'
import Breathe from './modules/brainfog/Breathe.jsx'

import MemoryTrainer from './modules/amnesia/MemoryTrainer.jsx'
import Orientation from './modules/amnesia/Orientation.jsx'
import Journal from './modules/amnesia/Journal.jsx'
import FaceName from './modules/amnesia/FaceName.jsx'

import VisualSchedule from './modules/autism/VisualSchedule.jsx'
import EmotionMatch from './modules/autism/EmotionMatch.jsx'
import SocialStories from './modules/autism/SocialStories.jsx'
import CalmSpace from './modules/autism/CalmSpace.jsx'

export default function App() {
  const { profile, loading, error } = useProfile()
  const loc = useLocation()

  if (loading) {
    return (
      <div className="content"><div className="card center muted">Loading MindGym…</div></div>
    )
  }
  if (error) {
    return (
      <div className="content">
        <div className="card">
          <h2>Can’t reach the MindGym server</h2>
          <p className="muted">
            The Python backend doesn’t seem to be running. Start it with
            <code> start.ps1 </code> then refresh this page.
          </p>
          <p className="muted">{String(error.message)}</p>
        </div>
      </div>
    )
  }

  // First-run gate: send people to onboarding until they've set it up.
  if (profile && !profile.onboarded && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/progress" element={<Progress />} />

        <Route path="/adhd" element={<ModuleHome moduleId="adhd" />} />
        <Route path="/adhd/focus" element={<FocusTimer />} />
        <Route path="/adhd/gonogo" element={<GoNoGo />} />
        <Route path="/adhd/tasks" element={<TaskBreakdown />} />

        <Route path="/dyslexia" element={<ModuleHome moduleId="dyslexia" />} />
        <Route path="/dyslexia/reading" element={<ReadingAssist />} />
        <Route path="/dyslexia/phonics" element={<Phonics />} />
        <Route path="/dyslexia/letters" element={<LetterFlip />} />

        <Route path="/brainfog" element={<ModuleHome moduleId="brainfog" />} />
        <Route path="/brainfog/checkin" element={<CheckIn />} />
        <Route path="/brainfog/puzzle" element={<ClarityPuzzle />} />
        <Route path="/brainfog/breathe" element={<Breathe />} />

        <Route path="/amnesia" element={<ModuleHome moduleId="amnesia" />} />
        <Route path="/amnesia/memory" element={<MemoryTrainer />} />
        <Route path="/amnesia/orientation" element={<Orientation />} />
        <Route path="/amnesia/journal" element={<Journal />} />
        <Route path="/amnesia/facename" element={<FaceName />} />

        <Route path="/autism" element={<ModuleHome moduleId="autism" />} />
        <Route path="/autism/schedule" element={<VisualSchedule />} />
        <Route path="/autism/emotions" element={<EmotionMatch />} />
        <Route path="/autism/stories" element={<SocialStories />} />
        <Route path="/autism/calm" element={<CalmSpace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
