import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Quotations from './pages/Quotations';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Manufacturing from './pages/Manufacturing';
import FieldSales from './pages/FieldSales';
import Settings from './pages/Settings';
import Employees from './pages/Employees';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <span className="spinner spinner-lg" />
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stock />} />
        <Route path="sales" element={<Sales />} />
        <Route path="customers" element={<Customers />} />
        <Route path="employees" element={<Employees />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="reports" element={<Reports />} />
        <Route path="manufacturing" element={<Manufacturing />} />
        <Route path="field-sales" element={<FieldSales />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
