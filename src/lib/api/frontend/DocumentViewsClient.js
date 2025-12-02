// Frontend client for document views (seen feature)
// Uses shared client helpers for base URL and JSON handling
import { buildUrl, fetchJson } from './client.js';

// Mark a document as viewed
export const markDocumentAsViewed = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/view`), {
    method: 'POST'
  });
};

// Check if a document is viewed by current user
export const checkDocumentViewed = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/viewed`));
};

// Get list of users who viewed a document
export const getDocumentViewers = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/viewers`));
};
