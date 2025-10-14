import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiAlertCircle, FiMaximize2, FiExternalLink } from 'react-icons/fi';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';

const Reply = ({ onNavigateToDocuments }) => {
  const [replyTitle, setReplyTitle] = useState('');
  const [replyDescription, setReplyDescription] = useState('');
  const [replyLink, setReplyLink] = useState('');
  const [fromField, setFromField] = useState('');
  const [toField, setToField] = useState('');
  const [dateTimeReceived, setDateTimeReceived] = useState('');
  const [sourceDocumentId, setSourceDocumentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth <= 768); } catch {}
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cleanup sessionStorage when component unmounts
  useEffect(() => {
    return () => {
      // Clear reply data when leaving the Reply page
      sessionStorage.removeItem('createReply');
    };
  }, []);

  // Get source document ID from URL parameters or sessionStorage
  useEffect(() => {
    // First try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('replyTo') || urlParams.get('docId') || urlParams.get('id');
    
    // If not in URL, try hash parameters (for single-page app routing)
    if (!docId && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      docId = hashParams.get('replyTo') || hashParams.get('docId') || hashParams.get('id');
    }
    
    // If still not found, try sessionStorage as fallback
    if (!docId) {
      try {
        const replyData = sessionStorage.getItem('createReply');
        if (replyData) {
          const data = JSON.parse(replyData);
          docId = data.source_document_id;
          
          // Pre-fill form fields from sessionStorage
          if (data.from) setFromField(data.from);
          if (data.to) setToField(data.to);
          if (data.dateTimeReceived) setDateTimeReceived(data.dateTimeReceived);
          if (data.reply_title) setReplyTitle(data.reply_title);
          if (data.reply_description) setReplyDescription(data.reply_description);
        }
      } catch (e) {}
    }
    
    if (docId) {
      setSourceDocumentId(docId);
    }
  }, []);

  // Validate Google Drive link
  const isValidDriveLink = (link) => {
    const drivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\//
    ];
    return !!(link && drivePatterns.some(p => p.test(link)));
  };

  // Build an iframe preview URL for Google Drive links
  const getDrivePreviewUrl = (link) => {
    if (!link) return null;
    let m = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/presentation/d/${m[1]}/preview`;
    return null;
  };

  // Get direct view URL for Google Drive links
  const getDriveViewUrl = (link) => {
    if (!link) return null;
    let m = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    return link; // Return original if no match
  };

  const previewUrl = useMemo(() => getDrivePreviewUrl(replyLink), [replyLink]);

  useEffect(() => {
    setShowPreviewPanel(isValidDriveLink(replyLink) && !!previewUrl);
  }, [replyLink, previewUrl]);

  // Styles matching Upload.jsx design system
  const styles = {
    outerWrap: {
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '16px' : '32px 0',
      fontFamily: 'Inter, sans-serif',
    },
    flexCard: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'stretch',
      width: '100%',
      maxWidth: 1200,
      background: '#fff',
      border: '1.5px solid #111',
      borderRadius: 16,
      boxSizing: 'border-box',
      marginBottom: 32,
      overflow: 'hidden',
    },
    formCol: {
      flex: 1,
      padding: isMobile ? '16px' : '32px',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      height: 'auto',
      alignSelf: 'stretch',
      margin: 0,
    },
    previewCol: {
      flex: 1,
      borderLeft: isMobile ? 'none' : '1px solid #eee',
      borderTop: isMobile ? '1px solid #eee' : 'none',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: isMobile ? '16px' : '32px',
      minWidth: 0,
      height: 'auto',
      alignSelf: 'stretch',
    },
    title: {
      fontSize: 'clamp(20px, 4vw, 28px)',
      fontWeight: 700,
      color: '#111',
      margin: 0,
      letterSpacing: '-0.02em',
      textAlign: 'left',
    },
    section: {
      marginBottom: 20,
    },
    inputRow: {
      display: 'flex',
      gap: 18,
      marginBottom: 0,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
    },
    inputLabel: {
      fontWeight: 400,
      marginBottom: 2,
      color: '#333',
      fontSize: 'clamp(12px, 2vw, 13px)',
      textAlign: 'left',
      minWidth: isMobile ? 'auto' : '120px',
    },
    input: {
      width: '100%',
      border: 'none',
      borderBottom: '1px solid #ddd',
      borderRadius: 0,
      background: '#fff',
      fontSize: 15,
      color: '#111',
      padding: '6px 0 4px 0',
      marginBottom: 10,
      outline: 'none',
      transition: 'border-bottom-color 0.2s',
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%',
      border: 'none',
      borderBottom: '1px solid #ddd',
      borderRadius: 0,
      background: '#fff',
      fontSize: 15,
      color: '#111',
      padding: '6px 0 4px 0',
      marginBottom: 10,
      outline: 'none',
      transition: 'border-bottom-color 0.2s',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: 60,
    },
    error: {
      color: '#c00',
      fontSize: 'clamp(11px, 2vw, 12px)',
      fontWeight: 400,
      marginTop: 6,
    },
    buttonRow: {
      display: 'flex',
      gap: 12,
      marginTop: 24,
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'flex-end',
    },
    button: {
      padding: isMobile ? '12px 20px' : '10px 20px',
      borderRadius: '8px',
      border: '1.5px solid #ddd',
      background: 'white',
      color: '#666',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      width: isMobile ? '100%' : 'auto',
    },
    primaryButton: {
      padding: isMobile ? '12px 20px' : '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: '#111',
      color: 'white',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      width: isMobile ? '100%' : 'auto',
    },
    previewToggleButton: {
      padding: isMobile ? '10px 14px' : '8px 16px',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      color: '#475569',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 2vw, 14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s',
      width: isMobile ? '100%' : 'auto',
    },
    backButton: {
      padding: isMobile ? '10px 14px' : '8px 16px',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      color: '#475569',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 2vw, 14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      width: isMobile ? '100%' : 'auto',
    },
    statusBadge: {
      backgroundColor: sourceDocumentId ? '#f0f9ff' : '#fef2f2',
      border: `1px solid ${sourceDocumentId ? '#0ea5e9' : '#f87171'}`,
      borderRadius: '6px',
      padding: isMobile ? '6px 10px' : '8px 12px',
      marginTop: '8px',
      fontSize: 'clamp(11px, 2vw, 13px)',
      color: sourceDocumentId ? '#0c4a6e' : '#991b1b',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      width: isMobile ? '100%' : 'auto',
      justifyContent: isMobile ? 'center' : 'flex-start',
    },
    linkInputContainer: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      width: '100%',
    },
    linkInput: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      borderBottom: '1px solid #ddd',
      borderRadius: 0,
      background: '#fff',
      fontSize: 15,
      color: '#111',
      padding: '6px 0 4px 0',
      marginBottom: 10,
      outline: 'none',
      transition: 'border-bottom-color 0.2s',
      fontFamily: 'inherit',
    },
    openButton: {
      background: 'transparent',
      border: '1.5px solid #ddd',
      borderRadius: '6px',
      color: '#666',
      fontSize: 12,
      fontWeight: 500,
      padding: '6px 12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
      flex: '0 0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    previewHeader: {
      fontWeight: 600,
      fontSize: 18,
      color: '#111',
      marginBottom: 16,
      alignSelf: 'flex-start',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    previewIframe: {
      width: '100%',
      height: '100%',
      minHeight: isMobile ? 300 : 500,
      flex: 1,
      border: '1.5px solid #111',
      borderRadius: 8,
      background: '#fff',
      overflow: 'auto',
    },
    previewPlaceholder: {
      width: '100%',
      minHeight: isMobile ? 200 : 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#888',
      border: '1.5px dashed #bbb',
      borderRadius: 8,
      background: '#fff',
      fontSize: 14,
      padding: 20,
      textAlign: 'center',
    },
    previewIcon: {
      width: 64,
      height: 64,
      backgroundColor: '#4285f4',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    previewButton: {
      backgroundColor: '#4285f4',
      color: 'white',
      border: 'none',
      borderRadius: 6,
      padding: '8px 16px',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.2s',
    },
  };

  // Prefill removed per request

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    if (!sourceDocumentId) {
      setError('Missing source document ID. Please navigate to this page from a document\'s reply button or add ?replyTo=<docId> to the URL.');
      return;
    }
    const errs = {};
    if (!replyTitle.trim()) errs.replyTitle = 'Title is required';
    if (!replyLink.trim()) errs.replyLink = 'Google Drive link is required';
    else if (!isValidDriveLink(replyLink)) errs.replyLink = 'Please enter a valid Google Drive link';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSubmitting(true);
    try {
      // Try to get a Reply document type id to satisfy backend if needed
      let replyTypeId = null;
      try {
        const typesData = await fetchJson(buildUrl('document-types'));
        const list = Array.isArray(typesData) ? typesData : (typesData.documentTypes || []);
        const byName = list.find(t => (t.name || t.type_name || '').toString().toLowerCase() === 'reply');
        if (byName) replyTypeId = byName.type_id ?? byName.id ?? byName.typeId ?? null;
        if (!replyTypeId && list.length > 0) {
          const f = list[0];
          replyTypeId = f.type_id ?? f.id ?? f.typeId ?? null;
        }
      } catch {}

      const data = await fetchJson(buildUrl('documents/reply'), {
        method: 'POST',
        body: JSON.stringify({
          original_doc_id: sourceDocumentId,
          title: replyTitle,
          description: replyDescription,
          google_drive_link: replyLink,
          reply_type: 'action_response',
          from_field: fromField,
          to_field: toField,
          date_received: dateTimeReceived,
          ...(replyTypeId ? { doc_type: replyTypeId, type_id: replyTypeId, doc_type_id: replyTypeId } : {})
        })
      });

      if (data && data.success) {
        setSuccess('Reply uploaded successfully');
        sessionStorage.removeItem('createReply');
        setTimeout(() => {
          if (onNavigateToDocuments) onNavigateToDocuments('requests');
        }, 1200);
      } else {
        setError(data.message || 'Failed to upload reply');
      }
    } catch (err) {
      setError('Failed to upload reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.outerWrap}>
      <div style={{...styles.flexCard, maxWidth: isMobile ? '100%' : 1200}}>
        <div style={styles.formCol}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            marginBottom: '24px',
            gap: isMobile ? '12px' : '0'
          }}>
            <div>
              <h2 style={styles.title}>Upload Reply</h2>
              <div style={styles.statusBadge}>
                {sourceDocumentId ? (
                  <>
                    <FiCheck size={14} /> Replying to document ID: {sourceDocumentId}
                  </>
                ) : (
                  <>
                    <FiAlertCircle size={14} /> No source document ID found in URL
                  </>
                )}
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              {isValidDriveLink(replyLink) && (
                <button
                  onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                  style={{
                    ...styles.previewToggleButton,
                    backgroundColor: showPreviewPanel ? '#111' : 'white',
                    color: showPreviewPanel ? 'white' : '#475569',
                  }}
                >
                  <FiMaximize2 style={{ fontSize: isMobile ? '12px' : '14px' }} />
                  {showPreviewPanel ? 'Hide Preview' : 'Show Preview'}
                </button>
              )}
              {onNavigateToDocuments && (
                <button
                  onClick={() => {
                    sessionStorage.removeItem('createReply');
                    onNavigateToDocuments('requests');
                  }}
                  style={styles.backButton}
                >
                  ← Back to Requests
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
            {!!error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                <FiAlertCircle size={16} /> {error}
              </div>
            )}
            {!!success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                <FiCheck size={16} /> {success}
              </div>
            )}

              {/* From, To, Date/Time Row */}
              <div style={styles.section}>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>From</div>
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={fromField} 
                    onChange={e => setFromField(e.target.value)} 
                    placeholder=" " 
                  />
                </div>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>To</div>
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={toField} 
                    onChange={e => setToField(e.target.value)} 
                    placeholder=" " 
                  />
                </div>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>Date/Time</div>
                  <input 
                    style={styles.input} 
                    type="datetime-local" 
                    value={dateTimeReceived} 
                    onChange={e => setDateTimeReceived(e.target.value)} 
                    placeholder=" " 
                  />
                </div>
              </div>

              {/* Reply Title */}
              <div style={styles.section}>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>Reply Title *</div>
                  <input 
                    style={{...styles.input, borderBottom: `1px solid ${fieldErrors.replyTitle ? '#fca5a5' : '#ddd'}`}} 
                    type="text" 
                    value={replyTitle} 
                    onChange={e => setReplyTitle(e.target.value)} 
                    placeholder="e.g., Response to Memo #123" 
                  />
                </div>
                {fieldErrors.replyTitle && <div style={styles.error}>{fieldErrors.replyTitle}</div>}
              </div>

              {/* Description */}
              <div style={styles.section}>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>Description</div>
                  <textarea 
                    style={styles.textarea} 
                    value={replyDescription} 
                    onChange={e => setReplyDescription(e.target.value)} 
                    rows={3} 
                    placeholder="Brief description of your response..." 
                  />
                </div>
              </div>

              {/* Google Drive Link */}
              <div style={styles.section}>
                <div style={{...styles.inputRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <div style={{...styles.inputLabel, minWidth: isMobile ? 'auto' : '120px'}}>Google Drive Link *</div>
                  <div style={styles.linkInputContainer}>
                    <input 
                      style={{...styles.linkInput, borderBottom: `1px solid ${fieldErrors.replyLink ? '#fca5a5' : '#ddd'}`}} 
                      type="url" 
                      value={replyLink} 
                      onChange={e => setReplyLink(e.target.value)} 
                      placeholder="https://drive.google.com/file/d/..." 
                    />
                    <button 
                      type="button" 
                      style={{
                        ...styles.openButton,
                        opacity: replyLink ? 1 : 0.5,
                        cursor: replyLink ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => replyLink && window.open(replyLink, '_blank')} 
                      disabled={!replyLink} 
                      title="Open in new tab"
                    >
                      <FiExternalLink size={14} />
                      Open
                    </button>
                  </div>
                </div>
                {fieldErrors.replyLink && <div style={styles.error}>{fieldErrors.replyLink}</div>}
              </div>

              {/* Action Buttons */}
              <div style={styles.buttonRow}>
                <button 
                  type="button" 
                  style={styles.button}
                  onClick={() => {
                    sessionStorage.removeItem('createReply');
                    onNavigateToDocuments && onNavigateToDocuments('requests');
                  }} 
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.primaryButton}
                  disabled={submitting}
                >
                  {submitting ? 'Uploading...' : 'Upload Reply'}
                </button>
              </div>
            </form>
          </div>
        {showPreviewPanel && (
          <div style={styles.previewCol}>
            <div style={styles.previewHeader}>
              <FiExternalLink size={18} />
              Document Preview
            </div>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                style={styles.previewIframe}
                title="Google Drive Preview"
                allow="autoplay"
              />
            ) : (
              <div style={styles.previewPlaceholder}>
                <div style={styles.previewIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                  Google Drive Document
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                  Preview not available for this link type
                </div>
                <button 
                  type="button" 
                  onClick={() => window.open(getDriveViewUrl(replyLink), '_blank')}
                  style={styles.previewButton}
                >
                  <FiExternalLink size={14} />
                  Open in New Tab
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;




