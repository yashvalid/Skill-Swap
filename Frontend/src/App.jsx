import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
          <Route path="/marketplace" element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>} />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>} />

          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>} />

          <Route path="/login" element={<Login />} />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Messaging />
            </ProtectedRoute>} />

          <Route path="/feed" element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>} />

          <Route path="/swap-flow" element={
            <ProtectedRoute>
              <SwapFlow />
            </ProtectedRoute>} />

          <Route path="/docs" element={
            <ProtectedRoute>
              <Docs />
            </ProtectedRoute>} />
        </Routes>
      </Layout>

      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
