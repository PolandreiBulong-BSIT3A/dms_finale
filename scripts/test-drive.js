// Minimal tests for drive link utilities
// Run with: npm run test
import assert from 'node:assert/strict';
import { isValidDriveLink, getDrivePreviewUrl } from '../src/lib/utils/drive.js';

function run(name, fn) {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (e) {
    console.error(`✖ ${name}`);
    console.error(e?.stack || e?.message || e);
    process.exitCode = 1;
  }
}

run('isValidDriveLink returns false for empty and invalid strings', () => {
  assert.equal(isValidDriveLink(''), false);
  assert.equal(isValidDriveLink('not a url'), false);
  assert.equal(isValidDriveLink('https://example.com/file/123'), false);
});

run('isValidDriveLink accepts common Google Drive URLs', () => {
  assert.equal(isValidDriveLink('https://drive.google.com/file/d/ABC123/view'), true);
  assert.equal(isValidDriveLink('https://drive.google.com/open?id=ABC123'), true);
  assert.equal(isValidDriveLink('https://docs.google.com/document/d/ABC123/edit'), true);
  assert.equal(isValidDriveLink('https://docs.google.com/spreadsheets/d/ABC123/edit'), true);
  assert.equal(isValidDriveLink('https://docs.google.com/presentation/d/ABC123/edit'), true);
});

run('getDrivePreviewUrl extracts preview for file/doc/sheet/slide', () => {
  assert.equal(
    getDrivePreviewUrl('https://drive.google.com/file/d/ABC123/view?usp=sharing'),
    'https://drive.google.com/file/d/ABC123/preview'
  );
  assert.equal(
    getDrivePreviewUrl('https://docs.google.com/document/d/DOCID123/edit'),
    'https://docs.google.com/document/d/DOCID123/preview'
  );
  assert.equal(
    getDrivePreviewUrl('https://docs.google.com/spreadsheets/d/SHEETID456/edit#gid=0'),
    'https://docs.google.com/spreadsheets/d/SHEETID456/preview'
  );
  assert.equal(
    getDrivePreviewUrl('https://docs.google.com/presentation/d/SLIDEID789/edit'),
    'https://docs.google.com/presentation/d/SLIDEID789/preview'
  );
});

run('getDrivePreviewUrl returns null for non-drive links', () => {
  assert.equal(getDrivePreviewUrl('https://example.com'), null);
  assert.equal(getDrivePreviewUrl(''), null);
});

if (process.exitCode) {
  console.error('\nSome tests failed.');
  process.exit(process.exitCode);
} else {
  console.log('\nAll tests passed.');
}
