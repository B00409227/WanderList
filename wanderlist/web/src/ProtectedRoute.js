// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';  // Import Firebase config

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // State to handle loading

  // Check authentication status when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);  // Set authenticated user
      } else {
        setUser(null);  // Clear user if not authenticated
      }
      setLoading(false);  // Loading is complete
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Optional: Add a better loading UI, like a spinner or skeleton screen
    return <div>Loading...</div>;
  }

  // If user is authenticated, render children components; otherwise, redirect to login
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
