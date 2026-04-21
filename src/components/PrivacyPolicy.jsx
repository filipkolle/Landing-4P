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
          <p className="pp-date"><strong>Datum zadnje posodobitve:</strong> 21. april 2026</p>
          
          <p className="pp-intro">
            Namen te Politike zasebnosti je seznanitev uporabnikov mobilne aplikacije Finance 4P ter obiskovalcev spletne strani (v nadaljevanju: "landing page") z nameni, podlagami, varnostnimi ukrepi in načini obdelave osebnih podatkov s strani upravljavca Filipa Kolle.
          </p>

          <p className="pp-intro">
            Vse osebne podatke obdelujemo, hranimo in varujemo v skladu z veljavno zakonodajo, zlasti v skladu z Uredbo (EU) 2016/679 (GDPR) in Zakon o varstvu osebnih podatkov (ZVOP-2). S posredovanjem vaših osebnih podatkov izjavljate, da ste prebrali našo Politiko zasebnosti in se zavedate načinov obdelave ter pravnih podlag. Če ne soglašate z načini obdelave, vas prosimo, da nam ne posredujete vaših osebnih podatkov in aplikacije ali spletne strani ne uporabljate.
          </p>

          <div className="pp-toc" style={{ background: 'rgba(94, 141, 178, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '40px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Kazalo vsebine</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><a href="#sec-1" style={{ color: 'var(--primary)', textDecoration: 'none' }}>1. UPRAVLJAVEC OSEBNIH PODATKOV</a></li>
              <li><a href="#sec-2" style={{ color: 'var(--primary)', textDecoration: 'none' }}>2. OSNOVNI POJMI IN DEFINICIJE</a></li>
              <li><a href="#sec-3" style={{ color: 'var(--primary)', textDecoration: 'none' }}>3. NAMENI IN PRAVNE PODLAGE ZA OBDELAVO PODATKOV</a></li>
              <li><a href="#sec-4" style={{ color: 'var(--primary)', textDecoration: 'none' }}>4. KATERE PODATKE ZBIRAMO?</a></li>
              <li><a href="#sec-5" style={{ color: 'var(--primary)', textDecoration: 'none' }}>5. PODROBEN SEZNAM OBDELOVALCEV IN LOKACIJA PODATKOV</a></li>
              <li><a href="#sec-6" style={{ color: 'var(--primary)', textDecoration: 'none' }}>6. VARNOST PODATKOV IN TEHNIČNI UKREPI</a></li>
              <li><a href="#sec-7" style={{ color: 'var(--primary)', textDecoration: 'none' }}>7. PIŠKOTKI (COOKIES) IN SPLETNE TEHNOLOGIJE</a></li>
              <li><a href="#sec-8" style={{ color: 'var(--primary)', textDecoration: 'none' }}>8. DOBA HRAMBE PODATKOV</a></li>
              <li><a href="#sec-9" style={{ color: 'var(--primary)', textDecoration: 'none' }}>9. IZBRIS PODATKOV (PRAVICA DO POZABE)</a></li>
              <li><a href="#sec-10" style={{ color: 'var(--primary)', textDecoration: 'none' }}>10. POSAMEZNIKOVE PRAVICE PO GDPR</a></li>
              <li><a href="#sec-11" style={{ color: 'var(--primary)', textDecoration: 'none' }}>11. VARSTVO OTROK</a></li>
              <li><a href="#sec-12" style={{ color: 'var(--primary)', textDecoration: 'none' }}>12. PRITOŽBA NADZORNEMU ORGANU</a></li>
              <li><a href="#sec-13" style={{ color: 'var(--primary)', textDecoration: 'none' }}>13. KONČNE DOLOČBE</a></li>
            </ul>
          </div>

          <section id="sec-1">
            <h2>1. UPRAVLJAVEC OSEBNIH PODATKOV</h2>
            <p>Upravljavec osebnih podatkov, ki določa namene in sredstva obdelave, je:</p>
            <ul>
              <li><strong>Ime in priimek:</strong> Filip Kolle</li>
              <li><strong>E-naslov:</strong> <a href="mailto:info@finance4p.com">info@finance4p.com</a></li>
            </ul>
            <p>Za vsa vprašanja v zvezi z varstvom vaših osebnih podatkov, vpogledom v podatke ali uveljavljanjem vaših pravic smo vam na voljo na zgoraj navedenem e-naslovu.</p>
          </section>

          <section id="sec-2">
            <h2>2. OSNOVNI POJMI IN DEFINICIJE</h2>
            <ul>
              <li><strong>Osebni podatek:</strong> Vsaka informacija, ki se nanaša na določenega ali določljivega posameznika (npr. ime, e-naslov, IP naslov, lokacijski podatki, spletni identifikatorji).</li>
              <li><strong>Obdelava:</strong> Kakršno koli dejanje ali niz dejanj, ki se izvaja v zvezi z osebnimi podatki (zbiranje, beleženje, urejanje, shranjevanje, prilagajanje, vpogled, uporaba, razkritje, izbris).</li>
              <li><strong>Upravljavec:</strong> Posameznik ali pravna oseba, ki določa namene in sredstva obdelave vaših podatkov.</li>
              <li><strong>Obdelovalec:</strong> Pravna ali fizična oseba, ki obdeluje osebne podatke v imenu upravljavca (npr. ponudniki oblačnih storitev).</li>
              <li><strong>Privolitev:</strong> Prostovoljna, izrecna in nedvoumna izjava volje, s katero posameznik dovoli obdelavo svojih podatkov za določen namen.</li>
            </ul>
          </section>

          <section id="sec-3">
            <h2>3. NAMENI IN PRAVNE PODLAGE ZA OBDELAVO PODATKOV</h2>
            <p>Osebne podatke zbiramo in obdelujemo le takrat, ko imamo za to zakonito podlago:</p>
            
            <h3>a.) Obdelava na podlagi privolitve (Člen 6(1)(a) GDPR)</h3>
            <ul>
              <li><strong>E-novice in waitlist:</strong> Obdelava vašega imena in e-naslova za namen obveščanja o novostih, posodobitvah in začetku delovanja aplikacije prek platforme Brevo.</li>
              <li><strong>Potisna obvestila:</strong> Pošiljanje opomnikov in finančnih nasvetov znotraj aplikacije Finance 4P.</li>
              <li><strong>Dostop do funkcij naprave:</strong> Dostop do kamere in galerije za namene nalaganja slik računov ali dokumentov v aplikacijo.</li>
              <li><strong>Analitični piškotki:</strong> Spremljanje vedenja na spletni strani prek Google Analytics za izboljšanje uporabniške izkušnje.</li>
            </ul>

            <h3>b.) Obdelava na podlagi pogodbe (Člen 6(1)(b) GDPR)</h3>
            <p>Obdelava je nujna za izvajanje storitve ali na zahtevo posameznika pred sklenitvijo pogodbe:</p>
            <ul>
              <li><strong>Registracija in avtentikacija:</strong> Uporaba Google Sign-In ali Apple ID za varno prijavo.</li>
              <li><strong>Izvajanje storitve:</strong> Shranjevanje in sinhronizacija vaših ročnih finančnih vnosov v oblaku prek storitve Supabase.</li>
              <li><strong>Naročnine:</strong> Upravljanje plačljivih paketov prek Stripe in RevenueCat.</li>
            </ul>

            <h3>c.) Obdelava na podlagi zakonitega interesa (Člen 6(1)(f) GDPR)</h3>
            <ul>
              <li>Analiza tehnične stabilnosti aplikacije in preprečevanje zlorab ali vdorov.</li>
              <li>Statistična obdelava podatkov v anonimizirani obliki za namen optimizacije poslovnih procesov.</li>
            </ul>

            <h3>d.) Obdelava na podlagi zakonske obveznosti (Člen 6(1)(c) GDPR)</h3>
            <ul>
              <li>Hranjenje podatkov o finančnih transakcijah (naročninah) za namene davčnega poročanja in računovodstva.</li>
            </ul>
          </section>

          <section id="sec-4">
            <h2>4. KATERE PODATKE ZBIRAMO?</h2>
            <p><strong>Prostovoljno posredovani podatki:</strong></p>
            <ul>
              <li><strong>Podatki z landing page-a:</strong> Ime in e-poštni naslov, ki ju vnesete v obrazec za prijavo.</li>
              <li><strong>Podatki v aplikaciji:</strong> Ime, e-poštni naslov, neobvezno telefonska številka.</li>
              <li><strong>Finančni vnosi:</strong> Vsi podatki o prihodkih, odhodkih in finančnih ciljih, ki jih v aplikacijo vnesete ročno. Poudarjamo, da aplikacija ni neposredno povezana z vašimi bančnimi računi.</li>
            </ul>
            <p><strong>Podatki, ki se generirajo avtomatsko:</strong></p>
            <ul>
              <li><strong>Tehnični podatki:</strong> IP naslov, Advertising ID (IDFA/AAID), model naprave, operacijski sistem.</li>
              <li><strong>Podatki o uporabi:</strong> Čas obiska, trajanje seje, kliknjene funkcije in poti znotraj aplikacije ali spletne strani.</li>
            </ul>
          </section>

          <section id="sec-5">
            <h2>5. PODROBEN SEZNAM OBDELOVALCEV IN LOKACIJA PODATKOV</h2>
            <p>Vaših osebnih podatkov ne prodajamo ali nepooblaščeno razkrivamo. Za zagotavljanje vrhunske storitve sodelujemo s preverjenimi partnerji:</p>
            <ol>
              <li><strong>Supabase:</strong> Uporablja se izključno za bazo podatkov mobilne aplikacije in avtentikacijo. Podatki se hranijo na strežnikih v regiji EU (Frankfurt ali Dublin), kar zagotavlja skladnost z GDPR.</li>
              <li><strong>Brevo:</strong> Uporablja se za shranjevanje e-naslovov in imen, zbranih na landing pagu. Brevo je podjetje s sedežem v EU, ki zagotavlja najvišje standarde varnosti e-poštnega marketinga.</li>
              <li><strong>Google Ireland Ltd.:</strong> Uporablja se za Google Analytics (analitika spletne strani in aplikacije) ter Google Sign-In.</li>
              <li><strong>Apple Inc.:</strong> Uporablja se za Apple ID prijavo in In-App nakupne procese.</li>
              <li><strong>Cookiebot:</strong> Storitev za upravljanje in dokumentiranje vaših privolitev glede piškotkov na spletni strani.</li>
              <li><strong>Stripe &amp; RevenueCat:</strong> Obdelava naročnin in plačilnih procesov.</li>
            </ol>
          </section>

          <section id="sec-6">
            <h2>6. VARNOST PODATKOV IN TEHNIČNI UKREPI</h2>
            <p>Vaše zaupanje cenimo, zato izvajamo stroge tehnične in organizacijske ukrepe za zaščito pred nepooblaščenim dostopom, spreminjanjem ali uničenjem podatkov:</p>
            <ul>
              <li><strong>Šifriranje:</strong> Uporaba SSL (Secure Sockets Layer) in TLS protokola za varen prenos podatkov.</li>
              <li><strong>Varnost v oblaku:</strong> Podatki v storitvi Supabase so šifrirani tako med prenosom kot v mirovanju (at-rest encryption).</li>
              <li><strong>Omejitev dostopa:</strong> Dostop do baz podatkov je omejen na upravljavca in zaščiten z večstopenjsko avtentikacijo.</li>
            </ul>
          </section>

          <section id="sec-7">
            <h2>7. PIŠKOTKI (COOKIES) IN SPLETNE TEHNOLOGIJE</h2>
            <p><strong>Mobilna aplikacija:</strong> Finance 4P ne uporablja klasičnih piškotkov, temveč uporablja identifikatorje naprave in lokalno shrambo za zagotavljanje seje uporabnika.</p>
            <p><strong>Spletna stran (Landing page):</strong> Uporablja piškotke za analizo prometa. Za zagotavljanje popolne transparentnosti uporabljamo orodje Cookiebot.</p>
            <ul>
              <li><strong>Nujni piškotki:</strong> Nujni za delovanje strani (npr. shranjevanje vaše privolitve).</li>
              <li><strong>Analitični piškotki:</strong> Google Analytics piškotki, ki se naložijo le, če v Cookiebot bannerju kliknete "Sprejmi" ali "Strinjam se".</li>
              <li><strong>Upravljanje:</strong> Svoje nastavitve lahko kadarkoli spremenite s klikom na ikono piškotka v nogi spletne strani.</li>
            </ul>
          </section>

          <section id="sec-8">
            <h2>8. DOBA HRAMBE PODATKOV</h2>
            <p>Podatke hranimo le toliko časa, dokler je to potrebno za dosego namena, za katerega so bili zbrani:</p>
            <ul>
              <li><strong>Podatki v aplikaciji:</strong> Hranijo se do trenutka, ko uporabnik izbriše svoj račun.</li>
              <li><strong>Podatki v sistemu Brevo:</strong> Hranijo se do vaše odjave od e-novic (preklic privolitve).</li>
              <li><strong>Tehnični dnevniki:</strong> Hranijo se od 6 do 12 mesecev.</li>
              <li><strong>Davčni podatki:</strong> Podatki o plačilih se skladno z zakonom hranijo 10 let.</li>
            </ul>
          </section>

          <section id="sec-9">
            <h2>9. IZBRIS PODATKOV (PRAVICA DO POZABE)</h2>
            <p>Uporabnik ima v aplikaciji Finance 4P možnost, da kadarkoli sam sproži postopek izbrisa računa.</p>
            <ul>
              <li>Po potrditvi izbrisa bodo vsi vaši osebni in finančni podatki trajno odstranjeni iz baz Supabase v roku 10 dni.</li>
              <li>Če želite izbris podatkov iz sistema Brevo, lahko to storite s klikom na povezavo "Odjava" v katerem koli e-mailu ali pa nam pišete na <a href="mailto:info@finance4p.com">info@finance4p.com</a>.</li>
            </ul>
          </section>

          <section id="sec-10">
            <h2>10. POSAMEZNIKOVE PRAVICE PO GDPR</h2>
            <p>Skladno z veljavno zakonodajo imate naslednje pravice:</p>
            <ul>
              <li><strong>Pravica do dostopa:</strong> Zahtevate lahko potrditev, ali se vaši podatki obdelujejo, in pridobite kopijo teh podatkov.</li>
              <li><strong>Pravica do popravka:</strong> Zahtevate lahko takojšen popravek netočnih ali dopolnitev nepopolnih podatkov.</li>
              <li><strong>Pravica do izbrisa (Pozaba):</strong> Zahtevate lahko izbris svojih podatkov pod določenimi pogoji.</li>
              <li><strong>Pravica do omejitve obdelave:</strong> Zahtevate lahko, da se obdelava vaših podatkov omeji.</li>
              <li><strong>Pravica do prenosljivosti:</strong> Zahtevate lahko, da vam podatke posredujemo v strukturirani, strojno berljivi obliki.</li>
              <li><strong>Pravica do ugovora:</strong> Kadarkoli lahko ugovarjate obdelavi za namene neposrednega trženja.</li>
            </ul>
            <p>Za uveljavljanje teh pravic nam pišite na: <a href="mailto:info@finance4p.com">info@finance4p.com</a>. Na vašo zahtevo bomo odgovorili brez nepotrebnega odlašanja, najkasneje pa v roku 30 dni.</p>
          </section>

          <section id="sec-11">
            <h2>11. VARSTVO OTROK</h2>
            <p>Aplikacija Finance 4P ni namenjena osebam, mlajšim od 15 let. Upravljavec zavestno ne zbira osebnih podatkov od otrok, mlajših od 15 let. Če ugotovimo, da smo nenamerno pridobili podatke mladoletne osebe brez privolitve staršev, bomo te podatke nemudoma izbrisali.</p>
          </section>

          <section id="sec-12">
            <h2>12. PRITOŽBA NADZORNEMU ORGANU</h2>
            <p>Če menite, da obdelava vaših osebnih podatkov krši predpise o varstvu podatkov, imate pravico vložiti pritožbo pri nacionalnem nadzornem organu:</p>
            <p>
              <strong>Informacijski pooblaščenec Republike Slovenije</strong><br />
              Dunajska cesta 22, 1000 Ljubljana<br />
              Telefon: 01 230 97 30<br />
              E-pošta: <a href="mailto:gp.ip@ip-rs.si">gp.ip@ip-rs.si</a>
            </p>
          </section>

          <section id="sec-13">
            <h2>13. KONČNE DOLOČBE</h2>
            <p>Ta Politika zasebnosti stopi v veljavo z dnem objave. Upravljavec si pridržuje pravico do občasnih posodobitev dokumenta v primeru tehničnih sprememb ali sprememb zakonodaje. O vseh pomembnih spremembah boste obveščeni znotraj aplikacije, na spletni strani ali prek e-pošte.</p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
