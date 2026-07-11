import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import { setupAutoSync } from './services/offlineSync';

setupAutoSync();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#fff', color: '#1e293b', borderRadius: '12px', fontSize: '13px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }} />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
