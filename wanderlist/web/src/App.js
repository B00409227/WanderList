// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import HomePage from './HomePage';
import MapPage from './MapPage';
import Profile from './Profile';
import ProtectedRoute from './ProtectedRoute';
import Navigation from './Navigation';
import AdminPage from './AdminPage';
import AdminMapPage from './AdminMapPage';
import { auth } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import Explore from './Explore';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AboutUs from './AboutUs';
import CollectionsPage from './CollectionsPage';
import NotFound from './NotFound';
import PageLoader from './PageLoader';
import PrivacyConsent from './PrivacyConsent';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <PageLoader message="Loading application..." />;
  }

  const isAdmin = user && user.email === 'mhabz1129@gmail.com';

  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <div className="page-transition">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/map" /> : <Auth />} 
            />

            <Route
              path="/admin"
              element={isAdmin ? <AdminPage /> : <Navigate to="/" />}
            />
            <Route
              path="/admin-map"
              element={isAdmin ? <AdminMapPage /> : <Navigate to="/" />}
            />

            <Route
              path="/map"
              element={
                <ProtectedRoute user={user}>
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<AboutUs />} />

            <Route path="/login" element={<Navigate to="/auth" />} />
            <Route path="/register" element={<Navigate to="/auth" />} />
            <Route
              path="/collections"
              element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <ToastContainer />
        <PrivacyConsent />
      </div>
    </Router>
  );
}

export default App;
