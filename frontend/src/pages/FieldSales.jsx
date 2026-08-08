import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import api, { formatCurrency } from '../services/api';

export default function FieldSales() {
  const [trips, setTrips] = useState([]);
  const [performance, setPerformance] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/field-sales/trips').then(res => setTrips(res.data));
    api.get('/field-sales/performance').then(res => setPerformance(res.data));
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="page-title">Field Sales</h1>
        <p className="page-subtitle">Manage field agents, stock issuance, and performance</p>
      </div>

      {/* Salesperson Performance */}
      {performance.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Salesperson Performance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th>Trips</th>
                  <th>Total Sales</th>
                  <th>Expenses</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => (
                  <tr key={`${p.first_name}-${p.last_name}`}>
                    <td className="font-medium text-gray-700">{p.first_name} {p.last_name}</td>
                    <td className="tabular-nums text-gray-600">{p.trips}</td>
                    <td className="tabular-nums font-medium text-gray-900">{formatCurrency(p.total_sales)}</td>
                    <td className="tabular-nums text-gray-600">{formatCurrency(p.total_expenses)}</td>
                    <td className={`tabular-nums font-medium ${p.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(p.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trips */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Field Sales Trips</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Salesperson</th>
                <th>Branch</th>
                <th>Sales</th>
                <th>Expenses</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td className="tabular-nums text-gray-500">
                    {new Date(t.trip_date).toLocaleDateString('en-UG')}
                  </td>
                  <td className="font-medium text-gray-700">{t.first_name} {t.last_name}</td>
                  <td className="text-gray-600">{t.branch_name}</td>
                  <td className="tabular-nums font-medium text-gray-900">{formatCurrency(t.total_sales)}</td>
                  <td className="tabular-nums text-gray-600">{formatCurrency(t.total_expenses)}</td>
                  <td>
                    <span className={`badge ${t.status === 'active' ? 'badge-green' : t.status === 'completed' ? 'badge-blue' : 'badge-gray'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!trips.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Truck size={32} className="text-gray-200" />
                      <p>No field sales trips yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
