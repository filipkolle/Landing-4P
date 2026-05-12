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
    let timeout;
    const debouncedCheck = () => {
      clearTimeout(timeout);
      timeout = setTimeout(checkMobile, 150);
    };
    window.addEventListener('resize', debouncedCheck);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', debouncedCheck);
    };
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

        {/* Hero CTA integrated for both Desktop & Mobile */}
        <motion.div 
          className="hero-cta-integrated"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ 
            marginTop: isMobile ? '20px' : '40px', 
            textAlign: 'center', 
            zIndex: 100,
            width: '100%',
            maxWidth: '800px',
            padding: isMobile ? '0 16px' : '0 20px'
          }}
        >
          <h2 style={{ 
            fontSize: isMobile ? '2.1rem' : '2.8rem', 
            fontWeight: 850, 
            marginBottom: isMobile ? '12px' : '16px', 
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#0c1e21'
          }}>
            <span className="highlight-blue">Uporabi svojega</span> Finance 4P asistenta.
          </h2>
          <p style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            color: 'var(--text-muted)', 
            marginBottom: isMobile ? '24px' : '32px', 
            lineHeight: 1.6,
            maxWidth: '650px',
            margin: '0 auto ' + (isMobile ? '24px' : '32px')
          }}>
            Brezplačno prenesi aplikacijo, izberi asistenta in prevzami nadzor nad svojim življenskim slogom!
          </p>
          <div className="hero-store-buttons" style={{ 
            display: 'flex', 
            gap: isMobile ? '10px' : '16px', 
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'nowrap'
          }}>
            <a 
              href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: isMobile ? '8px' : '12px', 
                textDecoration: 'none', 
                backgroundColor: '#000', 
                color: '#fff', 
                padding: isMobile ? '8px 12px' : '12px 20px',
                borderRadius: '16px',
                width: isMobile ? '160px' : '210px',
                height: isMobile ? '52px' : '64px',
                transition: 'transform 0.2s',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg viewBox="0 0 448 512" width={isMobile ? "28" : "34"} height={isMobile ? "28" : "34"}>
                <rect x="0" y="32" width="448" height="448" rx="100" fill="#fff"/>
                <path fill="#0A84FF" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM127 384.5c-5.5 9.6-17.8 12.8-27.3 7.3-9.6-5.5-12.8-17.8-7.3-27.3l14.3-24.7c16.1-4.9 29.3-1.1 39.6 11.4L127 384.5zm138.9-53.9H84c-11 0-20-9-20-20s9-20 20-20h51l65.4-113.2-20.5-35.4c-5.5-9.6-2.2-21.8 7.3-27.3 9.6-5.5 21.8-2.2 27.3 7.3l8.9 15.4 8.9-15.4c5.5-9.6 17.8-12.8 27.3-7.3 9.6 5.5 12.8 17.8 7.3 27.3l-85.8 148.6h62.1c20.2 0 31.5 23.7 22.7 40zm98.1 0h-29l19.6 33.9c5.5 9.6 2.2 21.8-7.3 27.3-9.6 5.5-21.8 2.2-27.3-7.3-32.9-56.9-57.5-99.7-74-128.1-16.7-29-4.8-58 7.1-67.8 13.1 22.7 32.7 56.7 58.9 102h52c11 0 20 9 20 20 0 11.1-9 20-20 20z"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: isMobile ? '0.6rem' : '0.8rem', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>Available on the</span>
                <span style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>App Store</span>
              </div>
            </a>

            <button 
              onClick={() => window.location.href='/cakalna-vrsta'}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: isMobile ? '8px' : '12px', 
                backgroundColor: '#000', 
                color: '#fff', 
                padding: isMobile ? '8px 12px' : '12px 20px',
                borderRadius: '16px',
                width: isMobile ? '160px' : '210px',
                height: isMobile ? '52px' : '64px',
                cursor: 'pointer',
                border: 'none',
                transition: 'transform 0.2s',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg viewBox="0 0 512 512" width={isMobile ? "24" : "30"} height={isMobile ? "24" : "30"} style={{ marginLeft: '4px' }}>
                <path fill="#4caf50" d="M47.7 29.5C41 33.7 36 41 36 50.8v410.4c0 9.8 5 17.1 11.7 21.3L253 277 47.7 29.5z"/>
                <path fill="#fbc02d" d="M336.8 378L253 277l83.8-101 64.9 36.8c18.5 10.5 18.5 27.6 0 38.1l-64.9 37.1z"/>
                <path fill="#e53935" d="M47.7 482.5c6.3 4 14.9 4 24.3-1.3l264.8-150.9L253 277 47.7 482.5z"/>
                <path fill="#2196f3" d="M72 30.8C62.6 25.5 54 25.5 47.7 29.5L253 277l83.8-101L72 30.8z"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: isMobile ? '0.6rem' : '0.8rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>GET IT ON</span>
                <span style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Google Play</span>
              </div>
            </button>
          </div>
        </motion.div>
      </header>
    </div>
  );
};

export default Hero;
