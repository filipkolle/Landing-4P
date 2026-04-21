import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        >
          <div className="subscribe-grid">
            <div className="subscribe-content">
              <div className="cta-badge animated-badge" style={{ width: 'fit-content' }}>
                <Star size={16} fill="currentColor" style={{ marginRight: '8px' }} />
                <span>Omejen dostop</span>
              </div>
              <p>Pridruži se čakalni vrsti in bodi med prvimi, ki bodo uporabljali aplikacijo.</p>
            </div>
            
            <div className="subscribe-actions">
              <button 
                onClick={() => navigate('/cakalna-vrsta')}
                className="professional-cta-btn"
              >
                <span>Pridruži se!</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscribeCTA;
