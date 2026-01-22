import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import JoinPage from './pages/JoinPage';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import QnA from './pages/QnA';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pastel-bg">Loading...</div>;
  if (!user) return <Navigate to="/join" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/join" element={<JoinPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="qna" element={<QnA />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
