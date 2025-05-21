
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>; // Simulado por ahora
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mediClicksHubAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Para verificar el estado inicial
  const router = useRouter();

  useEffect(() => {
    // Verificar el estado de autenticación desde localStorage al cargar
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Simulación de login
  const login = async (email: string, pass: string) => {
    // ¡¡¡ADVERTENCIA: ESTO ES SOLO UNA SIMULACIÓN Y NO ES SEGURO!!!
    // En una aplicación real, aquí llamarías a Firebase Auth o tu backend.
    // Por ahora, solo comprobamos credenciales hardcodeadas.
    if (email === 'admin@mediclicks.hub' && pass === 'password123') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      // No es necesario redirigir aquí, la página de login lo hará.
    } else {
      // El manejo de error de credenciales se hará en la página de login
      throw new Error('Credenciales incorrectas');
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    router.push('/login'); // Redirigir a login al cerrar sesión
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
