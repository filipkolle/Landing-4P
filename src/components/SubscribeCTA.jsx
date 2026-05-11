import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import phoneMockup from '../assets/mockups/phone_3d_v2.png';
import appStoreBadge from '../assets/app_store_badge.png';
import androidBadge from '../assets/android_badge.png';

const SubscribeCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="subscribe-cta-section">
      <div className="container">
        <motion.div 
          className="subscribe-cta-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          style={{ overflow: 'hidden', padding: 0 }}
        >
          <div className="subscribe-grid" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div className="subscribe-content" style={{ maxWidth: '600px', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                <span className="highlight-blue">Bodi prvi</span>, ki uporablja Finance 4P
              </h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
                Aplikacija je že na voljo za iOS naprave, za Android pa se pridruži čakalni vrsti.
              </p>
              
              <div className="store-buttons" style={{ 
                display: 'flex', 
                gap: '15px', 
                flexWrap: 'nowrap', 
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: '10px'
              }}>
                {/* Official App Store Button */}
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={appStoreBadge} 
                    alt="Download on the App Store" 
                    style={{ height: '70px', width: 'auto', objectFit: 'contain' }}
                  />
                </a>

                {/* Official-looking Play Store Button (Join Waitlist) */}
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={androidBadge} 
                    alt="Za Android Pridruži se" 
                    style={{ height: '70px', width: 'auto', objectFit: 'contain' }}
                  />
                </button>
              </div>
            </div>
            
            <div className="subscribe-visual" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img 
                src={phoneMockup} 
                alt="Finance 4P App" 
                style={{ 
                  width: '100%',
                  maxWidth: '320px', 
                  height: 'auto',
                  objectFit: 'contain'
                }} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscribeCTA;


