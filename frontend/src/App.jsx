import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Stock = lazy(() => import('./pages/Stock'));
const Sales = lazy(() => import('./pages/Sales'));
const Customers = lazy(() => import('./pages/Customers'));
const Quotations = lazy(() => import('./pages/Quotations'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Reports = lazy(() => import('./pages/Reports'));
const Manufacturing = lazy(() => import('./pages/Manufacturing'));
const FieldSales = lazy(() => import('./pages/FieldSales'));
const Settings = lazy(() => import('./pages/Settings'));
const Employees = lazy(() => import('./pages/Employees'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <span className="spinner spinner-lg" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" />;
}

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lazy><Landing /></Lazy>} />
      <Route path="/login" element={<Lazy><Login /></Lazy>} />
      <Route path="/register" element={<Lazy><Register /></Lazy>} />
      <Route path="/forgot-password" element={<Lazy><ForgotPassword /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPassword /></Lazy>} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Lazy><Dashboard /></Lazy>} />
        <Route path="pos" element={<Lazy><POS /></Lazy>} />
        <Route path="products" element={<Lazy><Products /></Lazy>} />
        <Route path="stock" element={<Lazy><Stock /></Lazy>} />
        <Route path="sales" element={<Lazy><Sales /></Lazy>} />
        <Route path="customers" element={<Lazy><Customers /></Lazy>} />
        <Route path="employees" element={<Lazy><Employees /></Lazy>} />
        <Route path="quotations" element={<Lazy><Quotations /></Lazy>} />
        <Route path="purchases" element={<Lazy><Purchases /></Lazy>} />
        <Route path="reports" element={<Lazy><Reports /></Lazy>} />
        <Route path="manufacturing" element={<Lazy><Manufacturing /></Lazy>} />
        <Route path="field-sales" element={<Lazy><FieldSales /></Lazy>} />
        <Route path="settings" element={<Lazy><Settings /></Lazy>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
