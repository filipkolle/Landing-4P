import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WaitlistPage from './pages/WaitlistPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import './styles/LandingPage.css';
import './styles/Waitlist.css';

// Pomožna komponenta za ponastavitev scroll pozicije na vrh ob zamenjavi strani
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cakalna-vrsta" element={<WaitlistPage />} />
        <Route path="/o-nas" element={<AboutPage />} />
        <Route path="/politikazasebnosti" element={<PrivacyPolicy />} />
        <Route path="/pogojiposlovanja" element={<TermsOfService />} />
      </Routes>
    </Router>
  );
}

export default App;
