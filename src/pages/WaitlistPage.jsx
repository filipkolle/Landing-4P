import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, AlertCircle, ArrowLeft, ArrowRight, Shield, Rocket, Clock, User } from 'lucide-react';
import logoImg from '../assets/logo_full_v2.png';
import { useNavigate } from 'react-router-dom';

const WaitlistPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name, 
          marketing 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setName('');
        setMarketing(false);
      } else {
        console.error('Waitlist error:', data.error);
        setStatus('error');
      }
    } catch (error) {
      console.error('Network error:', error);
      setStatus('error');
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] }
    }
  };

  return (
    <div className="waitlist-page-wrapper">
      <div className="waitlist-bg">
        <div className="waitlist-gradient" />
        <div className="waitlist-pattern" />
      </div>

      <nav className="waitlist-nav">
        <div className="container centered-nav">
          <img src={logoImg} alt="Finance 4P Logo" className="waitlist-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </div>
      </nav>

      <main className="waitlist-content">
        <div className="container">
          <motion.div 
            className="waitlist-card-container"
            variants={containerVars}
            initial="hidden"
            animate="visible"
          >
            <div className="waitlist-main-card">
              <motion.h1 variants={itemVars}>
                Bodi med <span className="highlight-waitlist">prvimi</span>, ki <br /> uporabljajo <span className="highlight-waitlist">Finance 4P</span>
              </motion.h1>
              
              <motion.p className="waitlist-subtitle" variants={itemVars}>
                Pridruži se čakalni vrsti in si zagotovi dostop do Finance 4P aplikacije še pred tem, ko bo na voljo širši javnosti.
              </motion.p>

              <motion.form 
                className={`waitlist-form ${status === 'success' ? 'success-mode' : ''}`}
                onSubmit={handleSubmit}
                variants={itemVars}
              >
                <div className="form-inputs-stack">
                  <div className="input-group">
                    <div className="input-icon">
                      <User size={20} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Ime in priimek" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={status === 'loading' || status === 'success'}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <div className="input-icon">
                      <Mail size={20} />
                    </div>
                    <input 
                      type="email" 
                      placeholder="E-poštni naslov" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === 'loading' || status === 'success'}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions-row">
                  <div className="consent-wrapper">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                        disabled={status === 'loading' || status === 'success'}
                      />
                      <span className="checkmark"></span>
                      <span className="consent-text">Želim prejemati obvestila o finančnih dogodkih in poučnih vsebinah</span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className={`waitlist-submit ${status}`}
                    disabled={status === 'loading' || status === 'success'}
                  >
                    {status === 'loading' ? (
                      <div className="spinner" />
                    ) : status === 'success' ? (
                      <Check size={20} />
                    ) : (
                      <>
                        <span>Pridruži se</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div 
                      className="form-feedback error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle size={16} />
                      <span>Vnesi veljaven e-poštni naslov.</span>
                    </motion.div>
                  )}
                  {status === 'success' && (
                    <motion.div 
                      className="form-feedback success"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Check size={16} />
                      <span>Odlično! Uspešno si se pridružil čakalni vrsti.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>

              <motion.div className="waitlist-benefits" variants={itemVars}>
                <div className="benefit-item">
                  <div className="benefit-dot" />
                  <span>Zgodnji dostop</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-dot" />
                  <span>Doživljenjske ugodnosti</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-dot" />
                  <span>Osebna pomoč pri nastavitvi</span>
                </div>
              </motion.div>
            </div>

            <motion.div className="waitlist-info-grid" variants={itemVars}>
              <div className="info-card">
                <Clock className="info-icon" />
                <h3>Prvi v vrsti</h3>
                <p>Uporabniki na čakalni vrsti bodo aplikacijo prejeli 2 tedna pred uradnim izidom.</p>
              </div>
              <div className="info-card">
                <Shield className="info-icon" />
                <h3>Varnost podatkov</h3>
                <p>Tvoji podatki so pri nas varni. Pošiljali ti bomo le pomembne novice o izidu.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <footer className="waitlist-footer">
        <p>&copy; 2024 Finance 4P. Vse pravice pridržane.</p>
      </footer>
    </div>
  );
};

export default WaitlistPage;
