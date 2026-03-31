import React from 'react';
import logoImg from '../assets/logo_4p.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-left">
          <a href="/" className="logo-container">
            <span className="logo-text">Finance</span>
            <div className="logo-img-wrapper">
              <img src={logoImg} alt="4P Logo" className="navbar-logo-img" />
            </div>
          </a>
          
          <div className="navbar-menu">
            <a href="#funkcije" className="nav-link">Funkcije</a>
            <a href="#o-nas" className="nav-link">O nas</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
        </div>

        <div className="navbar-actions">
          <a href="/login" className="nav-link login-link">Prijava</a>
          <a
            href="#prenesi"
            className="navbar-cta-btn"
          >
            Brezplačen prenos
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
