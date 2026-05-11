import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import workImg from '../assets/mockups/work_v5.png';
import financeImg from '../assets/mockups/finance_v4.png';
import dashboardImg from '../assets/mockups/dashboard_v3.png';

// Preload images so tab switches never wait on network
const PRELOAD_SRCS = [workImg, financeImg, dashboardImg];
if (typeof window !== 'undefined') {
  PRELOAD_SRCS.forEach(src => { const i = new Image(); i.src = src; });
}

const tabs = [
  {
    id: 'delo',
    label: 'Delovni asistent',
    title: 'Optimizacija delovnega procesa',
    description: '',
    image: workImg,
    features: [
      'Spremljanje delovnega časa',
      'Izračun in primerjanje zaslužka',
      'Izvoz delovnih ur v pdf dokument',
    ],
  },
  {
    id: 'finance',
    label: 'Finančni asistent',
    title: 'Celovit nadzor nad financami',
    description: '',
    image: financeImg,
    features: [
      'Spremljanje prihodka in stroškov',
      'Izračun denarnega toka',
      'Finančna analitika',
    ],
  },
  {
    id: 'all',
    label: '4P asistent',
    title: 'Vsa moč v eni intuitivni aplikaciji',
    description: '',
    image: dashboardImg,
    features: [
      'Popoln pregled nad delom in financami',
      'Napredna finančna analitika',
      'Izračun vaše neto vrednosti',
    ],
  },
];

const themes = {
  delo:    { color: '#5E8DB2' },
  finance: { color: '#7CB483' },
  all:     { color: '#1A365D' },
};

const SLIDE_EASE = [0.22, 1, 0.36, 1];
const SLIDE_DUR  = 0.75;

// Text always slides in from the LEFT edge and exits back to the LEFT
const textVariants = {
  enter:  { x: -140, opacity: 0 },
  center: { x: 0,    opacity: 1 },
  exit:   { x: -140, opacity: 0 },
};

// Mockup always slides in from the RIGHT edge and exits back to the RIGHT
const mockupVariants = {
  enter:  { x: 140,  opacity: 0 },
  center: { x: 0,    opacity: 1 },
  exit:   { x: 140,  opacity: 0 },
};

const FeatureSwitcher = () => {
  const [activeIdx, setActiveIdx] = useState(2); // start on '4P asistent'

  const handleTabClick = useCallback((idx) => {
    setActiveIdx(idx);
  }, []);

  const tab         = tabs[activeIdx];
  const activeColor = themes[tab.id].color;

  const transition = {
    duration: SLIDE_DUR,
    ease: SLIDE_EASE,
  };

  return (
    <section className="feature-switcher section-padding">
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>

        {/* Section header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: SLIDE_EASE }}
        >
          <h2>Uporabi samo to, kar <br /><span className="highlight-blue">potrebuješ</span></h2>
        </motion.div>

        {/* Tabs */}
        <div className="switcher-tabs-centered">
          <motion.div
            className="tabs-capsule"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: SLIDE_EASE }}
          >
            {tabs.map((t, idx) => (
              <button
                key={t.id}
                className={`tab-capsule-btn ${activeIdx === idx ? 'active' : ''}`}
                onClick={() => handleTabClick(idx)}
                style={{ color: activeIdx === idx ? themes[t.id].color : 'inherit' }}
              >
                {activeIdx === idx && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="active-bg"
                    style={{
                      backgroundColor: `${themes[t.id].color}15`,
                      border: `1px solid ${themes[t.id].color}30`,
                    }}
                    transition={{ type: 'spring', duration: 0.8, bounce: 0.2 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2 }}>{t.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* Content + Mockup grid — clipped so panels slide in/out of view */}
        <div className="switcher-display-grid">

          {/* ── Text: slides from LEFT ── */}
          <div className="display-content-wrapper switcher-clip">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab.id}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="display-header">
                  <h3 className="display-title" style={{ color: activeColor }}>
                    {tab.title}
                  </h3>
                </div>
                <div className="display-body">
                  <p className="display-desc">{tab.description}</p>
                  <div className="display-features">
                    {tab.features.map((feature, i) => (
                      <div key={i} className="display-feature-item">
                        <div className="feature-dot" style={{ background: activeColor }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Mockup: slides from RIGHT ── */}
          <div className="display-mockup-wrapper switcher-clip">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab.id}
                className="mockup-glass"
                variants={mockupVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                style={{ willChange: 'transform, opacity' }}
              >
                <img src={tab.image} alt={tab.label} loading="eager" decoding="async" />
                <div
                  className="mockup-shadow"
                  style={{
                    background: `radial-gradient(ellipse at center, ${activeColor}20 0%, transparent 70%)`,
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureSwitcher;
