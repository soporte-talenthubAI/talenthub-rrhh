import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Lock, Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { clientConfig } from '@/config/client';

const Login = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Consultar la contraseña desde la base de datos
      const { data, error } = await (supabase
        .from('system_config' as any)
        .select('value')
        .eq('key', 'app_password')
        .single() as unknown as Promise<{ data: { value: string } | null; error: any }>);

      if (error) {
        console.error('Error al verificar contraseña:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo verificar la contraseña. Intente nuevamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data && password === data.value) {
        localStorage.setItem('authenticated', 'true');
        toast({
          title: "Acceso concedido",
          description: clientConfig.mensajeBienvenida,
        });
        navigate('/');
      } else {
        toast({
          title: "Acceso denegado",
          description: "Contraseña incorrecta",
          variant: "destructive",
        });
        setPassword('');
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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
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
