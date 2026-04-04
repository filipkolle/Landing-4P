import React from 'react';
import logoImg from '../assets/logo_full_v2.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-left">
          <a href="/" className="logo-container">
            <div className="logo-img-wrapper">
              <img src={logoImg} alt="Finance 4P Logo" className="navbar-logo-img" style={{ height: '40px' }} />
            </div>
          </a>
          
          <div className="navbar-menu">
            <a href="/" className="nav-link">Domov</a>
            <a href="#o-nas" className="nav-link">O nas</a>
          </div>
        </div>

        <div className="navbar-actions">
          <a
            href="#naroci-se"
            className="navbar-cta-btn"
          >
            Naroči se
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
