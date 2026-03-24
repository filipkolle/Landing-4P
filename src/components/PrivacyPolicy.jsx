import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowLeft } from 'lucide-react';

const expoOut = [0.19, 1, 0.22, 1];

const PrivacyPolicy = ({ onClose }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      className="pp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="pp-panel"
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ duration: 0.6, ease: expoOut }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pp-header">
          <button className="pp-close-btn" onClick={onClose} aria-label="Zapri">
            <X size={22} />
          </button>
          <div className="pp-header-title">
            <ShieldCheck size={22} className="pp-shield-icon" />
            <span>Politika Zasebnosti</span>
          </div>
        </div>

        {/* Content */}
        <div className="pp-body">
          <h1>POLITIKA ZASEBNOSTI – FINANCE 4P</h1>
          <p className="pp-intro">
            Pri aplikaciji FINANCE 4P cenimo vašo zasebnost in transparentnost. Ta dokument pojasnjuje, 
            kako upravljamo z vašimi podatki v skladu s Splošno uredbo o varstvu podatkov (GDPR) in 
            slovenskim Zakonom o varstvu osebnih podatkov (ZVOP-2).
          </p>

          <section>
            <h2>1. Upravljavec in narava storitve</h2>
            <p>
              Upravljavec aplikacije in odgovorna oseba je <strong>Filip Kolle</strong>, Vrbovec 37, 
              1000 Ljubljana (<a href="mailto:info@finance4p.com">info@finance4p.com</a>).
            </p>
            <p>
              Aplikacija FINANCE 4P deluje kot digitalni osebni dnevnik. Vsi podatki so vneseni ročno 
              in so informativne narave. Ker aplikacija ni povezana z zunanjimi finančnimi institucijami, 
              se vneseni podatki ne štejejo za uradne finančne evidence.
            </p>
          </section>

          <section>
            <h2>2. Kategorije podatkov, ki jih obdelujemo</h2>
            <p>Za zagotavljanje polne funkcionalnosti vašega osebnega asistenta obdelujeme le podatke, ki jih vnesete sami:</p>
            <ul>
              <li><strong>Uporabniški profil:</strong> Ime za personalizacijo PDF izvozov in e-naslov za varno prijavo.</li>
              <li><strong>Asistent za delo:</strong> Evidence ur, postavke in tipi zaposlitve za izračun informativnega zaslužka.</li>
              <li><strong>Finančni pregled:</strong> Ročni vnosi transakcij, kategorij, stanja sredstev (nepremičnine, vozila, investicije) in obveznosti (dolgovi, naročnine) za namen vizualizacije neto vrednosti.</li>
              <li><strong>Sistemske nastavitve:</strong> Vaše preference glede izgleda in načina prikaza aplikacije.</li>
            </ul>
          </section>

          <section>
            <h2>3. Tehnološka infrastruktura in varnost</h2>
            <p>Vaši podatki so shranjeni v oblaku pri uveljavljenem svetovnem ponudniku <strong>Supabase</strong>.</p>
            <ul>
              <li><strong>Lokacija strežnikov:</strong> Podatki se obdelujejo v regiji Zahodna Evropa (London, UK). Ta prenos je pravno skladen na podlagi Sklepa Evropske komisije o ustreznosti (28. 6. 2021), ločeno pa so vaši podatki varovani po standardih, ki so enakovredni tistim v EU.</li>
              <li><strong>Varnostni ukrepi:</strong> Uporabljamo standardne protokole za šifriranje prenosov. Ker gre za ročno vnesene, nepreverjene podatke, upravljavec ne prevzema odgovornosti za njihovo resničnost ali morebitno škodo v primeru višje sile ali nepooblaščenega dostopa s strani tretjih oseb.</li>
            </ul>
          </section>

          <section>
            <h2>4. Vaš nadzor in pravice (GDPR)</h2>
            <p>V skladu z zakonodajo vam zagotavljamo popoln nadzor:</p>
            <ul>
              <li><strong>Pravica do izbrisa:</strong> Svoj račun in vse podatke lahko kadarkoli trajno izbrišete v nastavitvah profila. Po potrditvi se podatki v bazi nepovratno pobrišejo v roku 30 dni.</li>
              <li><strong>Dostop in prenosljivost:</strong> Kadarkoli lahko izvozite svoje vnose v obliki PDF dokumenta za lastno arhiviranje.</li>
              <li><strong>Popravek:</strong> Vse vnose lahko ročno urejate neposredno v aplikaciji.</li>
            </ul>
          </section>

          <section>
            <h2>5. Hramba podatkov</h2>
            <p>
              Podatke hranimo le dokler imate aktiven račun. Upravljavec ne izvaja nobene avtomatizirane 
              analitike vaših finančnih navad in vaših podatkov ne posreduje tretjim osebam za 
              marketinške namene.
            </p>
          </section>

          <section>
            <h2>6. Pritožbeni organ</h2>
            <p>
              V primeru vprašanj smo vam na voljo na <a href="mailto:info@finance4p.com">info@finance4p.com</a>. 
              Če menite, da vaši podatki niso obdelani pravilno, se lahko obrnete na nadzorni organ: 
              <strong>Informacijski pooblaščenec RS</strong>, Dunajska 22, Ljubljana.
            </p>
          </section>

          <p className="pp-date"><strong>Veljavnost:</strong> 25. marec 2026</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
