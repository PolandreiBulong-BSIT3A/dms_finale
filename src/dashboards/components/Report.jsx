import React, { useEffect, useState } from 'react';

const Report = () => {
  const [showPrompt, setShowPrompt] = useState(true);

  const streamlitUrl = 'https://dmsanalyticsfinalepy-jucq3wyqghj5iwgpyxwgkz.streamlit.app';

  const openStreamlitApp = () => {
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    // Optionally, auto-prompt once when entering the tab
    setShowPrompt(true);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics & Reports</h1>
          <p style={styles.subtitle}>Comprehensive system insights and performance metrics via Streamlit</p>
        </div>
        <button onClick={openStreamlitApp} style={styles.pillButton}>
          Open in New Tab
        </button>
      </div>
      
      {showPrompt && (
        <div style={styles.warnBox}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Leaving the app</h3>
          <p style={styles.noteText}>
            The Reports/Analytics page is hosted externally (Streamlit). Clicking continue will open the analytics
            dashboard in a new browser tab.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={openStreamlitApp}
              style={styles.pillButton}
            >
              Continue to Analytics
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              style={styles.secondaryButton}
            >
              Stay Here
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  pillButton: {
    padding: '12px 24px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
  },
  warnBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
  },
  noteText: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.6,
  },
  secondaryButton: {
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#1f2937',
    border: '1px solid #cbd5e1',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default Report;
