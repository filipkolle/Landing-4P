import React from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const expoOut = [0.19, 1, 0.22, 1];

const ProblemSolution = () => {
  const problems = [
    "Zamudno spremljanje delovnega časa",
    "Brez kontrole nad stroški",
    "Težave pri sprejemanju finančnih odločitev",
    "Pozabljene naročnine",
    "Ročno računanje v Excelu"
  ];

  const solutions = [
    { text: "Avtomatsko spremljanje delovnega časa", icon: <Check size={18} /> },
    { text: "Celovit pregled nad vsemi stroški", icon: <Check size={18} /> },
    { text: "Napredna finančna analitika v realnem času", icon: <Check size={18} /> },
    { text: "Brez odvečnih naročnin in skritih stroškov", icon: <Check size={18} /> },
    { text: "Večja jasnost za hitrejše finančne cilje", icon: <Check size={18} /> }
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5, ease: expoOut }
    }
  };

  return (
    <section className="problem-solution section-padding">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: expoOut }}
        >

          <h2>Rešite se finančnega <br /> <span className="highlight-blue">stresa</span></h2>

        </motion.div>
 
        <div className="comparison-wrapper">
          <div className="comparison-grid">
            <motion.div
              className="comparison-card problem"
              initial={{ opacity: 0, x: -30, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: expoOut }}
            >
              <div className="card-glass-glow" />
              <div className="card-header">
                <div className="icon-box icon-red">
                  <X size={20} />
                </div>
                <h3>Brez Finance 4P</h3>
              </div>
              <motion.ul variants={containerVars} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
                {problems.map((item, i) => (
                  <motion.li key={i} variants={itemVars}>
                    <div className="dot red" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
 
            <motion.div 
              className="vs-separator"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: expoOut }}
            >
              <div className="vs-line" />
              <div className="vs-circle">
                <span>VS</span>
              </div>
              <div className="vs-line" />
            </motion.div>
 
            <motion.div
              className="comparison-card solution"
              initial={{ opacity: 0, x: 30, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: expoOut }}
            >
              <div className="card-glass-glow" />
              <div className="card-header">
                <div className="icon-box icon-green">
                  <Check size={20} />
                </div>
                <h3>Z Finance 4P</h3>
              </div>
              <motion.ul variants={containerVars} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
                {solutions.map((item, i) => (
                  <motion.li key={i} variants={itemVars}>
                    <Check size={18} className="solution-check-icon" />
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
