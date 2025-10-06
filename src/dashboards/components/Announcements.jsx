import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext.jsx';
import socket from '../../lib/realtime/socket.js';
import { fetchDepartments, getFallbackDepartments } from '../../lib/api/frontend/departments.api.js';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';
import Select from 'react-select';

const Announcements = ({ role, setActiveTab }) => {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [showForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user: currentUser } = useUser();
  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [deptInput, setDeptInput] = useState(''); // comma-separated department IDs
  const [selectedRoles, setSelectedRoles] = useState([]); // ['ADMIN','DEAN','FACULTY']
  const [creating, setCreating] = useState(false);
  const [deptOptions, setDeptOptions] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // responsive helper like other tabs
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Subscribe socket to user/dept/role rooms so realtime events arrive
  useEffect(() => {
    if (!currentUser) return;
    const payload = {
      userId: currentUser.user_id || currentUser.id,
      departmentId: currentUser.department_id ?? currentUser.department ?? null,
      role: currentUser.role || null,
    };
    try { socket.emit('subscribe', payload); } catch {}
    const onConnect = () => {
      try { socket.emit('subscribe', payload); } catch {}
    };
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [currentUser]);

  // react-select flat theme styles
  const selectStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderRadius: 8,
      borderColor: state.isFocused ? '#111827' : '#e5e7eb',
      boxShadow: 'none',
      '&:hover': { borderColor: '#111827' },
    }),
    valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: 999,
    }),
    multiValueLabel: (base) => ({ ...base, color: '#334155', padding: '2px 6px' }),
    multiValueRemove: (base) => ({
      ...base,
      borderTopRightRadius: 999,
      borderBottomRightRadius: 999,
      ':hover': { backgroundColor: '#ef4444', color: 'white' },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#111827' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      ':active': { backgroundColor: state.isSelected ? '#111827' : '#e5e7eb' },
    }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 8, overflow: 'hidden' }),
    indicatorsContainer: (base) => ({ ...base, color: '#6b7280' }),
    placeholder: (base) => ({ ...base, color: '#9ca3af' }),
  }), []);

  const parseDeptIds = (text) => {
    return String(text || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => Number(n))
      .filter(n => !Number.isNaN(n));
  };

  const userDisplayName = useMemo(() => {
    const u = currentUser || {};
    return (
      u.Username ||
      u.username ||
      (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : null) ||
      u.name ||
      ''
    );
  }, [currentUser]);

  const roleLower = (currentUser?.role || '').toString().toLowerCase();
  const isDean = roleLower === 'dean';
  const isFaculty = roleLower === 'faculty';
  const isAdmin = roleLower === 'admin';

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) {
      setError('Title and message are required');
      return;
    }
    
    // Validate DEAN has department
    if (isDean) {
      const deanDept = currentUser?.department_id ?? currentUser?.department ?? null;
      if (!deanDept) {
        setError('Your account is missing a department assignment. Please contact an administrator.');
        return;
      }
    }
    // If NOT public, require at least one target department (Dean auto-scoped)
    if (!formIsPublic && !isDean) {
      const entered = parseDeptIds(deptInput);
      const targets = (selectedDeptIds && selectedDeptIds.length ? selectedDeptIds : entered);
      if (!targets || targets.length === 0) {
        setError('Please select at least one department for a targeted announcement.');
        return;
      }
    }
    
    setCreating(true);
    try {
      const payload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        visible_to_all: formIsPublic,
        target_departments: formIsPublic ? [] : (selectedDeptIds.length ? selectedDeptIds : parseDeptIds(deptInput)),
        target_roles: [], // Removed target roles
        target_users: [],
      };
      
      // Debug: Log payload for DEAN
      if (isDean) {
        console.log('DEAN Creating Announcement:', payload);
        console.log('Current User:', currentUser);
        console.log('Department ID:', currentUser?.department_id ?? currentUser?.department);
      }
      
      const endpoint = isEditing ? buildUrl(`announcements/${editingId}`) : buildUrl('announcements');
      const data = await fetchJson(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      if (!data || data.success === false) throw new Error(data?.message || 'Failed to create');
      // Optimistic add (socket will also deliver it)
      if (data.announcement) {
        const fallbackCreatorName =
          currentUser?.Username ||
          currentUser?.username ||
          (currentUser?.firstname && currentUser?.lastname ? `${currentUser.firstname} ${currentUser.lastname}` : null) ||
          currentUser?.name ||
          'System';
        const fallbackPic = currentUser?.profile_pic || null;
        const ann = { ...data.announcement };
        if (!ann.created_by) ann.created_by = fallbackCreatorName;
        if (!ann.created_by_profile_pic) ann.created_by_profile_pic = fallbackPic;
        if (isEditing) {
          setAnnouncements(prev => prev.map(a => (
            a.id === ann.id
              ? {
                  ...a,
                  ...ann,
                  created_by: ann.created_by || a.created_by,
                  created_by_profile_pic: ann.created_by_profile_pic || a.created_by_profile_pic,
                }
              : a
          )));
        } else {
          // Prevent duplicates if socket also delivers the new item
          setAnnouncements(prev => (prev.some(p => String(p.id) === String(ann.id)) ? prev : [ann, ...prev]));
          setNewNotice({ title: ann.title });
          setTimeout(() => setNewNotice(null), 4000);
        }
      }
      // Reset form based on role
      setFormTitle('');
      setFormMessage('');
      // Dean: always force targeting (public=false)
      // Admin/Others: default to public
      setFormIsPublic(!isDean);
      setDeptInput('');
      setSelectedDeptIds([]);
      setSelectedRoles([]);
      setIsEditing(false);
      setEditingId(null);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (ann) => {
    setIsEditing(true);
    setEditingId(ann.id);
    setFormTitle(ann.title || '');
    setFormMessage(ann.message || '');
    const visAll = ann.visible_to_all === true || ann.visible_to_all === 1 || (typeof ann.visible_to_all === 'string' && ann.visible_to_all.toLowerCase() === 'true');
    const deptIds = Array.isArray(ann.target_departments) ? ann.target_departments : [];
    
    if (isDean) {
      // Dean: force department targeting
      setFormIsPublic(false);
      const deanDept = currentUser?.department_id ?? currentUser?.department ?? null;
      setSelectedDeptIds(deanDept != null ? [Number(deanDept)] : []);
    } else if (isAdmin) {
      // Admin: can edit all fields freely
      setFormIsPublic(Boolean(visAll));
      setSelectedDeptIds(deptIds.map(Number).filter(n => !Number.isNaN(n)));
    } else {
      // Faculty/Others: use existing values
      setFormIsPublic(Boolean(visAll));
      setSelectedDeptIds(deptIds.map(Number).filter(n => !Number.isNaN(n)));
    }
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const data = await fetchJson(buildUrl(`announcements/${deleteTargetId}`), { method: 'DELETE' });
      if (!data || data.success === false) throw new Error(data?.message || 'Failed to delete');
      setAnnouncements(prev => prev.filter(a => a.id !== deleteTargetId));
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDeleting(false);
    }
  };


  // Visibility helpers similar to documents logic
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson(buildUrl('announcements'));
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : (Array.isArray(data) ? data : []));
      setCurrentSlide(0);
    } catch (e) {
      setError(e.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Visibility helpers similar to documents logic
  const isPublic = (a) => {
    const vals = [
      a?.visible_to_all,
      a?.is_public,
      a?.public,
      a?.visibility_flag,
      a?.visibility,
    ];
    for (const v of vals) {
      if (v === true || v === 1) return true;
      if (typeof v === 'number' && v === 1) return true;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes') return true;
        if (s === 'all' || s === 'public' || s === 'everyone') return true;
      }
    }
    return false;
  };

  const normalizeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    // try JSON
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { /* noop */ }
    return [];
  };

  const extractTargets = (a) => {
    // roles may come as strings or objects
    const roles = normalizeArray(
      a.target_roles || a.roles || a.announcement_roles || a.roles_list
    ).map(r => (typeof r === 'string' ? r : (r?.role || r?.name || r)));

    const departments = normalizeArray(
      a.target_departments || a.departments || a.announcement_departments || a.dept_list
    ).map(d => (d?.department_id ?? d?.id ?? d?.value ?? d));

    const users = normalizeArray(
      a.target_users || a.users || a.announcement_users || a.user_list
    ).map(u => (u?.user_id ?? u?.id ?? u));

    return { roles, departments, users };
  };

  const isPublishedAndActive = (a) => {
    const status = String(a?.status || '').toLowerCase();
    if (status && status !== 'published') return false;
    const now = new Date();
    const publishAt = a?.publish_at ? new Date(a.publish_at) : null;
    const expireAt = a?.expire_at ? new Date(a.expire_at) : null;
    if (publishAt && !isNaN(publishAt) && now < publishAt) return false;
    if (expireAt && !isNaN(expireAt) && now >= expireAt) return false;
    return true;
  };

  const canSeeAnnouncement = (a) => {
    if (!a) return false;
    // Status/time gate first
    if (!isPublishedAndActive(a)) return false;

    // ADMIN can see ALL announcements
    const role = (currentUser?.role || '').toString().toLowerCase();
    if (role === 'admin') return true;

    // Public
    if (isPublic(a)) return true;

    const deptId = currentUser?.department_id ?? currentUser?.department;
    const userId = currentUser?.user_id || currentUser?.id;
    const { roles, departments, users } = extractTargets(a);

    // role-based
    if (role && roles.map(r => String(r).toLowerCase()).includes(role)) return true;

    // department-based (normalize to string compare)
    if (deptId != null) {
      const deptStr = String(deptId);
      if (departments.map(d => String(d)).includes(deptStr)) return true;
    }

    // user-based
    if (userId != null) {
      const uidStr = String(userId);
      if (users.map(u => String(u)).includes(uidStr)) return true;
    }

    return false;
  };

  const visibleAnnouncements = useMemo(
    () => (announcements || []).filter(canSeeAnnouncement),
    [announcements, currentUser]
  );

  // Clamp currentSlide when visible list changes
  useEffect(() => {
    if (currentSlide > 0 && currentSlide >= visibleAnnouncements.length) {
      setCurrentSlide(Math.max(0, visibleAnnouncements.length - 1));
    }
  }, [visibleAnnouncements.length]);

  // Realtime: listen for newly created announcements and prepend if visible
  const [newNotice, setNewNotice] = useState(null);
  useEffect(() => {
    const handler = (item) => {
      // Normalize payload keys to match component expectations
      const normalized = {
        id: item.id,
        title: item.title,
        message: item.message || item.body,
        visible_to_all: item.visible_to_all,
        status: item.status,
        publish_at: item.publish_at,
        expire_at: item.expire_at,
        created_by: item.created_by || item.author,
        created_at: item.created_at || new Date().toISOString(),
        target_departments: item.target_departments || [],
        target_roles: item.target_roles || [],
        target_users: item.target_users || [],
        created_by_profile_pic: item.created_by_profile_pic || item.author_avatar || null,
      };
      if (canSeeAnnouncement(normalized)) {
        // Deduplicate by id
        setAnnouncements(prev => (prev.some(p => String(p.id) === String(normalized.id)) ? prev : [normalized, ...prev]));
        setNewNotice({ title: normalized.title });
        // Auto-hide after 4s
        setTimeout(() => setNewNotice(null), 4000);
      }
    };
    socket.on('announcement:new', handler);
    return () => socket.off('announcement:new', handler);
  }, [currentUser]);

  // Realtime: listen for updates and deletions
  useEffect(() => {
    const onUpdated = (item) => {
      if (!item || item.id == null) return;
      setAnnouncements((prev) => prev.map((a) => (
        a.id === item.id
          ? {
              ...a,
              ...item,
              created_by: item.created_by || a.created_by,
              created_by_profile_pic: item.created_by_profile_pic || a.created_by_profile_pic,
            }
          : a
      )));
    };
    const onDeleted = (id) => {
      if (id == null) return;
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    };

    socket.on('announcement:updated', onUpdated);
    socket.on('announcement:deleted', onDeleted);
    return () => {
      socket.off('announcement:updated', onUpdated);
      socket.off('announcement:deleted', onDeleted);
    };
  }, []);

  useEffect(() => { fetchAnnouncements(); }, []);

  // Load departments for the dropdown
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const departments = await fetchDepartments();
        if (departments && departments.length > 0) {
          // fetchDepartments() already returns normalized { value, label, code }
          setDeptOptions(departments);
        } else {
          // Use fallback departments if API fails
          setDeptOptions(getFallbackDepartments());
        }
      } catch (error) {
        console.error('Error loading departments:', error);
        // Use fallback departments on error
        setDeptOptions(getFallbackDepartments());
      }
    };
    loadDepartments();
  }, []);

  const goToAdminPanel = () => setActiveTab && setActiveTab('admin');

  const timeAgo = (dateValue) => {
    const now = new Date();
    const d = new Date(dateValue || Date.now());
    const seconds = Math.floor((now - d) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  const nextSlide = () => {
    if (visibleAnnouncements.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % visibleAnnouncements.length);
  };

  const prevSlide = () => {
    if (visibleAnnouncements.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  };

  const goToSlide = (index) => {
    if (index >= 0 && index < visibleAnnouncements.length) setCurrentSlide(index);
  };

  return (
    <div style={{ padding: 'clamp(16px,3vw,24px)' }}>
      {/* New announcement banner */}
      {newNotice && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 4000,
            background: '#111827',
            color: 'white',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 360
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>New announcement</div>
            <div style={{ fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{newNotice.title}</div>
          </div>
          <button
            onClick={() => setNewNotice(null)}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: isMobile ? 8 : 12
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'clamp(18px,2.6vw,22px)' }}>Announcements</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isFaculty && (
        <Button
          size="sm"
          variant="outline-dark"
          onClick={() => {
            // Reset form to create mode
            setIsEditing(false);
            setEditingId(null);
            setFormTitle('');
            setFormMessage('');
            setFormIsPublic(!isDean);
            // For DEAN: auto-set their department
            if (isDean) {
              const deanDept = currentUser?.department_id ?? currentUser?.department ?? null;
              setSelectedDeptIds(deanDept != null ? [Number(deanDept)] : []);
            } else {
              setSelectedDeptIds([]);
            }
            setSelectedRoles([]);
            setError('');
            setShowCreateModal(true);
          }}
          style={{
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            alignSelf: isMobile ? 'flex-start' : 'center',
            backgroundColor: 'transparent',
            borderColor: '#111',
            color: '#111',
            flex: isMobile ? 1 : 'none',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          + Add
        </Button>
        )}
        {(() => {
          const currentAnn = visibleAnnouncements[currentSlide];
          if (!currentAnn) return null;
          
          // FACULTY cannot edit or delete announcements
          if (isFaculty) return null;
          
          const author = currentAnn.created_by || currentAnn.author || '';
          const isCreator = String(author).trim().toLowerCase() === String(userDisplayName).trim().toLowerCase();
          const canEdit = isAdmin || (isDean && isCreator);
          const canDelete = isAdmin || (isDean && isCreator);
          
          if (!canEdit && !canDelete) return null;
          return (
            <>
              {canEdit && (
                <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(currentAnn)} style={{ borderRadius: '20px', padding: '6px 12px' }}>Edit</Button>
              )}
              {canDelete && (
                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(currentAnn.id)} style={{ borderRadius: '20px', padding: '6px 12px' }}>Delete</Button>
              )}
            </>
          );
        })()}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            padding: 16
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e5e7eb' }} />
            <div>
              <div style={{ height: 14, width: '40%', borderRadius: 6, background: '#e5e7eb', marginBottom: 8 }} />
              <div style={{ height: 12, width: '60%', borderRadius: 6, background: '#f1f5f9' }} />
            </div>
            <div style={{ height: 22, width: 40, borderRadius: 999, border: '1px solid #e5e7eb', background: '#f9fafb' }} />
          </div>
          <div style={{ height: 1, background: '#e5e7eb', marginBottom: 12 }} />
          <div style={{ height: 18, width: '60%', borderRadius: 6, background: '#e5e7eb', marginBottom: 10 }} />
          <div style={{ height: 12, width: '100%', borderRadius: 6, background: '#f1f5f9', marginBottom: 8 }} />
          <div style={{ height: 12, width: '90%', borderRadius: 6, background: '#f1f5f9', marginBottom: 8 }} />
          <div style={{ height: 12, width: '80%', borderRadius: 6, background: '#f1f5f9' }} />
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {!loading && announcements.length === 0 && (
          <div className="text-muted">No announcements yet.</div>
        )}
        {!loading && announcements.length > 0 && visibleAnnouncements.length === 0 && (
          <div className="text-muted">No visible announcements.</div>
        )}

        {visibleAnnouncements.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              style={{
                position: 'absolute',
                left: isMobile ? 8 : -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: '#f3f4f6',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={nextSlide}
              style={{
                position: 'absolute',
                right: isMobile ? 8 : -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: '#f3f4f6',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              <FiChevronRight />
            </button>
          </>
        )}

        {/* Carousel Content */}
        <div
          style={{
            overflow: 'hidden',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            width: '100%',
            minHeight: 'auto',
            background: '#fff'
          }}
        >
          <div
            style={{
              display: 'flex',
              transition: 'transform 0.3s ease',
              transform: `translateX(-${currentSlide * 100}%)`,
              width: '100%'
            }}
          >
            {visibleAnnouncements.map((a, idx) => {
              const author = a.created_by || a.author || 'Unknown';
              const title = a.title || '';
              const message = a.message || a.content || '';
              const createdAt =
                a.created_at || a.createdAt || a.date_created || Date.now();
              const initials = author
                .toString()
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const avatarUrl = a.author_avatar || a.created_by_profile_pic || '';

              return (
                <div key={idx} style={{ minWidth: '100%', width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'stretch',
                      padding: 'clamp(16px,3vw,24px)',
                      minHeight: 'auto',
                      width: '100%'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        marginBottom: 0
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          padding: '12px 0',
                          boxSizing: 'border-box',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {/* Row 1: header */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '56px 1fr auto',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 12
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              background: '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#374151',
                              fontSize: 18
                            }}
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={author}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#0f172a',
                                fontSize: 16,
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {author}
                            </div>
                          </div>

                          <div
                            style={{
                              justifySelf: 'end',
                              padding: '4px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 999,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            {timeAgo(createdAt)}
                          </div>
                          {/* Per-item action buttons removed; actions are available in the header */}
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: '#e5e7eb', marginBottom: 12 }} />

                        {/* Row 2: title */}
                        {title && (
                          <h2
                            style={{
                              fontSize: 'clamp(16px,2.6vw,18px)',
                              fontWeight: 600,
                              color: '#111827',
                              marginBottom: 8,
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {title}
                          </h2>
                        )}

                        {/* Row 3: content */}
                        {message && (
                          <div
                            style={{
                              color: '#374151',
                              lineHeight: 1.6,
                              fontSize: 14,
                              whiteSpace: 'pre-wrap',
                              marginBottom: 12,
                              maxHeight: 200,
                              overflowY: 'auto'
                            }}
                          >
                            {message}
                          </div>
                        )}

                        {/* Optional tags */}
                        {Array.isArray(a.tags) && a.tags.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 8,
                              marginTop: 4,
                              marginBottom: 8
                            }}
                          >
                            {a.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  padding: '4px 10px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 999,
                                  fontSize: 12,
                                  color: '#334155',
                                  background: '#ffffff'
                                }}
                              >
                                {String(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {visibleAnnouncements.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {visibleAnnouncements.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: currentSlide === i ? '#111' : '#e5e7eb',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>
      <Modal show={showCreateModal} onHide={() => {
        setShowCreateModal(false);
        // Reset form state when closing modal
        setIsEditing(false);
        setEditingId(null);
        setFormTitle('');
        setFormMessage('');
        setFormIsPublic(!isDean);
        setSelectedDeptIds([]);
        setSelectedRoles([]);
        setError('');
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Announcement' : 'Create Announcement'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Form id="createAnnForm" onSubmit={handleCreateSubmit}>
          <Form.Group className="mb-3" controlId="annTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="annMessage">
  <Form.Label>Message</Form.Label>
  <Form.Control
    as="textarea"
    rows={5}
    placeholder="Type the announcement message"
    value={formMessage}
    onChange={(e) => setFormMessage(e.target.value)}
    required
  />
</Form.Group>
            <Form.Group className="mb-3" controlId="annPublic">
              <Form.Check
                type="switch"
                label="Public (visible to all)"
                checked={formIsPublic}
                onChange={(e) => setFormIsPublic(e.target.checked)}
                disabled={isDean}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="annDepartments">
              <Form.Label>Target Departments</Form.Label>
              <Select
                isMulti
                isSearchable
                closeMenuOnSelect={false}
                options={deptOptions.map((d) => ({
                  value: String(d.value),
                  label: d.code ? `${d.code} — ${d.label}` : d.label,
                }))}
                value={deptOptions
                  .filter((d) => selectedDeptIds.map(String).includes(String(d.value)))
                  .map((d) => ({ value: String(d.value), label: d.code ? `${d.code} — ${d.label}` : d.label }))}
                onChange={(selected) => {
                  const vals = (selected || []).map((opt) => Number(opt.value)).filter((n) => !Number.isNaN(n));
                  setSelectedDeptIds(vals);
                }}
                styles={selectStyles}
                isDisabled={formIsPublic || isDean}
              />
              <Form.Text className="text-muted">Search and select one or more departments.</Form.Text>
            </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
          Cancel
        </Button>
        <Button variant="dark" type="submit" form="createAnnForm" disabled={creating}>
          {creating ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Delete Confirmation Modal */}
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Announcement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete this announcement? This action cannot be undone.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
        <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
      </Modal.Footer>
    </Modal>
  </div>
);
};

export default Announcements;