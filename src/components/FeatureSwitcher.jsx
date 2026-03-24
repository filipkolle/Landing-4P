import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import workImg from '../assets/mockups/work.png';
import financeImg from '../assets/mockups/finance.png';
import dashboardImg from '../assets/mockups/dashboard.png';

const expoOut = [0.19, 1, 0.22, 1];

const FeatureSwitcher = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    {
      id: 'delo',
      label: 'Delovni asistent',
      title: 'Popoln nadzor nad delom',
      description: 'Sledite delovnim uram v realnem času, avtomatsko izračunajte zaslužek glede na vašo postavko in generirajte profesionalna mesečna poročila z enim klikom. Idealno za freelancerje in tiste, ki želijo optimizirati svoj delovni dan.',
      image: workImg
    },
    {
      id: 'finance',
      label: 'Finančni asistent',
      title: 'Vaše finance pod kontrolo',
      description: 'Pridobite celovit pregled nad vsemi prihodki, odhodki in naročninami na enem mestu. Aplikacija vam pomaga razumeti vaše potrošniške navade in vas vodi do boljših finančnih odločitev za prihodnost.',
      image: financeImg
    },
    {
      id: 'all',
      label: 'All in one',
      title: 'Vsa moč v eni aplikaciji',
      description: 'Zakaj bi uporabljali več orodij, če imate lahko vse na enem mestu? Finance 4P združuje sledenje delu in osebne finance v enotno, intuitivno izkušnjo, ki vam prihrani čas in denar.',
      image: dashboardImg
    }
  ];

  const activeContent = tabs.find(t => t.id === activeTab);

  return (
    <section className="feature-switcher section-padding">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
        >
          <span className="section-label">Prilagodljivo</span>
          <h2>Uporabi samo to, kar potrebuješ</h2>
          <p>Izberite način, ki najbolje ustreza vašemu delovnemu ritmu in osebnim financam.</p>
        </motion.div>

        <motion.div 
          className="switcher-tabs-centered"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: expoOut }}
        >
          <div className="tabs-capsule">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-capsule-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabBg"
                    className="active-bg"
                    transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="switcher-display-wrapper"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, delay: 0.2, ease: expoOut }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.5, ease: expoOut }}
              className="switcher-display-grid"
            >
              <div className="display-text">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <h3 className="display-title">{activeContent.title}</h3>
                  <p className="display-desc">{activeContent.description}</p>
                  
                  <div className="display-features">
                    <div className="display-feature-item">
                      <div className="feature-dot" />
                      <span>Intuitiven vmesnik</span>
                    </div>
                    <div className="display-feature-item">
                      <div className="feature-dot" />
                      <span>Varni podatki</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="display-mockup-wrapper">
                <motion.div
                  className="mockup-glass"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.8 }}
                >
                  <img src={activeContent.image} alt={activeContent.label} />
                  <div className="mockup-shadow" />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSwitcher;
