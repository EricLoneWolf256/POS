import { AlertTriangle } from 'lucide-react';

export function TableLoading({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex items-center justify-center py-12">
          <span className="spinner" />
        </div>
      </td>
    </tr>
  );
}

export function TableError({ colSpan, onRetry }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <AlertTriangle size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">Failed to load data</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </td>
    </tr>
  );
}
