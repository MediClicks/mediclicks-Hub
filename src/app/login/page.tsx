
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Renamed for clarity

  React.useEffect(() => {
    // Redirect if already authenticated and auth is not loading
    if (!isLoadingAuth && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoadingAuth, router]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      // No need to push here, the useEffect in AppLayout or this page will handle redirection
      // after isAuthenticated state updates.
    } catch (err: any) {
      let errorMessage = 'Ocurrió un error inesperado al iniciar sesión.';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del email no es válido.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
            break;
          default:
            errorMessage = `Error: ${err.message}`;
        }
      }
      setError(errorMessage);
      console.error("Login page error details:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If auth state is still loading, don't render the form yet or show a page loader
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated after loading, router.push in useEffect should have redirected.
  // This is a fallback or in case redirection is slower.
  if (isAuthenticated) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
      <Card className="w-full max-w-sm shadow-2xl border-t-4 border-primary">
        <CardHeader className="space-y-2 text-center">
          <Image 
            src="/images/logo-mediclicks.png" 
            alt="MediClicks Hub Logo" 
            width={80} 
            height={80} 
            className="mx-auto mb-4"
            data-ai-hint="company logo"
          />
          <CardTitle className="text-3xl font-bold text-primary">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a MediClicks Hub.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-xs text-center text-muted-foreground">
        © {new Date().getFullYear()} MediClicks Hub. Todos los derechos reservados.
      </p>
    </div>
  );
}
