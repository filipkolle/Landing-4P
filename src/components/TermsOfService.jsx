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
      <motion.div
        className="pp-panel standalone"
        style={{ 
          height: 'calc(100vh - 80px)', 
          maxWidth: '900px', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: expoOut }}
      >
        {/* Header */}
        <div className="pp-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/')} 
            className="pp-back-btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="pp-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} className="pp-shield-icon" />
            <span>Splošni pogoji poslovanja</span>
          </div>
        </div>

        {/* Content */}
        <div className="pp-body" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex' }}>
          <iframe
            src="/splosni-pogoji-poslovanja.pdf"
            title="Splošni pogoji poslovanja"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TermsOfService;
