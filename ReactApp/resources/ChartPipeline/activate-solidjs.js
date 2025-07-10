#!/usr/bin/env node

// Activate SolidJS for CloudFront deployment
const fs = require('fs');
const path = require('path');

console.log('🚀 Activating SolidJS for SUMMARY SUBSYSTEMS...');

// 1. Set environment variable
process.env.REACT_APP_USE_SOLIDJS = 'true';

// 2. Create runtime activation script
const activationScript = `
// SolidJS Runtime Activation
window.REACT_APP_USE_SOLIDJS = 'true';
localStorage.setItem('use-solidjs', 'true');
console.log('✅ SolidJS activated for SUMMARY SUBSYSTEMS');
`;

// Write to public folder for CloudFront
fs.writeFileSync(
  path.join(__dirname, 'public', 'activate-solidjs.js'), 
  activationScript
);

// 3. Update index.html to include activation script
const indexPath = path.join(__dirname, 'public', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

if (!indexHtml.includes('activate-solidjs.js')) {
  indexHtml = indexHtml.replace(
    '</head>',
    '  <script src="/activate-solidjs.js"></script>\n</head>'
  );
  fs.writeFileSync(indexPath, indexHtml);
}

console.log('✅ SolidJS activation complete');
console.log('📦 Ready for CloudFront deployment');