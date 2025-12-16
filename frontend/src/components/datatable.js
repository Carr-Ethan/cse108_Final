export default function DataTable({ data, columns, isLoading }) {

  if (isLoading) {
    return <div className="loading">Loading data...</div>;
  }

  if (!data || data.length === 0) {
    return <p className="empty-state">No data available.</p>;
  }

  return (
    <table className="results-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={`${index}-${col.key}`}>
                {col.cellRenderer 
                  ? col.cellRenderer(row)
                  : (row[col.key] !== null && row[col.key] !== undefined 
                    ? row[col.key] 
                    : '-')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}