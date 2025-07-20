# Using Parquet with DuckDB in React

## Why Parquet?

Parquet is significantly faster and more efficient than CSV for several reasons:

1. **Column-oriented storage**: Parquet stores data by column rather than by row, which is ideal for analytical queries that typically only need to access a subset of columns.
2. **Efficient compression**: Parquet uses advanced compression techniques that are column-specific, resulting in better compression ratios.
3. **Schema preservation**: Parquet stores data types with the data, eliminating the need for type inference.
4. **Reduced I/O**: Due to its columnar nature and compression, Parquet requires less data to be read from disk.
5. **Predicate pushdown**: Parquet supports filtering at the storage level, further reducing I/O.

## Performance Comparison

In typical scenarios, Parquet offers:
- 2-4x faster query execution
- 10-20x faster data loading
- 40-60% smaller file sizes

## Converting CSV to Parquet

Use the provided conversion script:

```bash
# Install dependencies first
npm install

# Convert a CSV file to Parquet
npm run convert-csv -- ./data/master_subsystem.csv ./data/master_subsystem.parquet
```

## Using Parquet in Your Components

The `useDuckDB3` hook now supports Parquet files:

```javascript
import useDuckDB from '../../hooks/useDuckDB3';

const YourComponent = () => {
  const { createTableFromParquet, executeQuery } = useDuckDB();
  
  useEffect(() => {
    const loadData = async () => {
      // Fetch Parquet file
      const res = await fetch('/data/your_data.parquet');
      const parquetBuffer = await res.arrayBuffer();
      
      // Load into DuckDB
      await createTableFromParquet('your_table', parquetBuffer);
      
      // Query as usual
      const results = await executeQuery('SELECT * FROM your_table');
      // Use results with Chakra UI components
    };
    
    loadData();
  }, []);
  
  // Render your component...
};
```

## Best Practices

1. **Convert data at build time**: Convert CSV to Parquet during your build process rather than at runtime.
2. **Use appropriate column types**: When creating Parquet files, specify the correct data types for each column.
3. **Partition large datasets**: For very large datasets, consider partitioning your Parquet files.
4. **Implement progressive loading**: For large datasets, load data progressively to improve user experience.