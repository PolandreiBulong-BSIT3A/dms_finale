import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const OthersManagement = ({ styles }) => {
  const [others, setOthers] = useState([]);
  const [loadingOthers, setLoadingOthers] = useState(false);
  const [showOthersModal, setShowOthersModal] = useState(false);
  const [editingOther, setEditingOther] = useState(null);
  const [otherForm, setOtherForm] = useState({ 
    other_name: '', 
    category: 'ICON', 
    link: '' 
  });
  const [othersCategoryFilter, setOthersCategoryFilter] = useState('ALL');

  // Fetch Others
  const fetchOthers = async () => {
    try {
      setLoadingOthers(true);
      const data = await fetchJson(buildUrl('others'));
      setOthers(data.items || []);
    } catch (error) {
      console.error('Error fetching others:', error);
    } finally {
      setLoadingOthers(false);
    }
  };

  useEffect(() => {
    fetchOthers();
  }, []);

  // Handle Add Other
  const handleAddOther = () => {
    setEditingOther(null);
    setOtherForm({ other_name: '', category: 'ICON', link: '' });
    setShowOthersModal(true);
  };

  // Handle Edit Other
  const handleEditOther = (other) => {
    setEditingOther(other);
    setOtherForm({
      other_name: other.other_name,
      category: other.category,
      link: other.link || ''
    });
    setShowOthersModal(true);
  };

  // Handle Save Other
  const handleSaveOther = async () => {
    try {
      if (!otherForm.other_name || !otherForm.category) {
        alert('Name and category are required');
        return;
      }

      const url = editingOther 
        ? buildUrl(`others/${editingOther.other_id}`)
        : buildUrl('others');
      
      const method = editingOther ? 'PUT' : 'POST';

      const data = await fetchJson(url, {
        method,
        body: JSON.stringify(otherForm)
      });

      if (data.success) {
        setShowOthersModal(false);
        fetchOthers();
        alert(data.message || 'Resource saved successfully');
      } else {
        alert(data.message || 'Failed to save resource');
      }
    } catch (error) {
      console.error('Error saving other:', error);
      alert('Failed to save resource');
    }
  };

  // Handle Delete Other
  const handleDeleteOther = async (other) => {
    if (!confirm(`Are you sure you want to delete "${other.other_name}"?`)) {
      return;
    }

    try {
      const data = await fetchJson(buildUrl(`others/${other.other_id}`), {
        method: 'DELETE'
      });

      if (data.success) {
        fetchOthers();
        alert(data.message || 'Resource deleted successfully');
      } else {
        alert(data.message || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting other:', error);
      alert('Failed to delete resource');
    }
  };

  const filteredOthers = others.filter(other => 
    othersCategoryFilter === 'ALL' || other.category === othersCategoryFilter
  );

  return (
    <>
      {/* Others Management Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.subsectionTitle}>Resources Management</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Form.Select
              value={othersCategoryFilter}
              onChange={(e) => setOthersCategoryFilter(e.target.value)}
              style={{ width: '150px', fontSize: '14px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="ICON">Icons</option>
              <option value="MANUAL">Manuals</option>
              <option value="POLICY">Policies</option>
              <option value="TERMS">Terms</option>
              <option value="INFO">Info</option>
            </Form.Select>
            <button style={styles.primaryBtn} onClick={handleAddOther}>
              <FiPlus size={16} />
              Add Resource
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          {loadingOthers ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading resources...</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Link</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOthers.map(other => (
                  <tr key={other.other_id} style={styles.tableRow}>
                    <td style={styles.td}>{other.other_name}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: 
                          other.category === 'ICON' ? '#dbeafe' :
                          other.category === 'MANUAL' ? '#fef3c7' :
                          other.category === 'POLICY' ? '#fce7f3' :
                          other.category === 'TERMS' ? '#e0e7ff' :
                          '#f3f4f6',
                        color:
                          other.category === 'ICON' ? '#1e40af' :
                          other.category === 'MANUAL' ? '#d97706' :
                          other.category === 'POLICY' ? '#be185d' :
                          other.category === 'TERMS' ? '#4338ca' :
                          '#374151'
                      }}>
                        {other.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {other.link ? (
                        <a 
                          href={other.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {other.link.length > 50 ? other.link.substring(0, 50) + '...' : other.link}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>No link</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {other.created_at ? new Date(other.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={styles.iconBtn}
                          onClick={() => handleEditOther(other)}
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          style={{ ...styles.iconBtn, color: '#ef4444' }}
                          onClick={() => handleDeleteOther(other)}
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOthers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No resources found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Others Modal */}
      <Modal show={showOthersModal} onHide={() => setShowOthersModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingOther ? 'Edit Resource' : 'Add Resource'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Resource Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., ICON_1, USER MANUAL, PRIVACY POLICY"
              value={otherForm.other_name}
              onChange={(e) => setOtherForm({ ...otherForm, other_name: e.target.value })}
            />
            <Form.Text className="text-muted">
              A unique name for this resource
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category *</Form.Label>
            <Form.Select
              value={otherForm.category}
              onChange={(e) => setOtherForm({ ...otherForm, category: e.target.value })}
            >
              <option value="ICON">Icon (Profile Pictures)</option>
              <option value="MANUAL">Manual (User Guides)</option>
              <option value="POLICY">Policy (Privacy Policy)</option>
              <option value="TERMS">Terms (Terms & Conditions)</option>
              <option value="INFO">Info (Contact, Email, etc.)</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Link / URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="https://example.com/resource or email@example.com"
              value={otherForm.link}
              onChange={(e) => setOtherForm({ ...otherForm, link: e.target.value })}
            />
            <Form.Text className="text-muted">
              For ICON: Image URL (Imgur, local path)<br />
              For MANUAL/POLICY/TERMS: Google Drive or document URL<br />
              For INFO: Email address or contact info
            </Form.Text>
          </Form.Group>

          {otherForm.link && otherForm.category === 'ICON' && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '500' }}>Preview:</p>
              <img 
                src={otherForm.link} 
                alt="Preview" 
                style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <p style={{ display: 'none', color: '#ef4444', fontSize: '13px', margin: '8px 0 0 0' }}>
                Failed to load image. Please check the URL.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOthersModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveOther}>
            {editingOther ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OthersManagement;
