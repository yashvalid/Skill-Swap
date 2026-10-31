import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Messaging from './pages/Messaging';
import Feed from './pages/Feed';
import SwapFlow from './pages/SwapFlow';
import Docs from './pages/Docs';
import UserProfile from './pages/UserProfile';
import VideoCallModal from './components/VideoCallModal';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <VideoCallModal />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Public browsing routes */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile/:id" element={<UserProfile />} />

          {/* Member authenticated routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>} 
          />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>} 
          />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Messaging />
            </ProtectedRoute>} 
          />

          <Route path="/swap-flow" element={
            <ProtectedRoute>
              <SwapFlow />
            </ProtectedRoute>} 
          />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right"
        containerStyle={{ zIndex: 500 }}
        toastOptions={{
          style: {
            background: '#353B48',
            color: '#F5F6FA',
            border: '1px solid rgba(108, 92, 231, 0.4)',
            borderRadius: '0px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '0.875rem',
            letterSpacing: '-0.01em',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
          },
          success: {
            iconTheme: {
              primary: '#55E6C1',
              secondary: '#2F3640',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF7675',
              secondary: '#2F3640',
            },
          },
        }}
      />
    </>
  );
}

export default App;
