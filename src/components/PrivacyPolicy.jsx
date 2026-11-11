import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Calendar, Globe, ChevronRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const PrivacyPolicy = () => {
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
            <span>Politika zasebnosti</span>
          </div>
        </div>

        <header className="legal-header">
          <div className="legal-badge">
            <ShieldCheck size={16} />
            <span>Pravni dokument • Finance 4P</span>
          </div>
          <h1 className="legal-title">Politika zasebnosti</h1>
          <p className="legal-subtitle">Aplikacija Finance 4P • finance4p.com • 4P dashboard</p>

          <div className="legal-meta-tags">
            <div className="legal-meta-item">
              <Calendar size={16} />
              <span>Datum zadnje posodobitve: <strong>9. september 2026</strong></span>
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
        <p className="legal-p">Vaša pravica do zasebnosti in digitalni varnosti je zelo pomembna. Ta Politika zasebnosti opisuje, katere osebne podatke zbiramo, zakaj jih zbiramo, kako jih varujemo in katere pravice imate v zvezi z njimi. Preberite jo pozorno — s tem boste natanko vedeli, kako ravnamo z vašimi podatki.</p>
        <p className="legal-p">Ta dokument velja za vse digitalne platforme in produkte Finance 4P:</p>
        <ul className="legal-list">
          <li>Spletna stran <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a></li>
          <li>Mobilna aplikacija Finance 4P (iOS in Android)</li>
          <li>Spletna platforma 4P dashboard</li>
        </ul>
        <p className="legal-p"><em>Če se s to Politiko zasebnosti v celoti ne strinjate, vas prosimo, da ne uporabljate nobene od naših digitalnih storitev.</em></p>
        <p className="legal-p">Za vprašanja o zasebnosti nas kadar koli kontaktirajte na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>. Na vašo zahtevo bomo odgovorili v 30 dneh.</p>
        <h2 className="legal-h2">Kratek pregled storitev</h2>
        <h3 className="legal-h3">Aplikacija Finance 4P</h3>
        <p className="legal-p">Finance 4P je osebno finančno orodje in evidenca delovnega časa za posameznike. Omogoča sledenje prihodkom in odhodkom, beleženje delovnih ur, spremljnaje delovnega časa, izračun zaslužka in pregled finančne analitike.</p>
        <p className="legal-p"><strong>Ustvarjanje računa: </strong>Za dostop do aplikacije se registrirate prek Google Sign-In ali Apple ID. Ob registraciji prejmemo vaše ime, priimek in e-poštni naslov. Te podatke uporabljamo za upravljanje vašega računa, stik z vami če je to potrebno (npr. varnostna obvestila ali podpora), ter da vas lahko najdejo osebe, ki z vami delijo delovno razmerje (npr. delodajalec prek 4P dashboarda).</p>
        <h3 className="legal-h3">Finance 4P Dashboard</h3>
        <p className="legal-p">Finance 4P Dashboard je ločen spletni vmesnik, namenjen delodajalcem. Omogoča pregled delovnih ur zaposlenih in izračun obveznosti za izplačilo — izključno na podlagi podatkov, ki jih zaposleni sam prostovoljno odobri preko enkratne dostopne kode.</p>
        <p className="legal-p"><strong>Ustvarjanje računa: </strong>Delodajalec se registrira neposredno na spletni strani <a href="https://finance4p.com/dashboard" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com/dashboard</a>. Ob registraciji zbiramo ime in priimek ali naziv podjetja ter e-poštni naslov. Te podatke uporabljamo za upravljanje računa, stik v primeru potreb (npr. tehnična podpora ali varnostna obvestila), ter da ga zaposleni lahko identificira, ko mu posreduje dostopno kodo.</p>
        <h3 className="legal-h3">Varstvo otrok</h3>
        <p className="legal-p"><em>Naše storitve niso namenjene otrokom, mlajšim od 13 let, in zavestno ne zbiramo osebnih podatkov oseb, mlajših od 13 let. Če ste starš ali zakoniti skrbnik in ugotovite, da vaš otrok, mlajši od 13 let, uporablja katerikoli produkt Finance 4P, nas prosimo nemudoma kontaktirajte na </em><em><a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></em><em>. Račun bomo takoj izbrisali skupaj z vsemi podatki.</em></p>
        <h2 className="legal-h2">PODATKI, KI JIH ZBIRAMO, IN KAKO JIH UPORABLJAMO</h2>
        <h3 className="legal-h3">Podatki, ki jih vnesete sami — v aplikaciji Finance 4P</h3>
        <p className="legal-p"><strong>Registracijski podatki: </strong>Ko se registrirate prek Google Sign-In ali Apple ID, prejmemo vaše ime, priimek in e-poštni naslov. Te podatke uporabljamo za upravljanje vašega računa in stik z vami, če je to potrebno.</p>
        <p className="legal-p"><strong>Finančni podatki: </strong>V aplikacijo sami vnašate prihodke, odhodke, delovne ure, narocnine, vire dohodka in kategorije. Vi odločate, katere podatke vnesete, in mi ne preverjamo njihove pravilnosti. Obdelujemo jih izključno za zagotavljanje funkcionalnosti aplikacije — ne za oglaševanje in ne za prodajo tretjim. Ponudnik ima tehnični dostop do finančnih podatkov, ki jih vnesete v aplikacijo, izključno v obsegu, ki je potreben za zagotavljanje delovanja storitve, tehnično podporo in odpravljanje napak. Ponudnik teh podatkov ne analizira v komercialne namene, jih ne prodaja tretjim osebam in do njih ne dostopa brez utemeljenega tehničnega razloga.</p>
        <h3 className="legal-h3">Podatki, ki jih zbiramo na spletni strani finance4p.com</h3>
        <p className="legal-p"><strong>E-poštni naslov: </strong>Prek obrazca na spletni strani zbiramo e-poštne naslove tistih, ki se prostovoljno prijavijo za obvestila o dostopnosti aplikacije na Androidu in novostih. Ta naslov posredujemo storitvi Brevo SAS, ki je naš pogodbeni obdelovalec za pošiljanje e-pošte. Naslov shranjujemo do vaše odjave.</p>
        <p className="legal-p"><strong>Piškotki in analitika: </strong>Preko Google Analytics zbiramo anonimizirane podatke o obisku (katere strani so bile obiskane, trajanje, vrsta naprave, približna geografska lokacija na ravni države). IP naslov je anonimiziran. Analitični piškotki se nastavijo SAMO če jim izrecno privolite prek bannerja ob prvem obisku. Podrobnosti so opisane v razdelku Piškotki.</p>
        <h3 className="legal-h3">Podatki v delodajalskem dashboardu</h3>
        <p className="legal-p">Delodajalski dashboard je ločen spletni vmesnik. Delodajalec pridobi dostop do podatkov zaposlenega izključno prek enkratne dostopne kode, ki jo zaposleni sam generira in prostovoljno posreduje delodajalcu, ki jo prostovoljno vnese v aplikacijo in omogoči dostop delodajalcu. Zaposleni lahko kadarkoli dostop prekine z izbrisom kode, kar delodajalcu onemogoči vpogled v njegove nadaljne vnose.</p>
        <h4 className="legal-h4">Kar delodajalec vidi:</h4>
        <ul className="legal-list">
          <li>Delovne ure po posameznih dnevih, opravljene pri tem delodajalcu</li>
          <li>Urna postavka, dogovorjena za ta vir dohodka</li>
          <li>Opombe zaposlenega pri posameznih vnosih delovnega časa</li>
          <li>Skupni znesek za izplačilo na podlagi vnesenih ur — izključno za tega delodajalca</li>
        </ul>
        <p className="legal-p"><em>Delodajalec ne vidi skupnega zaslužka zaposlenega, njegovih ostalih virov dohodka, odhodkov, naročnin ali katerih koli drugih osebnih finančnih podatkov. Dostop je strogo omejen na podatke specifičnega delovnega razmerja, ki ga je zaposleni eksplicitno odobril.</em></p>
        <p className="legal-p"><strong>Podatki delodajalca ob registraciji: </strong>ime in priimek ali naziv podjetja, e-poštni naslov za prijavo, dostopne kode (shranjene v zašifrirani obliki).</p>
        <h3 className="legal-h3">Podatki, ki se zbirajo avtomatsko — v aplikaciji Finance 4P</h3>
        <p className="legal-p"><strong>Tehnični podatki naprave: </strong>Ko prenesete ali uporabljate aplikacijo, prejmemo informacije o vaši napravi (vrsta naprave, operacijski sistem, verzija aplikacije) in IP naslov. Te podatke uporabljamo za zagotavljanje delovanja storitve, izboljšanje aplikacije in varnost računa.</p>
        <p className="legal-p"><strong>Statistika uporabe: </strong>Zbiramo anonimizirane podatke o tem, katere funkcije aplikacije se uporabljajo (prek Google Analytics). Te informacije nam pomagajo razumeti, katere funkcije so koristne, in izboljšati aplikacijo.</p>
        <p className="legal-p"><strong>Advertising ID (IDFA/AAID): </strong>Advertising ID se zbira le ob vaši izrecni privolitvi za namene personaliziranih oglasov. Če privolitvi ne date, se ne zbira.</p>
        <h2 className="legal-h2">VEČ O TEM, KAKO DELIMO VAŠE PODATKE</h2>
        <h3 className="legal-h3">Deljenje podatkov zaposlenega z delodajalcem</h3>
        <p className="legal-p">Ko zaposleni generira dostopno kodo in jo posreduje delodajalcu, ta prostovoljno odobri dostop do omejenega nabora svojih podatkov. Privolitev je izrecna, saj zaposleni sam kreira kodo in jo aktivno posreduje. Brez te kode delodajalec ne more pridobiti nobenega dostopa.</p>
        <p className="legal-p">Zaposleni lahko ta dostop kadar koli in brez navedbe razloga prekliče neposredno v aplikaciji. Po preklicu delodajalec takoj in trajno izgubi dostop do vseh prihodnjih podatkov. Ponudnik tega preklica ne more razveljaviti na zahtevo delodajalca.</p>
        <p className="legal-p"><strong>Izvoz podatkov (PDF/CSV): </strong>Delodajalec ima možnost izvoza podatkov zaposlenega v formatu PDF ali CSV. Z izvozom delodajalec postane samostojni upravljavec teh podatkov v smislu čl. 4(7) GDPR. Ponudnik ne odgovarja za ravnanje delodajalca z izvoženimi podatki po prenosu iz sistema.</p>
        <h3 className="legal-h3">Naši zunanji obdelovalci</h3>
        <p className="legal-p">Finance 4P ter njegovi ponudniki storitev in partnerji poslujejo v Sloveniji in drugih državah ter lahko vaše osebne podatke obdelujejo zunaj države, v kateri se nahajate. Nekatere od teh jurisdikcij morda ne zagotavljajo enake ravni varstva podatkov kot vaša matična jurisdikcija. Z izbiro naše storitve in posredovanjem informacij se strinjate in privolite v prenos, shranjevanje in obdelavo svojih osebnih podatkov v državah, ki niso vaša matična država. Ne glede na lokacijo uporabljamo tehnične, organizacijske in pogodbene zaščitne ukrepe, namenjene varovanju vaših osebnih podatkov ter zagotavljanju, da se ti obdelujejo v skladu s to Izjavo o zasebnosti. </p>
        <p className="legal-p">Vaših osebnih podatkov ne prodajamo. Delimo jih le z naslednjimi preverjenimi obdelovalci, s katerimi ima upravljavec sklenjene pogodbe o obdelavi podatkov (DPA) v skladu s čl. 28 GDPR:</p>
        <ul className="legal-list">
          <li>Supabase Inc. — hramba podatkov in avtentikacija. Strežniki v Zahodni Evropi (London, UK). Prenos temelji na Sklepu EU o ustreznosti za UK in SCC.</li>
          <li>Google LLC — Google Analytics (anonimizirana analitika; IP anonimizacija aktivirana) in Google Sign-In. Prenos temelji na EU-US Data Privacy Framework in SCC.</li>
          <li>Brevo SAS — pošiljanje e-poštnih obvestil za prijavljene prek spletne strani. Certificiran po ISO 27001. Prenos temelji na SCC.</li>
          <li>Apple Inc. — Apple ID prijava in In-App Purchases. Ureja lastna politika zasebnosti Apple.</li>
          <li>Stripe Inc. — procesiranje plačil (bodoča funkcija). Prenos temelji na SCC.</li>
          <li>RevenueCat Inc. — upravljanje naročnin (bodoča funkcija).</li>
        </ul>
        <p className="legal-p">Podatki, ki jih delodajalec ali uporabnik izvozi (PDF/CSV), so pod upravljanjem delodajalca oziroma uporabnika kot samostojnega upravljavca in niso več pod nadzorom Ponudnika.</p>
        <h3 className="legal-h3">Pravne obveznosti</h3>
        <p className="legal-p">Osebne podatke bomo razkrili, kadar je to zahtevano z veljavno zakonodajo — na primer v odgovor na sodne odločbe, za preprečevanje goljufij ali v nujnih primerih za zaščito varnosti oseb. Vsako takšno razkritje bomo omejili na minimum, ki ga zahteva situacija.</p>
        <h2 className="legal-h2">NAMEN IN PRAVNA PODLAGA OBDELAVE</h2>
        <p className="legal-p">Osebne podatke obdelujemo izključno, kadar za to obstaja veljavna pravna podlaga:</p>
        <p className="legal-p"><strong>Izvajanje pogodbe (čl. 6(1)(b) GDPR): </strong>registracija in vzdrŽevanje računa zaposlenega in delodajalca, izvajanje plačil in upravljanje narocnin.</p>
        <p className="legal-p"><strong>Privolitev (čl. 6(1)(a) GDPR): </strong>deljenje podatkov zaposlenega z delodajalcem prek dostopne kode; pošiljanje e-poštnih obvestil (prijava prek spletne strani); analitični piškotki Google Analytics; tehnična potisna obvestila v aplikaciji; dostop do kamere za nalaganje slik; Advertising ID za personalizirane oglase.</p>
        <p className="legal-p"><strong>Zakoniti interes (čl. 6(1)(f) GDPR): </strong>zagotavljanje varnosti IT sistemov in preprečevanje zlorab, odkrivanje in odpravljanje tehničnih napak. Opravili smo presojo uravnoteženosti (balancing test) in ugotovili, da zakoniti interes ne prevlada nad pravicami posameznikov.</p>
        <p className="legal-p">Vašo privolitev lahko kadar koli umaknete: za deljenje z delodajalcem prek preklica kode v aplikaciji; za e-pošto prek odjave v katerem koli e-poštnem sporočilu ali z zahtevo na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>; za piškotke prek nastavitev na spletni strani. Umik privolitve ne vpliva na zakonitost obdelave pred umikom.</p>
        <h2 className="legal-h2">PIŠKOTKI</h2>
        <p className="legal-p">Spletna stran <a href="https://finance4p.com" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com</a> in 4P dashboard (<a href="https://finance4p.com/dashboard" target="_blank" rel="noopener noreferrer" className="legal-link">finance4p.com/dashboard</a>) uporabljata piškotke za zagotavljanje delovanja in analizo obiskov. Ob prvem obisku vam prikažemo baner za privolitev v piškotke.</p>
        <h3 className="legal-h3">Nujni piškotki</h3>
        <p className="legal-p">So nujni za delovanje strani in ne zahtevajo privolitve. V dashboardu vključujejo piškotek seje za ohranjanje vaše prijave. Brez teh piškotkov storitev ne more delovati pravilno.</p>
        <h3 className="legal-h3">Analitični piškotki (Google Analytics)</h3>
        <p className="legal-p">Zbiramo anonimizirane podatke o obiščenosti strani (katere strani ste obiskali, trajanje obiska, vrsta naprave). IP naslov je anonimiziran pred prenosom in se ne shrani.</p>
        <ul className="legal-list">
          <li>Piškotki: _ga (rok hrambe: 2 leti), _gid (24 ur), _gat (1 minuta)</li>
          <li>Ponudnik: Google LLC</li>
          <li>Prenos: EU-US Data Privacy Framework in SCC</li>
          <li>Pravna podlaga: vaša privolitev (čl. 6(1)(a) GDPR)</li>
        </ul>
        <p className="legal-p">Analitični piškotki se nastavijo SAMO, če jim izrecno privolite prek bannerja. Svojo privolitev lahko kadar koli umaknete prek nastavitev piškotkov na spletni strani ali s čiščenjem piškotkov v brskalniku.</p>
        <h2 className="legal-h2">VARNOST PODATKOV</h2>
        <p className="legal-p">Varnost vaših podatkov jemljemo resno. Zaščito zagotavljamo z naslednjimi tehničnimi in organizacijskimi ukrepi:</p>
        <ul className="legal-list">
          <li>Šifrirane povezave (HTTPS/TLS) med aplikacijo, spletno stranjo, dashboardom in strežniki</li>
          <li>Dostopne kode za dashboard so shranjene v zašifrirani obliki</li>
          <li>Nadzor dostopnih pravic do baz podatkov prek Row Level Security (RLS)</li>
          <li>Varnostna infrastruktura Supabase (certificiran po SOC 2 Type II)</li>
        </ul>
        <p className="legal-p">Nobena metoda prenosa podatkov prek interneta ali shranjevanja ni 100 % varna. Če zaznate sum nepooblaščenega dostopa do vašega računa, nas nemudoma kontaktirajte na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>.</p>
        <p className="legal-p">V primeru kršitve varnosti, ki bi ogrozila vaše pravice ali svoboščine, bomo Informacijskega pooblaščenca RS obvestili v 72 urah od odkritja. Prizadete uporabnike bomo obvestili brez nepotrebnega odlašanja v skladu s čl. 34 GDPR.</p>
        <h2 className="legal-h2">VAŠE PRAVICE IN IZBIRE</h2>
        <h3 className="legal-h3">Dostop do vaših podatkov in njihovo urejanje</h3>
        <p className="legal-p">Do svojih finančnih podatkov dostopate neposredno v aplikaciji in jih kadar koli urejate ali brišete. Za vpogled v podatke, ki jih hranimo o vas zunaj aplikacije (npr. tehnični logi), ali za njihov izvoz v strojno berljivi obliki nas kontaktirajte na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>.</p>
        <h3 className="legal-h3">Vaše pravice po GDPR</h3>
        <ul className="legal-list">
          <li>Pravica do dostopa (čl. 15): vpogled v podatke, ki jih hranimo o vas</li>
          <li>Pravica do popravka (čl. 16): popravek netočnih ali nepopolnih podatkov</li>
          <li>Pravica do izbrisa (čl. 17): „pozaba“ — izbris vaših podatkov</li>
          <li>Pravica do omejitve obdelave (čl. 18): omejitev obdelave v določenih primerih</li>
          <li>Pravica do prenosljivosti (čl. 20): prenos podatkov v strojno berljivi obliki</li>
          <li>Pravica do ugovora (čl. 21): ugovor obdelavi za namene neposrednega trženja ali zakonitega interesa</li>
          <li>Pravica do umika privolitve: kadar koli, brez vpliva na zakonitost predhodne obdelave</li>
        </ul>
        <p className="legal-p">Zahteve za uveljavljanje pravic pošljite na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>. Odgovorili vam bomo v 30 dneh.</p>
        <h3 className="legal-h3">Zaprtje računa in izbris podatkov</h3>
        <p className="legal-p"><strong>Zaposleni (aplikacija): </strong>Svoji račun izbrpišete neposredno v nastavitvah aplikacije. S tem se takoj prekličejo vsi dostopi delodajalcev do vaših podatkov. Vsi vaši osebni in finančni podatki bodo trajno odstranjeni iz naših strežnikov v roku 30 dni.</p>
        <p className="legal-p"><strong>Delodajalec (dashboard): </strong>Svoji račun izbrpišete v nastavitvah dashboarda. Po izbrisu takoj izgubite dostop do podatkov vseh zaposlenih. Podatki, ki ste jih predhodno izvozili, so pod vašo lastno odgovornostjo.</p>
        <p className="legal-p"><strong>Preklic dostopa delodajalca brez izbrisa računa: </strong>Zaposleni lahko kadar koli in brez razloga prekliče dostop posameznega delodajalca v aplikaciji, ne da bi izbrisal svoji račun. Po preklicu delodajalec takoj izgubi dostop do vseh podatkov.</p>
        <p className="legal-p"><strong>Odjava od e-poštnih obvestil: </strong>Kliknite „Odjava“ v katerem koli e-poštnem sporočilu ali pišite na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>. Vaš e-naslov bo izbrisan iz naših sistemov v roku 30 dni.</p>
        <p className="legal-p">Izjema so podatki, ki jih moramo hraniti po zakonu (npr. podatki o plačilih za davčne namene — 10 let po ZGD-1), in anonimizirani podatki, ki se ne morejo več povezati z vašo osebo.</p>
        <h2 className="legal-h2">ROKI HRAMBE PODATKOV</h2>
        <ul className="legal-list">
          <li>Podatki o računu in finančni podatki v aplikaciji: do izbrisa računa</li>
          <li>Podatki, dostopni delodajalcu prek dashboarda: dokler zaposleni ne prekliče dostopa; po preklicu takoj nedostopni</li>
          <li>Račun delodajalca in z njim povezani podatki: do izbrisa računa ali najdlje 2 leti od zadnje prijave</li>
          <li>E-poštni naslov za obvestila (Brevo): do odjave, najdlje 3 leta od zadnje interakcije</li>
          <li>Tehnični podatki (IP, logovi): največ 90 dni</li>
          <li>Podatki o plačilih: 10 let (ZGD-1)</li>
          <li>Podatki o privolitvah: do poteka zastaranja morebitnih zahtevkov</li>
          <li>Piškotki: _ga (2 leti), _gid (24 ur), _gat (1 minuta)</li>
        </ul>
        <h2 className="legal-h2">KONTAKT</h2>
        <p className="legal-p">Imate vprašanja ali pomisleke glede te politike zasebnosti? Pišite nam:</p>
        <ul className="legal-list">
          <li>E-naslov: <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a></li>
          <li>Telefon: <a href="tel:+38670736947" className="legal-link">+386 70 736 947</a></li>
          <li>Dosežgljivost: ponedeljek – petek, 10:00–20:00</li>
          <li>Upravljavec: Filip Kolle, Ljubljana, Slovenija</li>
        </ul>
        <h2 className="legal-h2">PRITUŽBA NADZORNEMU ORGANU</h2>
        <p className="legal-p">Menite, da obdelava vaših podatkov krši predpise o varstvu osebnih podatkov? Vložite pritužbo pri:</p>
        <ul className="legal-list">
          <li>Informacijski pooblaščenec Republike Slovenije</li>
          <li>Naslov: Dunajska cesta 22, 1000 Ljubljana</li>
          <li>E-pošta: <a href="mailto:gp.ip@ip-rs.si" className="legal-link">gp.ip@ip-rs.si</a></li>
          <li>Splet: <a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer" className="legal-link">www.ip-rs.si</a></li>
        </ul>
        <p className="legal-p">Pred vložitvijo pritužbe vas vabimo, da nas kontaktirate na <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a> — večino vprašanj rešimo hitro in neposredno.</p>
        <h2 className="legal-h2">SPREMEMBE TE POLITIKE ZASEBNOSTI</h2>
        <p className="legal-p">To politiko zasebnosti lahko občasno posodobimo. Ob vsaki pomembni spremembi vas bomo obvestili prek obvestila v aplikaciji oz. dashboardu ob prvem odprtju po posodobitvi ter prek e-pošte vsaj 30 dni pred uveljavitvijo (za registrirane uporabnike in prijavljene na obvestila). Vse prejšnje verzije so dostopne na zahtevo prek <a href="mailto:info@finance4p.com" className="legal-link">info@finance4p.com</a>.</p>
        <p className="legal-p">Nadaljnja uporaba aplikacije po uveljavitvi sprememb pomeni strinjanje z novo politiko zasebnosti.</p>
        <p className="legal-p"><em>Ta Politika zasebnosti je bila pripravljena v skladu z veljavno slovensko in evropsko zakonodajo (ZVOP-2, GDPR). Finance 4P ni certificirana računovodska programska oprema in ne nadomesti strokovnega finančnega ali pravnega svetovanja.</em></p>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
