import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Award, Rocket, Check, Mail, Handshake, Heart, MessageCircle, Users, ArrowRight, Clock, Wallet, Apple, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import logoImg from '../assets/logo_full_v2.png';
import ctaWomanImg from '../assets/cta_woman_v2.png';

import Footer from '../components/Footer';
import founderImg from '../assets/founder.jpg';
import signatureImg from '../assets/signature.png';
import '../styles/About.css';

const expoOut = [0.19, 1, 0.22, 1];

// Essential Icon Components
const Eye = ({ size, color }) => (
  <div style={{ color: color || 'var(--primary)', display: 'flex', alignItems: 'center' }}>
    <Rocket size={size} />
  </div>
);

const AboutPage = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1500);
  };

  return (
    <div className="about-page-wrapper">
      <Navbar />
      
      {/* 1. Hook / Hero */}
      <section className="about-hero">
        <div className="hero-blobs aurora-bg">
          <div className="aurora-blob aurora-1"></div>
          <div className="aurora-blob aurora-2"></div>
          <div className="aurora-blob aurora-3"></div>
          <div className="aurora-blob aurora-4"></div>
        </div>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: expoOut }}
            className="about-hero-container"
          >
            <h1>Finance za <span className="blue-text">ljudi!</span></h1>
            <div className="about-hero-content">
              <p className="hook-desc">
                Zgodba o digitalnem asistentu, ustvarjenem, da povrne nadzor tistim, ki cenijo svoj čas in trdo prislužen denar.
              </p>
            </div>
          </motion.div>
        </div>
      </section>



      {/* 2. Poslanstvo: Zakaj Finance 4P ni le "še ena aplikacija" */}
      <section className="mission-section">
        <div className="container">
          <motion.div 
            className="mission-intro"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, ease: expoOut }}
          >
            <h2><span className="blue-text">Družbeni</span> kaos</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
              Sistem v katerem živimo, predstavlja vse večje preglavice za posameznika - tako časovne kot tudi finančne. Zato je posvečanje svojega časa pravilnim dejavnostim in spremljanje osebnih financ ključnega pomena za boj proti finančni in časovni stiski, ki sta produkt kapitalističnega sistema.
            </p>
          </motion.div>

          <div className="mission-quotes">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 1.2, ease: expoOut, delay: 0.1 }} className="quote-bubble">"Ponovno so nam zvišali stroške!"</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 1.2, ease: expoOut, delay: 0.3 }} className="quote-bubble">"Zakaj so cene tako visoke?!"</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 1.2, ease: expoOut, delay: 0.5 }} className="quote-bubble">"Ali bom sposoben vzdrževati svojega otroka?"</motion.div>
          </div>

          <motion.div 
            className="mission-statement"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: expoOut }}
          >
            <img src={logoImg} alt="Finance 4P" className="statement-logo" />
            <p className="statement-sub">je naš odgovor!</p>
          </motion.div>

          <div className="mission-cards">
            {[
              { icon: Eye, title: "Prepoznaj tokove", text: "Je orodje, s katerim prepoznaš, kam odtekata tvoja energija in denar." },
              { icon: Target, title: "Usmeri energijo", text: "Svoja sredstva in čas usmeriš tja, kjer štejeta – družino, prosti čas in VASE." },
              { icon: Award, title: "Imej popoln nadzor", text: "Postali boste gospodar svojega časa in denarja. Nič več pasivnega opazovanja, vzemite stvari v svoje roke." }
            ].map((card, index) => (
              <motion.div 
                key={index}
                className="mission-card"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  ease: expoOut, 
                  delay: index * 0.2 
                }}
              >
                <div className="card-header">
                  <card.icon size={28} color="var(--primary)" />
                  <h3>{card.title}</h3>
                </div>
                <p>{card.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="step-highlight-wrapper"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: expoOut, delay: 0.2 }}
          >
            <h3 className="step-title">Je <span className="blue-text">prvi korak</span> k <span className="nowrap">časovni in finančni</span> razbremenitvi</h3>
            <div className="step-highlight">
              <p className="step-text">
                Finance 4P ne predstavlja le beleženja številk, ampak je odskočna deska za vsakega posameznika na poti v svet osebnih financ in bolj odgovornega delovanja v družbi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Vizija za prihodnost */}
      <section className="vision-social-section">
        <div className="container">
          <motion.h2 
            className="vision-lead-heading"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <strong>Vizija Finance 4P je <br /><span className="blue-text nowrap">opolnomočiti posameznika.</span></strong>
          </motion.h2>

          <motion.div 
            className="vision-container"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: expoOut }}
          >
            
            <div className="vision-main-content">
              <h3>Družbeni doprinos</h3>
              <div className="vision-contribution-content">
                
                <motion.p 
                  className="vision-context"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Danes se človek zaradi vsakodnevnih preglavic težko posveča drugemu kot le svojim težavam.
                </motion.p>

                <motion.p 
                  className="vision-solution"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Verjamem, da organiziranost in finančna pismenost vodita do boljših življenjskih odločitev in manj stresnega vsakdana. To omogoča večjo povezanost med ljudmi, kar privede do <strong>srečnejše in bolj stabilne družbe.</strong>
                </motion.p>
              </div>
            </div>
            
            <div className="vision-secondary-grid">
              <motion.div 
                className="vision-detail-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="vision-card-header">
                  <Target size={24} color="var(--primary)" />
                  <h4>CILJ</h4>
                </div>
                <p>Finance 4P se ne ustavi pri beleženju ur. Želi postati sinonim za osebnega asistenta, ki posamezniku pomaga rasti – ne le finančno, ampak tudi skozi disciplino in red.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Poziv na Waitlist */}
      <section className="about-cta-section">
        <div className="container">
          <motion.div 
            className="about-hybrid-cta"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: expoOut }}
          >
            <div className="cta-left" style={{ textAlign: 'center', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2>Začni <span className="blue-text">svojo pot</span></h2>
              <p>
                Bodi med prvimi, ki bodo uporabljali aplikacijo! Izberi svojega asistenta in izboljšaj svoj življenjski slog!
              </p>
              
              <div className="store-buttons" style={{ 
                display: 'flex', 
                gap: '10px', 
                flexWrap: 'nowrap', 
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: '10px'
              }}>
                {/* Requested App Store Button */}
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px', 
                    textDecoration: 'none', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '6px 4px',
                    borderRadius: '10px',
                    width: '135px',
                    height: '46px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 448 512" width="22" height="22">
                    <rect x="0" y="32" width="448" height="448" rx="100" fill="#fff"/>
                    <path fill="#0A84FF" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM127 384.5c-5.5 9.6-17.8 12.8-27.3 7.3-9.6-5.5-12.8-17.8-7.3-27.3l14.3-24.7c16.1-4.9 29.3-1.1 39.6 11.4L127 384.5zm138.9-53.9H84c-11 0-20-9-20-20s9-20 20-20h51l65.4-113.2-20.5-35.4c-5.5-9.6-2.2-21.8 7.3-27.3 9.6-5.5 21.8-2.2 27.3 7.3l8.9 15.4 8.9-15.4c5.5-9.6 17.8-12.8 27.3-7.3 9.6 5.5 12.8 17.8 7.3 27.3l-85.8 148.6h62.1c20.2 0 31.5 23.7 22.7 40zm98.1 0h-29l19.6 33.9c5.5 9.6 2.2 21.8-7.3 27.3-9.6 5.5-21.8 2.2-27.3-7.3-32.9-56.9-57.5-99.7-74-128.1-16.7-29-4.8-58 7.1-67.8 13.1 22.7 32.7 56.7 58.9 102h52c11 0 20 9 20 20 0 11.1-9 20-20 20z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.45rem', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>Available on the</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>App Store</span>
                  </div>
                </a>

                {/* Requested Google Play Button */}
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '6px 4px',
                    borderRadius: '10px',
                    width: '135px',
                    height: '46px',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 512 512" width="20" height="20" style={{ marginLeft: '4px' }}>
                    <path fill="#4caf50" d="M47.7 29.5C41 33.7 36 41 36 50.8v410.4c0 9.8 5 17.1 11.7 21.3L253 277 47.7 29.5z"/>
                    <path fill="#fbc02d" d="M336.8 378L253 277l83.8-101 64.9 36.8c18.5 10.5 18.5 27.6 0 38.1l-64.9 37.1z"/>
                    <path fill="#e53935" d="M47.7 482.5c6.3 4 14.9 4 24.3-1.3l264.8-150.9L253 277 47.7 482.5z"/>
                    <path fill="#2196f3" d="M72 30.8C62.6 25.5 54 25.5 47.7 29.5L253 277l83.8-101L72 30.8z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.45rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.01em', fontWeight: 500 }}>GET IT ON</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Google Play</span>
                  </div>
                </button>
              </div>
            </div>
            

          </motion.div>
        </div>
      </section>

      {/* 5. Moja zgodba: Kako se je vse začelo */}
      <section className="story-section">
        <div className="container">
          <div className="story-grid">
            <motion.div 
              className="story-visual"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: expoOut }}
            >
              <div className="story-image">
                <img src={founderImg} alt="Filip Kolle" />
              </div>

              <motion.div 
                className="key-message-box-side"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: expoOut, delay: 0.3 }}
              >
                <p className="key-message-text-side">
                  "<span className="blue-text">Finance in delo ne smejo imeti negativen prizvok!</span> So orodje za osebni razvoj."
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              className="story-text"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: expoOut }}
            >
              <h2><span className="blue-text">Moja</span> zgodba</h2>
              <p className="p-lead">
                Odraščanje v družini, ki se je nenehno srečevala s finančnimi ovirami, je povzročilo, da sem svojo delovno pot začel zelo zgodaj, pri 15 letih.
              </p>
              <p>
                Kljub temu, da sem služil denar in doprinesel družini, se naše finančno stanje ni kaj prida izboljšalo. Hitro sem dojel, da moram postaviti jasne prioritete, če želim, da moj trud sploh obrodi sadove in ne preobremenim svojih finančnih zmožnosti.
              </p>
              <div className="accent-border">
                <p style={{marginBottom: 0}}>
                  "Tako sem začel voditi evidenco osebnih financ že pri 17-ih letih in s časom razvil rutino, ki mi pomaga izbrati prave finančne odločitve v kritičnih situacijah."
                </p>
              </div>
              <p>
                Ta proces je pri meni igral ključno vlogo, da sem popolnoma spremenil svoj pogled na finance, prepoznal svoje potrošniške navade in na koncu postal bolj samozavesten ter odgovoren posameznik.
              </p>
              <p>
                Zato sem ustvaril projekt <strong>Finance 4P</strong>, s katerim želim ljudem omogočiti, da prevzamejo stvari v svoje roke in postanejo boljša verzija sebe.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Zaključek in osebni podpis */}
      <section className="about-footer-sig">
        <div className="container">
          <motion.div 
            className="sig-content"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.4, ease: expoOut }}
          >
            <p>Hvala vsem, ki skupaj z nami začenjate graditi zdrave delovne in finančne navade in pomagate pri ustvarjanju boljše družbe!</p>
            <div className="sig-block">
              <span className="sig-intro">Hvala, ker zaupate Finance 4P.</span>
              <div className="sig-image-container">
                <img src={signatureImg} alt="Podpis Filip Kolle" className="sig-actual-img" />
              </div>
              <span className="digital-sig">Filip Kolle</span>
              <span className="sig-title">idejni vodja in razvijalec</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};


export default AboutPage;
