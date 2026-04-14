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
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Vnesi veljaven e-poštni naslov.');
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

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setName('');
      } else {
        // Broad check for duplicates or any other error (user specifically wants duplicate message)
        const errorContent = JSON.stringify(data).toLowerCase();
        
        if (errorContent.includes('invalid') || response.status === 400) {
          setErrorMessage('Vnesi veljaven e-poštni naslov.');
        } else {
          // Default to the message the user wants most
          setErrorMessage('Ta naslov je že v čakalni vrsti!');
        }
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage('Težava s povezavo. Preveri internet.');
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

              <AnimatePresence mode="wait">
                {status !== 'success' ? (
                  <motion.form 
                    key="waitlist-form"
                    className="waitlist-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
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
                          disabled={status === 'loading'}
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
                          disabled={status === 'loading'}
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
                            disabled={status === 'loading'}
                          />
                          <span className="checkmark"></span>
                          <span className="consent-text">Želim prejemati obvestila o finančnih dogodkih in poučnih vsebinah</span>
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        className={`waitlist-submit ${status}`}
                        disabled={status === 'loading'}
                      >
                        {status === 'loading' ? (
                          <div className="spinner" />
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
                          <span>{errorMessage}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success-message"
                    className="waitlist-success-state"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <div className="success-icon-circle">
                      <Check size={40} strokeWidth={3} />
                    </div>
                    <h2>Uspešno si se pridružil čakalni vrsti!</h2>
                    <p>Kmalu boš prejel več informacij na svoj e-poštni naslov.</p>
                  </motion.div>
                )}
              </AnimatePresence>
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
