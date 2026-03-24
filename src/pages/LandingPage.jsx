import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
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
