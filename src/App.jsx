import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import FeatureSwitcher from './components/FeatureSwitcher';
import FeaturesGrid from './components/FeaturesGrid';
import SocialFAQ from './components/SocialFAQ';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import './styles/LandingPage.css';

function App() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <FeatureSwitcher />
        <FeaturesGrid />
        <SocialFAQ />
      </main>
      <Footer onOpenPrivacy={() => setShowPrivacy(true)} />

      <AnimatePresence>
        {showPrivacy && (
          <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
