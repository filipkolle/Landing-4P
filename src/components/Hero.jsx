import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import phone3D from '../assets/mockups/hero_selection_mockup.png';

const expoOut = [0.19, 1, 0.22, 1];

const Hero = () => {
  const containerRef = useRef(null);
  const title = "Osebni asistent v tvojem žepu.";
  const words = title.split(" ");

  // Mouse move effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const orbX1 = useTransform(springX, [-0.5, 0.5], [-40, 40]);
  const orbY1 = useTransform(springY, [-0.5, 0.5], [-40, 40]);
  const orbX2 = useTransform(springX, [-0.5, 0.5], [30, -30]);
  const orbY2 = useTransform(springY, [-0.5, 0.5], [30, -30]);

  const containerVars = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
  };

  const wordVars = {
    hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
    visible: {
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: { ease: expoOut, duration: 0.9 }
    }
  };

  return (
    <header className="hero" ref={containerRef} onMouseMove={handleMouseMove}>
      {/* Dynamic background */}
      <div className="hero-bg">
        <div className="hero-bg-gradient" />
        <motion.div 
          className="hero-orb orb-1" 
          style={{ x: orbX1, y: orbY1 }}
          animate={{ opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="hero-orb orb-2"
          style={{ x: orbX2, y: orbY2 }}
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="hero-orb orb-3" />
        <div className="hero-dots" />
      </div>

      <div className="container">
        {/* LEFT: Text content */}
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: expoOut }}
          >
            <Sparkles size={14} />
            Nova verzija aplikacije je živa
          </motion.div>

          <motion.h1
            variants={containerVars}
            initial="hidden"
            animate="visible"
            style={{ wordBreak: 'break-word' }}
          >
            {words.map((word, i) => {
              const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
              const isHighlight = ["asistent", "žepu"].includes(cleanWord.toLowerCase());
              return (
                <motion.span
                  key={i}
                  variants={wordVars}
                  className={isHighlight ? "highlight" : ""}
                  style={{ display: 'inline-block', marginRight: '0.28em' }}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.8, ease: expoOut }}
          >
            Imej pregled nad svojo porabo denarja, svojim delom in izračunaj svojo
            neto vrednost, ki ti bo pomagala pri sprejemanju boljših finančnih odločitev.
          </motion.p>

          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.1, ease: expoOut }}
          >
            <a href="#" className="btn-app">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>
                <span className="small">Prenesi v</span>
                <span className="large">App Store</span>
              </span>
            </a>
            <a href="#" className="btn-app">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M3.18 23.76c.37.2.8.21 1.2.02l12.15-6.63-2.62-2.61-10.73 9.22zm-1.5-20.89C1.42 3.2 1.25 3.64 1.25 4.16v15.68c0 .52.17.96.43 1.29l.07.07 8.79-8.8v-.2l-8.86-8.33zm14.96 11.2l-2.94-2.94v-.2L16.64 8l.2.12 3.48 1.98c.99.56.99 1.48 0 2.05l-3.68 2.92zM4.38.22L16.53 6.87l-2.62 2.62L3.18.27C3.58.08 4.01.09 4.38.22z"/>
              </svg>
              <span>
                <span className="small">Prenesi v</span>
                <span className="large">Google Play</span>
              </span>
            </a>
          </motion.div>

          <motion.div
            className="hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
          >
            <div className="hero-trust-dots">
              {[1,2,3,4].map(n => (
                <motion.div 
                   key={n} 
                   className="hero-trust-dot"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 1.3 + (n * 0.1) }}
                />
              ))}
            </div>
            <span>Tisoči uporabnikov že zaupajo Finance 4P</span>
          </motion.div>
        </div>

        {/* RIGHT: 3D Phone mockup */}
        <motion.div
          className="hero-mockup"
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.5, delay: 0.4, ease: expoOut }}
        >
          {/* Stat card 1 */}
          <motion.div
            className="stat-card stat-1"
            initial={{ opacity: 0, x: -30, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1.6, type: 'spring', damping: 14, stiffness: 200 }}
          >
            <div className="stat-card-icon green">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="stat-card-label">Mesečni prihranek</div>
              <div className="stat-card-value text-green-highlight">+320 €</div>
            </div>
          </motion.div>

          {/* Stat card 2 */}
          <motion.div
            className="stat-card stat-2"
            initial={{ opacity: 0, x: 30, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1.8, type: 'spring', damping: 14, stiffness: 200 }}
          >
            <div className="stat-card-icon blue">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="stat-card-label">Neto vrednost</div>
              <div className="stat-card-value text-blue-highlight">142.980 €</div>
            </div>
          </motion.div>

          <motion.div 
            className="phone-3d-wrapper"
            whileHover={{ scale: 1.02, rotateY: 5 }}
            transition={{ duration: 0.8, ease: expoOut }}
          >
            <img src={phone3D} alt="Finance 4P aplikacija" />
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
};

export default Hero;

