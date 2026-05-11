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
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px', 
                    textDecoration: 'none', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '10px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '190px',
                    height: '65px',
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 384 512" width="32" height="32" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.02em', opacity: 0.9 }}>Download on the</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>App Store</span>
                  </div>
                </a>

                {/* Official-looking Play Store Button (Join Waitlist) */}
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '10px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '190px',
                    height: '65px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 512 512" width="30" height="30">
                    <path fill="#4caf50" d="M47.7 29.5C41 33.7 36 41 36 50.8v410.4c0 9.8 5 17.1 11.7 21.3L253 277 47.7 29.5z"/>
                    <path fill="#fbc02d" d="M336.8 378L253 277l83.8-101 64.9 36.8c18.5 10.5 18.5 27.6 0 38.1l-64.9 37.1z"/>
                    <path fill="#e53935" d="M47.7 482.5c6.3 4 14.9 4 24.3-1.3l264.8-150.9L253 277 47.7 482.5z"/>
                    <path fill="#2196f3" d="M72 30.8C62.6 25.5 54 25.5 47.7 29.5L253 277l83.8-101L72 30.8z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.02em', opacity: 0.9 }}>Za Android</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Pridruži se</span>
                  </div>
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


