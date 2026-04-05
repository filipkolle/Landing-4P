import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WaitlistPage from './pages/WaitlistPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import './styles/LandingPage.css';
import './styles/Waitlist.css';

function App() {
  return (
    <Router>
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
