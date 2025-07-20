# High Performance Table Component

This component is optimized for rendering large datasets (22+ columns, 2000+ rows) with high performance in the browser using DuckDB-WASM.

## Performance Optimizations

1. **Virtualization**: Only renders visible rows in the viewport using `@tanstack/react-virtual`
2. **Efficient Filtering**: Uses optimized DuckDB queries for filtering
3. **Performance Metrics**: Displays load time, render time, and filter time
4. **Optimized DuckDB Queries**: Uses indexes and optimized query execution
5. **Memoization**: Prevents unnecessary re-renders

## Usage

```jsx
import SubsystemCommentsTable from './components/tables/SubsystemCommentsTable';

function App() {
  return (
    <div>
      <SubsystemCommentsTable />
    </div>
  );
}
```

## Performance Metrics

The component displays three key performance metrics:
- **Load**: Time to load and process data from Parquet/CSV
- **Render**: Time to render the table with data
- **Filter**: Time to filter the table when searching

## Customization

To add more columns, modify the `columns` definition in `SubsystemCommentsTable.js`.

## Troubleshooting

If you experience performance issues:
1. Check browser console for DuckDB warnings
2. Ensure Parquet files are properly formatted
3. Consider reducing the number of columns displayed
4. Use the Chrome Performance tab to identify bottlenecks

## Browser Support

This component requires WebAssembly support in the browser. All modern browsers (Chrome, Firefox, Safari, Edge) support WebAssembly.