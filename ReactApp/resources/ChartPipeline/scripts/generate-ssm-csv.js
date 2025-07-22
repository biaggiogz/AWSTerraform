const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Paths to CSV files
const pipelineDataPath = path.resolve(__dirname, '../public/data/pipelinedata.csv');
const aislDataPath = path.resolve(__dirname, '../public/data/aislamientos.csv');
const loopDataPath = path.resolve(__dirname, '../public/data/test_of_lazos_updated.csv');
const subsystemsInfoPath = path.resolve(__dirname, '../public/data/subsystems_info.csv');
const outputPath = path.resolve(__dirname, '../public/data/ssm.csv');

// Check if output file already exists
if (fs.existsSync(outputPath)) {
  console.log('SSM CSV file already exists. Skipping generation.');
  process.exit(0);
}

// Read and parse CSV files
console.log('Reading CSV files...');
const pipelineData = Papa.parse(fs.readFileSync(pipelineDataPath, 'utf8'), { header: true }).data;
const aislData = Papa.parse(fs.readFileSync(aislDataPath, 'utf8'), { header: true }).data;
const loopData = Papa.parse(fs.readFileSync(loopDataPath, 'utf8'), { header: true }).data;
const subsystemsInfoData = Papa.parse(fs.readFileSync(subsystemsInfoPath, 'utf8'), { header: true }).data;

console.log('Processing data for SSM CSV...');

// Get all unique subsystems
const allSubsystems = new Set();
loopData.forEach(item => {
  if (item['SUBS_PRE']) allSubsystems.add(item['SUBS_PRE']);
});
pipelineData.forEach(item => {
  if (item['SUBSYSTEM']) allSubsystems.add(item['SUBSYSTEM']);
});

// Create metadata lookup
const metadataMap = new Map();
subsystemsInfoData.forEach(item => {
  if (item['SUBSYSTEM']) {
    metadataMap.set(item['SUBSYSTEM'], {
      fluid: item['SUBSYSTEM'].split('-')[0] || ''
    });
  }
});

// Process insulation data
const insulationMap = new Map();
aislData.forEach(item => {
  const subsystem = item['SUBSYSTEM'];
  if (!subsystem) return;
  
  if (!insulationMap.has(subsystem)) {
    insulationMap.set(subsystem, { totalItems: 0, doneItems: 0 });
  }
  
  const stats = insulationMap.get(subsystem);
  stats.totalItems += 1;
  if (item['DONE'] === 'YES') stats.doneItems += 1;
});

// Process loop data
const loopMap = new Map();
loopData.forEach(item => {
  const subsystem = item['SUBS_PRE'];
  if (!subsystem) return;
  
  if (!loopMap.has(subsystem)) {
    loopMap.set(subsystem, { totalLoop: 0, loopDone: 0, loopPending: 0 });
  }
  
  const stats = loopMap.get(subsystem);
  stats.totalLoop += 1;
  if (item['OK=100%'] === '100.00%') {
    stats.loopDone += 1;
  } else {
    stats.loopPending += 1;
  }
});

// Process test pack data
const testPackMap = new Map();
pipelineData.forEach(item => {
  const subsystem = item['SUBSYSTEM'];
  if (!subsystem || !item['TEST PACK']) return;

  if (!testPackMap.has(subsystem)) {
    testPackMap.set(subsystem, {
      serialNumber: item['S/N'] || '',
      testPacks: new Set(),
      description: item['DESCRIPTION'] || ''
    });
  }

  const stats = testPackMap.get(subsystem);
  item['TEST PACK'].split('|').forEach(tp => {
    const trimmedTp = tp.trim();
    if (trimmedTp) stats.testPacks.add(trimmedTp);
  });
});

// Create final result
const result = Array.from(allSubsystems).map(subsystem => {
  const metadata = metadataMap.get(subsystem) || { fluid: ''};
  const insulation = insulationMap.get(subsystem) || { totalItems: 0, doneItems: 0 };
  const loop = loopMap.get(subsystem) || { totalLoop: 0, loopDone: 0, loopPending: 0 };
  const testPack = testPackMap.get(subsystem) || { serialNumber: '', testPacks: new Set(), description: '' };

  return {
    serialNumber: testPack.serialNumber,
    subsystem,
    fluid: metadata.fluid,
    totalItems: insulation.totalItems,
    doneItems: insulation.doneItems,
    pendingItems: insulation.totalItems - insulation.doneItems,
    description: testPack.description,
    numTestPacks: testPack.testPacks.size,
    totalLoops: loop.totalLoop,
    doneLoops: loop.loopDone,
    pendingLoops: loop.loopPending
  };
}).sort((a, b) => b.totalItems - a.totalItems);

// Write to CSV
console.log(`Writing ${result.length} rows to SSM CSV file...`);
const csv = Papa.unparse(result);
fs.writeFileSync(outputPath, csv);

console.log(`SSM CSV file created at: ${outputPath}`);
console.log('Done!');