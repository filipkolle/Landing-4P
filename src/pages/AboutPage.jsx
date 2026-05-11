import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Award, Rocket, Check, Mail, Handshake, Heart, MessageCircle, Users, ArrowRight, Clock, Wallet, Apple, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import logoImg from '../assets/logo_full_v2.png';
import ctaWomanImg from '../assets/cta_woman_v2.png';
import phoneMockup from '../assets/mockups/phone_3d_v2.png';
import appStoreBadge from '../assets/app_store_badge.png';
import androidBadge from '../assets/android_badge.png';
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

      {/* 1.5. Glavna ideja */}
      <section className="idea-section">
        <div className="container">
          <motion.div 
            className="idea-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: expoOut }}
          >
            <div className="idea-content">
              <h2>Ena navada <br/><span className="blue-text">Dva rezultata</span></h2>
              <p>
                Vi beležite ure, aplikacija vodi finance.<br/>
                Zakaj si ne bi poenostavili spremljanja osebnih financ in ubili dve muhi na en mah?
              </p>
            </div>
            <div className="idea-visual">
              <motion.div 
                className="idea-icon-box blue-box"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              >
                <Clock size={36} />
                <span>Čas</span>
              </motion.div>
              
              <div className="idea-connector">
                <motion.div 
                  className="conn-line"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  style={{ transformOrigin: "left center" }}
                />
                <motion.div 
                  className="conn-plus"
                  initial={{ scale: 0, rotate: -90 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                >
                  +
                </motion.div>
                <motion.div 
                  className="conn-line"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  style={{ transformOrigin: "right center" }}
                />
              </div>
              
              <motion.div 
                className="idea-icon-box green-box"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1.75 }}
              >
                <Wallet size={36} />
                <span>Denar</span>
              </motion.div>
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
            <div className="cta-left">
              <h2>Začni svojo pot</h2>
              <p>
                Bodi med prvimi, ki bodo uporabljali aplikacijo! Izberi svojega asistenta in izboljšaj svoj življenjski slog!
              </p>
              
              <div className="store-buttons" style={{ 
                display: 'flex', 
                gap: '15px', 
                flexWrap: 'nowrap', 
                marginTop: '30px',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}>
                <a 
                  href="https://apps.apple.com/si/app/finance-4p/id6762084663" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px', 
                    textDecoration: 'none', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '10px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '190px',
                    height: '65px',
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 384 512" width="32" height="32" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.02em', opacity: 0.9 }}>Download on the</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>App Store</span>
                  </div>
                </a>
                <button 
                  onClick={() => navigate('/cakalna-vrsta')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px', 
                    backgroundColor: '#000', 
                    color: '#fff', 
                    padding: '10px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '190px',
                    height: '65px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 512 512" width="30" height="30">
                    <path fill="#4caf50" d="M47.7 29.5C41 33.7 36 41 36 50.8v410.4c0 9.8 5 17.1 11.7 21.3L253 277 47.7 29.5z"/>
                    <path fill="#fbc02d" d="M336.8 378L253 277l83.8-101 64.9 36.8c18.5 10.5 18.5 27.6 0 38.1l-64.9 37.1z"/>
                    <path fill="#e53935" d="M47.7 482.5c6.3 4 14.9 4 24.3-1.3l264.8-150.9L253 277 47.7 482.5z"/>
                    <path fill="#2196f3" d="M72 30.8C62.6 25.5 54 25.5 47.7 29.5L253 277l83.8-101L72 30.8z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '0.02em', opacity: 0.9 }}>Za Android</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Pridruži se</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="cta-right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
              <img src={phoneMockup} alt="Finance 4P" className="cta-featured-image" style={{ maxHeight: '400px', objectFit: 'contain' }} />
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
