import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import phoneDelo from '../assets/mockups/hero_phone_delo.png';
import phoneFinance from '../assets/mockups/hero_phone_finance_dark.png';
import phoneCategories from '../assets/mockups/hero_phone_categories.png';

const Hero = () => {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Responsive values
  const phoneOffset = isMobile ? 80 : 150;
  const deloLabelX = isMobile ? 300 : 240;
  const financeLabelX = isMobile ? 1140 : 1200;
  const labelY = isMobile ? 150 : 550;

  // Phases and Transformations - Significantly delayed side phones to ensure center priority
  const leftPhoneX = useTransform(scrollYProgress, [0.3, 0.55], [phoneOffset, 0]);
  const leftPhoneOpacity = useTransform(scrollYProgress, [0, 0.3, 0.45], [0, 0, 1]);
  const leftPhoneRotate = useTransform(scrollYProgress, [0.3, 0.55], [0, -8]);
  const leftLineLength = useTransform(scrollYProgress, [0.4, 0.65], [0, 1]);
  const leftLabelOpacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);

  const rightPhoneX = useTransform(scrollYProgress, [0.7, 0.95], [-phoneOffset, 0]);
  const rightPhoneOpacity = useTransform(scrollYProgress, [0, 0.7, 0.85], [0, 0, 1]);
  const rightPhoneRotate = useTransform(scrollYProgress, [0.7, 0.95], [0, 8]);
  const rightLineLength = useTransform(scrollYProgress, [0.8, 0.98], [0, 1]);
  const rightLabelOpacity = useTransform(scrollYProgress, [0.9, 0.98], [0, 1]);

  return (
    <div ref={containerRef} className="hero-scroll-wrapper">
      <header className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-overlay" />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content-centered">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Osebni <span className="highlight-blue">asistent</span> v<br />
              tvojem <span className="highlight-green">žepu</span>
            </motion.h1>
          </div>

          <div className="hero-phones-container">
            <motion.div 
              className="hero-phone phone-left"
              initial={{ opacity: 0 }}
              style={{ 
                opacity: leftPhoneOpacity, 
                x: leftPhoneX, 
                rotate: leftPhoneRotate,
                y: isMobile ? 0 : 40 
              }}
            >
              <motion.div 
                className="phone-glow glow-blue" 
                style={{ opacity: leftPhoneOpacity, scale: leftPhoneOpacity }}
              />
              <img src={phoneDelo} alt="Phone Delo" />
            </motion.div>

            <motion.div 
              className="hero-phone phone-center"
              initial={{ opacity: 0, y: isMobile ? 120 : 180, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0,
                ease: "linear"
              }}
            >
              <img src={phoneFinance} alt="Phone Finance" />
            </motion.div>

            <motion.div 
              className="hero-phone phone-right"
              initial={{ opacity: 0 }}
              style={{ 
                opacity: rightPhoneOpacity, 
                x: rightPhoneX, 
                rotate: rightPhoneRotate,
                y: isMobile ? 0 : 40 
              }}
            >
              <motion.div 
                className="phone-glow glow-green" 
                style={{ opacity: rightPhoneOpacity, scale: rightPhoneOpacity }}
              />
              <img src={phoneCategories} alt="Phone Categories" />
            </motion.div>
          </div>
        </div>

        <svg className="hero-curves" viewBox="0 0 1440 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path 
            id="curve-left"
            d="M-200,600 C0,600 150,550 150,450 C150,350 50,350 50,450 C50,550 150,600 720,700" 
            stroke="#5E8DB2" 
            strokeWidth="24" 
            strokeLinecap="round" 
            style={{ pathLength: leftLineLength }}
          />
          <motion.path 
            id="curve-right"
            d="M1640,600 C1440,600 1290,550 1290,450 C1290,350 1390,350 1390,450 C1390,550 1290,600 720,700" 
            stroke="#7CB483" 
            strokeWidth="24" 
            strokeLinecap="round" 
            style={{ pathLength: rightLineLength }}
          />
        </svg>

        <svg className="hero-labels" viewBox="0 0 1440 1000" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 100 }}>
          <motion.text 
            x={deloLabelX} y={labelY} 
            fill="#5E8DB2" 
            fontSize="56" 
            fontWeight="900" 
            letterSpacing="-0.04em"
            transform={`rotate(-20, ${deloLabelX}, ${labelY})`}
            style={{ opacity: leftLabelOpacity }}
          >
            Delo
          </motion.text>

          <motion.text 
            x={financeLabelX} y={labelY} 
            fill="#7CB483" 
            fontSize="56" 
            fontWeight="900" 
            letterSpacing="-0.04em"
            transform={`rotate(20, ${financeLabelX}, ${labelY})`}
            style={{ opacity: rightLabelOpacity }}
            textAnchor={isMobile ? "middle" : "end"}
          >
            Finance
          </motion.text>
        </svg>
      </header>
    </div>
  );
};

export default Hero;
