import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Lock, Loader2, Building2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { clientConfig } from '@/config/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Usar Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error de autenticación:', error);
        
        // Mensajes de error amigables
        let errorMessage = 'Credenciales incorrectas';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Debe confirmar su email antes de ingresar';
        }
        
        toast({
          title: "Acceso denegado",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Verificar si el email está confirmado
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          toast({
            title: "Email no verificado",
            description: "Revisa tu correo para verificar tu cuenta antes de ingresar.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Verificar si el usuario está activo
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_active, nombre, rol')
          .eq('id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          toast({
            title: "Cuenta desactivada",
            description: "Su cuenta ha sido desactivada. Contacte al administrador.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Actualizar último acceso
        await supabase
          .from('user_profiles')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', data.user.id);

        // Guardar en localStorage para compatibilidad
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('user_role', profile?.rol || 'viewer');
        localStorage.setItem('user_name', profile?.nombre || email);
        
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${profile?.nombre || 'Usuario'}`,
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {clientConfig.logoUrl ? (
              <img 
                src={clientConfig.logoUrl} 
                alt={clientConfig.nombre}
                className="h-20 w-20 object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {clientConfig.nombre}
          </CardTitle>
          <CardDescription>
            Sistema de Gestión de RRHH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
