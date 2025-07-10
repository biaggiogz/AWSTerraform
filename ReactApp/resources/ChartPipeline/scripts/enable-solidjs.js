#!/usr/bin/env node

/**
 * SolidJS Migration Control Script
 * Enables/disables SolidJS components with performance monitoring
 */

const fs = require('fs');
const path = require('path');

class SolidJSMigrationController {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.solidEnvPath = path.join(__dirname, '../.env.solidjs');
  }
  
  enableSolidJS(components = ['PersistentMetricCards']) {
    console.log('🚀 Enabling SolidJS Migration...');
    
    // Set localStorage for immediate effect
    console.log('Setting localStorage flags...');
    console.log('Run in browser console: localStorage.setItem("use-solidjs", "true")');
    
    // Update environment variables
    this.updateEnvFile({
      'REACT_APP_USE_SOLIDJS': 'true',
      'REACT_APP_SOLIDJS_COMPONENTS': components.join(','),
      'REACT_APP_SOLIDJS_DEBUG': 'true'
    });
    
    console.log('✅ SolidJS enabled for components:', components.join(', '));
    console.log('📊 Performance monitoring active');
    console.log('🔄 Restart development server to apply changes');
  }
  
  disableSolidJS() {
    console.log('⏸️  Disabling SolidJS Migration...');
    
    this.updateEnvFile({
      'REACT_APP_USE_SOLIDJS': 'false',
      'REACT_APP_SOLIDJS_DEBUG': 'false'
    });
    
    console.log('Run in browser console: localStorage.removeItem("use-solidjs")');
    console.log('✅ SolidJS disabled, using React fallback');
  }
  
  updateEnvFile(updates) {
    let envContent = '';
    
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    }
    
    // Update or add environment variables
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const line = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += `\n${line}`;
      }
    });
    
    fs.writeFileSync(this.envPath, envContent.trim() + '\n');
  }
  
  showStatus() {
    console.log('📊 SolidJS Migration Status:');
    
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const useSolidJS = envContent.match(/REACT_APP_USE_SOLIDJS=(.+)/)?.[1] === 'true';
      const components = envContent.match(/REACT_APP_SOLIDJS_COMPONENTS=(.+)/)?.[1] || 'none';
      
      console.log(`Status: ${useSolidJS ? '🟢 ENABLED' : '🔴 DISABLED'}`);
      console.log(`Components: ${components}`);
    } else {
      console.log('Status: 🔴 NOT CONFIGURED');
    }
    
    console.log('\nCommands:');
    console.log('  node scripts/enable-solidjs.js enable    - Enable SolidJS');
    console.log('  node scripts/enable-solidjs.js disable   - Disable SolidJS');
    console.log('  node scripts/enable-solidjs.js status    - Show status');
  }
  
  benchmark() {
    console.log('🏃‍♂️ Running Performance Benchmark...');
    console.log('Open browser console and run:');
    console.log(`
// React Performance Test
console.time('React Render');
// Interact with PersistentMetricCards
console.timeEnd('React Render');

// Enable SolidJS
localStorage.setItem('use-solidjs', 'true');
location.reload();

// SolidJS Performance Test  
console.time('SolidJS Render');
// Interact with PersistentMetricCards
console.timeEnd('SolidJS Render');
    `);
  }
}

// CLI Interface
const controller = new SolidJSMigrationController();
const command = process.argv[2];

switch (command) {
  case 'enable':
    controller.enableSolidJS(['PersistentMetricCards']);
    break;
  case 'disable':
    controller.disableSolidJS();
    break;
  case 'status':
    controller.showStatus();
    break;
  case 'benchmark':
    controller.benchmark();
    break;
  default:
    controller.showStatus();
}