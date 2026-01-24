import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { isSupabaseConfigured } from './lib/supabase';
import JoinPage from './pages/JoinPage';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import AddMood from './pages/AddMood';
import Profile from './pages/Profile';
import Insights from './pages/Insights';
import QnA from './pages/QnA';
import Layout from './components/Layout';

// Safety check screen
const ConfigErrorScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-red-50 text-red-900">
    <h1 className="text-3xl font-bold mb-4">😿 Meow... Setup Needed!</h1>
    <p className="max-w-md text-lg">
      The app couldn't connect to the database.
    </p>
    <div className="mt-6 bg-white p-6 rounded-xl shadow-sm text-left text-sm font-mono border border-red-100 overflow-x-auto w-full max-w-lg">
      <p className="font-bold text-gray-500 mb-2">Missing Environment Variables:</p>
      <p>VITE_SUPABASE_URL</p>
      <p>VITE_SUPABASE_ANON_KEY</p>
    </div>
    <p className="mt-6 text-sm text-gray-600">
      If you are on Vercel, go to <strong>Settings &gt; Environment Variables</strong> and add them.
    </p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pastel-bg text-gray-400 font-medium animate-pulse">Loading...</div>;
  if (!user) return <Navigate to="/join" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/join" element={<JoinPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="add" element={<AddMood />} />
        <Route path="profile" element={<Profile />} />
        <Route path="insights" element={<Insights />} />
        <Route path="qna" element={<QnA />} />

        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="history" element={<Navigate to="/calendar" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}

export default App;
