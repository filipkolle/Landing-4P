import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SubscribeCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="subscribe-cta-section" style={{ padding: '60px 0' }}>
      <div className="container" style={{ padding: '0 20px' }}>
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
            padding: '20px'
          }}>
            <div className="subscribe-content" style={{ maxWidth: '550px', width: '100%' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '12px', lineHeight: 1.2 }}>
                <span className="highlight-blue">Bodi prvi</span>, ki uporablja Finance 4P
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '25px', lineHeight: 1.5 }}>
                Aplikacija je že na voljo za iOS naprave, za Android pa se pridruži čakalni vrsti.
              </p>
                          <div className="store-buttons" style={{ 
                display: 'flex', 
                gap: '10px', 
                flexWrap: 'nowrap', 
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: '10px'
              }}>
                {/* Requested App Store Button */}
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px', 
                    textDecoration: 'none', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '6px 12px 6px 8px',
                    borderRadius: '10px',
                    width: '160px',
                    height: '48px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 448 512" width="28" height="28">
                    <rect x="0" y="32" width="448" height="448" rx="100" fill="#fff"/>
                    <path fill="#0A84FF" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM127 384.5c-5.5 9.6-17.8 12.8-27.3 7.3-9.6-5.5-12.8-17.8-7.3-27.3l14.3-24.7c16.1-4.9 29.3-1.1 39.6 11.4L127 384.5zm138.9-53.9H84c-11 0-20-9-20-20s9-20 20-20h51l65.4-113.2-20.5-35.4c-5.5-9.6-2.2-21.8 7.3-27.3 9.6-5.5 21.8-2.2 27.3 7.3l8.9 15.4 8.9-15.4c5.5-9.6 17.8-12.8 27.3-7.3 9.6 5.5 12.8 17.8 7.3 27.3l-85.8 148.6h62.1c20.2 0 31.5 23.7 22.7 40zm98.1 0h-29l19.6 33.9c5.5 9.6 2.2 21.8-7.3 27.3-9.6 5.5-21.8 2.2-27.3-7.3-32.9-56.9-57.5-99.7-74-128.1-16.7-29-4.8-58 7.1-67.8 13.1 22.7 32.7 56.7 58.9 102h52c11 0 20 9 20 20 0 11.1-9 20-20 20z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.55rem', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>Available on the</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>App Store</span>
                  </div>
                </a>

                {/* Requested Google Play Button */}
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '6px 12px 6px 8px',
                    borderRadius: '10px',
                    width: '160px',
                    height: '48px',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 512 512" width="24" height="24" style={{ marginLeft: '4px' }}>
                    <path fill="#4caf50" d="M47.7 29.5C41 33.7 36 41 36 50.8v410.4c0 9.8 5 17.1 11.7 21.3L253 277 47.7 29.5z"/>
                    <path fill="#fbc02d" d="M336.8 378L253 277l83.8-101 64.9 36.8c18.5 10.5 18.5 27.6 0 38.1l-64.9 37.1z"/>
                    <path fill="#e53935" d="M47.7 482.5c6.3 4 14.9 4 24.3-1.3l264.8-150.9L253 277 47.7 482.5z"/>
                    <path fill="#2196f3" d="M72 30.8C62.6 25.5 54 25.5 47.7 29.5L253 277l83.8-101L72 30.8z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>GET IT ON</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Google Play</span>
                  </div>
                </button>
              </div>iv>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscribeCTA;


