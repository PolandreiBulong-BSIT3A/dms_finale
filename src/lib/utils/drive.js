// Utility helpers for Google Drive links
// Exported as pure functions for easy testing

export function isValidDriveLink(link) {
  if (!link || typeof link !== 'string') return false;
  const drivePatterns = [
    /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view/,
    /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
    /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/,
    /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/edit/,
    /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\/edit/
  ];
  return drivePatterns.some((pattern) => pattern.test(link));
}

export function getDrivePreviewUrl(link) {
  if (!link || typeof link !== 'string') return null;
  // File
  let match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  // Doc
  match = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://docs.google.com/document/d/${match[1]}/preview`;
  // Sheet
  match = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
  // Slides
  match = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://docs.google.com/presentation/d/${match[1]}/preview`;
  return null;
}
