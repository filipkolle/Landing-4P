import React from 'react';
import logoImg from '../assets/logo_4p.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <a href="/" className="logo-container">
          <span className="logo-text">Finance</span>
          <div className="logo-img-wrapper">
            <img src={logoImg} alt="4P Logo" style={{ height: '30px', width: 'auto' }} />
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="#prenesi"
            style={{
              padding: '10px 22px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.19,1,0.22,1)',
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 20px rgba(94,141,178,0.35)'; }}
            onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = ''; }}
          >
            Prenesi brezplačno
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
