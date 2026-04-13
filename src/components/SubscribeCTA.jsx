import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, AlertCircle, ArrowRight } from 'lucide-react';

const SubscribeCTA = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 2000);
  };

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
              <h3>Bodi med prvimi v vrsti</h3>
              <p>Pridruži se čakalni vrsti in bodi med prvimi, ki bodo preizkusili našo aplikacijo.</p>
            </div>
            
            <form className={`subscribe-form ${status === 'success' ? 'success' : ''}`} onSubmit={handleSubmit}>
              <div className="subscribe-input-wrapper">
                <div className="subscribe-input-icon">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  placeholder="Vnesi svoj e-poštni naslov" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  required
                />
                <button 
                  type="submit" 
                  className={`subscribe-submit-btn ${status}`}
                  disabled={status === 'loading' || status === 'success'}
                >
                  {status === 'loading' ? (
                    <div className="subscribe-spinner" />
                  ) : status === 'success' ? (
                    <Check size={18} />
                  ) : (
                    <>
                      <span>Pridruži se</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {status === 'error' && (
                  <motion.div 
                    className="subscribe-feedback error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle size={14} />
                    <span>Vnesi veljaven e-poštni naslov.</span>
                  </motion.div>
                )}
                {status === 'success' && (
                  <motion.div 
                    className="subscribe-feedback success"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Check size={14} />
                    <span>Odlično! Uspešno dodan.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscribeCTA;
