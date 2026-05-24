import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExploreMap from './pages/ExploreMap';
import HabitablePage from './pages/HabitablePage';
import DiscoveriesPage from './pages/DiscoveriesPage';
import './styles/globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/explore"   element={<ExploreMap />} />
        <Route path="/habitable" element={<HabitablePage />} />
        <Route path="/timeline"  element={<DiscoveriesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
