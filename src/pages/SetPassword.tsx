/**
 * Página para establecer contraseña después de recibir invitación
 * 
 * El usuario llega aquí desde el link del email de invitación.
 * Supabase maneja automáticamente el token de verificación.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Verificar si hay una sesión válida (viene del link de invitación)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Supabase automáticamente procesa el token del URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('El link de invitación es inválido o ha expirado');
          setChecking(false);
          return;
        }

        if (!session) {
          // Esperar un momento porque Supabase puede estar procesando el token
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (!retrySession) {
            setError('No se encontró una sesión válida. Por favor, usa el link del email de invitación.');
            setChecking(false);
            return;
          }
          
          setUserEmail(retrySession.user.email || null);
        } else {
          setUserEmail(session.user.email || null);
        }
        
        setChecking(false);
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Error al verificar la sesión');
        setChecking(false);
      }
    };

    checkSession();

    // Escuchar cambios de auth (cuando Supabase procesa el token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserEmail(session.user.email || null);
        setChecking(false);
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validar contraseña
  const validatePassword = () => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  // Establecer contraseña
  const handleSetPassword = async () => {
    const validationError = validatePassword();
    if (validationError) {
      toast({
        title: 'Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: '¡Contraseña establecida!',
        description: 'Tu cuenta está lista. Serás redirigido al login.',
      });

      // Cerrar sesión y redirigir al login
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Error setting password:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo establecer la contraseña',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Estado: Verificando
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-300">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Link Inválido</CardTitle>
            <CardDescription className="text-slate-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-slate-700/50 border-slate-600">
              <AlertDescription className="text-slate-300">
                Si crees que esto es un error, contacta al administrador para que te reenvíe la invitación.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta Activada!</h2>
            <p className="text-slate-400 mb-4">
              Tu contraseña ha sido establecida correctamente.
            </p>
            <p className="text-slate-500 text-sm">
              Redirigiendo al login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Formulario
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-emerald-500/20">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Establecer Contraseña</CardTitle>
          <CardDescription className="text-slate-400">
            Bienvenido a TalentHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail && (
            <Alert className="bg-emerald-500/10 border-emerald-500/50">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-300">
                Email verificado: <strong>{userEmail}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-slate-700 border-slate-600 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="bg-slate-700 border-slate-600 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
            />
          </div>

          {/* Indicadores de fortaleza */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}>
                Mínimo 6 caracteres
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={password === confirmPassword && password.length > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                Las contraseñas coinciden
              </span>
            </div>
          </div>

          <Button
            onClick={handleSetPassword}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading || password.length < 6 || password !== confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Establecer Contraseña'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;

