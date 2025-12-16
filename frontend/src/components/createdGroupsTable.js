import "../HomePage.css";

export default function CreatedGroupsTable({ data, columns }) {

  if (!data || data.length === 0) {
    return <p className="empty-state">No data available.</p>;
  }

  return (
    <table className="results-table card-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="group-card-row">
            {columns.map((col) => {
              const isEditable = col.key === 'name' || col.key === 'description';

              const cellContent = col.cellRenderer
                ? col.cellRenderer(row)
                : row[col.key] ?? "-";
              return (
                <td 
                  {...(isEditable ? { contentEditable: "true" } : {})}
                  key={`${index}-${col.key}`}
                  className={isEditable ? 'editable-cell' : ''} 
                >
                  {cellContent}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}