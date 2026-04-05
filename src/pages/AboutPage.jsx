import React from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Rocket, ShieldCheck, Zap, Heart, Eye } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import founderImg from '../assets/founder.png';
import '../styles/About.css';

const expoOut = [0.19, 1, 0.22, 1];

const AboutPage = () => {
  return (
    <div className="about-page-wrapper">
      <Navbar />
      
      {/* Hero Header */}
      <section className="about-header-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: expoOut }}
          >
            <h1>Finance 4P: Vaša pot do jasnosti.</h1>
            <p>
              Zgodba o digitalnem asistentu, ki je bil ustvarjen, 
              da povrne nadzor tistim, ki cenijo svoj čas in trdo prislužen denar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Section - Homey & Professional */}
      <section className="about-intro-section">
        <div className="container">
          <div className="about-content-grid">
            <motion.div 
              className="about-image-wrapper"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: expoOut }}
            >
              <img src={founderImg} alt="Filip Kolle" />
            </motion.div>

            <motion.div 
              className="about-text-content"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: expoOut }}
            >
              <span className="section-label">Beseda ustanovitelja</span>
              <h2>Zakaj sem začel?</h2>
              <p>
                Pred leti sem se tudi sam znašel v labirintu zapiskov, tabel in bančnih izpiskov. 
                Finance 4P ni bil zgrajen v korporativnih pisarnah, temveč iz resnične želje 
                po poenostavitvi vsakdana. Moja misija je bila jasna: razviti orodje, ki je 
                dovolj močno za analitiko, a dovolj preprosto, da ga lahko uporabljaš med kavo.
              </p>
              <p>
                Danes Finance 4P predstavlja most med vašim trdim delom in mirnikom, 
                ki ga prinese popolna preglednost. Tu sem, da vam pomagam razumeti svojo vrednost.
              </p>
              <div className="founder-quote">
                <Heart size={20} className="quote-icon" />
                <p>"Finance niso le številke na zaslonu. So vaša svoboda, vaš čas in vaša prihodnost."</p>
                <strong>— Filip Kolle</strong>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The 4P Values - More richness */}
      <section className="values-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">Kaj nas vodi</span>
            <h2>Naši štirje stebri (4P)</h2>
            <p>Vsaka vrstica kode v aplikaciji Finance 4P je zgrajena na osnovi teh vrednot.</p>
          </div>

          <div className="values-grid">
            <motion.div className="value-card" whileHover={{ scale: 1.02 }}>
              <Eye className="impact-icon-bg" size={28} />
              <h3>Preglednost</h3>
              <p>Verjamemo, da je znanje moč. Kristalno jasen vpogled v finančne tokove je prvi korak do stabilnosti.</p>
            </motion.div>

            <motion.div className="value-card" whileHover={{ scale: 1.02 }}>
              <Zap className="impact-icon-bg" size={28} />
              <h3>Preprostost</h3>
              <p>Tehnologija mora služiti ljudem, ne obratno. Naš vmesnik je intuitiven in očiščen balasta.</p>
            </motion.div>

            <motion.div className="value-card" whileHover={{ scale: 1.02 }}>
              <ShieldCheck className="impact-icon-bg" size={28} />
              <h3>Poštenost</h3>
              <p>Brez skritih povezav do vaših računov. Vaši podatki so le vaši, varnost pa je naša prioriteta.</p>
            </motion.div>

            <motion.div className="value-card" whileHover={{ scale: 1.02 }}>
              <Rocket className="impact-icon-bg" size={28} />
              <h3>Prihodnost</h3>
              <p>Neprestano razvijamo nove funkcije, ki bodo avtomatizirale vaše rutine in izboljšale analitiko.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Homey Impact */}
      <section className="vision-row">
        <div className="container">
          <motion.div 
            className="vision-card-full"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Naša pot do leta 2030</h2>
            <p style={{ opacity: 0.8, maxWidth: '700px', margin: '0 auto' }}>
              Naša vizija ni le aplikacija, temveč ekosistem, ki bo vsakemu posamezniku v Sloveniji 
              in širše omogočil, da postane sam svoj finančni direktor.
            </p>

            <div className="vision-impact-light" style={{ marginTop: '50px' }}>
              <motion.div className="impact-item" whileHover={{ y: -5 }}>
                <div className="impact-icon-bg">
                  <Award size={24} />
                </div>
                <h4>Zadovoljni uporabniki</h4>
                <p>Naš cilj je skupnost, ki si medsebojno pomaga do boljših finančnih odločitev.</p>
              </motion.div>

              <motion.div className="impact-item" whileHover={{ y: -5 }}>
                <div className="impact-icon-bg">
                  <Target size={24} />
                </div>
                <h4>Lokalna podpora</h4>
                <p>Kot domač projekt vedno prisluhnemo vašim specifičnim potrebam in zakonodaji.</p>
              </motion.div>

              <motion.div className="impact-item" whileHover={{ y: -5 }}>
                <div className="impact-icon-bg">
                  <Heart size={24} />
                </div>
                <h4>Strast do detajlov</h4>
                <p>Vsaka animacija in graf sta tu, da vam pričarata nasmeh na obraz.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
