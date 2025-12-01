/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchWithRetry } from '../../lib/api/frontend/http.js';
import { buildUrl } from '../../lib/api/frontend/client.js';
import { FiExternalLink, FiEye, FiMessageSquare, FiUpload, FiDownload, FiPlus, FiMoreVertical, FiEdit3, FiTrash2, FiBookmark, FiInfo, FiAlertTriangle, FiSearch } from 'react-icons/fi';
import { ArrowDownUp, ArrowUp, ArrowDown } from 'react-bootstrap-icons';
import { useDocuments } from '../../contexts/DocumentContext.jsx';
import { useUser } from '../../contexts/UserContext.jsx';

const Request = ({ onNavigateToUpload }) => {
  const { documents, loading, error, refreshDocuments } = useDocuments();
  const { user: currentUser } = useUser();
  
  // Add spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'answered'
  const [answeredDocs, setAnsweredDocs] = useState([]);
  const [answeredLoading, setAnsweredLoading] = useState(false);
  const [sortField, setSortField] = useState('date_received'); // Default sort field
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  const [showMenu, setShowMenu] = useState(null); // Track which row's menu is open
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [propertiesDoc, setPropertiesDoc] = useState(null);
  const [requestViewers, setRequestViewers] = useState([]);
  const [requestViewersLoading, setRequestViewersLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // bulk selection
  const [allUsers, setAllUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [seenDocIds, setSeenDocIds] = useState(() => new Set());
  const [viewersByDocId, setViewersByDocId] = useState({});

  const loadViewersForCard = useCallback(async (doc) => {
    try {
      const id = doc?.id || doc?.doc_id;
      if (!id) return;
      const numericId = Number(id);
      if (!Number.isNaN(numericId) && viewersByDocId[numericId]) return; // already loaded

      const res = await fetchWithRetry(buildUrl(`documents/${id}/views`), { credentials: 'include' });
      if (!res || !res.ok) return;
      const data = await res.json().catch(() => ({}));
      const viewers = Array.isArray(data.viewers) ? data.viewers : [];
      if (!Number.isNaN(numericId)) {
        setViewersByDocId(prev => ({
          ...prev,
          [numericId]: viewers
        }));
      }
    } catch (e) {
      console.warn('Failed to load viewers for request card', e);
    }
  }, [viewersByDocId]);

  // Helper: mark document as seen for current user
  const markSeen = async (doc) => {
    try {
      const id = doc?.id || doc?.doc_id;
      if (!id) return;
      const res = await fetch(buildUrl(`documents/${id}/seen`), {
        method: 'POST',
        credentials: 'include'
      });
      if (res && res.ok) {
        const numericId = Number(id);
        if (!Number.isNaN(numericId)) {
          setSeenDocIds(prev => {
            const next = new Set(prev);
            next.add(numericId);
            return next;
          });
        }

        // lazily load viewers for this document after first successful interaction
        await loadViewersForCard(doc);
      }
    } catch (e) {
      // Do not block UI on errors
      console.warn('markSeen failed', e);
    }
  };

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth <= 768); } catch (resizeError) {
        console.error('Resize error:', resizeError);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Heuristics to detect action-required documents based on fields used in this app
  const isActionRequiredDoc = (doc) => {
    // Backend may attach different shapes; check common ones
    const arArray = doc.action_required || doc.actions || doc.actionRequired || doc.actionRequiredNames || [];
    const arName = doc.action_required_name || doc.actionName || '';
    const arIds = doc.action_required_ids || [];
    return (Array.isArray(arArray) && arArray.length > 0) || !!arName || (Array.isArray(arIds) && arIds.length > 0);
  };

  const [requestDocs, setRequestDocs] = React.useState([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [requestError, setRequestError] = React.useState(null);

  // Function to fetch request documents
  const fetchRequestDocuments = async () => {
    setLoadingRequests(true);
    setRequestError(null);
    try {
      const res = await fetchWithRetry(buildUrl('documents/requests'), { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const list = Array.isArray(data?.documents) ? data.documents : [];
      
      // Debug logging
      console.log('[Request] Fetched documents:', {
        total: list.length,
        sample: list.length > 0 ? {
          id: list[0].id,
          title: list[0].title,
          action_required: list[0].action_required,
          action_required_name: list[0].action_required_name,
          action_status: list[0].action_status
        } : null
      });
      
      setRequestDocs(list);
      
      // Mark new requests as seen after a short delay
      if (list.length > 0) {
        setTimeout(() => {
          list.forEach(doc => {
            if (doc.id && !seenDocIds.has(Number(doc.id))) {
              markSeen(doc);
            }
          });
        }, 1000);
      } else {
        console.log('[Request] No documents found. Check if documents have action_required assignments.');
      }
      
    } catch (e) {
      console.error('Failed to fetch requests:', e);
      setRequestError('Failed to load requests. Please try refreshing the page.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Initial fetch and set up refresh interval
  React.useEffect(() => {
    fetchRequestDocuments();
    
    // Refresh requests every 30 seconds
    const intervalId = setInterval(fetchRequestDocuments, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Load seen document ids for current user (persistent seen state)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchWithRetry(buildUrl('documents/seen'), { 
          credentials: 'include',
          // Don't show error toast for 404s as this is an optional feature
          headers: { 'X-Silent-Error': 'true' }
        }).catch(() => null);
        
        // Skip if component unmounted or request failed
        if (!isMounted || !res) return;
        
        // If endpoint returns 404, just return - this is not a critical feature
        if (res.status === 404) return;
        
        // Only process if response is ok
        if (!res.ok) return;
        
        const data = await res.json().catch(() => ({}));
        const ids = Array.isArray(data?.seen)
          ? data.seen.map(n => Number(n)).filter(n => !Number.isNaN(n))
          : [];
        if (!isMounted) return;
        setSeenDocIds(new Set(ids));
      } catch (e) {
        console.warn('Failed to load seen documents for requests', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch answered documents
  const fetchAnsweredDocuments = async () => {
    setAnsweredLoading(true);
    try {
      const response = await fetchWithRetry(buildUrl('documents/answered'), {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnsweredDocs(data.documents || []);
        }
      }
    } catch (error) {
      console.error('Error fetching answered documents:', error);
    } finally {
      setAnsweredLoading(false);
    }
  };

  // Load answered documents when switching to answered view
  React.useEffect(() => {
    if (viewMode === 'answered' && answeredDocs.length === 0) {
      fetchAnsweredDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, answeredDocs.length]);

  // Load users for avatar matching
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchWithRetry(buildUrl('users'), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.users || []);
          const normalized = list.map(u => ({
            id: u.user_id ?? u.id,
            firstname: u.firstname ?? u.first_name,
            lastname: u.lastname ?? u.last_name,
            full_name: `${(u.firstname ?? u.first_name) || ''} ${(u.lastname ?? u.last_name) || ''}`.trim(),
            username: u.Username || u.username || '',
            email: u.email || u.user_email || '',
            profilePic: u.profile_pic || u.profilePic || ''
          }));
          setAllUsers(normalized);
        }
      } catch (userLoadError) {
        console.error('Error loading users:', userLoadError);
      }
    };
    loadUsers();
  }, []);

  const findUserByName = (createdByName) => {
    if (!createdByName) return null;
    const name = createdByName.toString().trim();
    // Try exact matches by full name, username, email
    let match = allUsers.find(u => u.full_name === name || u.username === name || u.email === name);
    if (match) return match;
    // Try case-insensitive comparison
    const lower = name.toLowerCase();
    match = allUsers.find(u => u.full_name.toLowerCase() === lower || u.username.toLowerCase() === lower || u.email.toLowerCase() === lower);
    if (match) return match;
    // Try startsWith for partials
    match = allUsers.find(u => name.includes(u.full_name) || u.full_name.includes(name));
    return match || null;
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('[data-menu-container]')) {
        setShowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    const closeOnScrollOrResize = () => setShowMenu(null);
    window.addEventListener('scroll', closeOnScrollOrResize, true);
    window.addEventListener('resize', closeOnScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeOnScrollOrResize, true);
      window.removeEventListener('resize', closeOnScrollOrResize);
    };
  }, [showMenu]);

  // Sort function
  const sortItems = (list, field, direction) => {
    return [...list].sort((a, b) => {
      let aValue, bValue;
      
      switch (field) {
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'doc_type':
          aValue = (a.doc_type || '').toLowerCase();
          bValue = (b.doc_type || '').toLowerCase();
          break;
        case 'action_required':
          aValue = Array.isArray(a.action_required) 
            ? a.action_required.map(ar => ar.name || ar).join(', ').toLowerCase()
            : (a.action_required_name || '').toLowerCase();
          bValue = Array.isArray(b.action_required) 
            ? b.action_required.map(ar => ar.name || ar).join(', ').toLowerCase()
            : (b.action_required_name || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.action_status || '').toLowerCase();
          bValue = (b.action_status || '').toLowerCase();
          break;
        case 'created_by_name':
          aValue = (a.created_by_name || '').toLowerCase();
          bValue = (b.created_by_name || '').toLowerCase();
          break;
        case 'date_received':
          aValue = new Date(a.date_received || a.created_at || 0);
          bValue = new Date(b.date_received || b.created_at || 0);
          break;
        case 'completed_at':
          aValue = new Date(a.completed_at || 0);
          bValue = new Date(b.completed_at || 0);
          break;
        case 'reply_title':
          aValue = (a.reply_title || '').toLowerCase();
          bValue = (b.reply_title || '').toLowerCase();
          break;
        case 'completed_by_name':
          aValue = (a.completed_by_name || a.reply_created_by_name || '').toLowerCase();
          bValue = (b.completed_by_name || b.reply_created_by_name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const items = useMemo(() => {
    let list = [];
    
    if (viewMode === 'answered') {
      // For answered view, use answeredDocs if available, otherwise filter documents
      list = answeredDocs.length > 0 ? answeredDocs : documents.filter(doc => 
        doc.status?.toLowerCase() === 'completed' || 
        doc.action_status?.toLowerCase() === 'completed'
      );
    } else {
      // For pending view, prioritize requestDocs, then filter documents
      list = requestDocs.length > 0 ? requestDocs : documents.filter(doc => 
        isActionRequiredDoc(doc) || 
        doc.status?.toLowerCase() === 'pending' ||
        (doc.action_required && doc.action_required.length > 0) ||
        (doc.action_required_ids && doc.action_required_ids.length > 0)
      );
    }
    
    // Apply search filter if search term exists
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => {
        // Check if the document is a request document (has action required)
        const isRequestDoc = isActionRequiredDoc(d);
        const isPending = d.status?.toLowerCase() === 'pending' || !d.status;
        
        // For pending requests, include more fields in search
        if (viewMode === 'pending' && isRequestDoc && isPending) {
          return (
            (d.title || '').toLowerCase().includes(q) ||
            (d.doc_type || '').toLowerCase().includes(q) ||
            (d.action_required_name || '').toLowerCase().includes(q) ||
            (d.action_required ? 
              (Array.isArray(d.action_required) ? 
                d.action_required.some(ar => 
                  (ar.name || '').toLowerCase().includes(q) ||
                  (ar.id || '').toString().includes(q)
                ) : 
                d.action_required.toString().toLowerCase().includes(q)
              ) : 
              false
            ) ||
            (d.created_by_name || '').toLowerCase().includes(q) ||
            (d.description || '').toLowerCase().includes(q)
          );
        }
        
        // For answered requests or non-request documents
        return (
          (d.title || '').toLowerCase().includes(q) ||
          (d.doc_type || '').toLowerCase().includes(q) ||
          (d.action_required_name || '').toLowerCase().includes(q) ||
          (d.reply_title || '').toLowerCase().includes(q) ||
          (d.reply_description || '').toLowerCase().includes(q) ||
          (d.action_status || '').toLowerCase().includes(q) ||
          (d.completed_by_name || '').toLowerCase().includes(q) ||
          (d.created_by_name || '').toLowerCase().includes(q) ||
          (d.description || '').toLowerCase().includes(q)
        );
      });
    }
    
    // Apply sorting
    return sortItems(list, sortField, sortDirection);
  }, [requestDocs, documents, search, viewMode, answeredDocs, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isAnySelected = selectedIds.length > 0;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(d => d.id || d.doc_id));
    }
  };
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkDelete = async () => {
    if (!isAnySelected) return;
    const confirmDelete = window.confirm(`Delete ${selectedIds.length} selected document(s)?`);
    if (!confirmDelete) return;
    try {
      for (const id of selectedIds) {
        await fetch(buildUrl(`documents/${id}`), { method: 'DELETE', credentials: 'include' });
      }
      // Remove from local lists
      setSelectedIds([]);
      // If we have locally loaded requestDocs/answeredDocs, filter them
      setRequestDocs(prev => prev.filter(d => !selectedIds.includes(d.id || d.doc_id)));
      setAnsweredDocs(prev => prev.filter(d => !selectedIds.includes(d.id || d.doc_id)));
      // Refresh
      refreshDocuments();
      if (viewMode === 'answered') fetchAnsweredDocuments();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const getSortIcon = (key) => {
    if (sortField !== key) {
      return <ArrowDownUp size={14} style={{ marginLeft: 6, color: '#9ca3af' }} />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp size={14} style={{ marginLeft: 6, color: '#374151' }} />
      : <ArrowDown size={14} style={{ marginLeft: 6, color: '#374151' }} />;
  };

  // Visibility display helper for table - removed as unused

  // removed favorite toggle

  const handleMenuToggle = (docId, event) => {
    event.stopPropagation();
    if (showMenu === docId) {
      setShowMenu(null);
      return;
    }
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dropdownWidth = 240;
    const left = Math.max(12, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 12));
    const top = Math.min(rect.bottom + 4, window.innerHeight - 12);
    setMenuPosition({ top, left });
    setShowMenu(docId);
  };

  const handleEdit = (doc) => {
    setSelectedDocument(doc);
    setEditModalOpen(true);
    setShowMenu(null);
  };

  const openProperties = async (doc) => {
    await markSeen(doc);
    setPropertiesDoc(doc);
    setPropertiesOpen(true);
    setShowMenu(null);
  };
  const closeProperties = () => {
    setPropertiesOpen(false);
    setPropertiesDoc(null);
  };

  // Load viewers when properties modal opens
  useEffect(() => {
    const loadViews = async () => {
      if (!propertiesOpen || !propertiesDoc) {
        setRequestViewers([]);
        return;
      }
      const id = propertiesDoc.id || propertiesDoc.doc_id;
      if (!id) return;
      try {
        setRequestViewersLoading(true);
        const res = await fetchWithRetry(buildUrl(`documents/${id}/views`), { credentials: 'include' });
        const data = await res.json();
        setRequestViewers(Array.isArray(data.viewers) ? data.viewers : []);
      } catch (e) {
        console.warn('Failed to load request views', e);
        setRequestViewers([]);
      } finally {
        setRequestViewersLoading(false);
      }
    };
    loadViews();
  }, [propertiesOpen, propertiesDoc]);

  const handleDelete = (doc) => {
    setSelectedDocument(doc);
    setDeleteModalOpen(true);
    setShowMenu(null);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedDocument(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedDocument(null);
  };

  // Helper to format a Date for input[type="datetime-local"] (local timezone)
  const formatDatetimeLocal = (dateObj) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());
    const hh = pad(dateObj.getHours());
    const mm = pad(dateObj.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const createDocumentFromSource = (sourceDoc) => {
    if (onNavigateToUpload) {
      const currentUserName = [
        currentUser?.firstname || currentUser?.first_name,
        currentUser?.lastname || currentUser?.last_name
      ].filter(Boolean).join(' ') || currentUser?.name || currentUser?.full_name || currentUser?.username || '';
      // Determine the best Google Drive link to prefill
      let googleDriveLink = '';
      if (sourceDoc.google_drive_link) {
        googleDriveLink = sourceDoc.google_drive_link;
      } else if (sourceDoc.reply_google_drive_link) {
        googleDriveLink = sourceDoc.reply_google_drive_link;
      } else if (Array.isArray(sourceDoc.replies) && sourceDoc.replies.length > 0) {
        const firstReply = sourceDoc.replies[0];
        if (firstReply?.google_drive_link) {
          googleDriveLink = firstReply.google_drive_link;
        }
      }
      const documentData = {
        title: sourceDoc.title,
        reference: sourceDoc.reference,
        category: sourceDoc.doc_type,
        from: currentUserName || sourceDoc.from_field || sourceDoc.reply_created_by_name || '',
        to: sourceDoc.created_by_name || sourceDoc.to_field || '',
        dateTimeReceived: formatDatetimeLocal(new Date()),
        description: sourceDoc.description || '',
        google_drive_link: googleDriveLink,
        available_copy: sourceDoc.available_copy || 'soft_copy',
        action_required: sourceDoc.action_required,
        reply_title: sourceDoc.reply_title,
        reply_description: sourceDoc.reply_description,
        source_document_id: sourceDoc.id || sourceDoc.doc_id,
        // Flag to indicate this is a request with action required
        isRequest: isActionRequiredDoc(sourceDoc),
        notificationMessage: isActionRequiredDoc(sourceDoc) ? 'Request added' : 'New document added'
      };
      // For Reply page prefill
      sessionStorage.setItem('createReply', JSON.stringify(documentData));
      onNavigateToUpload('reply');
    }
  };

  const uploadDocumentFromSource = (sourceDoc) => {
    if (onNavigateToUpload) {
      // Clear any reply data before navigating to upload
      sessionStorage.removeItem('createReply');
      onNavigateToUpload('upload');
    }
  };

  const roleUpper = (currentUser?.role || '').toString().toUpperCase();
  const canAddDocument = roleUpper === 'ADMIN' || roleUpper === 'DEAN';

  return (
    <div style={{ padding: 24 }}>
      {isMobile ? (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, width: '100%', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>
            {viewMode === 'pending' ? 'Action Required' : 'Request Answered'}
          </h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {/* View toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                className={`btn ${viewMode === 'pending' ? 'btn-primary' : 'btn-light'} border rounded-pill px-3`}
                onClick={() => setViewMode('pending')}
                style={{ 
                  backgroundColor: viewMode === 'pending' ? '#0d6efd' : 'white',
                  color: viewMode === 'pending' ? 'white' : '#6c757d',
                  borderColor: viewMode === 'pending' ? '#0d6efd' : '#dee2e6',
                  width: '100%'
                }}
              >
                Pending
              </button>
              <button
                className={`btn ${viewMode === 'answered' ? 'btn-primary' : 'btn-light'} border rounded-pill px-3`}
                onClick={() => setViewMode('answered')}
                style={{ 
                  backgroundColor: viewMode === 'answered' ? '#0d6efd' : 'white',
                  color: viewMode === 'answered' ? 'white' : '#6c757d',
                  borderColor: viewMode === 'answered' ? '#0d6efd' : '#dee2e6',
                  width: '100%'
                }}
              >
                Answered
              </button>
            </div>

            {/* Search pill with icon */}
            <div style={{ position: 'relative', width: '100%' }}>
              <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={viewMode === 'pending' ? 'Search title, action, status...' : 'Search title, reply, action...'}
                style={{
                  paddingTop: 8,
                  paddingRight: 12,
                  paddingBottom: 8,
                  paddingLeft: 36,
                  borderRadius: 9999,
                  border: '1px solid #d1d5db',
                  width: '100%',
                  background: '#fff'
                }}
              />
            </div>

            {/* Add Document (mobile, only in answered) - only ADMIN/DEAN */}
            {viewMode === 'answered' && canAddDocument && (
              <button
                className="btn btn-primary border rounded-pill px-3"
                onClick={() => onNavigateToUpload && onNavigateToUpload('upload')}
                style={{ width: '100%' }}
                title="Add Document"
              >
                + Add Document
              </button>
            )}

            {/* Removed Refresh and Filters on mobile */}

            {items.length > 0 && (
              <button
                className="btn btn-danger border rounded-pill px-3"
                onClick={bulkDelete}
                disabled={!isAnySelected}
                title={isAnySelected ? `Delete ${selectedIds.length} selected` : 'Select rows to delete'}
                style={{ backgroundColor: isAnySelected ? '#dc2626' : '#f5f5f5', borderColor: isAnySelected ? '#dc2626' : '#e5e7eb', color: isAnySelected ? 'white' : '#9ca3af', width: '100%' }}
              >
                <FiTrash2 size={14} style={{ marginRight: 6 }} /> Delete Selected
              </button>
            )}
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          {viewMode === 'pending' ? 'Action Required' : 'Request Answered'}
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View Mode Toggle Buttons */}
          <div style={{ display: 'flex', gap: 4, marginRight: 16 }}>
            <button
              className={`btn ${viewMode === 'pending' ? 'btn-primary' : 'btn-light'} border rounded-pill px-3`}
              onClick={() => setViewMode('pending')}
              style={{ 
                backgroundColor: viewMode === 'pending' ? '#0d6efd' : 'white',
                color: viewMode === 'pending' ? 'white' : '#6c757d',
                borderColor: viewMode === 'pending' ? '#0d6efd' : '#dee2e6'
              }}
            >
              Pending
            </button>
            <button
              className={`btn ${viewMode === 'answered' ? 'btn-primary' : 'btn-light'} border rounded-pill px-3`}
              onClick={() => setViewMode('answered')}
              style={{ 
                backgroundColor: viewMode === 'answered' ? '#0d6efd' : 'white',
                color: viewMode === 'answered' ? 'white' : '#6c757d',
                borderColor: viewMode === 'answered' ? '#0d6efd' : '#dee2e6'
              }}
            >
              Answered
            </button>
          </div>
          
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === 'pending' ? "Search title, action, status..." : "Search title, reply, action..."}
            style={{ padding: '8px 12px', borderRadius: 20, border: '1px solid #d1d5db', minWidth: 260 }}
          />
          {/* Removed '+ Add Document' button in answered view per request */}
          {/* Removed Refresh on desktop */}

          {items.length > 0 && (
            <button
              className="btn btn-danger border rounded-pill px-3"
              onClick={bulkDelete}
              disabled={!isAnySelected}
              title={isAnySelected ? `Delete ${selectedIds.length} selected` : 'Select rows to delete'}
              style={{ backgroundColor: isAnySelected ? '#dc2626' : '#f5f5f5', borderColor: isAnySelected ? '#dc2626' : '#e5e7eb', color: isAnySelected ? 'white' : '#9ca3af', width: isMobile ? '100%' : 'auto' }}
            >
              <FiTrash2 size={14} style={{ marginRight: 6 }} /> Delete Selected
            </button>
          )}
          
          {/* Removed Add Document header button */}
        </div>
      </div>
      )}

      {(loading || answeredLoading || loadingRequests) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '40px 20px',
          color: '#64748b',
          fontSize: 16
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            Loading requests...
          </div>
        </div>
      )}
      
      {requestError && !loadingRequests && (
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          padding: 16, 
          borderRadius: 12,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {requestError}
          <button
            onClick={fetchRequestDocuments}
            style={{
              marginLeft: 12,
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {error && !loadingRequests && (
        <div style={{ color: '#dc2626', padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!(loading || answeredLoading || loadingRequests) && items.length === 0 && !requestError && (
        <div style={{ 
          color: '#64748b', 
          border: '1px dashed #cbd5e1', 
          padding: 40, 
          borderRadius: 12, 
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {viewMode === 'pending' ? 'No documents requiring action' : 'No answered requests found'}
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            {viewMode === 'pending' 
              ? 'When documents are assigned to you with action requirements, they will appear here.'
              : 'Completed requests will appear here once replies are submitted.'}
          </div>
        </div>
      )}

      {/* Responsive layout: cards on mobile, table on desktop */}
      {items.length > 0 && isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }}>
          {items.map((d) => {
            const u = findUserByName(d.created_by_name);
            const numericId = Number(d.id || d.doc_id);
            const isSelected = selectedIds.includes(d.id || d.doc_id);
            const isSeen = !Number.isNaN(numericId) && seenDocIds.has(numericId);
            const viewers = !Number.isNaN(numericId) && viewersByDocId[numericId] ? viewersByDocId[numericId] : [];

            return (
              <div 
                key={d.id || d.doc_id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  padding: 16,
                  boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => toggleSelectOne(d.id || d.doc_id)}
              >
                {/* Header with checkbox and menu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(d.id || d.doc_id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  
                  <div style={{ position: 'relative' }} data-menu-container onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-light btn-sm border rounded-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(d.id || d.doc_id, e);
                      }}
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <FiMoreVertical size={14} />
                    </button>
                    
                    {showMenu === (d.id || d.doc_id) && (
                      <div style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: 160,
                        padding: '4px 0'
                      }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markSeen(d);
                            window.open(d.google_drive_link, '_blank');
                            setShowMenu(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 14
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <FiEye size={14} /> View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProperties(d);
                            setShowMenu(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 14
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <FiInfo size={14} /> Properties
                        </button>
                        {canAddDocument && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              uploadDocumentFromSource(d);
                              setShowMenu(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 14
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <FiPlus size={14} /> + Add Document
                          </button>
                        )}
                        {viewMode === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createDocumentFromSource(d);
                              setShowMenu(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 14,
                              color: '#059669'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <FiMessageSquare size={14} /> Reply
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar and Creator Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0 }}>
                    {u?.profilePic ? (
                      <img src={u.profilePic} alt={d.created_by_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
                        {(d.created_by_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2 }}>
                      {d.created_by_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(d.date_received || d.created_at).toLocaleDateString()}
                    </div>
                    {viewers && viewers.length > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={`Seen by ${viewers.map(v => v.name || v.full_name || v.username || v.email || `User #${v.user_id}`).join(', ')}`}
                      >
                        {viewers.slice(0, 4).map((v, idx) => (
                          <div
                            key={v.user_id || v.id || idx}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '9999px',
                              backgroundColor: '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#374151',
                              border: '1px solid #fff',
                              marginLeft: idx === 0 ? 0 : -8
                            }}
                          >
                            {((v.name || v.full_name || v.username || v.email || 'U').toString().trim().slice(0, 2)).toUpperCase()}
                          </div>
                        ))}
                        {viewers.length > 4 && (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '9999px',
                              backgroundColor: '#111827',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 9,
                              fontWeight: 600,
                              color: '#f9fafb',
                              border: '1px solid #fff',
                              marginLeft: -8
                            }}
                          >
                            +{viewers.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Title */}
                <div
                  style={{
                    fontWeight: isSeen ? 400 : 700,
                    fontSize: 18,
                    color: '#111827',
                    marginBottom: 12,
                    lineHeight: 1.4
                  }}
                >
                  {d.title || 'Untitled'}
                </div>

                {/* Document Type Badge */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #93c5fd'
                  }}>
                    {d.doc_type || 'Document'}
                  </span>
                </div>

                {/* Action Required / Reply Info */}
                {viewMode === 'pending' ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Action Required:</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                      {Array.isArray(d.action_required) 
                        ? d.action_required.map(ar => ar.name || ar).join(', ')
                        : (d.action_required_name || 'N/A')}
                    </div>
                    {d.action_status && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: d.action_status.toLowerCase() === 'completed' ? '#dcfce7' : d.action_status.toLowerCase() === 'in_progress' ? '#fef3c7' : '#fef2f2',
                          color: d.action_status.toLowerCase() === 'completed' ? '#166534' : d.action_status.toLowerCase() === 'in_progress' ? '#92400e' : '#991b1b',
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 700,
                          border: `1px solid ${d.action_status.toLowerCase() === 'completed' ? '#16a34a' : d.action_status.toLowerCase() === 'in_progress' ? '#d97706' : '#dc2626'}`
                        }}>
                          {d.action_status === 'completed' ? 'Replied' : d.action_status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Reply:</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#059669', marginBottom: 6 }}>
                      {d.reply_title || 'No title'}
                    </div>
                    {d.reply_description && (
                      <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 8 }}>
                        {d.reply_description.substring(0, 100)}{d.reply_description.length > 100 ? '...' : ''}
                      </div>
                    )}
                    {d.completed_at && (
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8, fontWeight: 500 }}>
                        Completed: {new Date(d.completed_at).toLocaleDateString()} by {d.completed_by_name || d.reply_created_by_name || 'Unknown'}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '2px solid #e5e7eb' }}>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await markSeen(d);
                      window.open(d.google_drive_link, '_blank');
                    }}
                    className="btn btn-sm btn-light border"
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8, 
                      fontSize: 14,
                      fontWeight: 600,
                      padding: '10px 16px',
                      backgroundColor: '#f8fafc',
                      borderColor: '#d1d5db',
                      color: '#374151',
                      borderRadius: 8
                    }}
                  >
                    <FiEye size={16} /> View
                  </button>
                  {viewMode === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createDocumentFromSource(d);
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 8, 
                        fontSize: 14,
                        fontWeight: 600,
                        padding: '10px 16px',
                        backgroundColor: '#0d6efd',
                        borderColor: '#0d6efd',
                        color: 'white',
                        borderRadius: 8,
                        boxShadow: '0 2px 4px rgba(13, 110, 253, 0.2)'
                      }}
                    >
                      <FiMessageSquare size={16} /> Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop table layout */}
      {items.length > 0 && !isMobile && (
        <div style={{ width: '100%', overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th 
                  style={{ ...th, width: 44, textAlign: 'center', backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}
                >
                  <button
                    onClick={toggleSelectAll}
                    role="checkbox"
                    aria-checked={isAllSelected}
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isAllSelected ? '#111' : '#cbd5e1'}`, backgroundColor: isAllSelected ? '#111' : '#fff', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ ...sortableTh, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                  <button onClick={() => handleSort('title')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Title {getSortIcon('title')}</button>
                </th>
                <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                  <button onClick={() => handleSort('doc_type')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Type {getSortIcon('doc_type')}</button>
                </th>
                <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                  <button onClick={() => handleSort('created_by_name')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Requested By {getSortIcon('created_by_name')}</button>
                </th>
                {viewMode === 'pending' ? (
                  <>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('action_required')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Action Required {getSortIcon('action_required')}</button>
                    </th>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('status')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Status {getSortIcon('status')}</button>
                    </th>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('date_received')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Date Received {getSortIcon('date_received')}</button>
                    </th>
                  </>
                ) : (
                  <>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('action_required')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Action Required {getSortIcon('action_required')}</button>
                    </th>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('reply_title')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Reply {getSortIcon('reply_title')}</button>
                    </th>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('completed_by_name')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Replied By {getSortIcon('completed_by_name')}</button>
                    </th>
                    <th style={{ ...sortableTh, backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => handleSort('completed_at')} style={{ ...sortableTh, background: 'none', border: 'none', padding: 0 }}>Completed Date {getSortIcon('completed_at')}</button>
                    </th>
                  </>
                )}
                <th style={{ ...th, borderTopRightRadius: 0, borderBottomRightRadius: 0, textAlign: 'right', backgroundColor: 'transparent', borderBottom: '1px solid #f3f4f6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => {
                const numericId = Number(d.id || d.doc_id);
                const isSeen = !Number.isNaN(numericId) && seenDocIds.has(numericId);
                const viewers = !Number.isNaN(numericId) && viewersByDocId[numericId] ? viewersByDocId[numericId] : [];
                return (
                <tr key={d.id || d.doc_id} style={{ 
                  transition: 'all 0.2s ease', 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', 
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <td style={{ ...td, width: 44, textAlign: 'center', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: 'none', backgroundColor: '#fff' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelectOne(d.id || d.doc_id); }}
                      role="checkbox"
                      aria-checked={selectedIds.includes(d.id || d.doc_id)}
                      title={selectedIds.includes(d.id || d.doc_id) ? 'Unselect' : 'Select'}
                      style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedIds.includes(d.id || d.doc_id) ? '#111' : '#cbd5e1'}`, backgroundColor: selectedIds.includes(d.id || d.doc_id) ? '#111' : '#fff', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ ...tdPrimary, border: 'none', backgroundColor: '#fff', paddingRight: 8 }}>
                    <div style={{ fontWeight: isSeen ? 400 : 700 }}>{d.title}</div>
                  </td>
                  <td style={{ ...td, border: 'none', backgroundColor: '#fff', paddingLeft: 8 }}>{d.doc_type || '—'}</td>
                  <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>
                    {(() => {
                      const u2 = findUserByName(d.created_by_name);
                      const avatarSize = 24;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0 }}>
                            {u2?.profilePic ? (
                              <img src={u2.profilePic} alt={d.created_by_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                                {(d.created_by_name || 'U').toString().trim().slice(0,1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>{d.created_by_name || '—'}</span>
                            {viewers && viewers.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title={`Seen by ${viewers.map(v => v.name || v.full_name || v.username || v.email || `User #${v.user_id}`).join(', ')}`}
                              >
                                {viewers.slice(0, 4).map((v, idx) => (
                                  <div
                                    key={v.user_id || v.id || idx}
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '9999px',
                                      backgroundColor: '#e5e7eb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 9,
                                      fontWeight: 600,
                                      color: '#374151',
                                      border: '1px solid #fff',
                                      marginLeft: idx === 0 ? 0 : -6
                                    }}
                                  >
                                    {((v.name || v.full_name || v.username || v.email || 'U').toString().trim().slice(0, 2)).toUpperCase()}
                                  </div>
                                ))}
                                {viewers.length > 4 && (
                                  <div
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '9999px',
                                      backgroundColor: '#111827',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 8,
                                      fontWeight: 600,
                                      color: '#f9fafb',
                                      border: '1px solid #fff',
                                      marginLeft: -6
                                    }}
                                  >
                                    +{viewers.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>
                    {Array.isArray(d.action_required)
                      ? d.action_required.map((a, idx) => (
                          <span key={idx} style={chip}>{(a.name || a)}</span>
                        ))
                      : (d.action_required_name 
                          ? <span style={chip}>{d.action_required_name}</span> 
                          : (Array.isArray(d.actions) 
                              ? d.actions.map((n, i) => <span key={i} style={chip}>{n}</span>) 
                              : (Array.isArray(d.actionRequiredNames) 
                                  ? d.actionRequiredNames.map((n, i) => <span key={i} style={chip}>{n}</span>) 
                                  : '—')))}
                  </td>
                  {viewMode === 'pending' ? (
                    <>
                      <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>
                        {d.action_status === 'completed' ? (
                          <span style={{ 
                            ...chip, 
                            backgroundColor: '#dcfce7', 
                            borderColor: '#16a34a', 
                            color: '#166534',
                            fontWeight: 700,
                            fontSize: 14
                          }}>
                            ✓ Replied
                          </span>
                        ) : d.action_status === 'in_progress' ? (
                          <span style={{ 
                            ...chip, 
                            backgroundColor: '#fef3c7', 
                            borderColor: '#d97706', 
                            color: '#92400e',
                            fontWeight: 700,
                            fontSize: 14
                          }}>
                            In Progress
                          </span>
                        ) : (
                          <span style={{ 
                            ...chip, 
                            backgroundColor: '#fef2f2', 
                            borderColor: '#dc2626', 
                            color: '#991b1b',
                            fontWeight: 700,
                            fontSize: 14
                          }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>{d.date_received ? new Date(d.date_received).toLocaleString() : '—'}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>
                        {d.reply_title ? (
                          <div>
                            <div style={{ fontWeight: 500, color: '#059669' }}>{d.reply_title}</div>
                            {d.reply_description && (
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {d.reply_description.length > 50 
                                  ? `${d.reply_description.substring(0, 50)}...` 
                                  : d.reply_description}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>
                        {d.completed_by_name || d.reply_created_by_name || '—'}
                      </td>
                      <td style={{ ...td, border: 'none', backgroundColor: '#fff' }}>{d.completed_at ? new Date(d.completed_at).toLocaleString() : '—'}</td>
                    </>
                  )}
                  
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', position: 'relative', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: 'none', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      {viewMode === 'pending' ? (
                        d.action_status === 'completed' ? (
                            <button
                              title="View Reply"
                              className="btn btn-success border rounded-pill px-3"
                              style={{ 
                                backgroundColor: '#059669', 
                                borderColor: '#059669', 
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 14,
                                padding: '8px 12px',
                                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                              }}
                              onClick={() => d.reply_google_drive_link && window.open(d.reply_google_drive_link, '_blank', 'noopener')}
                              disabled={!d.reply_google_drive_link}
                            >
                              <FiEye size={16} />
                            </button>
                        ) : (
                          <button
                            title="Upload Reply"
                            className="btn btn-primary border rounded-pill px-3"
                            style={{ 
                              backgroundColor: '#0d6efd', 
                              borderColor: '#0d6efd', 
                              color: 'white',
                              fontWeight: 600,
                              fontSize: 14,
                              padding: '8px 12px',
                              boxShadow: '0 2px 4px rgba(13, 110, 253, 0.2)'
                            }}
                            onClick={() => createDocumentFromSource(d)}
                          >
                            <FiUpload size={16} />
                          </button>
                        )
                      ) : (
                          <button
                            title="View Reply"
                            className="btn btn-success border rounded-pill px-3"
                            style={{ 
                              backgroundColor: '#059669', 
                              borderColor: '#059669', 
                              color: 'white',
                              fontWeight: 600,
                              fontSize: 14,
                              padding: '8px 12px',
                              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                            }}
                            onClick={() => d.reply_google_drive_link && window.open(d.reply_google_drive_link, '_blank', 'noopener')}
                            disabled={!d.reply_google_drive_link}
                          >
                            <FiEye size={16} />
                          </button>
                      )}

                      <button
                        title="Open Original"
                        className="btn btn-light border rounded-pill px-3"
                        style={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#d1d5db',
                          color: '#374151',
                          fontWeight: 600,
                          fontSize: 14,
                          padding: '8px 12px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                        onClick={async () => {
                          await markSeen(d);
                          if (d.google_drive_link) {
                            window.open(d.google_drive_link, '_blank', 'noopener');
                          }
                        }}
                        disabled={!d.google_drive_link}
                      >
                        <FiExternalLink size={16} />
                      </button>

                      <div style={{ position: 'relative' }} data-menu-container>
                        <button
                          className="btn btn-light btn-sm border rounded-circle" 
                          onClick={(e) => handleMenuToggle(d.id || d.doc_id, e)}
                          title="More actions"
                          style={{ 
                            width: 32, 
                            height: 32, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: showMenu === (d.id || d.doc_id) ? '#e2e8f0' : 'white',
                            borderColor: showMenu === (d.id || d.doc_id) ? '#cbd5e1' : '#d1d5db'
                          }}
                        >
                          <FiMoreVertical size={14} />
                        </button>
                        {showMenu === (d.id || d.doc_id) && (
                          <div style={{
                            position: 'fixed',
                            top: menuPosition.top,
                            left: menuPosition.left,
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '6px',
                            zIndex: 2000,
                            minWidth: '220px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
                          }}>
                            <ul style={menuListStyle}>
                              <li style={menuItemStyle} onClick={() => uploadDocumentFromSource(d)}>
                                <span style={menuIconStyle}><FiPlus /></span>
                                <span style={menuLabelStyle}>+ Add Document</span>
                              </li>
                              <li style={menuItemStyle} onClick={() => createDocumentFromSource(d)}>
                                <span style={menuIconStyle}><FiUpload /></span>
                                <span style={menuLabelStyle}>Upload Reply</span>
                              </li>
                              <li style={menuItemStyle} onClick={() => d.google_drive_link && window.open(d.google_drive_link, '_blank', 'noopener')}>
                                <span style={menuIconStyle}><FiExternalLink /></span>
                                <span style={menuLabelStyle}>Open Original</span>
                              </li>
                              <li style={menuDividerStyle} />
                              <li style={menuItemStyle} onClick={() => openProperties(d)}>
                                <span style={menuIconStyle}><FiInfo /></span>
                                <span style={menuLabelStyle}>Properties</span>
                              </li>
                              <li style={menuDividerStyle} />
                              <li style={menuItemStyle} onClick={() => handleEdit(d)}>
                                <span style={menuIconStyle}><FiEdit3 /></span>
                                <span style={menuLabelStyle}>Edit</span>
                              </li>
                              <li style={{...menuItemStyle, color: '#dc2626'}} onClick={() => handleDelete(d)}>
                                <span style={{...menuIconStyle, color: '#dc2626'}}><FiTrash2 /></span>
                                <span style={menuLabelStyle}>Move to Trash</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal removed: routing to Reply.jsx for consistency */}

      {/* Edit Modal */}
      {editModalOpen && selectedDocument && (
        <EditModal 
          document={selectedDocument} 
          onClose={closeEditModal}
          onSuccess={() => {
            closeEditModal();
            refreshDocuments();
            if (viewMode === 'answered') {
              fetchAnsweredDocuments();
            }
          }}
        />
      )}

      {/* Properties Modal */}
      {propertiesOpen && propertiesDoc && (
        <div style={modalOverlay} onClick={closeProperties}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHeader, background: '#f8fafc' }}>
              <h3 style={{ ...modalTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiInfo /> Document Details
              </h3>
              <button style={modalCloseBtn} onClick={closeProperties}>×</button>
            </div>
            <div style={modalBody}>
              <div style={{ marginBottom: '16px', color: '#6b7280', fontSize: 14 }}>
                Overview of this document’s metadata
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {Object.entries(propertiesDoc)
                  .filter(([key]) => !['created_by_profile_pic','department_ids'].includes(key))
                  .map(([key, value]) => (
                  <div key={key} style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '14px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                      {key.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827', wordBreak: 'break-word' }}>
                      {(() => {
                        if (value === null || value === undefined) return '-';
                        if (typeof value === 'string') {
                          // format ISO dates nicely when detected
                          if (value.includes('T') || /\d{4}-\d{2}-\d{2}/.test(value)) {
                            const d = new Date(value);
                            if (!isNaN(d.getTime())) return d.toLocaleString();
                          }
                          return value;
                        }
                        if (value instanceof Date) return value.toLocaleString();
                        if (typeof value === 'object') return JSON.stringify(value);
                        return String(value);
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Seen by</div>
                {requestViewersLoading ? (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Loading viewers...</div>
                ) : requestViewers.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>No views yet</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {requestViewers.map((v) => (
                      <li key={v.user_id}>
                        {v.name || `User #${v.user_id}`}
                        {v.role ? ` • ${v.role}` : ''}
                        {v.viewed_at ? ` • ${new Date(v.viewed_at).toLocaleString()}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button onClick={closeProperties} style={cancelBtn}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedDocument && (
        <DeleteModal 
          document={selectedDocument} 
          onClose={closeDeleteModal}
          onSuccess={(deletedId) => {
            closeDeleteModal();
            setRequestDocs(prev => prev.filter(d => (d.id || d.doc_id) !== deletedId));
            setAnsweredDocs(prev => prev.filter(d => (d.id || d.doc_id) !== deletedId));
            refreshDocuments();
            if (viewMode === 'answered') {
              fetchAnsweredDocuments();
            }
          }}
        />
      )}
    </div>
  );
};

const th = { 
  textAlign: 'left', 
  padding: '20px 16px', 
  fontSize: 15, 
  fontWeight: 700,
  color: '#1f2937', 
  borderBottom: '2px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  letterSpacing: '0.025em'
};
const sortableTh = { 
  ...th, 
  cursor: 'pointer', 
  userSelect: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#111827'
  }
};
const td = { 
  padding: '20px 16px', 
  fontSize: 15, 
  color: '#1f2937', 
  border: 'none',
  verticalAlign: 'top',
  backgroundColor: '#fff',
  fontWeight: 500
};
const tdPrimary = { 
  ...td, 
  width: '220px',
  fontWeight: 600,
  paddingRight: '12px',
  color: '#111827'
};
const chip = { 
  display: 'inline-block', 
  padding: '8px 14px', 
  border: '1px solid #d1d5db', 
  borderRadius: 20, 
  marginRight: 6, 
  marginBottom: 6, 
  fontSize: 13, 
  fontWeight: 600,
  color: '#1f2937', 
  background: '#f3f4f6',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
};

// Reply Modal Component
const ReplyModal = ({ document, onClose, onSuccess }) => {
  const [replyTitle, setReplyTitle] = useState('');
  const [replyDescription, setReplyDescription] = useState('');
  const [replyLink, setReplyLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyTitle.trim()) {
      setError('Title is required');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Find the document type id for "Reply" to satisfy FK constraint
      let replyTypeId = null;
      try {
        const typesRes = await fetch(buildUrl('document-types'), {
          method: 'GET',
          credentials: 'include'
        });
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          const list = Array.isArray(typesData)
            ? typesData
            : Array.isArray(typesData.documentTypes)
              ? typesData.documentTypes
              : [];
          const byName = list.find(t =>
            (t.name || t.type_name || '').toString().toLowerCase() === 'reply'
          );
          if (byName) {
            replyTypeId = byName.type_id ?? byName.id ?? byName.typeId ?? null;
          }
          if (!replyTypeId && list.length > 0) {
            // fallback: choose first as last resort
            const f = list[0];
            replyTypeId = f.type_id ?? f.id ?? f.typeId ?? null;
          }
        }
      } catch (typeError) {
        // ignore; backend may default
        console.error('Error fetching document types:', typeError);
      }

      const response = await fetch(buildUrl('documents/reply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          original_doc_id: document.id || document.doc_id,
          title: replyTitle,
          description: replyDescription,
          google_drive_link: replyLink,
          ...(replyTypeId ? { doc_type: replyTypeId, type_id: replyTypeId, doc_type_id: replyTypeId } : {})
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Reply uploaded successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.message || 'Failed to upload reply');
      }
    } catch (err) {
      console.error('Error uploading reply:', err);
      setError('Failed to upload reply. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Reply to: {document.title}</h3>
          <button style={modalCloseBtn} onClick={onClose}>×</button>
        </div>
        
        <div style={modalBody}>
          <div style={modalInfo}>
            <strong>Action Required:</strong> {Array.isArray(document.action_required) 
              ? document.action_required.map(a => a.name || a).join(', ')
              : document.action_required_name || 'N/A'}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={formGroup}>
              <label style={formLabel}>Response Title *</label>
              <input
                type="text"
                value={replyTitle}
                onChange={(e) => setReplyTitle(e.target.value)}
                placeholder="e.g., Response to Memo #123"
                style={formInput}
                required
              />
            </div>
            
            <div style={formGroup}>
              <label style={formLabel}>Description</label>
              <textarea
                value={replyDescription}
                onChange={(e) => setReplyDescription(e.target.value)}
                placeholder="Brief description of your response..."
                style={formTextarea}
                rows={3}
              />
            </div>
            
            <div style={formGroup}>
              <label style={formLabel}>Google Drive Link (Optional)</label>
              <input
                type="url"
                value={replyLink}
                onChange={(e) => setReplyLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                style={formInput}
              />
            </div>
            
            {error && <div style={errorMsg}>{error}</div>}
            {success && <div style={successMsg}>{success}</div>}
            
            <div style={modalActions}>
              <button type="button" style={cancelBtn} onClick={onClose} disabled={uploading}>
                Cancel
              </button>
              <button type="submit" style={submitBtn} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal Styles
const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: 'white',
  borderRadius: 12,
  width: '90%',
  maxWidth: 600,
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
};

const modalTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#111',
};

const modalCloseBtn = {
  background: 'none',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
  color: '#6b7280',
  padding: 0,
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalBody = {
  padding: '24px',
};

const modalInfo = {
  backgroundColor: '#f8fafc',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14,
  color: '#374151',
};

const formGroup = {
  marginBottom: 20,
};

const formLabel = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
};

const formInput = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const formTextarea = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  resize: 'vertical',
  minHeight: 80,
  boxSizing: 'border-box',
};

const modalActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 24,
};

const cancelBtn = {
  padding: '10px 20px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  backgroundColor: 'white',
  color: '#374151',
  fontSize: 14,
  cursor: 'pointer',
};

const submitBtn = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 6,
  backgroundColor: '#0d6efd',
  color: 'white',
  fontSize: 14,
  cursor: 'pointer',
};

const errorMsg = {
  color: '#dc2626',
  fontSize: 14,
  marginTop: 8,
};

const successMsg = {
  color: '#059669',
  fontSize: 14,
  marginTop: 8,
};

// Dropdown menu styles removed - unused

const menuListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column'
};

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  color: '#111827',
  cursor: 'pointer',
  transition: 'background 0.15s',
  whiteSpace: 'nowrap'
};

const menuIconStyle = {
  width: '16px',
  height: '16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280'
};

const menuLabelStyle = {
  flex: 1,
  fontSize: '13px',
  color: '#111827'
};

const menuDividerStyle = {
  height: '1px',
  background: '#e5e7eb',
  margin: '4px 6px'
};

// Edit Modal Component
const EditModal = ({ document, onClose, onSuccess }) => {
  const [editData, setEditData] = useState({
    title: document.title || '',
    doc_type: document.doc_type || '',
    description: document.description || '',
    google_drive_link: document.google_drive_link || '',
    visible_to_all: typeof document.visible_to_all === 'boolean' ? document.visible_to_all : true,
  });
  const basicDocTypes = ['MEMO','LETTER','REPORT','REQUEST','NOTICE','OTHER'];

  // Visibility (match Upload.jsx approach)
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState(() => {
    if (editData.visible_to_all) return 'all';
    if (Array.isArray(document.department_ids) && document.department_ids.length > 0) return 'specific';
    if (Array.isArray(document.targetUsers) && document.targetUsers.length > 0) return 'users';
    if (Array.isArray(document.targetRoles) && document.targetRoles.length > 0) return 'roles';
    if (document.targetRoleDept) return 'role_dept';
    return 'all';
  });
  const [selectedVisibility, setSelectedVisibility] = useState(() => (document.department_ids || []).map(Number));
  const [selectedUsers, setSelectedUsers] = useState(() => (document.targetUsers || []).map(Number));
  const [selectedRoles, setSelectedRoles] = useState(() => (document.targetRoles || []));
  const [selectedRoleDept, setSelectedRoleDept] = useState(() => (document.targetRoleDept || { role: '', department: '' }));

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const res = await fetch(buildUrl('departments'), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.departments || []);
          const norm = list.map(d => ({
            id: (d.department_id ?? d.id) ?? d.value,
            name: (d.name ?? d.department_name) ?? d.label,
            code: ((d.code ?? d.department_code ?? d.abbr) || '').toString().toUpperCase()
          })).filter(d => d.id && (d.name || d.code));
          setDepartments(norm);
        }
      } finally {
        setDepartmentsLoading(false);
      }
    };
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await fetch(buildUrl('users'), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.users || []);
          const norm = list.map(u => ({
            id: u.user_id ?? u.id,
            name: `${u.firstname ?? u.first_name ?? ''} ${u.lastname ?? u.last_name ?? ''}`.trim(),
            role: u.role ?? u.user_role,
            department_id: u.department_id ?? u.dept_id
          })).filter(u => u.id && u.name);
          setUsers(norm);
        }
      } finally {
        setUsersLoading(false);
      }
    };
    fetchDepartments();
    fetchUsers();
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editData.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(buildUrl(`documents/${document.id || document.doc_id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editData.title,
          doc_type: editData.doc_type,
          description: editData.description,
          google_drive_link: editData.google_drive_link,
          visible_to_all: visibilityMode === 'all',
          ...(visibilityMode === 'specific' && { department_ids: selectedVisibility }),
          ...(visibilityMode === 'users' && { targetUsers: selectedUsers }),
          ...(visibilityMode === 'roles' && { targetRoles: selectedRoles }),
          ...(visibilityMode === 'role_dept' && { targetRoleDept: selectedRoleDept }),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Document updated successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.message || 'Failed to update document');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Edit Document: {document.title}</h3>
          <button style={modalCloseBtn} onClick={onClose}>×</button>
        </div>
        
        <div style={modalBody}>
          <form onSubmit={handleSubmit}>
            <div style={formGroup}>
              <label style={formLabel}>Title *</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Document title"
                style={formInput}
                required
              />
            </div>
            
            <div style={formGroup}>
              <label style={formLabel}>Document Type</label>
              <select
                value={editData.doc_type}
                onChange={(e) => setEditData(prev => ({ ...prev, doc_type: e.target.value }))}
                style={{ ...formInput, padding: '10px 12px', borderRadius: 6 }}
              >
                <option value="">Select type...</option>
                {basicDocTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div style={formGroup}>
              <label style={formLabel}>Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Document description..."
                style={formTextarea}
                rows={3}
              />
            </div>
            
            <div style={formGroup}>
              <label style={formLabel}>Google Drive Link</label>
              <input
                type="url"
                value={editData.google_drive_link}
                onChange={(e) => setEditData(prev => ({ ...prev, google_drive_link: e.target.value }))}
                placeholder="https://drive.google.com/file/d/..."
                style={formInput}
              />
            </div>

            <div style={formGroup}>
              <label style={formLabel}>Visibility</label>
              <div>
                <select
                  value={visibilityMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setVisibilityMode(mode);
                    setEditData(prev => ({ ...prev, visible_to_all: mode === 'all' }));
                    if (mode !== 'specific') setSelectedVisibility([]);
                    if (mode !== 'users') setSelectedUsers([]);
                    if (mode !== 'roles') setSelectedRoles([]);
                    if (mode !== 'role_dept') setSelectedRoleDept({ role: '', department: '' });
                  }}
                  style={{ ...formInput, padding: '10px 12px', borderRadius: 6 }}
                >
                  <option value="all">All Departments</option>
                  <option value="specific">Specific Departments</option>
                  <option value="users">Specific Users</option>
                  <option value="roles">Specific Roles</option>
                  <option value="role_dept">Role + Department</option>
                </select>
              </div>
              {visibilityMode === 'specific' && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {departmentsLoading ? 'Loading departments...' : departments.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        const id = Number(d.id);
                        setSelectedVisibility(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                      }}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: 999,
                        padding: '6px 12px',
                        background: selectedVisibility.includes(Number(d.id)) ? '#111' : '#fff',
                        color: selectedVisibility.includes(Number(d.id)) ? '#fff' : '#374151',
                        cursor: 'pointer'
                      }}
                    >{d.code || d.name}</button>
                  ))}
                </div>
              )}
              {visibilityMode === 'users' && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {usersLoading ? 'Loading users...' : users.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        const id = Number(u.id);
                        setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                      }}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: 999,
                        padding: '6px 12px',
                        background: selectedUsers.includes(Number(u.id)) ? '#111' : '#fff',
                        color: selectedUsers.includes(Number(u.id)) ? '#fff' : '#374151',
                        cursor: 'pointer'
                      }}
                    >{u.name} ({u.role})</button>
                  ))}
                </div>
              )}
              {visibilityMode === 'roles' && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['ADMIN','DEAN','FACULTY'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
                      }}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: 999,
                        padding: '6px 12px',
                        background: selectedRoles.includes(r) ? '#111' : '#fff',
                        color: selectedRoles.includes(r) ? '#fff' : '#374151',
                        cursor: 'pointer'
                      }}
                    >{r}</button>
                  ))}
                </div>
              )}
              {visibilityMode === 'role_dept' && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select
                    value={selectedRoleDept.role}
                    onChange={(e) => setSelectedRoleDept(prev => ({ ...prev, role: e.target.value }))}
                    style={{ ...formInput, padding: '10px 12px', borderRadius: 6 }}
                  >
                    <option value="">Select role...</option>
                    {['ADMIN','DEAN','FACULTY'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select
                    value={selectedRoleDept.department}
                    onChange={(e) => setSelectedRoleDept(prev => ({ ...prev, department: e.target.value }))}
                    style={{ ...formInput, padding: '10px 12px', borderRadius: 6 }}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {error && <div style={errorMsg}>{error}</div>}
            {success && <div style={successMsg}>{success}</div>}
            
            <div style={modalActions}>
              <button type="button" style={cancelBtn} onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" style={submitBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Modal Component
const DeleteModal = ({ document, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(buildUrl(`documents/${document.id || document.doc_id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        onSuccess(document.id || document.doc_id);
      } else {
        setError(data.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ ...modalHeader, background: '#fef2f2' }}>
          <h3 style={{ ...modalTitle, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertTriangle /> Move Document to Trash
          </h3>
          <button style={modalCloseBtn} onClick={onClose}>×</button>
        </div>
        
        <div style={modalBody}>
          <div style={modalInfo}>
            <strong>Warning:</strong> This action can be undone later from Trash.
          </div>
          
          <div style={formGroup}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#f9fafb',
              padding: 16,
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              rowGap: 10
            }}>
              <div style={{ fontWeight: 600, color: '#374151' }}>Document Title:</div>
              <div style={{ color: '#111827' }}>{document.title || '—'}</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>Reference:</div>
              <div style={{ color: '#111827' }}>{document.reference || '—'}</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>Created By:</div>
              <div style={{ color: '#111827' }}>{document.created_by_name || '—'}</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>Date Created:</div>
              <div style={{ color: '#111827' }}>{document.created_at ? new Date(document.created_at).toLocaleDateString() : '—'}</div>
          </div>
          </div>
          
          {error && <div style={errorMsg}>{error}</div>}
          
          <div style={modalActions}>
            <button type="button" style={cancelBtn} onClick={onClose} disabled={deleting}>
              Cancel
            </button>
            <button 
              type="button" 
              style={{
                ...submitBtn,
                backgroundColor: '#dc2626',
                borderColor: '#dc2626'
              }} 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Working...' : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiTrash2 /> Move to Trash</span>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Request;


