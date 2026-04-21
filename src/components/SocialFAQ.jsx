import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const expoOut = [0.19, 1, 0.22, 1];

const SocialFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Ali so moji podatki varni?",
      answer: "Da. Varnost vaših podatkov je naša prioriteta. Vse podatke šifriramo in smo popolnoma v skladu z GDPR uredbo."
    },
    {
      question: "Koliko stane aplikacija?",
      answer: "Aplikacija Finance 4P je popolnoma brezplačna za vse uporabnike, saj si želimo omogočiti boljši finančni nadzor čim širšemu krogu ljudi."
    },
    {
      question: "Koliko časa mi bo vzelo dnevno beleženje?",
      answer: "Zelo malo. Aplikacija je zasnovana tako, da vnos traja manj kot 10 sekund. Cilj je, da beleženje postane tvoja najlažja dnevna navada."
    },
    {
      question: "Ali mi bo aplikacija dejansko pomagala prihraniti denar?",
      answer: "Aplikacija sama po sebi ne varčuje namesto tebe, ti pa omogoča jasen vpogled v tvoje potrošniške navade. Ko enkrat vidiš, kam točno polzi tvoj denar, lahko svoje navade prilagodiš in začneš načrtno varčevati za tisto, kar ti je zares pomembno."
    },
    {
      question: "Ali lahko spremljam prihodke iz različnih virov?",
      answer: "Seveda. Finance 4P omogočajo poljubno kategorizacijo prihodkov, kar je idealno za vse, ki imajo več različnih virov zaslužka (npr. študentsko delo, s.p., redna zaposlitev)."
    },
    {
      question: "Ali je aplikacija primerna tudi za začetnike?",
      answer: "Absolutno. Brez kompliciranih računovodskih izrazov. Aplikacija te vodi korak za korakom, da dobiš takojšen občutek nadzora in varnosti."
    },
    {
      question: "Zakaj bi uporabil Finance 4P namesto Excela ali beležke?",
      answer: "Ker je tvoj telefon vedno s tabo. Poleg tega Finance 4P avtomatsko generira analitike in grafikone, ki bi ti v Excelu vzeli ure ročnega dela."
    },
    {
      question: "Na katerih napravah deluje aplikacija?",
      answer: "Finance 4P je na voljo za iOS (iPhone) in Android naprave. Podpiramo vse naprave z iOS 15+ in Android 8+."
    }
  ];

  return (
    <section className="social-faq section-padding">
      <div className="container">
        
        {/* GDPR trust badge */}
        <motion.div
          className="trust-marker"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: expoOut }}
        >
          <div className="gdpr-badge">
            <ShieldCheck className="icon-blue" size={22} />
            <span>Tvoji podatki so varni in skladni z GDPR uredbo.</span>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: expoOut }}
        >
          <h2>Pogosta vprašanja</h2>
          <p>Odgovori na najpogostejša vprašanja o aplikaciji.</p>
        </motion.div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: expoOut }}
            >
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`chevron ${openIndex === index ? 'rotate' : ''}`}
                  size={20}
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: expoOut }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialFAQ;
