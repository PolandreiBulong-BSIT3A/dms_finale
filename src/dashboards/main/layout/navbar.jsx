import React, { useState, useEffect } from 'react';
import { FiSearch, FiBell, FiUser, FiSettings, FiLogOut, FiX, FiRefreshCw, FiCheck, FiEye, FiHelpCircle, FiHeadphones, FiMail, FiPhone, FiMessageCircle } from 'react-icons/fi';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useUser } from '../../../contexts/UserContext';
import ProfilePicture from '../../../components/ProfilePicture';
import Logo from '../../../assets/logos/logo.png';
import { buildUrl } from '../../../lib/api/frontend/client.js';

const Navbar = ({ sidebarOpen, role, setRole, setSidebarOpen, isMobile }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(true);
  const [departmentName, setDepartmentName] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [developerInfo, setDeveloperInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotificationSession, refreshNotificationsImmediately } = useNotifications();
  const { user, logout } = useUser();

  // Set department name from user context
  useEffect(() => {
    if (user?.department_name) {
      setDepartmentName(user.department_name);
    } else {
      setDepartmentName('');
    }
  }, [user?.department_name]);



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-container') && !event.target.closest('.notification-container') && !event.target.closest('.contact-modal')) {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowContactModal(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowContactModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Helpers to open links stored in `others` table via OthersAPI
  const openOtherLink = async (category, name) => {
    try {
      const res = await fetch(buildUrl(`others/${encodeURIComponent(category)}/${encodeURIComponent(name)}`), { credentials: 'include' });
      if (!res.ok) throw new Error('Link not available');
      const data = await res.json();
      const link = data?.item?.link;
      if (!link) throw new Error('Link not found');
      window.open(link, '_blank', 'noopener');
    } catch (e) {
      console.error('openOtherLink error:', e);
    }
  };

  const handleOpenManual = () => openOtherLink('MANUAL', 'USER & MAINTENANCE MANUAL');

  const handleReportBug = async () => {
    try {
      // Fetch contact email from others table (category: INFO, other_name: CONTACT)
      const res = await fetch(buildUrl('others/INFO/CONTACT'), { credentials: 'include' });
      let email = 'support@example.com';
      if (res.ok) {
        const data = await res.json();
        const link = data?.item?.link;
        if (link) email = link;
      }
      const subject = encodeURIComponent('[ISPSC DMS] Bug Report');
      const body = encodeURIComponent(
        `Describe the issue:\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected result:\n\nActual result:\n\nScreenshots/Attachments (if any):\n\nBrowser/OS:`
      );
      // Open Gmail compose directly
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank', 'noopener');
    } catch (e) {
      console.error('handleReportBug error:', e);
    }
  };

  const handleContactDeveloper = async () => {
    try {
      setLoadingContact(true);
      setShowContactModal(true);
      
      // Fetch all developer contact info from others table
      const res = await fetch(buildUrl('others?category=DEVELOPER'), { credentials: 'include' });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items && data.items.length > 0) {
          // Parse the developer info items
          const info = {};
          data.items.forEach(item => {
            const name = item.other_name?.toUpperCase();
            if (name === 'EMAIL') info.email = item.link;
            else if (name === 'PHONE') info.phone = item.link;
            else if (name === 'NAME') info.name = item.link;
            else if (name === 'MESSAGE') info.message = item.link;
          });
          setDeveloperInfo(info);
        } else {
          // Fallback if no developer info found
          setDeveloperInfo({
            name: 'Developer Support',
            email: 'developer@ispsc.edu.ph',
            message: 'Contact us for technical support and inquiries.'
          });
        }
      } else {
        setDeveloperInfo({
          name: 'Developer Support',
          email: 'developer@ispsc.edu.ph',
          message: 'Contact us for technical support and inquiries.'
        });
      }
    } catch (e) {
      console.error('handleContactDeveloper error:', e);
      setDeveloperInfo({
        name: 'Developer Support',
        email: 'developer@ispsc.edu.ph',
        message: 'Contact us for technical support and inquiries.'
      });
    } finally {
      setLoadingContact(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };



  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div className="navbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left: Logo for mobile */}
        {isMobile && (
          <button
            className="mobile-logo-btn"
            onClick={() => setSidebarOpen && setSidebarOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              marginLeft: 12,
              cursor: 'pointer'
            }}
          >
            <img 
              src={Logo}
              alt="ISPSC Logo" 
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          </button>
        )}

        {/* Right Side Actions */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {/* Contact Developer */}
          <button
            className="icon-btn"
            onClick={handleContactDeveloper}
            title="Contact a Developer"
            aria-label="Contact a Developer"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 8,
              marginRight: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <FiMessageCircle size={18} />
          </button>

          {/* Developer Support (Report Bug) */}
          <button
            className="icon-btn"
            onClick={handleReportBug}
            title="Report a bug"
            aria-label="Report a bug"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 8,
              marginRight: 8,
              cursor: 'pointer'
            }}
          >
            <FiHeadphones size={18} />
          </button>

          {/* Help (User & Maintenance Manual) */}
          <button
            className="icon-btn"
            onClick={handleOpenManual}
            title="Open User & Maintenance Manual"
            aria-label="Open User & Maintenance Manual"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 8,
              marginRight: 12,
              cursor: 'pointer'
            }}
          >
            <FiHelpCircle size={18} />
          </button>


          {/* Notifications */}
          <div className="notification-container">
            <button 
              className={`notification-btn ${unreadCount > 0 ? 'has-notifications' : 'no-notifications'}`}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  setShowAllNotifications(true); // Always show all notifications when opening
                }
              }}
              title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
              data-tooltip={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
              data-count={unreadCount}
            >
              <div className="notification-icon-wrapper">
                <FiBell className="notification-icon" />
                {unreadCount > 0 && (
                  <div className="notification-pulse-ring"></div>
                )}
              </div>
              {unreadCount > 0 && (
                <span className={`notification-badge ${unreadCount > 9 ? 'high-count' : ''} ${unreadCount > 99 ? 'critical' : ''}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Off-Canvas */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div 
                  className="notification-backdrop"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Off-Canvas Panel */}
                <div className="notification-offcanvas">
                  <div className="notification-header">
                    <div className="notification-header-left">
                      <div className="notification-header-title">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="notification-unread-count">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="notification-header-actions">
                      {unreadCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={() => markAllAsRead()}
                          title="Mark all notifications as read"
                        >
                          <FiCheck size={14} />
                          Mark all read
                        </button>
                      )}
                      <button 
                        className="refresh-btn"
                        onClick={refreshNotificationsImmediately}
                        title="Refresh notifications"
                      >
                        <FiRefreshCw size={14} />
                      </button>
                      <button 
                        className="notification-close"
                        onClick={() => setShowNotifications(false)}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Notification Filter Tabs */}
                  <div className="notification-filters">
                    <button 
                      className={`filter-btn ${showAllNotifications ? 'active' : ''}`}
                      onClick={() => setShowAllNotifications(true)}
                    >
                      All ({notifications.length})
                    </button>
                    <button 
                      className={`filter-btn ${!showAllNotifications ? 'active' : ''}`}
                      onClick={() => setShowAllNotifications(false)}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <div className="empty-icon">
                          <FiBell size={48} />
                        </div>
                        <h4>No notifications yet</h4>
                        <p>We'll notify you when something important happens</p>
                      </div>
                    ) : (
                      <>
                        {notifications
                          .filter(notification => showAllNotifications || !notification.is_read)
                          .map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="notification-indicator">
                                {!notification.is_read && <div className="unread-dot"></div>}
                              </div>
                              <div className="notification-content">
                                <div className="notification-header-item">
                                  <h4>{notification.title}</h4>
                                  <span className="notification-time">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                <div className="notification-meta">
                                  <span className={`notification-type ${notification.type}`}>
                                    {notification.type}
                                  </span>
                                  {notification.related_doc_id && (
                                    <span className="notification-related">
                                      Related to document
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="notification-actions">
                                <button 
                                  className="notification-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                                >
                                  {notification.is_read ? <FiEye size={14} /> : <FiCheck size={14} />}
                                </button>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <div className="notification-count">
                        Showing all {notifications.length} notifications
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="user-container">
            <button 
              className="user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <ProfilePicture
                  src={user?.profilePic}
                  alt="Profile"
                  size={32}
                  className="user-profile-pic"
                  fallbackText={user?.firstname && user?.lastname ? 
                    `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase() : 
                    null
                  }
                />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.Username || user?.username || 'User'}</span>
                <span className="user-role">
                  {user?.role || role}
                  {departmentName ? ` | ${departmentName}` : ''}
                </span>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <ProfilePicture
                      src={user?.profilePic}
                      alt="Profile"
                      size={40}
                      className="dropdown-user-pic"
                      fallbackText={user?.firstname && user?.lastname ? 
                        `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase() : 
                        null
                      }
                    />
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{user?.Username || user?.username || 'User'}</span>
                    <span className="dropdown-email">{user?.email || user?.user_email || ''}</span>
                  </div>
                </div>
                <div className="dropdown-menu">
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut className="dropdown-item-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Developer Modal */}
      {showContactModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={() => setShowContactModal(false)}
          />
          <div 
            className="contact-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              zIndex: 9999,
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiMessageCircle size={24} color="#3b82f6" />
                Contact a Developer
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {loadingContact ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ color: '#6b7280', margin: 0 }}>Loading contact information...</p>
                </div>
              ) : developerInfo ? (
                <div>
                  {developerInfo.name && (
                    <div style={{
                      marginBottom: '20px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>Developer</div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>{developerInfo.name}</div>
                    </div>
                  )}

                  {developerInfo.email && (
                    <div style={{
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #dbeafe'
                    }}>
                      <FiMail size={20} color="#3b82f6" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Email</div>
                        <a 
                          href={`mailto:${developerInfo.email}`}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {developerInfo.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {developerInfo.phone && (
                    <div style={{
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5'
                    }}>
                      <FiPhone size={20} color="#10b981" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Phone</div>
                        <a 
                          href={`tel:${developerInfo.phone}`}
                          style={{
                            color: '#10b981',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {developerInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {developerInfo.message && (
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#92400e',
                        lineHeight: '1.6'
                      }}>{developerInfo.message}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {developerInfo.email && (
                      <button
                        onClick={() => window.open(`mailto:${developerInfo.email}`, '_blank')}
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      >
                        <FiMail size={16} />
                        Send Email
                      </button>
                    )}
                    <button
                      onClick={() => setShowContactModal(false)}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '10px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FiMessageCircle size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#6b7280', margin: 0 }}>No contact information available</p>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </nav>
  );
};

export default Navbar;