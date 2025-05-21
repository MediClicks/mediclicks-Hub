
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
import { Lock, Mail, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context'; // Crearemos este contexto
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    // **Simulación de Login (TEMPORAL Y NO SEGURO)**
    // En una implementación real, aquí llamarías a Firebase Auth
    // Por ahora, solo verificamos credenciales hardcodeadas (muy inseguro)
    // y asumimos que el login es exitoso para mostrar el flujo.
    // ¡ESTO DEBE SER REEMPLAZADO POR FIREBASE AUTH!
    if (email === 'admin@mediclicks.hub' && password === 'password123') {
      await login(email, password); // El login del contexto actualizará el estado
      router.push('/dashboard');
    } else {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    }
    setIsLoading(false);
  };

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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-xs text-center text-muted-foreground">
        © {new Date().getFullYear()} MediClicks Hub. Todos los derechos reservados.
        <br />
        <span className="font-bold text-destructive">Nota: Login temporal solo para desarrollo.</span>
      </p>
    </div>
  );
}
