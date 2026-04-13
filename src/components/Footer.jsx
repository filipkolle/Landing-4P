import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo_full_v2.png';

const Footer = () => {
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
              <div className="logo-img-wrapper">
                <img src={logoImg} alt="Finance 4P Logo" className="logo-img" style={{ height: '40px' }} />
              </div>
            </div>
            <p>Vaš osebni asistent za finance in delo.</p>
          </div>
          
            <div className="footer-links">
              <div className="link-group">
                <h4>Projekt</h4>
                <Link to="/o-nas" className="footer-link-btn">O nas</Link>
              </div>
              <div className="link-group">
                <h4>Pravno</h4>
                <Link to="/pogojiposlovanja" className="footer-link-btn">Pogoji poslovanja</Link>
                <Link to="/politikazasebnosti" className="footer-link-btn">Politika zasebnosti</Link>
              </div>
              <div className="link-group">
                <h4>Kontakt</h4>
                <a href="mailto:info@finance4p.com" className="email-link">
                  <Mail size={16} />
                  <span>info@finance4p.com</span>
                </a>
                <a href="tel:070736947" className="email-link">
                  <Phone size={16} />
                  <span>070 736 947</span>
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
