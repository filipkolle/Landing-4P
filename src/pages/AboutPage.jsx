import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Award, Rocket, Check, Mail, Handshake, Heart, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import founderImg from '../assets/founder.png';
import '../styles/About.css';

const expoOut = [0.19, 1, 0.22, 1];

const AboutPage = () => {
  const [email, setEmail] = useState('');
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
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: expoOut }}
          >
            <h1>Finance ljudem!</h1>
            <p className="hook-desc">
              Zgodba o digitalnem asistentu, ustvarjenem, da povrne nadzor tistim, ki cenijo svoj čas in trdo prislužen denar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Moja zgodba: Kako se je vse začelo */}
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
            </motion.div>

            <motion.div 
              className="story-text"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: expoOut }}
            >
              <span className="section-label">Iskra, ki je zanetila Finance 4P</span>
              <h2>Moja zgodba</h2>
              <p>
                Odraščanje v družini, ki se je nenehno srečevala s finančnimi ovirami, je povzročilo, da sem svojo delovno pot začel zelo zgodaj, pri 15 letih. Kljub temu, da sem služil denar in doprinesel družini, se naše finančno stanje ni kaj prida izboljšalo.
              </p>
              <p>
                Hitro sem dojel, da moram postaviti jasne prioritete, če želim, da moj trud sploh obrodi sadove in ne preobremenim svojih finančnih zmožnosti.
              </p>
              <p>
                Tako sem začel voditi evidenco osebnih financ že pri 17-ih letih, in s časom razvil rutino, ki mi pomaga izbrati prave finančne odločitev v kritičnih situacijah. Ta proces je pri meni igral ključno vlogo, da sem popolnoma spremenil svoj pogled na finance, prepoznal svoje potrošniške navade in na koncu postal bolj samozavesten ter odgovoren posameznik.
              </p>
              <p>
                Zato sem ustvaril projekt Finance 4P s katerim želim ljudem omogočiti, da prevzamejo stvari v svoje roke in postanejo boljša verzija sebe.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="key-message-box"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: expoOut }}
          >
            <p className="key-message-text">
              "Finance in delo ne smejo imeti negativen prizvok! So družbeno orodje, ki človeku pomagajo pri spoznavanju samega sebe in pripomorejo k njegovemu osebnemu razvoju na vseh področjih!"
            </p>
            <span className="key-message-author">— Filip Kolle, Ustanovitelj</span>
          </motion.div>
        </div>
      </section>

      {/* 3. Poslanstvo: Zakaj Finance 4P ni le "še ena aplikacija" */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-quotes">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }} className="quote-bubble">"Ponovno so nam zvišali stroške!"</motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }} className="quote-bubble">"Zakaj so cene tako visoke?!"</motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }} className="quote-bubble">"Ali bom sposoben vzdrževati svojega otroka?"</motion.div>
          </div>

          <div className="mission-intro">
            <span className="section-label">Finance niso samo številke – So način življenja</span>
            <h2>Odgovor na kaos vsakdana</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
              Sistem v katerem živimo, predstavlja vse večje preglavice za posameznika - tako časovne kot tudi finančne. Zato je posvečanje svojega časa pravilnim dejavnostim in spremljanje osebnih financ ključnega pomena za boj proti finančni in časovni stiski, ki sta produkt kapitalističnega sistema.
            </p>
          </div>

          <div className="mission-cards">
            <div className="mission-card">
              <Eye size={32} color="var(--primary)" />
              <h3>Prepoznaj tokove</h3>
              <p>Finance 4P je moj odgovor na ta kaos. Je orodje, s katerim prepoznaš, kam odtekata tvoja energija in denar.</p>
            </div>
            <div className="mission-card">
              <Target size={32} color="var(--primary)" />
              <h3>Usmeri energijo</h3>
              <p>Svoja sredstva in čas usmeriš tja, kjer štejeta – družino, prosti čas in VASE.</p>
            </div>
            <div className="mission-card">
              <Award size={32} color="var(--primary)" />
              <h3>Postani gospodar</h3>
              <p>Postali boste gospodar svojega časa in denarja. Nič več pasivnega opazovanja, čas je za akcijo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Vizija za prihodnost */}
      <section className="vision-social-section">
        <div className="container">
          <motion.div 
            className="vision-container"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="section-label" style={{ opacity: 0.6, color: '#fff' }}>Pogled naprej!</span>
            <h2>Družbeni doprinos</h2>
            <p className="vision-contribution">
              "Vizija Finance 4P je opolnomočiti posameznika. Verjamem, da organiziranost in finančna pismenost vodita do boljših odločitev, manj stresnega vsakdana in večje povezanosti med ljudmi."
            </p>
            <p className="vision-sub-text">
              Finance 4P se ne ustavi pri beleženju ur. Želi postati sinonim za osebnega asistenta, ki posamezniku pomaga rasti – ne le finančno, ampak tudi skozi disciplino in red. Prvi korak na poti v svet delovanja v družbi.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 6. Poziv na Waitlist */}
      <section className="about-cta-section">
        <div className="container">
          <motion.div 
            className="about-cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Prevzemi vajeti v svoje roke</h2>
            <p style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>
              Pridruži se čakalni vrsti in bodi med prvimi, ki bodo gradili zdrave finančne navade še pred izidom aplikacije.
            </p>
            
            <form onSubmit={handleWaitlist} className="about-waitlist-form">
              <div className="input-group">
                <Mail size={20} style={{ margin: '0 15px', color: 'var(--text-soft)' }} />
                <input 
                  type="email" 
                  placeholder="Vnesi svoj e-naslov..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }}
                />
                <button 
                  type="submit" 
                  className={`waitlist-submit ${status === 'success' ? 'success' : ''}`}
                  disabled={status !== 'idle'}
                  style={{ borderRadius: '14px', padding: '12px 24px' }}
                >
                  <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.span key="idle">Naroči se</motion.span>
                    )}
                    {status === 'loading' && (
                        <motion.div key="loading" className="spinner" />
                    )}
                    {status === 'success' && (
                        <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={20} />
                        </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 7. Zaključek in osebni podpis */}
      <section className="about-footer-sig">
        <div className="container">
          <div className="sig-content">
            <p>Hvala vsem, ki skupaj z nami začenjate graditi zdrave delovne in finančne navade in pomagate pri ustvarjanju boljše družbe!</p>
            <div className="sig-block">
              <span className="sig-intro">Hvala, ker zaupate Finance 4P.</span>
              <span className="digital-sig">Filip Kolle</span>
              <span className="sig-title">idejni vodja in razvijalec</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Essential Icon Components
const Eye = ({ size, color }) => (
  <div className="impact-icon-bg" style={{ background: 'rgba(94,141,178,0.1)', color: color || 'var(--primary)' }}>
    <Rocket size={size} />
  </div>
);

export default AboutPage;
