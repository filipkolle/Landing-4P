import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SubscribeCTA from '../components/SubscribeCTA';
import ProblemSolution from '../components/ProblemSolution';
import FeatureSwitcher from '../components/FeatureSwitcher';
import FeaturesGrid from '../components/FeaturesGrid';
import SocialFAQ from '../components/SocialFAQ';
import Footer from '../components/Footer';

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <div className="mobile-only-cta" style={{ display: 'none' }}>
          <SubscribeCTA />
        </div>
        <style>{`
          @media (max-width: 768px) {
            .mobile-only-cta { display: block !important; }
          }
        `}</style>
        <ProblemSolution />
        <FeatureSwitcher />
        <FeaturesGrid />
        <SocialFAQ />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
