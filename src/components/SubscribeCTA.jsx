import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import phoneMockup from '../assets/mockups/phone_3d_v2.png';

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
                gap: '12px', 
                flexWrap: 'wrap', 
                justifyContent: 'center' 
              }}>
                {/* Official App Store Button */}
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    textDecoration: 'none', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '170px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Apple size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', lineHeight: 1 }}>Download on the</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.1 }}>App Store</span>
                  </div>
                </a>

                {/* Official-looking Play Store Button (Join Waitlist) */}
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '170px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Play size={24} fill="white" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', lineHeight: 1 }}>Za Android</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.1 }}>Pridruži se</span>
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


