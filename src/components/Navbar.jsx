import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo_full_v2.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo-container">
          <div className="logo-img-wrapper">
            <img src={logoImg} alt="Finance 4P Logo" className="navbar-logo-img" />
          </div>
        </Link>
        
        <div className="navbar-actions">
          <div className="navbar-menu">
            <Link to="/" className="nav-link">Domov</Link>
            <Link to="/o-nas" className="nav-link">O nas</Link>
          </div>
          <Link
            to="/cakalna-vrsta"
            className="navbar-cta-btn"
          >
            Pridruži se
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
