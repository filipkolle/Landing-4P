import React from 'react';
import { motion } from 'framer-motion';
import { Star, Apple, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import phoneMockup from '../assets/mockups/phone_3d_v2.png';

const SubscribeCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="subscribe-cta-section">
      <div className="container">
        <motion.div 
          className="subscribe-cta-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          style={{ overflow: 'hidden', padding: 0 }}
        >
          <div className="subscribe-grid" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="subscribe-content" style={{ flex: '1 1 300px', padding: '40px' }}>
              <div className="cta-badge animated-badge" style={{ width: 'fit-content' }}>
                <Star size={16} fill="currentColor" style={{ marginRight: '8px' }} />
                <span>Omejen dostop</span>
              </div>
              <h3 style={{ marginTop: '20px', marginBottom: '15px' }}><span className="highlight-blue">Bodi prvi</span>, ki uporablja Finance 4P</h3>
              <p style={{ marginBottom: '30px' }}>Aplikacija je že na voljo za iOS naprave, za Android pa se pridruži čakalni vrsti.</p>
              
              <div className="store-buttons" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="professional-cta-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: '#000', color: '#fff', border: 'none' }}
                >
                  <Apple size={24} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>Prenesi v</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.1 }}>App Store</span>
                  </div>
                </a>
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  className="professional-cta-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Play size={24} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>Za Android</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.1 }}>Pridruži se</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="subscribe-visual" style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: '20px' }}>
              <img 
                src={phoneMockup} 
                alt="Finance 4P App na telefonu" 
                style={{ maxHeight: '350px', objectFit: 'contain', marginBottom: '-20px' }} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscribeCTA;

