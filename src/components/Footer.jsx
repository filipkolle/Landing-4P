import React from 'react';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo_4p.png';

const Footer = ({ onOpenPrivacy }) => {
  return (
    <footer className="footer">
      <motion.div 
        className="container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      >
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-container">
              <span className="logo-text">Finance</span>
              <div className="logo-img-wrapper">
                <img src={logoImg} alt="4P Logo" className="logo-img" style={{ height: '30px' }} />
              </div>
            </div>
            <p>Vaš osebni asistent za finance in delo.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Pravno</h4>
              <a href="#">Pogoji poslovanja</a>
              <button className="footer-link-btn" onClick={onOpenPrivacy}>Politika zasebnosti</button>
            </div>
            <div className="link-group">
              <h4>Kontakt</h4>
              <a href="mailto:info@finance4p.com" className="email-link">
                <Mail size={16} />
                <span>info@finance4p.com</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Finance 4P. Vse pravice pridržane.</p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
