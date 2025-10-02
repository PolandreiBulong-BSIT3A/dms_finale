import React, { useEffect, useRef, useState } from 'react';

const Report = () => {
  const [loaded, setLoaded] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const timeoutRef = useRef(null);

  const streamlitUrl = 'https://dmsanalyticsfinalepy-jucq3wyqghj5iwgpyxwgkz.streamlit.app';

  const openStreamlitApp = () => {
    window.open(streamlitUrl, '_blank');
  };

  useEffect(() => {
    // If iframe doesn't load within 6s, show warning
    timeoutRef.current = setTimeout(() => {
      if (!loaded) setShowWarn(true);
    }, 6000);
    return () => clearTimeout(timeoutRef.current);
  }, [loaded]);

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
      
      <div
        style={styles.iframeContainer}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {showTip && (
          <div style={styles.tooltip}>
            If this page isn’t working, click “Open in New Tab”.
          </div>
        )}
        <iframe
          src={streamlitUrl}
          title="DMS Analytics Dashboard"
          style={styles.iframe}
          frameBorder="0"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          onError={() => setShowWarn(true)}
        />
      </div>

      {showWarn && (
        <div style={styles.modalBackdrop} onClick={() => setShowWarn(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Having trouble loading the analytics?</h3>
            <p style={{ margin: '12px 0 0' }}>
              If the embedded dashboard doesn't load here due to browser or provider restrictions,
              click the button below to open it in a new tab.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowWarn(false)} style={styles.secondaryButton}>Close</button>
              <button onClick={openStreamlitApp} style={styles.pillButton}>Open in New Tab</button>
            </div>
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
  iframeContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    height: 'calc(100vh - 200px)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
  },
};

export default Report;
