import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500,
          style: { background: '#fff', color: '#171c1f', fontFamily: 'Inter, sans-serif', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,74,198,0.1)' }
        }} />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
