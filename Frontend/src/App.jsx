import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import VideoCallModal from './components/VideoCallModal';
import ProtectedRoute from './components/ProtectedRoute';

const Marketplace = lazy(() => import('./pages/Marketplace'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Messaging = lazy(() => import('./pages/Messaging'));
const Feed = lazy(() => import('./pages/Feed'));
const SwapFlow = lazy(() => import('./pages/SwapFlow'));
const Docs = lazy(() => import('./pages/Docs'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

const PageLoader = () => (
  <div className="max-w-[1280px] mx-auto px-6 py-16 space-y-6">
    <div className="h-8 w-56 skeleton-shimmer rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-44 skeleton-shimmer rounded-2xl" />
      <div className="h-44 skeleton-shimmer rounded-2xl" />
      <div className="h-44 skeleton-shimmer rounded-2xl" />
    </div>
  </div>
);

const NotFound = () => (
  <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
    <div className="ui-card max-w-md mx-auto p-8 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl space-y-4">
      <span className="tag-chip text-xs">404 • PAGE NOT FOUND</span>
      <h1 className="heading-h1 text-2xl text-[#F7F8FC]">Route Does Not Exist</h1>
      <p className="body-md text-xs text-[#A4B0C6]">
        The page you requested could not be found on SkillSwap.
      </p>
      <Link to="/" className="btn btn-primary text-xs py-2.5 px-5 rounded-xl inline-flex">
        Return Home
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <>
      <VideoCallModal />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Public browsing routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 500 }}
        toastOptions={{
          style: {
            background: '#283144',
            color: '#F7F8FC',
            border: '1px solid rgba(43, 63, 116, 0.4)',
            borderRadius: '12px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '0.875rem',
            letterSpacing: '-0.01em',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
          },
          success: {
            iconTheme: {
              primary: '#FFEEA8',
              secondary: '#202738',
            },
          },
          error: {
            iconTheme: {
              primary: '#D72E2B',
              secondary: '#202738',
            },
          },
        }}
      />
    </>
  );
}

export default App;
