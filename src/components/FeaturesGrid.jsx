import React from 'react';
import { Timer, BarChart3, Receipt, Zap, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturesGrid = () => {
  const features = [
    {
      icon: <Timer size={32} className="feature-icon" />,
      title: "Hitro beleženje",
      description: "Vnos delovnih ur v manj kot 10 sekundah. Brez nepotrebnega klikanja."
    },
    {
      icon: <BarChart3 size={32} className="feature-icon" />,
      title: "Primerjava virov dohodka",
      description: "Ugotovite, katera dejavnost vam prinaša največ zaslužka na uro."
    },
    {
      icon: <Receipt size={32} className="feature-icon" />,
      title: "Pregled nad stroški",
      description: "Spremljajte kam odhaja vaš denar z intuitivnimi grafi in analitiko."
    },
    {
      icon: <Zap size={32} className="feature-icon" />,
      title: "Avtomatizacija",
      description: "Avtomatiziran vnos zaslužkov in ponavljajočih se stroškov (naročnine, leasing...)"
    },
    {
      icon: <FileText size={32} className="feature-icon" />,
      title: "PDF poročila",
      description: "Izvoz poročil za delodajalca, računovodstvo ali osebni arhiv z enim klikom."
    }
  ];

  const containerVars = {
    before: {},
    after: {
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVars = {
    before: { opacity: 0, y: 30, filter: 'blur(10px)' },
    after: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { ease: [0.19, 1, 0.22, 1], duration: 0.8 }
    }
  };

  return (
    <section className="features-grid-section section-padding">
      <div className="container">
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          >
            <h2>Ključne funkcionalnosti</h2>
            <p>Vse, kar potrebujete za popoln finančni pregled v enem orodju.</p>
          </motion.div>
        </div>
        
        <motion.div 
          className="features-grid"
          variants={containerVars}
          initial="before"
          whileInView="after"
          viewport={{ once: true, margin: "-120px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card glass-card"
              variants={itemVars}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="icon-wrapper">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
