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

  // Phases and Transformations
  const leftPhoneX = useTransform(scrollYProgress, [0.1, 0.45], [phoneOffset, 0]);
  const leftPhoneOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const leftPhoneRotate = useTransform(scrollYProgress, [0.1, 0.45], [0, -8]);

  const rightPhoneX = useTransform(scrollYProgress, [0.55, 0.9], [-phoneOffset, 0]);
  const rightPhoneOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const rightPhoneRotate = useTransform(scrollYProgress, [0.55, 0.9], [0, 8]);

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
              transition={{ duration: 1, delay: 0.2 }}
            >
              Osebni <span className="highlight-blue">asistent</span> v<br />
              tvojem <span className="highlight-green">žepu</span>
            </motion.h1>
          </div>

          <div className="hero-phones-container">
            <motion.div 
              className="hero-phone phone-left"
              style={{ 
                opacity: leftPhoneOpacity, 
                x: leftPhoneX, 
                rotate: leftPhoneRotate,
                y: isMobile ? 0 : 40 
              }}
            >
              <img src={phoneDelo} alt="Phone Delo" />
            </motion.div>

            <motion.div 
              className="hero-phone phone-center"
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <img src={phoneFinance} alt="Phone Finance" />
            </motion.div>

            <motion.div 
              className="hero-phone phone-right"
              style={{ 
                opacity: rightPhoneOpacity, 
                x: rightPhoneX, 
                rotate: rightPhoneRotate,
                y: isMobile ? 0 : 40 
              }}
            >
              <img src={phoneCategories} alt="Phone Categories" />
            </motion.div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Hero;
