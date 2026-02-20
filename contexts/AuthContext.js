'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount and handle state synchronization
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Failed to parse saved user', e);
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } else {
          // If one is missing, clear both for consistency
          if (token || savedUser) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (e.g., from api interceptor)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuth);
      return () => window.removeEventListener('storage', checkAuth);
    }
  }, []);

  const { data: session, status } = useSession();

  // Handle NextAuth session synchronization
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const googleUser = {
        username: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email,
        image: session.user.image,
        isGoogle: true
      };

      setUser(googleUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(googleUser));
        // We might not have a traditional JWT token for Google users in the same way, 
        // but the session itself handles auth.
      }
    } else if (status === "unauthenticated" && user?.isGoogle) {
      // If we were logged in via Google but now we aren't, clear the internal state
      logout();
    }
  }, [session, status]);

  const signup = async (email, username, password) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      const { token, user } = data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signin = async (email, password) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signin failed');
      }

      const { token, user } = data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Signin failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    setUser(null);
    setError(null);
    if (session) {
      await signOut({ redirect: false });
    }
  };

  // Update user info in context and localStorage
  const updateUser = (newUser) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, signin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
