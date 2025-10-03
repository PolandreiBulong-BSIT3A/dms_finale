import React, { useEffect, useMemo, useState } from 'react';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';
import { useDocuments } from '../../contexts/DocumentContext';
import { useUser } from '../../contexts/UserContext';
import { ArrowCounterclockwise, Trash, ArrowDownUp, ChevronUp, ChevronDown, Funnel, Search, Plus, Pencil, Trash2, X } from 'react-bootstrap-icons';

const DocumentTrashcan = ({ onBack }) => {
  const { fetchDeletedDocuments, restoreDocument, permanentlyDeleteDocument, documents } = useDocuments();
  const { hasAdminPrivileges } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletedDocs, setDeletedDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [confirmModal, setConfirmModal] = useState({ open: false, mode: null, doc: null });
  const [propsModal, setPropsModal] = useState({ open: false, doc: null });
  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedCopyType, setSelectedCopyType] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [docTypeLookup, setDocTypeLookup] = useState({});
  // Folder management state
  const [allFolders, setAllFolders] = useState([]);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState('add'); // 'add' or 'edit'
  const [folderForm, setFolderForm] = useState({ name: '', description: '' });
  const [editingFolder, setEditingFolder] = useState(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const deleted = await fetchDeletedDocuments();
        const normalized = (deleted || [])
          .filter(d => (d.status || '').toString().toLowerCase() === 'deleted' || d.deleted === 1)
          .map(d => ({ ...d, id: d.id || d.doc_id }));
        setDeletedDocs(normalized);
      } catch (e) {
        setError(e?.message || 'Failed to load trash');
      } finally {
        setLoading(false);
      }
    };

  const openProps = (doc) => setPropsModal({ open: true, doc });
  const closeProps = () => setPropsModal({ open: false, doc: null });
    load();
  }, [fetchDeletedDocuments]);

  // Fetch document types from backend API (same as Document.jsx)
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const data = await fetchJson(buildUrl('document-types'));
        if (data.success && data.documentTypes) {
          // Build a map: doc_type_id -> type_name
          const typeMap = {};
          data.documentTypes.forEach(dt => {
            if (dt.doc_type_id && dt.type_name) {
              typeMap[String(dt.doc_type_id)] = dt.type_name;
            }
          });
          setDocTypeLookup(typeMap);
        }
      } catch (error) {
        console.error('Error fetching document types:', error);
      }
    };
    
    fetchDocumentTypes();
  }, []);

  // Fetch folders from backend
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await fetchJson(buildUrl('folders'));
        if (data.success && data.folders) {
          setAllFolders(data.folders);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };
    fetchFolders();
  }, []);

  // Folder management functions
  const openAddFolderModal = () => {
    setFolderModalMode('add');
    setFolderForm({ name: '', description: '' });
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  const openEditFolderModal = (folder) => {
    setFolderModalMode('edit');
    setFolderForm({ name: folder.name, description: folder.description || '' });
    setEditingFolder(folder);
    setFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    setFolderModalOpen(false);
    setFolderForm({ name: '', description: '' });
    setEditingFolder(null);
  };

  const handleSaveFolder = async () => {
    if (!folderForm.name.trim()) {
      alert('Folder name is required');
      return;
    }

    try {
      const url = folderModalMode === 'add' 
        ? buildUrl('folders')
        : buildUrl(`folders/${editingFolder.folder_id}`);

      const data = await fetchJson(url, {
        method: folderModalMode === 'add' ? 'POST' : 'PUT',
        body: JSON.stringify(folderForm),
      });

      if (data.success) {
        // Refresh folders
        const foldersData = await fetchJson(buildUrl('folders'));
        if (foldersData.success && foldersData.folders) {
          setAllFolders(foldersData.folders);
        }
        closeFolderModal();
      } else {
        alert(data.message || 'Failed to save folder');
      }
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Failed to save folder');
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      return;
    }

    try {
      const data = await fetchJson(buildUrl(`folders/${folder.folder_id}`), {
        method: 'DELETE',
      });

      if (data.success) {
        // Refresh folders
        const foldersData = await fetchJson(buildUrl('folders'));
        if (foldersData.success && foldersData.folders) {
          setAllFolders(foldersData.folders);
        }
        if (selectedFolder === folder.name) {
          setSelectedFolder('');
        }
      } else {
        alert(data.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return () => {};
  }, []);

  const filtered = useMemo(() => {
    const base = (() => {
      if (!search.trim()) return deletedDocs;
      const s = search.toLowerCase();
      return deletedDocs.filter(d =>
        d.title?.toLowerCase().includes(s) ||
        d.reference?.toLowerCase().includes(s) ||
        d.from_field?.toLowerCase().includes(s) ||
        d.to_field?.toLowerCase().includes(s) ||
        d.doc_type?.toLowerCase().includes(s) ||
        d.created_by_name?.toLowerCase().includes(s) ||
        d.department_names?.toLowerCase().includes(s)
      );
    })();
    // Apply advanced filters
    let acc = base;
    if (selectedCategory) {
      acc = acc.filter(d => {
        const key = (d.doc_type ?? d.docType ?? d.type_id ?? d.type)?.toString().toLowerCase();
        return key === String(selectedCategory).toLowerCase();
      });
    }
    if (selectedDepartment) acc = acc.filter(d => String(d.department_names || '').toLowerCase().includes(String(selectedDepartment).toLowerCase()));
    if (selectedSender) acc = acc.filter(d => String(d.from_field || '').toLowerCase() === String(selectedSender).toLowerCase());
    if (selectedReceiver) acc = acc.filter(d => String(d.to_field || '').toLowerCase() === String(selectedReceiver).toLowerCase());
    if (selectedCreator) acc = acc.filter(d => String(d.created_by_name || '').toLowerCase() === String(selectedCreator).toLowerCase());
    if (selectedCopyType) acc = acc.filter(d => String(d.available_copy || '').toLowerCase() === String(selectedCopyType).toLowerCase());
    if (selectedFolder) acc = acc.filter(d => String(d.folder || d.folder_name || '').toLowerCase() === String(selectedFolder).toLowerCase());
    if (!sortConfig.key) return acc;
    const sorted = [...acc].sort((a, b) => {
      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      const av = a[key] || '';
      const bv = b[key] || '';
      if (key.includes('date') || key.includes('created_at') || key.includes('updated_at')) {
        return (new Date(av) - new Date(bv)) * dir;
      }
      return av.toString().localeCompare(bv.toString()) * dir;
    });
    return sorted;
  }, [deletedDocs, search, sortConfig, selectedCategory, selectedDepartment, selectedSender, selectedReceiver, selectedCreator, selectedCopyType, selectedFolder]);

  // Unique categories (doc_type)
  // Build a map of doc_type (id or key) -> readable label using both deleted docs and current documents
  const docTypeMap = useMemo(() => {
    const map = new Map();
    // From lookup fetched from backend
    Object.entries(docTypeLookup || {}).forEach(([k, v]) => {
      const key = String(k);
      const label = String(v);
      if (key && label && !map.has(key)) map.set(key, label);
    });
    // From deleted docs
    (deletedDocs || []).forEach(d => {
      const key = (d.doc_type ?? d.docType ?? d.type_id ?? d.type)?.toString();
      const label = d.doc_type_name || d.docType || d.type_name || d.type || d.category || null;
      if (key && label && !map.has(key)) map.set(key, label);
    });
    // From active documents (if available)
    (documents || []).forEach(d => {
      const key = (d.doc_type ?? d.docType ?? d.type_id ?? d.type)?.toString();
      const label = d.doc_type_name || d.docType || d.type_name || d.type || d.category || null;
      if (key && label && !map.has(key)) map.set(key, label);
    });
    return map;
  }, [deletedDocs, documents, docTypeLookup]);

  // Unique categories based on keys, but show human labels when available
  const categories = useMemo(() => {
    const keys = new Set();
    (deletedDocs || []).forEach(d => {
      const key = (d.doc_type ?? d.docType ?? d.type_id ?? d.type)?.toString();
      if (key) keys.add(key);
    });
    (documents || []).forEach(d => {
      const key = (d.doc_type ?? d.docType ?? d.type_id ?? d.type)?.toString();
      if (key) keys.add(key);
    });
    // Return array of { value, label }
    return Array.from(keys)
      .map(value => ({ value, label: docTypeMap.get(value) || value }))
      .sort((a, b) => a.label.toString().localeCompare(b.label.toString()));
  }, [deletedDocs, documents, docTypeMap]);
  const departments = useMemo(() => Array.from(new Set((deletedDocs || []).flatMap(d => String(d.department_names || '').split(',').map(s => s.trim()).filter(Boolean)))), [deletedDocs]);
  const senders = useMemo(() => Array.from(new Set((deletedDocs || []).map(d => d.from_field).filter(Boolean))), [deletedDocs]);
  const receivers = useMemo(() => Array.from(new Set((deletedDocs || []).map(d => d.to_field).filter(Boolean))), [deletedDocs]);
  const creators = useMemo(() => Array.from(new Set((deletedDocs || []).map(d => d.created_by_name).filter(Boolean))), [deletedDocs]);
  const copyTypes = useMemo(() => Array.from(new Set((deletedDocs || []).map(d => d.available_copy).filter(Boolean))), [deletedDocs]);
  const folders = useMemo(() => Array.from(new Set((deletedDocs || []).map(d => d.folder || d.folder_name).filter(Boolean))), [deletedDocs]);

  // Pagination calculations (per-page rendering & selection)
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  // Reset to first page when search/sort changes
  useEffect(() => { setCurrentPage(1); }, [search, sortConfig]);

  const getInitials = (text) => {
    const t = (text || '').toString().trim();
    if (!t) return 'U';
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortIcon = (key) => {
    const baseStyle = { marginLeft: 6, verticalAlign: 'middle' };
    if (sortConfig.key !== key) return <ArrowDownUp size={14} style={baseStyle} />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={16} style={baseStyle} />
      : <ChevronDown size={16} style={baseStyle} />;
  };

  const handleSelectAll = (checked) => {
    // Select only items on the current page for consistent UX
    if (checked) setSelectedDocs(paginated.map(d => d.id));
    else setSelectedDocs([]);
  };

  const handleSelect = (id, checked) => {
    if (checked) setSelectedDocs(prev => [...prev, id]);
    else setSelectedDocs(prev => prev.filter(x => x !== id));
  };

  const handleRestore = async (doc) => {
    setConfirmModal({ open: true, mode: 'restore', doc });
  };

  const handlePermanentDelete = async (doc) => {
    if (!hasAdminPrivileges()) return;
    setConfirmModal({ open: true, mode: 'delete', doc });
  };

  const runToast = (message, bg = '#10b981') => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:20px;right:20px;padding:10px 14px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.15);';
      el.style.background = bg;
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
    } catch {}
  };

  const confirmAction = async () => {
    const { mode, doc } = confirmModal;
    if (!doc) return;
    const id = doc.id || doc.doc_id;
    try {
      if (mode === 'restore') {
        await restoreDocument(id);
        setDeletedDocs(prev => prev.filter(d => (d.id || d.doc_id) !== id));
        setSelectedDocs(prev => prev.filter(x => x !== id));
        runToast('✅ Document restored');
      } else if (mode === 'delete') {
        await permanentlyDeleteDocument(id);
        setDeletedDocs(prev => prev.filter(d => (d.id || d.doc_id) !== id));
        setSelectedDocs(prev => prev.filter(x => x !== id));
        runToast('🗑️ Document permanently deleted', '#ef4444');
      }
    } finally {
      setConfirmModal({ open: false, mode: null, doc: null });
    }
  };

  const closeConfirm = () => setConfirmModal({ open: false, mode: null, doc: null });

  const handleRestoreSelected = async () => {
    if (selectedDocs.length === 0) return;
    for (const id of selectedDocs) {
      await restoreDocument(id);
    }
    setDeletedDocs(prev => prev.filter(d => !selectedDocs.includes(d.id || d.doc_id)));
    setSelectedDocs([]);
  };

  const handlePermanentDeleteSelected = async () => {
    if (!hasAdminPrivileges()) return;
    if (selectedDocs.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedDocs.length} document(s)? This cannot be undone.`)) return;
    for (const id of selectedDocs) {
      await permanentlyDeleteDocument(id);
    }
    setDeletedDocs(prev => prev.filter(d => !selectedDocs.includes(d.id || d.doc_id)));
    setSelectedDocs([]);
  };

  if (loading) return <div>Loading Trash...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.headerRow,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '8px' : '12px'
      }}>
        <h1 style={{
          ...styles.headerTitle,
          textAlign: isMobile ? 'center' : 'left',
          margin: 0
        }}>TRASH</h1>
        <div style={{
          ...styles.headerActions,
          width: isMobile ? '100%' : 'auto',
          marginLeft: isMobile ? 0 : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          gap: isMobile ? '8px' : '12px'
        }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...styles.searchInput, padding: '8px 12px 8px 40px', width: '100%' }}
            />
          </div>
          <button
            className="btn btn-light btn-sm border rounded-pill"
            title="Filters"
            onClick={() => setFiltersOpen(prev => !prev)}
            style={{ 
              padding: '8px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14,
              ...(isMobile ? { width: '100%', minHeight: 44, borderRadius: 9999, alignSelf: 'center' } : { borderRadius: 9999 })
            }}
          >
            <Funnel /> {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
          {selectedDocs.length > 0 && (
            <>
              <button
                className="btn btn-light btn-sm border rounded-pill"
                onClick={handleRestoreSelected}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', ...(isMobile ? { width: '100%', justifyContent: 'center' } : {}) }}
              >
                <ArrowCounterclockwise /> Restore Selected ({selectedDocs.length})
              </button>
              {hasAdminPrivileges() && (
                <button
                  className="btn btn-danger btn-sm border rounded-pill"
                  onClick={handlePermanentDeleteSelected}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', ...(isMobile ? { width: '100%', justifyContent: 'center' } : {}) }}
                >
                  <Trash /> Delete Permanently
                </button>
              )}
            </>
          )}
          <button onClick={() => (onBack ? onBack() : null)} className="btn btn-primary rounded-pill px-3" style={isMobile ? { width: '100%' } : {}}>View Documents</button>
        </div>
      </div>

      {filtersOpen && (
        <div style={{
          border: '1px solid #e2e8f0', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 12,
          backgroundColor: '#ffffff',
          ...(isMobile ? {} : { maxWidth: 720 })
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: isMobile ? 16 : 14 }}>Filters</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Categories</option>
                {categories.length === 0 ? (
                  <option value="" disabled>No categories</option>
                ) : (
                  categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Department</label>
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Departments</option>
                {departments.length === 0 ? (<option value="" disabled>No departments</option>) : departments.map(d => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Sender</label>
              <select value={selectedSender} onChange={(e) => setSelectedSender(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Senders</option>
                {senders.length === 0 ? (<option value="" disabled>No senders</option>) : senders.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Receiver</label>
              <select value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Receivers</option>
                {receivers.length === 0 ? (<option value="" disabled>No receivers</option>) : receivers.map(r => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Created By</label>
              <select value={selectedCreator} onChange={(e) => setSelectedCreator(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Creators</option>
                {creators.length === 0 ? (<option value="" disabled>No creators</option>) : creators.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>Available Copy</label>
              <select value={selectedCopyType} onChange={(e) => setSelectedCopyType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Copy Types</option>
                {copyTypes.length === 0 ? (<option value="" disabled>No copy types</option>) : copyTypes.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Folder</span>
                <button
                  onClick={openAddFolderModal}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '4px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Add New Folder"
                >
                  <Plus size={14} /> Add
                </button>
              </label>
              <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 9999, border: '1px solid #d1d5db', fontSize: 16, backgroundColor: '#fff', minHeight: 48 }}>
                <option value="">All Folders</option>
                {allFolders.length === 0 ? (<option value="" disabled>No folders</option>) : allFolders.map(f => (<option key={f.folder_id || f.name} value={f.name}>{f.name}</option>))}
              </select>
              {/* Folder Management List */}
              {allFolders.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allFolders.map(folder => (
                    <div key={folder.folder_id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: selectedFolder === folder.name ? '#e0f2fe' : '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: selectedFolder === folder.name ? 600 : 400 }}>
                        {folder.name}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => openEditFolderModal(folder)}
                          className="btn btn-sm btn-light"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          title="Edit Folder"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="btn btn-sm btn-light text-danger"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          title="Delete Folder"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Card Layout */}
      {isMobile && (
        <>
          <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8 }}>
            <label className="d-flex align-items-center" style={{ gap: 8, margin: 0 }}>
              <input
                type="checkbox"
                checked={selectedDocs.length === paginated.length && paginated.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="small text-muted">Select All</span>
            </label>
            {selectedDocs.length > 0 && (
              <span className="small text-muted">{selectedDocs.length} selected</span>
            )}
          </div>
          <div className="d-grid gap-3">
            {paginated.map(doc => (
              <div key={doc.id} className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3">
                    <div className="d-flex align-items-center justify-content-center fw-bold" style={{ width: 48, height: 48, borderRadius: '50%', background: '#e9ecef', color: '#6b7280', flexShrink: 0 }}>
                      {doc.created_by_profile_pic ? (
                        <img src={doc.created_by_profile_pic} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(doc.created_by_name || doc.title)
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem', color: '#111827' }} onClick={() => openProps(doc)}>{doc.title || '-'}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            {(() => { 
                              const key = (doc.doc_type ?? doc.docType ?? doc.type_id ?? doc.type)?.toString();
                              const label = key ? (docTypeMap.get(key) || key) : 'DOC';
                              return <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>{label}</span>;
                            })()}
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => handleSelect(doc.id, e.target.checked)}
                            title="Select"
                            style={{ width: 16, height: 16 }}
                          />
                          <button className="btn btn-sm btn-light border-0" onClick={() => handleRestore(doc)} title="Restore" style={{ color: '#10b981' }}>
                            <ArrowCounterclockwise size={16} />
                          </button>
                          {hasAdminPrivileges() && (
                            <button className="btn btn-sm btn-light border-0 text-danger" onClick={() => handlePermanentDelete(doc)} title="Delete Permanently">
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-muted small">
                        <div className="mb-1"><span style={{ fontWeight: 500 }}>Created by:</span> {doc.created_by_name || '-'}</div>
                        <div><span style={{ fontWeight: 500 }}>Date:</span> {doc.created_at ? (doc.created_at.split('T')[0] || doc.created_at) : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Desktop Table Layout */}
      {!isMobile && (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              <div
                style={{
                  ...styles.checkbox,
                  ...(selectedDocs.length === filtered.length && filtered.length > 0 ? styles.checkboxChecked : {})
                }}
                onClick={() => handleSelectAll(!(selectedDocs.length === filtered.length && filtered.length > 0))}
              >
                {(selectedDocs.length === filtered.length && filtered.length > 0) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
            </th>
            <th style={styles.th}><button onClick={() => handleSort('title')} style={styles.sortBtn}>File Name {sortIcon('title')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('deleted_by_name')} style={styles.sortBtn}>Deleted By {sortIcon('deleted_by_name')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('created_at')} style={styles.sortBtn}>Date Created {sortIcon('created_at')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('updated_at')} style={styles.sortBtn}>Last Updated {sortIcon('updated_at')}</button></th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(doc => (
            <tr key={doc.id} style={styles.tableRow}>
              <td style={{ ...styles.td, ...styles.tableRowFirstCell }}>
                <div
                  style={{
                    ...styles.checkbox,
                    ...(selectedDocs.includes(doc.id) ? styles.checkboxChecked : {})
                  }}
                  onClick={() => handleSelect(doc.id, !selectedDocs.includes(doc.id))}
                >
                  {selectedDocs.includes(doc.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
              </td>
              <td style={{...styles.td, paddingRight: 0}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  <div style={styles.avatarWrap}>
                    {doc.created_by_profile_pic ? (
                      <img src={doc.created_by_profile_pic} alt="avatar" style={styles.avatarImg} />
                    ) : (
                      <div style={styles.avatarMono}>{getInitials(doc.created_by_name || doc.title)}</div>
                    )}
                  </div>
                  {/* Title + meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={styles.titleRow}>
                      <span 
                        title={doc.title}
                        style={styles.titleLink}
                        onClick={() => openProps(doc)}
                      >
                        {doc.title || '-'}
                      </span>
                      {(() => {
                        const key = (doc.doc_type ?? doc.docType ?? doc.type_id ?? doc.type)?.toString();
                        const label = key ? (docTypeMap.get(key) || key) : 'DOC';
                        return <span style={{...styles.typeTag, background:'#3b82f6'}}>{label}</span>;
                      })()}
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaText}>Created by: {doc.created_by_name || '-'}</span>
                      {doc.deleted_by_name && (
                        <span style={styles.metaDot}>•</span>
                      )}
                      {doc.deleted_by_name && (
                        <span style={{...styles.metaText, color:'#dc2626'}}>Deleted by: {doc.deleted_by_name}</span>
                      )}
                    </div>
                    {doc.department_names && (
                      <div style={styles.badgesRow}>
                        {String(doc.department_names)
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                          .slice(0, 6)
                          .map((name, idx) => (
                            <span key={idx} style={styles.deptBadge}>{name}</span>
                          ))}
                        {String(doc.department_names).split(',').filter(Boolean).length > 6 && (
                          <span style={{...styles.deptBadge, background:'#9ca3af'}}>+{String(doc.department_names).split(',').filter(Boolean).length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={styles.avatarWrapSm}>
                    {doc.deleted_by_profile_pic ? (
                      <img src={doc.deleted_by_profile_pic} alt="avatar" style={styles.avatarImgSm} />
                    ) : (
                      <div style={styles.avatarMonoSm}>{getInitials(doc.deleted_by_name)}</div>
                    )}
                  </div>
                  <span>{doc.deleted_by_name || '-'}</span>
                </div>
              </td>
              <td style={styles.td}>{doc.created_at ? (doc.created_at.split('T')[0] || doc.created_at) : '-'}</td>
              <td style={styles.td}>{doc.updated_at ? (doc.updated_at.split('T')[0] || doc.updated_at) : '-'}</td>
              <td style={{ ...styles.td, ...styles.tableRowLastCell }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-light btn-sm border rounded-circle" onClick={() => handleRestore(doc)} title="Restore" aria-label="Restore"><ArrowCounterclockwise /></button>
                    {hasAdminPrivileges() && (
                      <button className="btn btn-light btn-sm border text-danger rounded-circle" onClick={() => handlePermanentDelete(doc)} title="Delete Permanently" aria-label="Delete"><Trash /></button>
                    )}
                  </div>
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    <button onClick={(e) => {
                      const current = e.currentTarget.nextSibling;
                      if (current) current.style.display = current.style.display === 'block' ? 'none' : 'block';
                    }} className="btn btn-link btn-sm" style={{ textDecoration: 'none' }} title="Details">⋮</button>
                    <div style={{ ...styles.menu, display: 'none', right: 0 }}>
                      <div style={{fontWeight: 600, marginBottom: 8}}>Details</div>
                      <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap: '6px 10px', fontSize: 12, color: '#555'}}>
                        <div><strong>Reference</strong></div><div>{doc.reference || '-'}</div>
                        <div><strong>Sender</strong></div><div>{doc.from_field || '-'}</div>
                        <div><strong>Recipient</strong></div><div>{doc.to_field || '-'}</div>
                        <div><strong>Category</strong></div><div>{doc.doc_type || '-'}</div>
                        <div><strong>Departments</strong></div><div>{doc.department_names || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      {filtered.length === 0 && (
        <div style={{ marginTop: 12, color: '#666' }}>No deleted documents found.</div>
      )}

      {confirmModal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }} onClick={closeConfirm}>
          <div style={{ background:'#fff', borderRadius:12, width:'min(520px, 90vw)', padding:20, boxShadow:'0 12px 32px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ margin:0 }}>{confirmModal.mode === 'restore' ? 'Restore Document' : 'Delete Permanently'}</h3>
              <button onClick={closeConfirm} className="btn btn-light btn-sm">✕</button>
            </div>
            <div style={{ color:'#374151', marginBottom:16 }}>
              {confirmModal.mode === 'restore' ? (
                <>
                  Are you sure you want to restore <strong>{confirmModal.doc?.title || 'this document'}</strong>?
                </>
              ) : (
                <>
                  This will permanently delete <strong>{confirmModal.doc?.title || 'this document'}</strong>. This action cannot be undone.
                </>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={closeConfirm} className="btn btn-light">Cancel</button>
              {confirmModal.mode === 'restore' ? (
                <button onClick={confirmAction} className="btn btn-primary">Restore</button>
              ) : (
                <button onClick={confirmAction} className="btn btn-danger">Delete Permanently</button>
              )}
            </div>
          </div>
        </div>
      )}

      {propsModal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }} onClick={closeProps}>
          <div style={{ background:'#fff', borderRadius:12, width:'min(820px, 96vw)', maxHeight:'88vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Document Properties</div>
              <button onClick={closeProps} className="btn btn-light btn-sm">✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                <div>
                  <div style={styles.propLabel}>Title</div>
                  <div style={styles.propValue}>{propsModal.doc?.title || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Reference</div>
                  <div style={styles.propValue}>{propsModal.doc?.reference || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>From</div>
                  <div style={styles.propValue}>{propsModal.doc?.from_field || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>To</div>
                  <div style={styles.propValue}>{propsModal.doc?.to_field || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Type</div>
                  <div style={styles.propValue}>{String(propsModal.doc?.doc_type || '') || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Deleted By</div>
                  <div style={styles.propValue}>{propsModal.doc?.deleted_by_name || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Date Created</div>
                  <div style={styles.propValue}>{propsModal.doc?.created_at ? (propsModal.doc.created_at.split('T')[0] || propsModal.doc.created_at) : '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Deleted At</div>
                  <div style={styles.propValue}>{propsModal.doc?.deleted_at ? (new Date(propsModal.doc.deleted_at).toLocaleString()) : '-'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={styles.propLabel}>Departments</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {String(propsModal.doc?.department_names || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map((name, idx) => (
                        <span key={idx} style={styles.deptBadge}>{name}</span>
                      ))}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={styles.propLabel}>Description</div>
                  <div style={styles.propValue}>{propsModal.doc?.description || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Management Modal */}
      {folderModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }} onClick={closeFolderModal}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {folderModalMode === 'add' ? 'Add New Folder' : 'Edit Folder'}
              </h3>
              <button onClick={closeFolderModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Folder Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="Enter folder name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Description
              </label>
              <textarea
                value={folderForm.description}
                onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                placeholder="Enter folder description (optional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={closeFolderModal}
                className="btn btn-light"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolder}
                className="btn btn-primary"
                style={{ padding: '8px 16px' }}
              >
                {folderModalMode === 'add' ? 'Create Folder' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px' },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    margin: '0 0 16px 0',
    position: 'relative',
    padding: 0,
    flexWrap: 'wrap'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    padding: 0,
    textAlign: 'left',
    lineHeight: '1.2'
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: '8px'
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '9999px',
    fontSize: '14px',
    width: '280px',
    backgroundColor: '#fff'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
    background: 'transparent'
  },
  th: {
    padding: '16px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: 600,
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6'
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: '#6b7280',
    fontWeight: 600,
  },
  td: {
    padding: '16px 12px',
    border: 'none',
    textAlign: 'left',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#374151'
  },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 36, height: 36, borderRadius: '50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#1f2937' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  titleLink: { fontSize: 16, fontWeight: 600, color: '#1f2937', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  typeTag: { marginLeft: 6, fontSize: 10, color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 600 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12 },
  metaText: { color: '#6b7280' },
  metaDot: { color: '#9ca3af' },
  badgesRow: { display:'flex', flexWrap:'wrap', gap:6 },
  deptBadge: { background:'#e0e7ff', color:'#1e40af', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600 },
  propLabel: { fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4 },
  propValue: { fontSize:14, color:'#111827', wordBreak:'break-word' },
  // Profile avatar styles (match Documents list)
  avatarWrap: { width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarImg: { width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' },
  avatarMono: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#111827', background:'#f3f4f6' },
  avatarWrapSm: { width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarImgSm: { width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' },
  avatarMonoSm: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#111827', background:'#f3f4f6' },
  tableRow: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  tableRowFirstCell: {
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px'
  },
  tableRowLastCell: {
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    borderColor: '#3b82f6',
    background: '#3b82f6',
    color: '#fff'
  },
  menu: { position: 'absolute', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, zIndex: 1000, minWidth: 280, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }
};

export default DocumentTrashcan;


