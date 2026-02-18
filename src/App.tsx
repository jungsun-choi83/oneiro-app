import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DreamInput from './pages/DreamInput'
import Loading from './pages/Loading'
import Result from './pages/Result'
import Visualize from './pages/Visualize'
import Report from './pages/Report'
import Journal from './pages/Journal'
import Test from './pages/Test'

function App() {
  return (
    <div className="min-h-screen bg-gradient-midnight">
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/" element={<Home />} />
        <Route path="/dream" element={<DreamInput />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/result" element={<Result />} />
        <Route path="/result/full" element={<Result fullReading={true} />} />
        <Route path="/visualize" element={<Visualize />} />
        <Route path="/report" element={<Report />} />
        <Route path="/journal" element={<Journal />} />
      </Routes>
    </div>
  )
}

export default App
