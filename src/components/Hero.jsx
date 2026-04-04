import React from 'react';
import { motion } from 'framer-motion';
import phoneDelo from '../assets/mockups/hero_phone_delo.png';
import phoneFinance from '../assets/mockups/hero_phone_finance_dark.png';
import phoneCategories from '../assets/mockups/hero_phone_categories.png';

const Hero = () => {
  return (
    <header className="hero-section">
      {/* Background Gradient & Animated Background Elements */}
      <div className="hero-background">
        <div className="hero-gradient-overlay" />
        
        {/* SVG Curves with Animated Text */}
        <svg className="hero-curves" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left Curve (Delo) */}
          <path 
            id="curve-left" 
            d="M-50,250 C100,150 200,450 350,350 C450,280 400,150 300,100 C200,50 50,150 150,300" 
            stroke="rgba(107, 150, 181, 0.2)" 
            strokeWidth="40" 
            strokeLinecap="round"
          />
          <motion.text 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <motion.textPath 
              xlinkHref="#curve-left" 
              initial={{ startOffset: "0%" }}
              animate={{ startOffset: "15%" }}
              transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
              className="curve-text blue-text"
            >
              Delo
            </motion.textPath>
          </motion.text>

          {/* Right Curve (Finance) */}
          <path 
            id="curve-right" 
            d="M1490,250 C1340,150 1240,450 1090,350 C990,280 1040,150 1140,100 C1240,50 1390,150 1290,300" 
            stroke="rgba(107, 164, 181, 0.2)" 
            strokeWidth="40" 
            strokeLinecap="round"
          />
          <motion.text 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <motion.textPath 
              xlinkHref="#curve-right" 
              initial={{ startOffset: "100%" }}
              animate={{ startOffset: "75%" }}
              transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
              className="curve-text green-text"
            >
              Finance
            </motion.textPath>
          </motion.text>
        </svg>
      </div>

      <div className="container">
        {/* Main Content */}
        <div className="hero-content-centered">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          >
            Osebni <span className="highlight-blue">asistent</span> v<br />
            tvojem <span className="highlight-green">žepu</span>
          </motion.h1>
        </div>

        {/* Phones Animation */}
        <div className="hero-phones-container">
          {/* Left Phone */}
          <motion.div 
            className="hero-phone phone-left"
            initial={{ opacity: 0, y: 400 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.6, ease: [0.19, 1, 0.22, 1] }}
          >
            <img src={phoneDelo} alt="Phone Delo" />
          </motion.div>

          {/* Right Phone */}
          <motion.div 
            className="hero-phone phone-right"
            initial={{ opacity: 0, y: 400 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1, ease: [0.19, 1, 0.22, 1] }}
          >
            <img src={phoneCategories} alt="Phone Categories" />
          </motion.div>

          {/* Center Phone (Most Prominent) */}
          <motion.div 
            className="hero-phone phone-center"
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
          >
            <img src={phoneFinance} alt="Phone Finance" />
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
