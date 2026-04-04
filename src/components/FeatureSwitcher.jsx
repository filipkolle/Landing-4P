import React, { useState } from 'react';
// Triggering rebuild with new mockups v2
import { motion, AnimatePresence } from 'framer-motion';
import workImg from '../assets/mockups/work_v3.png';
import financeImg from '../assets/mockups/finance_v3.png';
import dashboardImg from '../assets/mockups/dashboard_v3.png';

const expoOut = [0.19, 1, 0.22, 1];

const FeatureSwitcher = () => {
  const [activeTab, setActiveTab] = useState('all');

  const themes = {
    delo: { color: '#5E8DB2' },
    finance: { color: '#7CB483' },
    all: { color: '#1A365D' } // Proper Dark Blue, not black
  };

  const tabs = [
    {
      id: 'delo',
      label: 'Delovni asistent',
      title: 'Optimizacija delovnega procesa',
      description: 'Sledite delovnim uram v realnem času, avtomatsko izračunajte zaslužek glede na vašo postavko in generirajte profesionalna mesečna poročila z enim klikom.',
      image: workImg
    },
    {
      id: 'finance',
      label: 'Finančni asistent',
      title: 'Celovit nadzor nad financami',
      description: 'Pridobite celovit pregled nad vsemi prihodki, odhodki in naročninami na enem mestu. Aplikacija vam pomaga razumeti vaše potrošniške navade.',
      image: financeImg
    },
    {
      id: 'all',
      label: '4P asistent',
      title: 'Vsa moč v eni intuitivni aplikaciji',
      description: 'Poenostavite svoje življenje. Finance 4P združuje sledenje delu in osebne finance v enotno, premium izkušnjo, ki vam prihrani čas.',
      image: dashboardImg
    }
  ];

  const activeContent = tabs.find(t => t.id === activeTab);
  const activeColor = themes[activeTab].color;

  return (
    <section className="feature-switcher section-padding">
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
        >
          <h2>Uporabi samo to, kar potrebuješ</h2>
          <p>Izberite način, ki najbolje ustreza vašemu delovnemu ritmu in osebnim financam.</p>
        </motion.div>

        <div className="switcher-display-grid">
          <div className="display-text">
            {/* Static Toggle */}
            <motion.div 
              className="tabs-capsule" 
              style={{ marginBottom: '40px' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: expoOut }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-capsule-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ color: activeTab === tab.id ? activeColor : 'inherit' }}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabBg"
                      className="active-bg"
                      transition={{ type: 'spring', duration: 0.8, bounce: 0.2 }}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.5, ease: expoOut }}
              >
                <h3 className="display-title" style={{ color: activeColor }}>{activeContent.title}</h3>
                <p className="display-desc">{activeContent.description}</p>
                
                <div className="display-features">
                  <div className="display-feature-item">
                    <div className="feature-dot" style={{ background: activeColor }} />
                    <span>Intuitiven vmesnik</span>
                  </div>
                  <div className="display-feature-item">
                    <div className="feature-dot" style={{ background: activeColor }} />
                    <span>Varni podatki</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="display-mockup-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="mockup-glass"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: expoOut }}
              >
                <img src={activeContent.image} alt={activeContent.label} />
                <div 
                  className="mockup-shadow" 
                  style={{ 
                    background: `radial-gradient(ellipse at center, ${activeColor}20 0%, transparent 70%)` 
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
