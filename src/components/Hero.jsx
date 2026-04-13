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

  // Desktop scroll animations
  const phoneOffset = 150;
  const leftPhoneXAnim = useTransform(smoothProgress, [0.1, 0.35], [phoneOffset, 0]);
  const leftPhoneOpacityAnim = useTransform(smoothProgress, [0, 0.1, 0.25], [0, 0, 1]);
  const leftPhoneRotateAnim = useTransform(smoothProgress, [0.1, 0.35], [0, -8]);
  
  const rightPhoneXAnim = useTransform(smoothProgress, [0.3, 0.55], [-phoneOffset, 0]);
  const rightPhoneOpacityAnim = useTransform(smoothProgress, [0, 0.3, 0.45], [0, 0, 1]);
  const rightPhoneRotateAnim = useTransform(smoothProgress, [0.3, 0.55], [0, 8]);

  const centerPhoneScale = useTransform(smoothProgress, [0, 0.3], [0.92, 1]);
  const centerPhoneOpacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);

  // On mobile: static values (no scroll animation)
  const leftPhoneX      = isMobile ? 0 : leftPhoneXAnim;
  const leftPhoneOpacity= isMobile ? 1 : leftPhoneOpacityAnim;
  const leftPhoneRotate = isMobile ? 0 : leftPhoneRotateAnim;

  const rightPhoneX      = isMobile ? 0 : rightPhoneXAnim;
  const rightPhoneOpacity= isMobile ? 1 : rightPhoneOpacityAnim;
  const rightPhoneRotate = isMobile ? 0 : rightPhoneRotateAnim;

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
              {!isMobile && (
                <motion.div 
                  className="phone-glow glow-blue" 
                  style={{ 
                    opacity: leftPhoneOpacityAnim, 
                    scale: leftPhoneOpacityAnim,
                    x: "-50%",
                    y: "-50%"
                  }}
                />
              )}
              <img src={phoneDelo} alt="Phone Delo" />
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-phone phone-center"
            initial={isMobile ? false : { opacity: 0, y: 120 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            style={{
              scale: isMobile ? 1 : centerPhoneScale,
              opacity: isMobile ? 1 : centerPhoneOpacity,
            }}
            transition={{ 
              duration: isMobile ? 0.01 : 1.2, 
              delay: 0,
              ease: [0.22, 1, 0.36, 1] 
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
              {!isMobile && (
                <motion.div 
                  className="phone-glow glow-green" 
                  style={{ 
                    opacity: rightPhoneOpacityAnim, 
                    scale: rightPhoneOpacityAnim,
                    x: "-50%",
                    y: "-50%"
                  }}
                />
              )}
              <img src={phoneCategories} alt="Phone Categories" />
            </motion.div>
          </motion.div>
        </div>
      </header>
    </div>
  );
};

export default Hero;
