import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
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

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Responsive values
  const phoneOffset = isMobile ? 70 : 150;

  // Desktop scroll animations
  const leftPhoneX = useTransform(smoothProgress, [0.05, 0.3], [phoneOffset, 0]);
  const leftPhoneOpacity = useTransform(smoothProgress, [0, 0.05, 0.25], [0, 0, 1]);
  const leftPhoneRotate = useTransform(smoothProgress, [0.05, 0.3], [0, isMobile ? -5 : -8]);
  
  const rightPhoneX = useTransform(smoothProgress, [0.35, 0.6], [-phoneOffset, 0]);
  const rightPhoneOpacity = useTransform(smoothProgress, [0, 0.35, 0.55], [0, 0, 1]);
  const rightPhoneRotate = useTransform(smoothProgress, [0.35, 0.6], [0, isMobile ? 5 : 8]);

  // Central phone (now persistent)
  const centerPhoneScale = 1;
  const centerPhoneOpacity = 1;

  return (
    <div ref={containerRef} className="hero-scroll-wrapper">
      <header className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-overlay" />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content-centered">
            <motion.h1
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Osebni <span className="highlight-blue">asistent</span> v<br />
              tvojem <span className="highlight-blue">žepu</span>
            </motion.h1>
          </div>
        </div>

        <div className="hero-phones-container">
          <motion.div 
            className="hero-phone phone-left"
            style={{ 
              opacity: leftPhoneOpacity, 
              x: leftPhoneX, 
              y: 0 
            }}
          >
            <motion.div className="hero-phone-label highlight-blue">
              Delo
            </motion.div>
            <motion.div 
              style={{ rotate: leftPhoneRotate }}
            >
              <motion.div 
                className="phone-glow glow-blue" 
                style={{ 
                  opacity: leftPhoneOpacity, 
                  scale: leftPhoneOpacity,
                  x: "-50%",
                  y: "-50%"
                }}
              />
              <img src={phoneDelo} alt="Phone Delo" />
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-phone phone-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              scale: centerPhoneScale,
              opacity: centerPhoneOpacity,
            }}
          >
            <img src={phoneFinance} alt="Phone Finance" />
          </motion.div>

          <motion.div 
            className="hero-phone phone-right"
            style={{ 
              opacity: rightPhoneOpacity, 
              x: rightPhoneX, 
              y: 0 
            }}
          >
            <motion.div className="hero-phone-label highlight-green">
              Finance
            </motion.div>
            <motion.div 
              style={{ rotate: rightPhoneRotate }}
            >
              <motion.div 
                className="phone-glow glow-green" 
                style={{ 
                  opacity: rightPhoneOpacity, 
                  scale: rightPhoneOpacity,
                  x: "-50%",
                  y: "-50%"
                }}
              />
              <img src={phoneCategories} alt="Phone Categories" />
            </motion.div>
          </motion.div>
        </div>
      </header>
    </div>
  );
};

export default Hero;
