import React, { useState, useEffect } from 'react';
import { buildUrl } from '../lib/api/frontend/client.js';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import Logo from '../assets/logos/logo.png';

const MaintenancePage = ({ isAdminView = false }) => {
  const [userRole, setUserRole] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    message: 'We\'re currently performing scheduled maintenance to improve your experience',
    endTime: null,
    estimatedDuration: '30-60 minutes'
  });
  const [contactInfo, setContactInfo] = useState({
    email: 'support@ispsc.edu.ph',
    facebook: 'https://facebook.com/ispsc',
    twitter: 'https://twitter.com/ispsc',
    instagram: 'https://instagram.com/ispsc'
  });

  const handleLogout = async () => {
    try {
      const response = await fetch(buildUrl('logout'), {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear any local storage/session data if needed
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        // Force redirect anyway
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch(buildUrl('auth/me'), {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || null);
        }
      } catch (error) {
        setUserRole(null);
      }
    };

    const fetchMaintenanceInfo = async () => {
      try {
        const response = await fetch(buildUrl('system/maintenance-settings'), {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMaintenanceInfo({
              message: data.maintenanceMessage || 'We\'re currently performing scheduled maintenance to improve your experience',
              endTime: data.maintenanceEndTime,
              estimatedDuration: calculateDuration(data.maintenanceEndTime)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching maintenance info:', error);
      }
    };

    const fetchContactInfo = async () => {
      try {
        const response = await fetch(buildUrl('others/INFO'));
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.items) {
            const newContactInfo = { ...contactInfo };
            
            data.items.forEach(item => {
              const name = item.other_name.toLowerCase();
              if (name.includes('email') || name.includes('contact')) {
                newContactInfo.email = item.link;
              } else if (name.includes('facebook')) {
                newContactInfo.facebook = item.link;
              } else if (name.includes('twitter')) {
                newContactInfo.twitter = item.link;
              } else if (name.includes('instagram')) {
                newContactInfo.instagram = item.link;
              }
            });
            
            setContactInfo(newContactInfo);
          }
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };

    checkUserRole();
    fetchMaintenanceInfo();
    fetchContactInfo();
  }, []);

  const calculateDuration = (endTime) => {
    if (!endTime) return '30-60 minutes';
    
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end - now;
    
    if (diffMs <= 0) return 'Almost ready';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      const mins = diffMins % 60;
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
    }
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src={Logo} alt="ISPSc Logo" style={styles.logo} />
        </div>

        {/* Main Message */}
        <h1 style={styles.title}>
          Sorry! We're under<br />construction maintenance!
        </h1>
        
        <p style={styles.subtitle}>
          {maintenanceInfo.message || 'Our website is currently undergoing scheduled maintenance, we will be back soon! Thank you for being so patient.'}
        </p>

        {maintenanceInfo.endTime && (
          <p style={styles.eta}>
            Expected completion: {new Date(maintenanceInfo.endTime).toLocaleString()}
          </p>
        )}

        {/* Follow Us Section */}
        <div style={styles.followSection}>
          <p style={styles.followText}>Follow us</p>
          <div style={styles.socialIcons}>
            {contactInfo.facebook && (
              <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
                <FaFacebook size={20} />
              </a>
            )}
            {contactInfo.twitter && (
              <a href={contactInfo.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
                <FaTwitter size={20} />
              </a>
            )}
            {contactInfo.instagram && (
              <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
                <FaInstagram size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Contact Email */}
        <div style={styles.contactSection}>
          <a href={`mailto:${contactInfo.email}`} style={styles.emailLink}>
            {contactInfo.email}
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    padding: '40px 20px'
  },
  logoContainer: {
    marginBottom: '40px'
  },
  logo: {
    width: '120px',
    height: 'auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 20px 0',
    lineHeight: '1.3'
  },
  subtitle: {
    fontSize: '15px',
    color: '#4a4a4a',
    margin: '0 0 10px 0',
    lineHeight: '1.6',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  eta: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 30px 0',
    fontStyle: 'italic'
  },
  followSection: {
    marginTop: '40px',
    marginBottom: '20px'
  },
  followText: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: '0 0 15px 0',
    fontWeight: '500'
  },
  socialIcons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  socialIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1a1a1a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'transform 0.2s, background-color 0.2s',
    cursor: 'pointer'
  },
  contactSection: {
    marginTop: '20px'
  },
  emailLink: {
    fontSize: '14px',
    color: '#1a1a1a',
    textDecoration: 'none',
    fontWeight: '500'
  },
  oldStatusCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid #e2e8f0'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  statusTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0'
  },
  statusLabel: {
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500'
  },
  statusValue: {
    fontSize: '16px',
    color: '#1f2937',
    fontWeight: '600'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  infoCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#6b7280'
  },
  contactCard: {
    background: '#eff6ff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid #dbeafe'
  },
  contactTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 12px 0'
  },
  contactDescription: {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 20px 0',
    lineHeight: '1.6'
  },
  contactMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  contactMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  contactText: {
    fontSize: '16px',
    color: '#1e40af',
    fontWeight: '500'
  },
  refreshSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  },
  refreshText: {
    fontSize: '16px'
  },
  refreshNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '12px 0 0 0'
  },
  actionSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    minWidth: '120px'
  },
  logoutText: {
    fontSize: '16px',
    fontWeight: '500'
  },
  actionNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '12px 0 0 0'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '32px',
    borderTop: '1px solid #e5e7eb'
  },
  footerText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  footerSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
};

export default MaintenancePage;
