import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck } from 'react-icons/fi';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';

const PositionsManagement = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role_type: 'ALL',
    is_active: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(buildUrl('positions'));
      if (data.success) {
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      description: '',
      role_type: 'ALL',
      is_active: true
    });
    setSelectedPosition(null);
    setShowModal(true);
    setError('');
  };

  const handleEdit = (position) => {
    setModalMode('edit');
    setFormData({
      name: position.name,
      description: position.description || '',
      role_type: position.role_type,
      is_active: position.is_active === 1
    });
    setSelectedPosition(position);
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'create' 
        ? buildUrl('positions')
        : buildUrl(`positions/${selectedPosition.position_id}`);
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const data = await fetchJson(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (data.success) {
        setSuccess(data.message || `Position ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
        setShowModal(false);
        await fetchPositions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving position:', error);
      setError('Failed to save position');
    }
  };

  const handleDelete = async (positionId) => {
    try {
      const data = await fetchJson(buildUrl(`positions/${positionId}`), {
        method: 'DELETE'
      });

      if (data.success) {
        setSuccess('Position deleted successfully!');
        setDeleteConfirm(null);
        await fetchPositions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete position');
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      setError('Failed to delete position');
    }
  };

  const getRoleTypeBadge = (roleType) => {
    const colors = {
      'ADMIN': '#007bff',
      'DEAN': '#28a745',
      'FACULTY': '#ffc107',
      'ALL': '#6c757d'
    };
    return colors[roleType] || '#6c757d';
  };

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#212529',
      margin: 0
    },
    createButton: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s'
    },
    table: {
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6'
    },
    th: {
      padding: '1rem',
      textAlign: 'left',
      fontWeight: 600,
      color: '#495057',
      fontSize: '0.9rem'
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #e9ecef',
      fontSize: '0.9rem',
      color: '#212529'
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#ffffff',
      display: 'inline-block'
    },
    actionButton: {
      backgroundColor: 'transparent',
      border: 'none',
      padding: '0.5rem',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'all 0.2s',
      marginRight: '0.5rem'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    },
    modalHeader: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#212529'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#495057',
      fontSize: '0.9rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      fontSize: '0.9rem',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      fontSize: '0.9rem',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      fontSize: '0.9rem',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    checkbox: {
      marginRight: '0.5rem',
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: '#495057'
    },
    modalActions: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem'
    },
    submitButton: {
      flex: 1,
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#6c757d',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    alert: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    alertError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Positions Management</h1>
        <button 
          style={styles.createButton}
          onClick={handleCreate}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          <FiPlus size={18} />
          Create Position
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <FiCheck style={{marginRight: '0.5rem'}} />
          {success}
        </div>
      )}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '3rem'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Position Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Role Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.position_id}>
                <td style={styles.td}>
                  <strong>{position.name}</strong>
                </td>
                <td style={styles.td}>
                  {position.description || '-'}
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getRoleTypeBadge(position.role_type)
                  }}>
                    {position.role_type}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: position.is_active ? '#28a745' : '#dc3545'
                  }}>
                    {position.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.actionButton}
                    onClick={() => handleEdit(position)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Edit"
                  >
                    <FiEdit2 size={18} color="#007bff" />
                  </button>
                  {deleteConfirm === position.position_id ? (
                    <>
                      <button
                        style={{...styles.actionButton, color: '#dc3545'}}
                        onClick={() => handleDelete(position.position_id)}
                        title="Confirm Delete"
                      >
                        <FiCheck size={18} color="#dc3545" />
                      </button>
                      <button
                        style={styles.actionButton}
                        onClick={() => setDeleteConfirm(null)}
                        title="Cancel"
                      >
                        <FiX size={18} color="#6c757d" />
                      </button>
                    </>
                  ) : (
                    <button
                      style={styles.actionButton}
                      onClick={() => setDeleteConfirm(position.position_id)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fee'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Delete"
                    >
                      <FiTrash2 size={18} color="#dc3545" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>
              {modalMode === 'create' ? 'Create New Position' : 'Edit Position'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Position Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Secretary, Dean, Developer"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this position"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role Type *</label>
                <select
                  style={styles.select}
                  value={formData.role_type}
                  onChange={(e) => setFormData({...formData, role_type: e.target.value})}
                  required
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin Only</option>
                  <option value="DEAN">Dean Only</option>
                  <option value="FACULTY">Faculty Only</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              {error && (
                <div style={{...styles.alert, ...styles.alertError}}>
                  {error}
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  <FiX size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                  <FiSave size={18} />
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionsManagement;
