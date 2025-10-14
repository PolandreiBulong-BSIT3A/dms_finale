#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const fixes = [
  // Fix catch blocks with unused parameters
  { pattern: /catch\s*\(\s*_\s*\)\s*\{\s*\}/g, replacement: 'catch (error) {\n    console.error("Error:", error);\n  }' },
  { pattern: /catch\s*\(\s*e\s*\)\s*\{\s*\}/g, replacement: 'catch (error) {\n    console.error("Error:", error);\n  }' },
  { pattern: /catch\s*\(\s*err\s*\)\s*\{\s*\}/g, replacement: 'catch (error) {\n    console.error("Error:", error);\n  }' },
  
  // Fix try-catch with only console.error
  { pattern: /catch\s*\(\s*_\s*\)\s*\{\s*console\.error/g, replacement: 'catch (error) {\n    console.error' },
  { pattern: /catch\s*\(\s*e\s*\)\s*\{\s*console\.error/g, replacement: 'catch (error) {\n    console.error' },
];

function walkDir(dir, callback) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        walkDir(filePath, callback);
      }
    } else if (extname(file) === '.js' || extname(file) === '.jsx') {
      callback(filePath);
    }
  });
}

function fixFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

const srcDir = join(process.cwd(), 'src');
console.log('Fixing lint errors...');
walkDir(srcDir, fixFile);
console.log('Done!');
