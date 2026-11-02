import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MergeRequests from './pages/MergeRequests';
import DecisionRecords from './pages/DecisionRecords';
import Search from './pages/Search';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gitlab-darker font-sans text-gitlab-light">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gitlab-dark p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mrs" element={<MergeRequests />} />
            <Route path="/decisions" element={<DecisionRecords />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
