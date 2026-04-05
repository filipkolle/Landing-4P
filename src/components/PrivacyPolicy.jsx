import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const expoOut = [0.19, 1, 0.22, 1];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="pp-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <button className="pp-back-btn floating" onClick={() => navigate('/')} aria-label="Nazaj">
        <ArrowLeft size={22} />
        <span>Nazaj</span>
      </button>

      <motion.div
        className="pp-panel standalone"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: expoOut }}
      >
        {/* Header */}
        <div className="pp-header">
          <div className="pp-header-title">
            <ShieldCheck size={22} className="pp-shield-icon" />
            <span>Politika Zasebnosti</span>
          </div>
        </div>

        {/* Content */}
        <div className="pp-body">
          <h1>POLITIKA ZASEBNOSTI ZA MOBILNO APLIKACIJO FINANCE 4P</h1>
          <p className="pp-date"><strong>Datum zadnje posodobitve:</strong> 31. marec 2026</p>
          
          <p className="pp-intro">
            Namen te Politike zasebnosti je seznanitev uporabnikov mobilne aplikacije Finance 4P z nameni 
            in podlago obdelave osebnih podatkov s strani upravljavca Filipa Kolle. 
            Vse osebne podatke obdelujemo, hranimo in varujemo v skladu z veljavno zakonodajo, zlasti v 
            skladu z Uredbo (EU) 2016/679 (GDPR) in Zakonom o varstvu osebnih podatkov (ZVOP-2).
          </p>

          <p className="pp-intro">
            S posredovanjem vaših osebnih podatkov izjavljate, da ste prebrali našo Politiko zasebnosti in 
            se zavedate načinov obdelave ter pravnih podlag obdelave osebnih podatkov. Če ne soglašate z 
            načini obdelave, vas prosimo, da nam ne posredujete vaših osebnih podatkov in aplikacije ne uporabljate.
          </p>

          <section>
            <h2>1. UPRAVLJAVEC OSEBNIH PODATKOV</h2>
            <p>Upravljavec osebnih podatkov je:</p>
            <p>
              <strong>Ime in priimek:</strong> Filip Kolle<br />
              <strong>E-naslov:</strong> <a href="mailto:info@finance4p.com">info@finance4p.com</a>
            </p>
            <p>
              Za vsa vprašanja v zvezi z varstvom vaših osebnih podatkov ali uveljavljanjem vaših pravic 
              smo vam na voljo na zgoraj navedenem e-naslovu.
            </p>
          </section>

          <section>
            <h2>2. OSNOVNI POJMI</h2>
            <ul>
              <li><strong>Osebni podatek:</strong> informacija, ki posameznika identificira kot določenega ali določljivega posameznika (ime, e-naslov, IP naslov, podatki o lokaciji, spletni identifikator ipd.).</li>
              <li><strong>Obdelava:</strong> kakršno koli delovanje v zvezi z osebnimi podatki (zbiranje, shranjevanje, posredovanje, vpogled, izbris).</li>
              <li><strong>Upravljavec:</strong> oseba, ki določa namene in sredstva obdelave podatkov.</li>
              <li><strong>Privolitev:</strong> prostovoljna in nedvoumna izjava volje posameznika za obdelavo podatkov.</li>
            </ul>
          </section>

          <section>
            <h2>3. NAMEN IN PODLAGA ZA OBDELAVO PODATKOV</h2>
            <h3>a.) Obdelava na podlagi privolitve</h3>
            <p>Osebne podatke obdelujemo na podlagi vaše privolitve za:</p>
            <ul>
              <li>Pošiljanje potisnih obvestil (Push Notifications) za opomnike in novice.</li>
              <li>Dostop do kamere in galerije za namene nalaganja slik računov ali dokumentov.</li>
            </ul>
            
            <h3>b.) Obdelava na podlagi pogodbe</h3>
            <p>Obdelava je nujna za izvajanje storitve Finance 4P:</p>
            <ul>
              <li>Registracija in prijava (prek Google Sign-In ali Apple ID).</li>
              <li>Izvajanje plačil in upravljanje naročnin (prek Stripe, RevenueCat, Apple/Google In-App Purchases).</li>
            </ul>

            <h3>c.) Obdelava na podlagi zakonitega interesa</h3>
            <ul>
              <li>Analitika uporabe aplikacije za izboljšanje uporabniške izkušnje.</li>
              <li>Zagotavljanje varnosti IT sistemov in preprečevanje zlorab.</li>
            </ul>
          </section>

          <section>
            <h2>4. PODATKI, KI JIH ZBIRAMO</h2>
            <p><strong>Prostovoljno posredovani podatki:</strong> Zbiramo osebne podatke, ki jih izrecno sporočite ob registraciji ali uporabi:</p>
            <ul>
              <li>Ime in priimek, e-poštni naslov, telefonska številka.</li>
              <li><strong>Ročni finančni vnosi:</strong> Vsi podatki o prihodkih, odhodkih in finančnih ciljih, ki jih v aplikacijo vnesete ročno. Aplikacija ni povezana z bančnimi računi.</li>
            </ul>
            <p><strong>Podatki, ki se generirajo avtomatsko:</strong> Ko uporabljate aplikacijo, pridobivamo tehnične podatke:</p>
            <ul>
              <li>IP naslov, Advertising ID (npr. IDFA ali AAID), vrsta naprave in operacijski sistem.</li>
              <li>Anonimni statistični podatki o uporabi funkcij aplikacije.</li>
            </ul>
          </section>

          <section>
            <h2>5. POSREDOVANJE PODATKOV TRETJIM OSEBAM</h2>
            <p>Vaših osebnih podatkov ne prodajamo. Delimo jih le s preverjenimi obdelovalci:</p>
            <ul>
              <li><strong>Shramba podatkov:</strong> Supabase (regija Zahodna Evropa, London, UK). Prenos je skladen s standardi EU.</li>
              <li><strong>Analitika in oglasi:</strong> Google Analytics.</li>
              <li><strong>Plačila in prijava:</strong> Stripe, RevenueCat, Apple Inc., Google LLC.</li>
            </ul>
          </section>

          <section>
            <h2>6. VARNOST PODATKOV</h2>
            <p>Vaše zaupanje cenimo, zato izvajamo stroge tehnične in organizacijske ukrepe:</p>
            <ul>
              <li>Uporaba šifriranja podatkov (SSL/TLS).</li>
              <li>Varovanje strežniške infrastrukture ponudnika Supabase.</li>
              <li>Nadzor nad pooblastili za dostop do informacij.</li>
            </ul>
          </section>

          <section>
            <h2>7. PIŠKOTKI (COOKIES)</h2>
            <p>
              Mobilna aplikacija Finance 4P ne uporablja piškotkov v tradicionalnem smislu. 
              Za delovanje aplikacije se uporabljajo lokalne shrambe naprave in identifikatorji (SDK-ji) 
              tretjih oseb (npr. Google Analytics), ki omogočajo delovanje brez shranjevanja podatkov 
              v spletnem brskalniku.
            </p>
          </section>

          <section>
            <h2>8. IZBRIS PODATKOV (PRAVICA DO POZABE)</h2>
            <p>
              Uporabnik ima v aplikaciji Finance 4P možnost, da kadarkoli sam izbriše svoj račun. 
              Po potrditvi izbrisa bodo vsi vaši osebni in finančni podatki trajno odstranjeni iz 
              naših baz v roku 10 dni, razen tistih, ki jih moramo hraniti po zakonu (npr. davčni podatki).
            </p>
          </section>

          <section>
            <h2>9. POSAMEZNIKOVE PRAVICE</h2>
            <p>Skladno z GDPR imate pravico do:</p>
            <ul>
              <li>Dostopa do vaših podatkov in njihovega popravka.</li>
              <li>Izbrisa osebnih podatkov (»pozabe«).</li>
              <li>Prenosljivosti podatkov v strojno berljivi obliki.</li>
              <li>Ugovora obdelavi za namene neposrednega trženja.</li>
            </ul>
            <p>Vse zahteve naslovite na: <a href="mailto:info@finance4p.com">info@finance4p.com</a>.</p>
          </section>

          <section>
            <h2>10. PRITOŽBA NADZORNEMU ORGANU</h2>
            <p>
              Če menite, da obdelava vaših podatkov krši predpise, lahko vložite pritožbo pri:<br />
              <strong>Informacijski pooblaščenec Republike Slovenije</strong><br />
              Dunajska cesta 22, 1000 Ljubljana<br />
              E-pošta: <a href="mailto:gp.ip@ip-rs.si">gp.ip@ip-rs.si</a>
            </p>
          </section>

          <section>
            <h2>11. KONČNE DOLOČBE</h2>
            <p>
              Ta politika zasebnosti se lahko občasno posodobi. O vseh pomembnih spremembah boste 
              obveščeni znotraj aplikacije ali prek e-pošte.
            </p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
