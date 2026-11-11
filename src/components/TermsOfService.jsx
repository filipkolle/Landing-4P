import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Globe, ChevronRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <Navbar />

      <main className="legal-main-container">
        <div className="legal-top-nav">
          <button onClick={() => navigate('/')} className="legal-back-btn">
            <ArrowLeft size={18} />
            <span>Nazaj na začetno stran</span>
          </button>
          <div className="legal-breadcrumb">
            <Link to="/">Domov</Link>
            <ChevronRight size={14} />
            <span>Pogoji poslovanja</span>
          </div>
        </div>

        <header className="legal-header">
          <div className="legal-badge">
            <FileText size={16} />
            <span>Pravni dokument • Finance 4P</span>
          </div>
          <h1 className="legal-title">Splošni pogoji poslovanja</h1>
          <p className="legal-subtitle">Finance 4P • Aplikacija • finance4p.com • 4P dashboard</p>

          <div className="legal-meta-tags">
            <div className="legal-meta-item">
              <Calendar size={16} />
              <span>Datum uveljavitve: <strong>9. september 2026</strong></span>
            </div>
            <div className="legal-meta-item">
              <Globe size={16} />
              <span>Veljavno pravo: <strong>Republika Slovenija, Evropska unija</strong></span>
            </div>
          </div>
        </header>

        <div className="legal-divider" />

        <article className="legal-content">
        <h2 className="legal-h2">Dobrodošli pri Finance 4P.</h2>
        <p className="legal-p">Ti Splošni pogoji poslovanja (v nadaljevanju: Pogoji) so pravno zavezujoč sporazum med vami kot uporabnikom (v nadaljevanju: Uporabnik) in ponudnikom Finance 4P (v nadaljevanju: Ponudnik). Urejajo dostop do mobilne aplikacije Finance 4P, spletne strani <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a> in 4P dashboarda ter vse z njimi povezane storitve.</p>
        <p className="legal-p">Z namestitvijo, registracijo ali kakšno koli obliko uporabe katerekoli storitve Finance 4P Uporabnik potrjuje, da je v celoti prebral te Pogoje, jih razume in se z njimi v celoti strinja. Ti Pogoji skupaj s Politiko zasebnosti predstavljajo celoten sporazum med Ponudnikom in Uporabnikom.</p>
        <p className="legal-p"><em>Če se s temi Pogoji v celoti ne strinjate, vas prosimo, da ne nameščate aplikacije oziroma jo nemudoma odstranite s svoje naprave ter prenehate z obiski naših spletnih storitev.</em></p>
        <h2 className="legal-h2">Kdo lahko uporablja Finance 4P</h2>
        <p className="legal-p">Storitve Finance 4P lahko uporabljate, če:</p>
        <ul className="legal-list">
          <li>ste stari 13 let ali več</li>
          <li>se strinjate s temi Pogoji in našo Politiko zasebnosti</li>
          <li>ste pooblaščeni za sklenitev pravno zavezujočega sporazuma</li>
          <li>vaš račun predhodno ni bil deaktiviran s strani Ponudnika zaradi kršitve Pogojev</li>
        </ul>
        <p className="legal-p"><em>Otroci, mlajši od 13 let, ne smejo uporabljati nobene storitve Finance 4P. Če ste starš ali zakoniti skrbnik in ugotovite, da vaš otrok uporablja Finance 4P, nas nemudoma kontaktirajte na </em><em><a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></em><em>.</em></p>
        <h2 className="legal-h2">1. Podatki o ponudniku</h2>
        <p className="legal-p">V skladu z Zakonom o elektronskem poslovanju na trgu (ZEPT):</p>
        <ul className="legal-list">
          <li>Ime in priimek: Filip Kolle</li>
          <li>Kraj stalnega bivalšča: Ljubljana, Slovenija</li>
          <li>Ponudnik ni zavezanec za DDV.</li>
          <li>E-naslov: <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></li>
          <li>Telefon: <a href="tel:+38670736947" className="legal-link">+386 70 736 947</a></li>
          <li>Dosegljivost: ponedeljek – petek, 10:00–20:00</li>
        </ul>
        <h2 className="legal-h2">2. Opis storitev</h2>
        <h3 className="legal-h3">2.1 Mobilna aplikacija Finance 4P</h3>
        <p className="legal-p">Finance 4P je osebni digitalni dnevnik in analitično orodje, namenjeno posameznikom za pregled nad lastnimi finančnimi tokovi in delovnim časom. Aplikacija deluje izključno na podlagi ročnih vnosov Uporabnika in ni povezana z bančnimi računi ali katerim koli zunanjim finančnim sistemom.</p>
        <p className="legal-p">Aplikacija ponuja: sledenje delovnemu času in izračun predvidenega zaslužka, beleženje prihodkov in odhodkov po kategorijah, generiranje informativnih PDF poročil ter pregled finančne analitike.</p>
        <h3 className="legal-h3">2.2 Spletna stran finance4p.com</h3>
        <p className="legal-p">Informativna spletna stran za predstavitev aplikacije Finance 4P. Omogoča prijavo z e-poštnim naslovom za obvestila o dostopnosti aplikacije in novostih ter dostop do teh Pogojev in Politike zasebnosti.</p>
        <h3 className="legal-h3">2.3 Delodajalski dashboard (finance4p.com/dashboard)</h3>
        <p className="legal-p">Ločen spletni vmesnik, namenjen delodajalcem, ki omogoča pregled delovnih ur in izračun obveznosti do zaposlenega. Dostop deluje izključno na podlagi dostopne kode, ki jo zaposleni sam generira in prostovoljno posreduje delodajalcu.</p>
        <p className="legal-p">Dashboard je trenutno v fazi brezplačne bete. Ponudnik si pridržuje pravico do uvedbe plačljivih nivojev v prihodnosti.</p>
        <p className="legal-p"><em>Pomembno: Nobena storitev Finance 4P ni namenjena profesionalnemu finančnemu upravljanju, bančnemu posredovanju, uradnemu računovodstvu ali davčnemu svetovanju. Storitve se zagotavljajo na osnovi ročnih vnosov uporabnikov. Vsi izračuni, grafi in PDF izvozi so izključno informativne narave. Pred pomembnimi finančnimi odločitvami se posvetujte s pooblaščenim strokovnjakom.</em></p>
        <h2 className="legal-h2">3. Narava storitve in izključitev garancij</h2>
        <p className="legal-p">Storitve Finance 4P se zagotavljajo „KOT SO“ in „KOT SO RAZPOLOŽLJIVE“ brez kakršnih koli garancij. Finance 4P je produkt v razvoju — nekatere funkcionalnosti morda ne bodo delovale točno tako, kot je načrtovano.</p>
        <p className="legal-p"><strong>Ponudnik izrecno izključuje vse garancije, izražene ali implicitne, vključno z garancijami glede ustreznosti za določen namen, prodajnosti, točnosti izračunov, razpoložljivosti storitve ali nekršitve pravic. Uporabnik uporablja storitve na lastno odgovornost.</strong></p>
        <p className="legal-p">Ponudnik ne jamči za:</p>
        <ul className="legal-list">
          <li>brezhibno ali neprekinjeno delovanje aplikacije, spletne strani ali dashboarda</li>
          <li>točnost izračunov, ki temeljijo na vnosih Uporabnika</li>
          <li>ohranitev podatkov pri anonimni (gostujoči) uporabi brez varnostne kopije</li>
          <li>razpoložljivost tretjih ponudnikov (Supabase, Google, Apple, Stripe, Brevo)</li>
        </ul>
        <p className="legal-p">Ponudnik si pridržuje pravico do spremembe, prekinitve ali ukinitve katerekoli funkcionalnosti ali celotne storitve kadarkoli, z ali brez predhodnega obvestila, brez odgovornosti do Uporabnika.</p>
        <h2 className="legal-h2">4. Pogoji in pravila uporabe</h2>
        <h3 className="legal-h3">4.1 Dovoljene oblike uporabe</h3>
        <p className="legal-p">Uporabnik se strinja, da bo storitve Finance 4P uporabljal izključno za zakonite namene in v skladu z vsemi veljavnimi zakoni in predpisi — lokalnimi, nacionalnimi in mednarodnimi. Uporabnik se strinja, da storitev ne bo uporabljal za:</p>
        <ul className="legal-list">
          <li>goljufive, zlorabljajoče ali nezakonite dejavnosti</li>
          <li>pranje denarja ali financiranje prepovedanih dejavnosti</li>
          <li>vnos lažnih, zavajajočih ali napačnih podatkov z namenom oškodovati tretje osebe</li>
          <li>poskuse nepooblaščenega dostopa do sistemov Ponudnika ali računov drugih Uporabnikov</li>
          <li>obratno inženirstvo, dekompilacijo ali razstavljanje aplikacije</li>
          <li>komercialno izkoriščanje storitve brez pisnega soglasja Ponudnika</li>
        </ul>
        <h3 className="legal-h3">4.2 Točnost podatkov</h3>
        <p className="legal-p">Uporabnik se strinja, da bo pri registraciji in uporabi storitev posredoval točne, popolne in ažurne podatke. Lažni ali zavajajoči podatki so razlog za takojšnjo deaktivacijo računa. Za točnost in resničnost finančnih podatkov, ki jih Uporabnik vnese v aplikacijo, Ponudnik ne odgovarja.</p>
        <h3 className="legal-h3">4.3 Vsebinski standardi za vnose, ki so vidni tretjim</h3>
        <p className="legal-p">Opombe, ki jih Uporabnik (zaposleni) vnese pri vnosih delovnega časa, so potencialno vidne delodajalcu prek dashboarda. Uporabnik se strinja, da v take vnose ne bo zapisoval vsebine, ki:</p>
        <ul className="legal-list">
          <li>vsebuje osebne podatke tretjih oseb brez njihovega soglasja</li>
          <li>je klevetniška, grobeža, žalljiva ali spolno eksplicitna</li>
          <li>vzpodbuja nasilje ali sovraštvo do posameznikov ali skupin</li>
          <li>je nezakonita ali krši pravice tretjih oseb</li>
          <li>vsebuje lažne ali zavajajoče trditve</li>
        </ul>
        <p className="legal-p">Ponudnik si pridržuje pravico do odstranitve vsake vsebine, ki krši te standarde, brez predhodnega obvestila. Ponudnik nima obveznosti nadzora vnesene vsebine, jo pa lahko po lastni presoji pregleduje.</p>
        <h2 className="legal-h2">5. Uporabniški računi in varnost</h2>
        <h3 className="legal-h3">5.1 Račun zaposlenega (aplikacija)</h3>
        <p className="legal-p">Za dostop do aplikacije je potrebna registracija preko Google Sign-In ali Apple ID in email računom. Uporabnik je izključno odgovoren za:</p>
        <ul className="legal-list">
          <li>varovanje dostopa do svojega računa in mobilne naprave</li>
          <li>vse dejavnosti, ki se zgodijo pod njegovim računom</li>
          <li>takojšnjo prijavo suma nepooblaščenega dostopa na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></li>
        </ul>
        <p className="legal-p">Ponudnik ne odgovarja za nepooblaščen dostop, ki je posledica malomarnosti Uporabnika.</p>
        <h3 className="legal-h3">5.2 Račun delodajalca (dashboard)</h3>
        <p className="legal-p">Delodajalec ustvari ločen račun na spletni strani <a href="https://finance4p.com/dashboard" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com/dashboard</a>. Ob registraciji je dolžan posredovati točne in popolne podatke. Ker dashboard vsebuje osebne podatke zaposlenih, mora delodajalec zagotoviti:</p>
        <ul className="legal-list">
          <li>zavarovanje dostopa z močnim geslom in omejitev dostopa na pooblaščene osebe</li>
          <li>takojšnjo prijavo suma nepooblaščenega dostopa na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></li>
          <li>skladnost z veljavno zakonodajo o varstvu osebnih podatkov</li>
        </ul>
        <h3 className="legal-h3">5.3 Prijava na e-poštna obvestila</h3>
        <p className="legal-p">Prek obrazca na spletni strani <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a> lahko Uporabnik prostovoljno vnese e-poštni naslov za obvestila o dostopnosti aplikacije in novostih. Odjava je mogoča kadarkoli prek povezave „Odjava“ v e-poštnem sporočilu ali z zahtevo na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>.</p>
        <h2 className="legal-h2">6. Prekinitev dostopa in deaktivacija računa</h2>
        <h3 className="legal-h3">6.1 Pravica Ponudnika do prekinitve</h3>
        <p className="legal-p">Ponudnik si pridržuje pravico do začasne ali trajne prekinitve dostopa kateremu koli Uporabniku, kadarkoli in brez navedbe razloga, po lastni presoji. To vključuje, a ni omejeno na, primere:</p>
        <ul className="legal-list">
          <li>kršitve teh Pogojev ali Politike zasebnosti</li>
          <li>suma zlorabe, goljufije ali nepooblaščenega dostopa</li>
          <li>lažnih ali zavajajočih podatkov ob registraciji</li>
          <li>ugotovitve, da je Uporabnik mlajši od 13 let</li>
          <li>zaznane sumljive ali neobličajen dejavnosti na računu</li>
          <li>kadar Ponudnik po lastni presoji meni, da je prekinitev potrebna</li>
        </ul>
        <p className="legal-p">O deaktivaciji bo Ponudnik Uporabnika praviloma obvestil prek e-pošte, razen kadar to ni mogoče ali bi oviralo preprečevanje zlorabe.</p>
        <h3 className="legal-h3">6.2 Prenehanje pogodbe s strani Uporabnika</h3>
        <p className="legal-p"><strong>Zaposleni: </strong>Pogodbo prekine z izbrisom računa v nastavitvah aplikacije. S tem se takoj prekličejo vsi dostopi delodajalcev do njegovih podatkov. Vsi podatki bodo odstranjeni iz strežnikov v roku 30 dni.</p>
        <p className="legal-p"><strong>Delodajalec: </strong>Pogodbo prekine z izbrisom računa v nastavitvah dashboarda. Po izbrisu takoj izgubi dostop do vseh podatkov zaposlenih.</p>
        <h2 className="legal-h2">7. Delodajalski dashboard — posebni pogoji</h2>
        <h3 className="legal-h3">7.1 Dostop in privolitev zaposlenega</h3>
        <p className="legal-p">Delodajalec lahko dostopa do podatkov o zaposlenem v dashboardu izključno z veljavno dostopno kodo, ki jo zaposleni prostovoljno vnese v svojem profilu v aplikaciji. Vnašanje dostopnih kod brez vednosti zaposlenega, s silo ali prevaro je prepovedano in pomeni kršitev teh Pogojev ter veljavne zakonodaje.</p>
        <h3 className="legal-h3">7.2 Podatki, dostopni delodajalcu</h3>
        <p className="legal-p">Po vnosu veljavne dostopne kode delodajalec vidi izključno naslednje podatke, vezane na delovno razmerje z njim:</p>
        <ul className="legal-list">
          <li>Delovne ure po posameznih dnevih</li>
          <li>Urna postavka, dogovorjena za ta vir dohodka</li>
          <li>Opombe zaposlenega pri posameznih vnosih delovnega časa</li>
          <li>Skupni znesek za izplačilo na podlagi vnesenih ur — izključno za tega delodajalca</li>
        </ul>
        <p className="legal-p"><em>Delodajalec ne vidi skupnega zaslužka zaposlenega, njegovih ostalih virov dohodka, odhodkov, naročnin ali katerih koli drugih osebnih finančnih podatkov. Dostop je strogo omejen na podatke specifičnega delovnega razmerja.</em></p>
        <h3 className="legal-h3">7.3 Preklic dostopa s strani zaposlenega</h3>
        <p className="legal-p">Zaposleni lahko kadarkoli in brez navedbe razloga prekliče dostop posameznega delodajalca neposredno v aplikaciji. Po preklicu delodajalec takoj izgubi dostop do vseh podatkov — tako novih kot zgodovinskih. Ponudnik tega preklica ne more razveljaviti na zahtevo delodajalca.</p>
        <h3 className="legal-h3">7.4 Obveznosti in prepovedana ravnanja delodajalca</h3>
        <p className="legal-p">Z aktivacijo dashboarda prek dostopne kode se delodajalec zavezuje, da bo podatke zaposlenega:</p>
        <ul className="legal-list">
          <li>uporabljal izključno za namen izračuna in izplačila plačila</li>
          <li>varoval pred nepooblaščenim dostopom tretjih oseb</li>
          <li>obdeloval v skladu z GDPR in ZVOP-2</li>
        </ul>
        <p className="legal-p">Delodajalcu je izrecno prepovedano:</p>
        <ul className="legal-list">
          <li>Vnašanje dostopne kode brez prostovoljne privolitve zaposlenega</li>
          <li>dostopati do podatkov zaposlenega za namene razen izplačila</li>
          <li>posredovati podatke zaposlenega tretjim osebam brez njegove privolitve</li>
          <li>si prizadevati pridobiti dostop po preklicu dostopne kode</li>
          <li>podatke zaposlenega uporabljati za profiliranje, oglaševanje ali nadzor</li>
        </ul>
        <p className="legal-p">Kršitev teh prepovedi je razlog za takojšnjo trajno deaktivacijo računa delodajalca in je lahko podlaga za prijavo pristojnim organom.</p>
        <h3 className="legal-h3">7.5 Izvoz podatkov (PDF/CSV)</h3>
        <p className="legal-p">Delodajalec ima možnost izvoza podatkov zaposlenega v formatu PDF ali CSV. Z izvozom delodajalec postane samostojni upravljavec teh podatkov v smislu čl. 4(7) GDPR in je osebno odgovoren za njihovo varno hrambo, omejitev dostopa, skladnost z zakonodajo in izbris, ko podatki niso več potrebni.</p>
        <p className="legal-p">Ponudnik ne odgovarja za ravnanje delodajalca z izvoženimi podatki po prenosu iz sistema. Izvoženi dokumenti so informativne narave in ne predstavljajo uradnih obračunskih listin.</p>
        <h3 className="legal-h3">7.6 Status dashboarda in cene</h3>
        <p className="legal-p">Dashboard je trenutno v fazi brezplačne bete. Ponudnik si pridržuje pravico do uvedbe plačljivih nivojev v prihodnosti. V tem primeru se zavezuje:</p>
        <ul className="legal-list">
          <li>obvestiti registrirane delodajalce vsaj 30 dni pred uveljavitvijo cen prek e-pošte</li>
          <li>jasno navesti cene, pogoje in vsebino vsakega plačljivega nivoja pred kakršnim koli plačilom</li>
          <li>omogočiti nadaljevanje brezplačne uporabe v obsegu, ki ga plačljivi model ne zajame</li>
        </ul>
        <h2 className="legal-h2">8. Intelektualna lastnina in licenca</h2>
        <p className="legal-p">Aplikacija Finance 4P, spletna stran <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a> in delodajalski dashboard, vključno z vso programsko kodo, grafičnim vmesnikom, logotipi, besedili in vsemi drugimi elementi, so intelektualna lastnina Ponudnika in so zaščiteni z veljavno slovensko in mednarodno zakonodajo o avtorskih pravicah.</p>
        <p className="legal-p">Ponudnik Uporabniku podeljuje omejeno, neizključno, neprenosljivo in odpoklicljivo licenco za osebno, nekomercialno uporabo storitev v skladu s temi Pogoji. Brez izrecnega pisnega soglasja Ponudnika je prepovedano:</p>
        <ul className="legal-list">
          <li>kopiranje, reproduciranje ali distribucija aplikacije ali njenih delov</li>
          <li>razstavljanje, dekompilacija ali obratno inženirstvo izvorne kode</li>
          <li>prodaja, sublicenciranje ali prenos licence na tretje osebe</li>
          <li>komercialna uporaba aplikacije ali njenih elementov</li>
        </ul>
        <h2 className="legal-h2">9. Omejitev odgovornosti</h2>
        <h3 className="legal-h3">9.1 Izključitev posredne škode</h3>
        <p className="legal-p">Ponudnik ne prevzema odgovornosti za:</p>
        <ul className="legal-list">
          <li>napake v izračunih, ki so posledica napačnih ali nepopolnih ročnih vnosov Uporabnika</li>
          <li>izgubo podatkov pri anonimni uporabi brez varnostne kopije</li>
          <li>začasno ali trajno nedosegljivost katerekoli storitve</li>
          <li>motnje v delovanju tretjih ponudnikov (Supabase, Google, Apple, Stripe, Brevo)</li>
          <li>ravnanje delodajalca z izvoženimi podatki zaposlenega po prenosu</li>
          <li>škodo, ki nastane zaposlenemu zaradi zlorabe dostopne kode s strani delodajalca</li>
          <li>finančne odločitve, ki jih Uporabnik sprejme na podlagi informacij v aplikaciji</li>
        </ul>
        <p className="legal-p"><strong>Ponudnik v nobenem primeru ne odgovarja za posredno, naključno, posledično, posebno ali kazensko škodo (vključno z izgubljenimi prihodki, izgubljenimi podatki, izpadom poslovanja ali čustveno škodo), ki izhaja iz uporabe ali nezmožnosti uporabe storitev Finance 4P, ne glede na to, ali je bil Ponudnik obveščen o možnosti take škode.</strong></p>
        <p className="legal-p">Ponudnik ne izključuje odgovornosti za škodo, povzročeno z naklepnim ravnanjem ali hudo malomarnostjo Ponudnika. Omejitev odgovornosti velja v največjem obsegu, ki ga dovoljuje veljavna zakonodaja (ZVPot-1, Direktiva 2019/770/EU).</p>
        <h3 className="legal-h3">9.2 Odgovornost za vsebino Uporabnika</h3>
        <p className="legal-p">Ponudnik ni odgovoren za ocenjevanje točnosti, resničnosti, koristnosti, zakonitosti ali primernosti vsebine, ki jo Uporabniki vnašajo v storitve. Vsak Uporabnik je izključno odgovoren za vso vsebino, ki jo vnese, naloži ali posreduje prek storitev Finance 4P.</p>
        <h2 className="legal-h2">10. Odškočninska klavzula</h2>
        <p className="legal-p">Uporabnik se zavezuje, da bo Ponudnika (Filipa Kolle), njegove zaposlene, agente in zastopnike zavaroval pred škodo in jih odškodninsko zavaroval pred vsemi zahtevki tretjih oseb, izgubami, škodami, obveznostmi, stroški in odvetniškimi honorarji, ki izhajajo iz:</p>
        <ul className="legal-list">
          <li>Uporabnikove uporabe storitev Finance 4P v nasprotju s temi Pogoji</li>
          <li>vsebine, ki jo je Uporabnik vnesel v storitve</li>
          <li>Uporabnikove kršitve veljavne zakonodaje</li>
          <li>Uporabnikove kršitve pravic tretjih oseb</li>
          <li>Uporabnikove zlorabe dostopa do podatkov zaposlenega (v primeru delodajalca)</li>
        </ul>
        <h2 className="legal-h2">11. Uporaba PDF poročil</h2>
        <p className="legal-p">PDF poročila, ki jih generira aplikacija ali jih izvozi delodajalec iz dashboarda, so izključno informativne narave in temeljijo v celoti na ročnih vnosih Uporabnika. Niso certificirana računovodska dokumentacija in se ne morejo brez dodatne preveritve predložiti FURS-u, delodajalcu ali računovodstvu kot uradnih dokazil.</p>
        <h2 className="legal-h2">12. Cena in plačilni pogoji</h2>
        <p className="legal-p">Aplikacija Finance 4P je v trenutni različici v celoti brezplačna. Dashboard je v fazi bete brezplačen. Ponudnik si pridržuje pravico do uvedbe plačljivih funkcionalnosti za aplikacijo in/ali plačljivih nivojev za dashboard v prihodnosti.</p>
        <p className="legal-p">Ob uvedbi plačljivih funkcionalnosti se Ponudnik zavezuje:</p>
        <ul className="legal-list">
          <li>obvestiti Uporabnike vsaj 30 dni vnaprej prek obvestila v aplikaciji in/ali prek e-pošte</li>
          <li>jasno navesti cene, pogoje in vsebino pred kakršnim koli plačilom</li>
          <li>zagotoviti, da bodo obstoječe brezplačne funkcionalnosti ostale brezplačne ali da bo Uporabnik obveščen z možnostjo izhoda</li>
          <li>plačila izvajati izključno prek App Store (Apple), Google Play ali overjenega ponudnika plačilnih storitev.</li>
        </ul>
        <h2 className="legal-h2">13. Varstvo osebnih podatkov (GDPR)</h2>
        <p className="legal-p">Ponudnik obdeluje osebne podatke v skladu z GDPR in ZVOP-2. Podrobnosti so opredeljene v Politiki zasebnosti, ki je sestavni del teh Pogojev in je dostopna v aplikaciji ter na spletni strani.</p>
        <p className="legal-p">Za zagotavljanje delovanja storitev Ponudnik sodeluje z: Supabase Inc., Google LLC, Brevo SAS, Apple Inc., Stripe Inc. in RevenueCat Inc. — vsi z ustreznimi pogodbami o obdelavi podatkov (DPA).</p>
        <p className="legal-p">Delodajalec, ki dostopa do podatkov zaposlenega prek dashboarda, je v razmerju do teh podatkov samostojni upravljavec v smislu čl. 4(7) GDPR in je osebno odgovoren za zagotavljanje skladnosti z veljavno zakonodajo o varstvu podatkov.</p>
        <h2 className="legal-h2">14. Piškotki in analitika</h2>
        <p className="legal-p">Spletna stran <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a> in dashboard uporabljata piškotke. Nužni piškotki zagotavljajo delovanje in ne zahtevajo privolitve. Analitični piškotki (Google Analytics) se nastavijo SAMO po vaši izrecni privolitvi prek bannerja ob prvem obisku. Svojo privolitev lahko kadar koli umaknete prek nastavitev piškotkov na spletni strani. Podrobnosti so v Politiki zasebnosti.</p>
        <h2 className="legal-h2">15. Spremembe storitev in Pogojev</h2>
        <p className="legal-p">Ponudnik si pridržuje pravico do spremembe, dopolnitve ali ukinitve posameznih funkcionalnosti katerekoli storitve kadarkoli. Za bistvene spremembe bo Ponudnik Uporabnike obvestil vsaj 30 dni vnaprej.</p>
        <p className="legal-p">Ponudnik lahko te Pogoje kadarkoli posodobi. O pomembnih spremembah bo Ponudnik obvestil prek obvestila v aplikaciji oz. dashboardu in prek e-pošte vsaj 30 dni pred uveljavitvijo. Vse prejšnje verzije Pogojev so dostopne na zahtevo prek e-naslova <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>.</p>
        <p className="legal-p">Nadaljnja uporaba katerekoli storitve Finance 4P po uveljavitvi sprememb pomeni strinjanje z novimi Pogoji. Če se Uporabnik s spremenjenimi Pogoji ne strinja, mora prenehati z uporabo in izbrisati svoji račun.</p>
        <h2 className="legal-h2">16. Prenos posla</h2>
        <p className="legal-p">V primeru združitve, prevzema, prodaje sredstev ali drugega prenosa posla Ponudnika na tretjo osebo, se tečnike te Pogoje in pravice ter obveznosti iz njih prenesejo na pravnega naslednika. Ponudnik bo Uporabnike obvestil o takem prenosu prek obvestila v aplikaciji ali prek e-pošte. Uporabnik ima v tem primeru pravico izbrisati svoji račun, če se z novimi pogoji ne strinja.</p>
        <h2 className="legal-h2">17. Višja sila</h2>
        <p className="legal-p">Ponudnik ne odgovarja za neizpolnitev ali zamudo pri izpolnitvi obveznosti, ki je posledica okoliščin zunaj njegove razumne kontrole, vključno z naravnimi nesrečami, epidemijami, vladnimi ukrepi, izpadi tretjih ponudnikov (Supabase, Apple, Google, Stripe, Brevo), kibernetskimi napadi ali splošnimi internetnimi izpadi. V primeru višje sile bo Ponudnik Uporabnike obvestil v razumnem roku.</p>
        <h2 className="legal-h2">18. Reševanje sporov</h2>
        <p className="legal-p">Za te Pogoje in vse spore, ki iz njih izhajajo, velja pravo Republike Slovenije, brez kolizijskih pravnih določb.</p>
        <p className="legal-p">Pred vsakim pravnim ukrepom Ponudnik zahteva, da Uporabnik morebitni spor najprej pisno naslovi na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>. Ponudnik se zavezuje, da bo na vsako pisno pritožbo odgovoril v 30 dneh.</p>
        <p className="legal-p">Evropska komisija zagotavlja platformo za spletno reševanje potrošniških sporov, dostopno na: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="legal-link">ec.europa.eu/consumers/odr</a>. Ponudnik ne sodeluje z nobenim izvensodnim telesom za reševanje sporov (IRPS) v smislu čl. 32 ZVPot-1. Zgornji link je naveden v skladu z zakonsko obveznostjo informiranja.</p>
        <p className="legal-p">Za morebitne spore, ki jih ni mogoče rešiti sporazumno, je krajevno in stvarno pristojno sodišče v Ljubljani.</p>
        <h2 className="legal-h2">19. Splošne določbe</h2>
        <p className="legal-p"><strong>Delna neveljavnost: </strong>Če bi katerakoli določba teh Pogojev bila neveljavna ali neizvršljiva, se ta določba nadomesti z veljavno določbo, ki čim bolj ustreza namenu prvotne. Neveljavnost posamezne določbe ne vpliva na veljavnost preostalih.</p>
        <p className="legal-p"><strong>Neuveljavljanje pravic: </strong>Morebitna opustitev uveljavljanja katerekoli pravice ali določbe teh Pogojev s strani Ponudnika v posameznem primeru ne pomeni trajne odpovedi tej pravici ali določbi.</p>
        <p className="legal-p"><strong>Celoten sporazum: </strong>Ti Pogoji skupaj s Politiko zasebnosti predstavljajo celoten sporazum med Ponudnikom in Uporabnikom glede uporabe storitev Finance 4P in nadomestijo vse prejšnje dogovore o isti temi.</p>
        <p className="legal-p"><strong>Jezik: </strong>Ti Pogoji so sestavljeni in veljavni v slovenskem jeziku. Merodajna je izključno slovenska jezikovna različica.</p>
        <h2 className="legal-h2">20. Kontaktni podatki</h2>
        <p className="legal-p">Za vsa vprašanja, pritožbe ali uveljavljanje pravic:</p>
        <ul className="legal-list">
          <li>E-naslov: <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></li>
          <li>Telefon: <a href="tel:+38670736947" className="legal-link">+386 70 736 947</a></li>
          <li>Dosegljivost: ponedeljek – petek, 10:00–20:00</li>
          <li>Upravljavec: Filip Kolle, Ljubljana, Slovenija</li>
        </ul>
        <p className="legal-p"><em>Ti Splošni pogoji poslovanja so bili pripravljeni v skladu z veljavno slovensko in evropsko zakonodajo (ZVPot-1, ZEPT, Direktiva 2019/770/EU, GDPR). Finance 4P ni certificirana računovodska programska oprema in ne nadomesti strokovnega finančnega ali pravnega svetovanja.</em></p>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
