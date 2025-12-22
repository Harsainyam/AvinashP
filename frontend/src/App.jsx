import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/Common/ProtectedRoute';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import OTPVerification from './components/Auth/OTPVerification';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionHistory from './components/Transaction/TransactionHistory';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;