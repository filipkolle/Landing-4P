import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const expoOut = [0.19, 1, 0.22, 1];

const TermsOfService = () => {
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
            <FileText size={22} className="pp-shield-icon" />
            <span>Splošni pogoji poslovanja</span>
          </div>
        </div>

        {/* Content */}
        <div className="pp-body">
          <h1>SPLOŠNI POGOJI POSLOVANJA MOBILNE APLIKACIJE FINANCE 4P</h1>
          <p className="pp-date"><strong>Datum zadnje osvežitve:</strong> 5. april 2026</p>
          
          <section>
            <h2>Uvodne določbe in sprejem pogojev</h2>
            <p>
              Ti splošni pogoji poslovanja (v nadaljevanju: "pogoji") predstavljajo pravno zavezujoč sporazum med vami kot uporabnikom (v nadaljevanju: "uporabnik" ali "vi") in ponudnikom aplikacije glede dostopa in uporabe mobilne aplikacije FINANCE 4P (v nadaljevanju: "aplikacija") ter vseh povezanih storitev, spletnih strani in funkcij.
            </p>
            <p>
              Z namestitvijo, registracijo ali kakršno koli obliko uporabe te aplikacije potrjujete, da ste v celoti prebrali te pogoje, jih razumeli in se z njimi nepreklicno strinjate. Če se s katerim koli delom teh pogojev ne strinjate, vas prosimo, da aplikacije ne nameščate oziroma jo nemudoma odstranite s svoje naprave.
            </p>
          </section>

          <section>
            <h2>Namen in narava aplikacije</h2>
            <p>
              Aplikacija FINANCE 4P je zasnovana kot sodoben digitalni dnevnik in analitično orodje, namenjeno posameznikom za boljšo organizacijo in pregled nad lastnimi finančnimi tokovi ter delovnim časom. Deluje po principu ročnega vnosa podatkov, kar pomeni, da je aplikacija zgolj pasivno orodje za obdelavo informacij, ki jih vanjo vnaša uporabnik.
            </p>
            <p>
              Ponudnik poudarja, da aplikacija ni namenjena profesionalnemu finančnemu upravljanju, bančnemu posredovanju ali uradnemu računovodstvu. Vsi izračuni, grafi in PDF izvozi so informativne narave in služijo kot pripomoček za osebno evidenco. Uporabnik aplikacijo uporablja na lastno odgovornost, zavedajoč se, da nobena programska oprema ni popolnoma imuna na morebitne tehnične napake ali nepravilnosti v delovanju.
            </p>
          </section>

          <section>
            <h2>Opredelitev pojmov</h2>
            <ul>
              <li><strong>Aplikacija:</strong> Programska oprema FINANCE 4P, dostopna v uradnih trgovinah z aplikacijami.</li>
              <li><strong>Uporabnik:</strong> Vsaka fizična ali pravna oseba, ki uporablja aplikacijo.</li>
              <li><strong>Vsebina:</strong> Vsi podatki, besedila, grafi in poročila, ki jih aplikacija generira ali vsebuje.</li>
              <li><strong>Storitve:</strong> Vse funkcionalnosti, ki jih ponudnik omogoča prek aplikacije (npr. beleženje ur, izračun neto vrednosti, PDF izvoz).</li>
            </ul>
          </section>

          <section>
            <h2>1. Podatki o ponudniku</h2>
            <p>V skladu z ZEPT navajamo podatke o upravljavcu aplikacije:</p>
            <p>
              <strong>Ime in priimek:</strong> Filip Kolle<br />
              <strong>E-naslov za podporo:</strong> <a href="mailto:info@finance4p.com">info@finance4p.com</a>
            </p>
          </section>

          <section>
            <h2>2. Opis storitve in dostopnost</h2>
            <p>Aplikacija FINANCE 4P je digitalno orodje za analizo osebnih financ in spremljanje dela, ki vključuje:</p>
            <ul>
              <li>Beleženje delovnega časa in izračun predvidenega zaslužka.</li>
              <li>Spremljanje denarnega toka (cash flow), neto vrednosti in osebnih sredstev/dolgov.</li>
              <li>Generiranje PDF poročil na podlagi ročnih vnosov.</li>
              <li>Finančna analitika.</li>
            </ul>
            <p>
              Aplikacija je na voljo prek uradnih trgovin (App Store, Google Play). Ponudnik si pridržuje pravico do spreminjanja funkcionalnosti aplikacije brez predhodnega obvestila.
            </p>
          </section>

          <section>
            <h2>3. Uporabniški račun in varnost</h2>
            <ul>
              <li><strong>Registracija:</strong> Za uporabo določenih funkcij se zahteva registracija računa. Uporabnik je dolžan posredovati točne podatke.</li>
              <li><strong>Varnost gesla:</strong> Uporabnik je sam odgovoren za varovanje svojega gesla in dostopa do mobilne naprave. Ponudnik ne odgovarja za nepooblaščen dostop do računa, ki je posledica malomarnosti uporabnika.</li>
              <li><strong>Izbris računa:</strong> Uporabnik lahko svoj račun in vse povezane podatke trajno izbriše neposredno v nastavitvah aplikacije.</li>
            </ul>
          </section>

          <section>
            <h2>4. Omejitev odgovornosti (Pravni pouk)</h2>
            <p>Aplikacija FINANCE 4P deluje izključno kot matematično-analitično orodje.</p>
            <ul>
              <li><strong>Ni finančni nasvet:</strong> Informacije v aplikaciji niso finančno, davčno ali pravno svetovanje. Uporabnik se mora pred ključnimi finančnimi odločitvami posvetovati s strokovnjakom.</li>
              <li><strong>Ročni vnosi:</strong> Rezultati (izračuni) so v celoti odvisni od točnosti ročnih vnosov uporabnika. Ponudnik ne jamči za pravilnost izračunov v primeru napačnih vnosov.</li>
              <li><strong>Tehnična odgovornost:</strong> Ponudnik ne prevzema odgovornosti za morebitno izgubo podatkov zaradi tehničnih napak, izpadov strežnika ali izgube mobilne naprave. Uporabniku svetujemo redni izvoz podatkov v PDF format.</li>
            </ul>
          </section>

          <section>
            <h2>5. Uporaba PDF poročil in uradne evidence</h2>
            <ul>
              <li>PDF poročila, ki jih generira aplikacija, so informativne narave.</li>
              <li>Uporabnik prevzema polno odgovornost za uporabo teh poročil v uradne namene (oddaja delodajalcu, računovodstvu ali FURS-u).</li>
              <li>Aplikacija ni certificirana računovodska programska oprema, temveč pripomoček za osebno evidenco.</li>
            </ul>
          </section>

          <section>
            <h2>6. Cena in plačilni pogoji</h2>
            <ul>
              <li><strong>Osnovna uporaba:</strong> Prenos in osnovna uporaba aplikacije sta trenutno brezplačna.</li>
              <li><strong>Morebitne prihodnje storitve:</strong> Ponudnik si pridržuje pravico do uvedbe plačljivih (Premium) funkcij, o čemer bodo uporabniki obveščeni vnaprej.</li>
            </ul>
          </section>

          <section>
            <h2>7. Varstvo osebnih podatkov (GDPR)</h2>
            <p>
              Ponudnik obdeluje osebne podatke v skladu z veljavno slovensko zakonodajo in Splošno uredbo o varstvu podatkov (GDPR). Podatki se zbirajo izključno za namen delovanja aplikacije. Podrobnosti so opredeljene v Politiki zasebnosti, ki je dostopna v aplikaciji.
            </p>
            <p>
              Za zagotavljanje nemotenega delovanja aplikacije Finance 4P in izboljšanje uporabniške izkušnje sodelujemo z zunanjimi izvajalci storitev, ki v našem imenu obdelujejo določene podatke. Ti izvajalci (obdelovalci podatkov) so izbrani skrbno in zagotavljajo skladnost z evropskimi standardi varstva podatkov (GDPR).
            </p>
            <h3>1. Hramba podatkov in infrastruktura (Supabase)</h3>
            <p>Za varno hrambo vaših vnesenih podatkov, registracijo uporabnikov in delovanje baze podatkov uporabljamo storitev Supabase (Supabase Inc.).</p>
            <ul>
              <li><strong>Vrsta podatkov:</strong> E-naslov, geslo (v šifrirani obliki), vsi ročno vneseni finančni podatki in podatki o delovnem času.</li>
              <li><strong>Namen:</strong> Zagotavljanje osnovne funkcionalnosti aplikacije, sinhronizacija podatkov med napravami in varna avtentikacija.</li>
              <li><strong>Varnost:</strong> Podatki so shranjeni na strežnikih z visoko stopnjo zaščite in so dostopni le prek šifriranih povezav.</li>
            </ul>
            <h3>2. Analitika in izboljšanje storitev (Google Analytics)</h3>
            <p>Za analizo uporabe aplikacije in razumevanje, kako uporabniki interagirajo z vmesnikom, uporabljamo orodje Google Analytics (Google Ireland Limited).</p>
            <ul>
              <li><strong>Vrsta podatkov:</strong> Anonimizirani podatki o uporabi (npr. katere gumbe uporabniki kliknejo, čas uporabe, tip naprave). Orodje ne zbira vaših osebnih finančnih vnosov.</li>
              <li><strong>Namen:</strong> Optimizacija delovanja aplikacije, odpravljanje hroščev in izboljšanje uporabniške izkušnje.</li>
              <li><strong>Nadzor:</strong> Uporabnik lahko zbiranje analitičnih podatkov omeji s svojimi nastavitvami v napravi ali znotraj aplikacije.</li>
            </ul>
            <h3>3. Prenos podatkov v tretje države</h3>
            <p>
              Nekateri naši partnerji imajo sedež zunaj Evropskega gospodarskega prostora (npr. v ZDA). V teh primerih prenos podatkov poteka v skladu z odločbo o ustreznosti (Data Privacy Framework med EU in ZDA) ali na podlagi standardnih pogodbenih klavzul, ki zagotavljajo, da vaši podatki ostanejo varni.
            </p>
          </section>

          <section>
            <h2>8. Pravica do odstopa od pogodbe</h2>
            <p>
              V skladu z ZVPot-1 pri digitalnih storitvah (brezplačnih ali plačljivih) uporabnik s prenosom in začetkom uporabe digitalne vsebine soglaša, da se storitev začne izvajati takoj. Pri brezplačnih storitvah uporabnik pogodbo prekine z izbrisom računa in aplikacije.
            </p>
          </section>

          <section>
            <h2>9. Reševanje sporov</h2>
            <ul>
              <li><strong>Veljavno pravo:</strong> Za te pogoje velja pravo Republike Slovenije.</li>
              <li><strong>Izvensodno reševanje:</strong> Ponudnik v skladu z zakonskimi normami ne priznava nobenega izvajalca izvensodnega reševanja potrošniških sporov kot pristojnega za reševanje potrošniškega spora.</li>
              <li><strong>Platforma SRPS:</strong> Povezava do platforme za spletno reševanje sporov (SRPS): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</li>
              <li><strong>Sodišče:</strong> Za morebitne spore, ki jih ni mogoče rešiti sporazumno, je pristojno sodišče v Ljubljani.</li>
            </ul>
          </section>

          <section>
            <h2>10. Spremembe</h2>
            <p>
              Ponudnik lahko te pogoje kadarkoli spremeni. O pomembnih spremembah bodo uporabniki obveščeni prek aplikacije ali e-pošte. Nadaljnja uporaba aplikacije po objavi sprememb pomeni strinjanje z novimi pogoji.
            </p>
          </section>

          <section>
            <h2>11. Kontaktni podatki</h2>
            <p>
              Za vsa vprašanja smo dosegljivi od ponedeljka do petka od 10:00 do 20:00 na telefonski številki <strong>+386 70 736 947</strong> ali preko e-pošte: <a href="mailto:info@finance4p.com">info@finance4p.com</a>.
            </p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TermsOfService;
