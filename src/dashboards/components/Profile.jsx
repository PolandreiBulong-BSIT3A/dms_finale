/* eslint-disable no-unused-vars, no-useless-escape, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiSave, 
  FiEdit3, 
  FiCheckCircle,
  FiAlertCircle,
  FiUserCheck,
  FiCalendar,
  FiTrash2
} from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';



const Profile = () => {
  const { user: contextUser, loading: contextLoading, updateUser, refreshUser } = useUser();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth <= 768); } catch {}
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '', show: false });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    department: '',
    contactNumber: '',
    profilePic: '',
    role: '',
    position: '',
    status: '',
    isVerified: false,
    createdAt: '',
    updatedAt: ''
  });

  // Profile icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [availableIcons, setAvailableIcons] = useState([]);
  const [iconsLoading, setIconsLoading] = useState(false);


  // Department options - will be fetched from API
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Position options - will be fetched from API
  const [positionOptions, setPositionOptions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  // Role options - matching database schema
  const roleOptions = [
            { value: 'FACULTY', label: 'Faculty' },
            { value: 'DEAN', label: 'Dean' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  // Status options - matching database schema
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'banned', label: 'Banned' },
    { value: 'deleted', label: 'Deleted' }
  ];


  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const data = await fetchJson(buildUrl('departments'));
      if (data.success && data.departments) {
        // Transform to { value, label } format
        const options = data.departments.map(dept => ({
          value: dept.department_id,
          label: dept.name
        }));
        setDepartmentOptions(options);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Update form data when context user changes
  useEffect(() => {
    if (contextUser) {
      const departmentValue = contextUser.department_id?.toString() || contextUser.department || '';
      
      setFormData({
        username: contextUser.username || '',
        email: contextUser.email || '',
        firstname: contextUser.firstname || '',
        lastname: contextUser.lastname || '',
        department: departmentValue,
        contactNumber: contextUser.contactNumber || '',
        profilePic: contextUser.profilePic || '',
        role: contextUser.role || '',
        position: contextUser.position || '',
        status: contextUser.status || '',
        isVerified: contextUser.isVerified || false,
        createdAt: contextUser.createdAt || '',
        updatedAt: contextUser.updatedAt || ''
      });
    }
  }, [contextUser]);

  // Fetch positions from API
  const fetchPositions = async (roleType = null) => {
    try {
      setPositionsLoading(true);
      const url = roleType 
        ? buildUrl(`positions?role_type=${roleType}&is_active=true`)
        : buildUrl('positions?is_active=true');
      const data = await fetchJson(url);
      if (data.success && data.positions) {
        setPositionOptions(data.positions);
      } else {
        setPositionOptions([]);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositionOptions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  // Fetch departments and icons on component mount
  useEffect(() => {
    fetchDepartments();
    fetchProfileIcons();
    // Fetch positions based on user's role
    if (contextUser?.role) {
      fetchPositions(contextUser.role);
    }
  }, [contextUser?.role]);

  // Convert image links to proper format
  const convertImageLink = (url) => {
    if (!url) return url;
    
    // If it's Imgur or other direct image hosting, return as-is
    if (url.includes('imgur.com') || url.includes('imgbb.com') || url.startsWith('/icons/')) {
      return url;
    }
    
    // Handle Google Drive URLs
    const match = url.match(/\/file\/d\/([^/]+)/);
    if (match && match[1]) {
      // Use Google Drive thumbnail API
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }
    
    return url;
  };

  // Fetch profile icons from others table
  const fetchProfileIcons = async () => {
    try {
      setIconsLoading(true);
      const data = await fetchJson(buildUrl('others/ICON'));
      if (data.success && Array.isArray(data.items)) {
        // Convert all image links to proper format
        const icons = data.items.map(icon => ({
          ...icon,
          link: convertImageLink(icon.link)
        }));
        setAvailableIcons(icons);
      }
    } catch (error) {
      console.error('Error fetching profile icons:', error);
    } finally {
      setIconsLoading(false);
    }
  };

  // Handle profile icon selection
  const handleIconSelect = async (iconUrl) => {
    try {
      setFormData(prev => ({ ...prev, profilePic: iconUrl }));
      
      // Save to backend immediately
      const data = await fetchJson(buildUrl('users/update-profile-picture'), {
        method: 'PUT',
        body: JSON.stringify({ profilePic: iconUrl })
      });
      
      if (data.success) {
        updateUser({ ...contextUser, profilePic: iconUrl });
        setMessage({ text: 'Profile icon updated!', type: 'success', show: true });
        setShowIconPicker(false);
      } else {
        setMessage({ text: data.message || 'Failed to update icon', type: 'danger', show: true });
      }
    } catch (error) {
      console.error('Error updating profile icon:', error);
      setMessage({ text: 'Failed to update icon', type: 'danger', show: true });
    }
  };


  const handleInputChange = (field, value) => {
    // Special validation for contact number
    if (field === 'contactNumber') {
      // Only allow numbers and limit to 11 digits
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digit characters
      if (numericValue.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [field]: numericValue
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const getProfileImage = () => {
    if (formData.profilePic) {
      return formData.profilePic;
    }
    return null;
  };

  const handleImageError = (e) => {
    // optional: track image error
  };
  // You could set a fallback image here if needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '', show: false });

    // Validate contact number
    if (formData.contactNumber && formData.contactNumber.length !== 11) {
      setMessage({ 
        text: 'Contact number must be exactly 11 digits', 
        type: 'danger', 
        show: true 
      });
      setLoading(false);
      return;
    }

    try {
      
      const requestBody = {
        email: contextUser.email,
        username: formData.username,
        firstname: formData.firstname,
        lastname: formData.lastname,
        department: formData.department, // This will be department_id as string
        contactNumber: formData.contactNumber,
        position: formData.position
      };
      const data = await fetchJson(buildUrl('users/update-profile'), {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });
      
      if (data.success) {
        // Update context user data
        const updated = { 
          ...contextUser, 
          username: formData.username,
          firstname: formData.firstname,
          lastname: formData.lastname,
          department_id: formData.department, // Convert to department_id
          contactNumber: formData.contactNumber,
          position: formData.position
        };
        
        // Update the context user
        updateUser(updated);
        
        // Refresh user data from server to ensure banner logic gets latest data
        await refreshUser();
        
        setMessage({ 
          text: data.message || 'Profile updated successfully!', 
          type: 'success', 
          show: true 
        });
        setIsEditing(false);
      } else {
        setMessage({ 
          text: data.message || 'Failed to update profile', 
          type: 'danger', 
          show: true 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Network error. Please try again.', 
        type: 'danger', 
        show: true 
      });
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    if (contextUser) {
      setFormData({
        username: contextUser.username || '',
        email: contextUser.email || '',
        firstname: contextUser.firstname || '',
        lastname: contextUser.lastname || '',
        department: contextUser.department_id?.toString() || contextUser.department || '',
        contactNumber: contextUser.contactNumber || '',
        role: contextUser.role || '',
        position: contextUser.position || '',
        status: contextUser.status || '',
        isVerified: contextUser.isVerified || false,
        createdAt: contextUser.createdAt || '',
        updatedAt: contextUser.updatedAt || ''
      });
    }
    setIsEditing(false);
    setMessage({ text: '', type: '', show: false });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'delete') {
      setMessage({ 
        text: 'Please type "delete" exactly to confirm account deletion', 
        type: 'danger', 
        show: true 
      });
      return;
    }

    try {
      setDeletingAccount(true);
      
      const data = await fetchJson(buildUrl('users/delete-account'), {
        method: 'DELETE'
      });

      if (data.success) {
        setMessage({ 
          text: 'Account deleted successfully. You will be logged out.', 
          type: 'success', 
          show: true 
        });
        
        // Close modal and reset
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        
        // Logout after a short delay
        setTimeout(() => {
          // Redirect to login page or trigger logout
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage({ 
          text: data.message || 'Failed to delete account', 
          type: 'danger', 
          show: true 
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ 
        text: 'Network error. Please try again.', 
        type: 'danger', 
        show: true 
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrator';
              case 'DEAN':
                  return 'Dean';
              case 'FACULTY':
                  return 'Faculty';
      default:
        return role || 'Unknown';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending Verification';
      case 'banned':
        return 'Banned';
      case 'deleted':
        return 'Deleted';
      default:
        return status || 'Unknown';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'warning';
      case 'banned':
        return 'danger';
      case 'deleted':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  // Get department display name
const getDepartmentDisplayName = (departmentId) => {
  if (!departmentId) return 'Not assigned';

  const opts = Array.isArray(departmentOptions) ? departmentOptions : [];
  
  // Convert departmentId to number for comparison
  const idNum = Number(departmentId);
  
  // Try to find by numeric value match
  let dept = opts.find(opt => Number(opt?.value) === idNum);

  // If not found, try string comparison
  if (!dept) {
    const idStr = String(departmentId);
    dept = opts.find(opt => String(opt?.value) === idStr);
  }

  if (dept?.label) {
    return dept.label;
  }
  
  return `Department ID: ${departmentId} (Name not found)`;
};

  // Get current department name for display
  const getCurrentDepartmentName = () => {
    // If departments haven't loaded yet, try to show from context
    if (departmentOptions.length === 0 && contextUser?.department_name) {
      return contextUser.department_name;
    }
    
    // If we have department options, use the lookup function
    if (departmentOptions.length > 0) {
      return getDepartmentDisplayName(formData.department);
    }
    
    // Fallback: show the raw value
    return formData.department || 'Loading departments...';
  };

  if (contextLoading || !contextUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="spinner-border text-muted" style={{ width: '2rem', height: '2rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .contact-number-input:focus {
          border: 2px solid #dee2e6 !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .contact-number-input.form-control:focus {
          border-color: #dee2e6 !important;
          box-shadow: none !important;
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        padding: isMobile ? '1rem 1rem' : '2rem 0',
        boxSizing: 'border-box'
      }}>
        <Container style={{ maxWidth: '1000px' }}>
        {/* Alert Messages */}
        {message.show && (
          <div className="mb-4">
            <Alert 
              variant={message.type} 
              dismissible 
              onClose={() => setMessage({ text: '', type: '', show: false })}
              style={{ 
                borderRadius: 12, 
                border: 'none',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div className="d-flex align-items-center">
                {message.type === 'success' ? (
                  <FiCheckCircle className="me-2" size={16} />
                ) : (
                  <FiAlertCircle className="me-2" size={16} />
                )}
                {message.text}
              </div>
            </Alert>
          </div>
        )}

        {/* Top Banner */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: isMobile ? '1rem' : '2rem',
          borderRadius: '25px',
          marginBottom: '2rem',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <div className="d-flex align-items-center justify-content-between" style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : 0, maxWidth: '100%' }}>
            <div className="d-flex align-items-center" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'center', width: '100%', maxWidth: '100%' }}>
              {/* Profile Picture */}
              <div className={isMobile ? '' : 'me-4'} style={{ position: 'relative', marginBottom: isMobile ? '0.5rem' : 0 }}>
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()}
                    alt="Profile"
                    className="rounded-circle"
                    onError={handleImageError}
                    style={{ 
                      width: isMobile ? '72px' : '80px', 
                      height: isMobile ? '72px' : '80px', 
                      objectFit: 'cover',
                      border: '3px solid #ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowIconPicker(true)}
                    title="Click to change profile icon"
                  />
                ) : (
                  <div 
                    style={{
                      width: isMobile ? '72px' : '80px',
                      height: isMobile ? '72px' : '80px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowIconPicker(true)}
                    title="Click to choose profile icon"
                  >
                    <FiUser size={32} color="#6c757d" />
                  </div>
                )}
                
                {/* Edit icon overlay */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#007bff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    border: '2px solid #ffffff'
                  }}
                  onClick={() => setShowIconPicker(true)}
                  title="Change profile icon"
                >
                  <FiEdit3 size={14} color="#ffffff" />
                </div>
              </div>

              {/* User Info */}
              <div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '100%', minWidth: 0 }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#212529',
                  fontWeight: 600,
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  wordBreak: 'break-word'
                }}>
                  {formData.firstname && formData.lastname 
                    ? `${formData.firstname} ${formData.lastname}`
                    : formData.username || 'User Profile'
                }
                </h3>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  color: '#6c757d',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  overflowWrap: 'anywhere'
                }}>
                  {formData.email}
                </p>
                <div className="d-flex align-items-center mt-2" style={{ flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start', gap: '0.5rem', maxWidth: '100%' }}>
                  <span className={`badge bg-${getStatusBadgeVariant(formData.status)}`}>
                    {getStatusDisplayName(formData.status)} ({formData.status || 'undefined'})
                  </span>
                  <span className="badge bg-info" style={{ whiteSpace: 'nowrap' }}>
                    {getRoleDisplayName(formData.role)} {formData.position && `| ${formData.position}`}
                  </span>
                  <span className="badge bg-secondary" style={{ whiteSpace: 'nowrap' }}>
                    {formData.isVerified ? 'Verified' : 'Not Verified'} ({formData.isVerified ? 'true' : 'false'})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-column gap-2" style={{ width: isMobile ? '100%' : 'auto' }}>
              {!isEditing ? (
                <div className="d-flex gap-2" style={{ flexDirection: isMobile ? 'column' : 'row', width: '100%' }}>
                  <Button
                    variant="outline-primary"
                    onClick={() => setIsEditing(true)}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <FiEdit3 className="me-2" size={16} />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <FiTrash2 className="me-2" size={16} />
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div className="d-flex gap-3" style={{ flexDirection: isMobile ? 'column' : 'row', width: '100%' }}>
                  <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={loading}
                    onClick={handleSubmit}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="me-2" size={16} />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: isMobile ? '1rem' : '2rem',
          borderRadius: '25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <Form>
            <Row className="g-4">
              {/* First Name */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    First Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your first name"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (isEditing) {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isEditing) {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Last Name */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Last Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your last name"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Username */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Username
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your username"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Department */}
              <Col md={6}>
                <Form.Group>
                  
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Department
                    {departmentsLoading && (
                      <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                        (Loading...)
                      </span>
                    )}
                  </Form.Label>
                  {isEditing ? (
                    <Form.Select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={departmentsLoading}
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <option value="">
                        {departmentsLoading ? 'Loading departments...' : 'Select department'}
                      </option>
                      {departmentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={getCurrentDepartmentName()}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                  {!formData.department && (
                    <Form.Text style={{ fontSize: '0.8rem', color: '#dc3545' }}>
                      Please select your department
                    </Form.Text>
                  )}
                  
                </Form.Group>
              </Col>

              {/* Contact Number */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Contact Number
                    {isEditing && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#6c757d',
                        marginLeft: '0.5rem',
                        fontWeight: 'normal'
                      }}>
                        ({formData.contactNumber.length}/11)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="09XX XXX XXXX"
                    maxLength={11}
                    className="contact-number-input"
                    style={{ 
                      borderRadius: '50px !important', 
                      border: '2px solid #dee2e6 !important',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease',
                      outline: 'none !important',
                      boxShadow: 'none !important'
                    }}
                  />
                  <Form.Text style={{ 
                    fontSize: '0.8rem', 
                    color: '#6c757d'
                  }}>
                    Philippine mobile number format (11 digits required)
                    {formData.contactNumber.length > 0 && formData.contactNumber.length < 11 && (
                      <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>
                        - {11 - formData.contactNumber.length} more digits needed
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>
              </Col>



              {/* Email (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Form.Text style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    Email cannot be changed
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Role (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Role
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={getRoleDisplayName(formData.role)}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Position (Editable) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Position/Designation
                    {positionsLoading && (
                      <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                        (Loading...)
                      </span>
                    )}
                  </Form.Label>
                  {isEditing ? (
                    <>
                      {positionsLoading ? (
                        <Form.Control
                          type="text"
                          value={formData.position}
                          disabled
                          placeholder="Loading positions..."
                          style={{ 
                            borderRadius: '50px', 
                            border: '2px solid #dee2e6',
                            padding: '1rem 1.5rem',
                            fontSize: '0.9rem',
                            backgroundColor: '#f8f9fa',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ) : positionOptions && positionOptions.length > 0 ? (
                        <Form.Select
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          style={{ 
                            borderRadius: '50px', 
                            border: '2px solid #dee2e6',
                            padding: '1rem 1.5rem',
                            fontSize: '0.9rem',
                            backgroundColor: '#ffffff',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <option value="">
                            Select position (Optional)
                          </option>
                          {positionOptions.map(option => (
                            <option key={option.position_id} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        <Form.Control
                          type="text"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          placeholder="Enter your position/designation"
                          style={{ 
                            borderRadius: '50px', 
                            border: '2px solid #dee2e6',
                            padding: '1rem 1.5rem',
                            fontSize: '0.9rem',
                            backgroundColor: '#ffffff',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Form.Control
                      type="text"
                      value={formData.position || '-'}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                  <Form.Text style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    {positionsLoading
                      ? 'Loading positions...'
                      : positionOptions.length === 0
                        ? 'No predefined positions for your role. You can type your designation.'
                        : 'Select your specific position/designation or leave blank.'}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Status (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Account Status
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={`${getStatusDisplayName(formData.status)} (${formData.status || 'undefined'})`}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Verification Status */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Verification Status
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="text"
                      value={`${formData.isVerified ? 'Verified' : 'Not Verified'} (${formData.isVerified ? 'true' : 'false'})`}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    {formData.isVerified && (
                      <FiUserCheck 
                        className="ms-2" 
                        size={20} 
                        color="#28a745" 
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </div>
                </Form.Group>
              </Col>

              {/* Created Date */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Member Since
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="text"
                      value={`${formatDate(formData.createdAt)} (${formData.createdAt || 'undefined'})`}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <FiCalendar 
                      className="ms-2" 
                      size={20} 
                      color="#6c757d" 
                      style={{ flexShrink: 0 }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Profile Icon Picker Modal */}
        {showIconPicker && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '25px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 style={{ margin: 0, fontWeight: 600 }}>Choose Profile Icon</h4>
                <button
                  onClick={() => setShowIconPicker(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: 0,
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>

              {iconsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading icons...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading icons...</p>
                </div>
              ) : availableIcons.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No icons available</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '1rem'
                }}>
                  {availableIcons.map((icon) => (
                    <div
                      key={icon.other_id}
                      onClick={() => handleIconSelect(icon.link)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '12px',
                        padding: '8px',
                        border: formData.profilePic === icon.link ? '3px solid #007bff' : '2px solid #e9ecef',
                        transition: 'all 0.2s',
                        backgroundColor: formData.profilePic === icon.link ? '#f0f8ff' : '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.profilePic !== icon.link) {
                          e.currentTarget.style.borderColor = '#007bff';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.profilePic !== icon.link) {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <img
                        src={icon.link}
                        alt={icon.other_name}
                        style={{
                          width: '100%',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:64px;color:#6c757d;">❌</div>';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '25px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div className="text-center mb-4">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  border: '3px solid #fecaca'
                }}>
                  <FiTrash2 size={32} color="#dc3545" />
                </div>
                <h4 style={{ color: '#dc3545', fontWeight: 600 }}>Delete Account</h4>
                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>

              <div className="mb-4">
                <Form.Label style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  color: '#495057',
                  marginBottom: '0.75rem'
                }}>
                  Type "delete" to confirm
                </Form.Label>
                <Form.Control
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  style={{ 
                    borderRadius: '50px', 
                    border: '2px solid #dee2e6',
                    padding: '1rem 1.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && deleteConfirmation === 'delete') {
                      handleDeleteAccount();
                    }
                  }}
                />
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={deletingAccount}
                  style={{
                    borderRadius: '50px',
                    padding: '0.75rem 2rem',
                    borderWidth: '2px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'delete' || deletingAccount}
                  style={{
                    borderRadius: '50px',
                    padding: '0.75rem 2rem',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  {deletingAccount ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="me-2" size={16} />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </Container>
    </div>
    </>
  );
};

export default Profile;