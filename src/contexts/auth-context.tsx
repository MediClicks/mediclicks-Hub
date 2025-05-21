
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser // Import Firebase User type
} from 'firebase/auth';
import { app } from '@/lib/firebase'; // Import your Firebase app instance

interface AuthContextType {
  isAuthenticated: boolean;
  user: FirebaseUser | null; // Store the Firebase user object
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const auth = getAuth(app); // Get auth instance

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user and redirecting
      // No need to explicitly setUser here or push route, AppLayout handles redirection based on auth state
    } catch (error: any) {
      // Firebase Auth errors have a 'code' property
      console.error("Firebase login error:", error.code, error.message);
      throw error; // Re-throw the error so LoginPage can handle it
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Clear user state
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally show a toast message for sign-out error
    }
  };
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
