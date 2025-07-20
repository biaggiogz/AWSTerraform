const fs = require('fs');
const path = require('path');
const { Table, tableFromArrays } = require('apache-arrow');
const parquet = require('parquetjs');

/**
 * Converts a CSV file to Parquet format
 * 
 * Usage: node convert-csv-to-parquet.js <input.csv> <output.parquet>
 */

async function convertCsvToParquet(inputCsvPath, outputParquetPath) {
  console.log(`Converting ${inputCsvPath} to ${outputParquetPath}`);
  
  // Read CSV file
  const csvData = fs.readFileSync(inputCsvPath, 'utf8');
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Parse CSV data
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });
    return row;
  });
  
  // Infer schema from first row
  const schema = new parquet.ParquetSchema({});
  const firstRow = rows[0];
  
  headers.forEach(header => {
    schema.fields[header] = { type: 'UTF8' };
  });
  
  // Create a new ParquetWriter
  const writer = await parquet.ParquetWriter.openFile(schema, outputParquetPath);
  
  // Write rows
  for (const row of rows) {
    await writer.appendRow(row);
  }
  
  // Close the writer
  await writer.close();
  
  console.log(`Successfully converted ${inputCsvPath} to ${outputParquetPath}`);
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node convert-csv-to-parquet.js <input.csv> <output.parquet>');
  process.exit(1);
}

const [inputCsvPath, outputParquetPath] = args;

// Run the conversion
convertCsvToParquet(inputCsvPath, outputParquetPath)
  .catch(err => {
    console.error('Error converting CSV to Parquet:', err);
    process.exit(1);
  });