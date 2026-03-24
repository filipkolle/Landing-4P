import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import './styles/LandingPage.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/politikazasebnosti" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

export default App;
