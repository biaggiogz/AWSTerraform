/**
 * Activation script for DetailsInstrumentsTable implementations
 * Enables/disables different implementations via feature flags
 */

const fs = require('fs');
const path = require('path');

// Available implementations
const IMPLEMENTATIONS = ['react', 'wasm', 'duckdb', 'solidjs'];

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const implementation = args[1]?.toLowerCase();

// Show usage if no arguments provided
if (!command || (command !== 'status' && !implementation)) {
  console.log(`
Usage: node activate-table-implementations.js <command> [implementation]

Commands:
  enable <implementation>   Enable specific implementation
  disable <implementation>  Disable specific implementation
  status                    Show current status

Implementations:
  react    Standard React implementation (default)
  wasm     WASM-optimized implementation
  duckdb   DuckDB-powered implementation
  solidjs  SolidJS implementation
  
Examples:
  node activate-table-implementations.js enable wasm
  node activate-table-implementations.js disable solidjs
  node activate-table-implementations.js status
`);
  process.exit(0);
}

// Validate implementation
if (implementation && !IMPLEMENTATIONS.includes(implementation)) {
  console.error(`Error: Invalid implementation "${implementation}". Must be one of: ${IMPLEMENTATIONS.join(', ')}`);
  process.exit(1);
}

// Get current status from localStorage mock file
const getStatus = () => {
  const mockPath = path.join(__dirname, '.localstorage-mock.json');
  
  try {
    if (fs.existsSync(mockPath)) {
      return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading status:', err);
  }
  
  return {
    'use-wasm': false,
    'disable-duckdb': false,
    'use-solidjs': false,
    'use-solidjs-tables': false
  };
};

// Save status to localStorage mock file
const saveStatus = (status) => {
  const mockPath = path.join(__dirname, '.localstorage-mock.json');
  
  try {
    fs.writeFileSync(mockPath, JSON.stringify(status, null, 2), 'utf8');
    console.log('Status saved successfully');
  } catch (err) {
    console.error('Error saving status:', err);
  }
};

// Enable implementation
const enableImplementation = (impl) => {
  const status = getStatus();
  
  // Reset all implementations
  status['use-wasm'] = false;
  status['disable-duckdb'] = false;
  status['use-solidjs'] = false;
  status['use-solidjs-tables'] = false;
  
  // Enable selected implementation
  switch (impl) {
    case 'wasm':
      status['use-wasm'] = true;
      break;
    case 'duckdb':
      // DuckDB is the default, so just make sure it's not disabled
      status['disable-duckdb'] = false;
      break;
    case 'solidjs':
      status['use-solidjs'] = true;
      status['use-solidjs-tables'] = true;
      break;
    case 'react':
      // Disable DuckDB to use React
      status['disable-duckdb'] = true;
      break;
  }
  
  saveStatus(status);
  console.log(`Enabled ${impl.toUpperCase()} implementation`);
};

// Disable implementation
const disableImplementation = (impl) => {
  const status = getStatus();
  
  switch (impl) {
    case 'wasm':
      status['use-wasm'] = false;
      break;
    case 'duckdb':
      status['disable-duckdb'] = true;
      break;
    case 'solidjs':
      status['use-solidjs'] = false;
      status['use-solidjs-tables'] = false;
      break;
    case 'react':
      status['disable-duckdb'] = false;
      console.log('React implementation can be enabled by disabling DuckDB');
      return;
  }
  
  saveStatus(status);
  console.log(`Disabled ${impl.toUpperCase()} implementation`);
};

// Show current status
const showStatus = () => {
  const status = getStatus();
  
  console.log('\nCurrent Implementation Status:');
  console.log('-----------------------------');
  
  if (status['use-solidjs'] && status['use-solidjs-tables']) {
    console.log('✅ ACTIVE: SolidJS implementation');
  } else if (status['use-wasm']) {
    console.log('✅ ACTIVE: WASM implementation');
  } else if (status['disable-duckdb']) {
    console.log('✅ ACTIVE: React implementation');
  } else {
    console.log('✅ ACTIVE: DuckDB implementation (default)');
  }
  
  console.log('\nFeature Flags:');
  console.log('-------------');
  console.log(`use-wasm: ${status['use-wasm'] ? '✅ enabled' : '❌ disabled'}`);
  console.log(`disable-duckdb: ${status['disable-duckdb'] ? '✅ enabled' : '❌ disabled'}`);
  console.log(`use-solidjs: ${status['use-solidjs'] ? '✅ enabled' : '❌ disabled'}`);
  console.log(`use-solidjs-tables: ${status['use-solidjs-tables'] ? '✅ enabled' : '❌ disabled'}`);
  
  console.log('\nTo activate in browser:');
  console.log('---------------------');
  console.log('Open browser console and run:');
  
  if (status['use-solidjs'] && status['use-solidjs-tables']) {
    console.log("localStorage.setItem('use-solidjs', 'true');");
    console.log("localStorage.setItem('use-solidjs-tables', 'true');");
  } else if (status['use-wasm']) {
    console.log("localStorage.setItem('use-wasm', 'true');");
  } else if (status['disable-duckdb']) {
    console.log("localStorage.setItem('disable-duckdb', 'true');");
  } else {
    console.log("// No flags needed for default DuckDB implementation");
  }
  
  console.log('\nThen reload the page');
};

// Execute command
switch (command) {
  case 'enable':
    enableImplementation(implementation);
    showStatus();
    break;
  case 'disable':
    disableImplementation(implementation);
    showStatus();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.error(`Error: Unknown command "${command}"`);
    process.exit(1);
}