import React from 'react';
import logoImg from '../assets/logo_4p.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <a href="/" className="logo-container">
          <span className="logo-text">Finance</span>
          <div className="logo-img-wrapper">
            <img src={logoImg} alt="4P Logo" className="navbar-logo-img" />
          </div>
        </a>
        <div className="navbar-actions">
          <a
            href="#prenesi"
            className="navbar-cta-btn"
          >
            Prenesi Brezplačno
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
