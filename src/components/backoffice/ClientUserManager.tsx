/**
 * Gestión de Usuarios por Cliente
 *
 * Permite:
 * - Ver usuarios asignados a un cliente
 * - Invitar nuevos usuarios por email
 * - Cambiar roles de usuarios
 * - Desactivar usuarios
 * - Reenviar invitaciones
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  KeyRound,
  Send,
  AlertTriangle,
  MailCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantUser {
  id: string;
  user_id: string | null;
  tenant_id: string;
  email: string;
  role: 'admin' | 'rrhh' | 'viewer';
  is_active: boolean;
  invited_at: string;
  last_access: string | null;
  email_verified?: boolean;
}

interface ClientUserManagerProps {
  clientId: string | null;
  clientName: string | null;
}

// Generar contraseña temporal
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const ClientUserManager = ({ clientId, clientName }: ClientUserManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'viewer' as const });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState<{ userId: string; email: string; newPassword: string }>({ userId: '', email: '', newPassword: '' });

  // Si no hay cliente seleccionado
  if (!clientId) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Selecciona un Cliente</h3>
          <p className="text-slate-400">
            Selecciona un cliente del menú superior para gestionar sus usuarios.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Cargar usuarios del cliente
  useEffect(() => {
    const loadUsers = async () => {
      if (!clientId) return;

      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('tenant_users')
          .select('*')
          .eq('tenant_id', clientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [clientId]);

  // Invitar usuario por email - requiere verificación
  const handleInviteUser = async () => {
    if (!inviteData.email) {
      toast({
        title: 'Error',
        description: 'Ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    // Verificar si el usuario ya existe en este tenant
    const existingUser = users.find(u => u.email === inviteData.email);
    if (existingUser) {
      toast({
        title: 'Error',
        description: 'Este email ya está registrado para este cliente',
        variant: 'destructive',
      });
      return;
    }

    setInviteLoading(true);
    try {
      // 1. Llamar a Edge Function para invitar por email
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lmxyphwydubacsekkyxi.supabase.co'}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'invite_user',
          email: inviteData.email,
          tenantId: clientId,
          role: inviteData.role,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar invitación');
      }

      // 2. Crear el registro en tenant_users (user_id será null hasta que verifique)
      const { data, error } = await (supabase as any)
        .from('tenant_users')
        .insert({
          user_id: result.user?.id || null,
          tenant_id: clientId,
          email: inviteData.email,
          role: inviteData.role,
          is_active: true,
          invited_at: new Date().toISOString(),
          email_verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data, ...prev]);
      setShowInviteDialog(false);
      setInviteData({ email: '', role: 'viewer' });

      toast({
        title: 'Invitación enviada',
        description: `Se envió un email a ${inviteData.email} para que establezca su contraseña`,
      });
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la invitación',
        variant: 'destructive',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Reenviar invitación
  const handleResendInvite = async (email: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lmxyphwydubacsekkyxi.supabase.co'}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'resend_invite',
          email: email,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al reenviar invitación');
      }

      toast({
        title: 'Invitación reenviada',
        description: `Se reenvió el email de invitación a ${email}`,
      });
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reenviar la invitación',
        variant: 'destructive',
      });
    }
  };

  // Resetear contraseña de un usuario
  const handleResetPassword = async (userId: string, email: string) => {
    setPasswordChangeData({ userId, email, newPassword: generateTempPassword() });
    setShowPasswordDialog(true);
  };

  // Confirmar cambio de contraseña - usa Edge Function
  const handleConfirmPasswordChange = async () => {
    if (!passwordChangeData.newPassword || passwordChangeData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Llamar a la Edge Function para cambiar contraseña
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lmxyphwydubacsekkyxi.supabase.co'}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_password',
          userId: passwordChangeData.userId,
          password: passwordChangeData.newPassword,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar contraseña');
      }

      setShowPasswordDialog(false);
      setPasswordChangeData({ userId: '', email: '', newPassword: '' });
      
      toast({
        title: 'Contraseña actualizada',
        description: `La contraseña de ${passwordChangeData.email} ha sido cambiada`,
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    }
  };

  // Cambiar rol de usuario
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tenant_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole as any } : u
      ));

      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido actualizado',
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    }
  };

  // Toggle estado activo
  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('tenant_users')
        .update({ is_active: !currentActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !currentActive } : u
      ));

      toast({
        title: currentActive ? 'Usuario desactivado' : 'Usuario activado',
        description: `El usuario ha sido ${currentActive ? 'desactivado' : 'activado'}`,
      });
    } catch (error) {
      console.error('Error toggling user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string, authUserId: string | null) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      // 1. Eliminar de tenant_users
      const { error } = await (supabase as any)
        .from('tenant_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // 2. Si tiene user_id, también eliminar de Auth
      if (authUserId) {
        const { data: session } = await supabase.auth.getSession();
        
        await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lmxyphwydubacsekkyxi.supabase.co'}/functions/v1/admin-update-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'delete_user',
            userId: authUserId,
          }),
        });
      }

      setUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado completamente',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    }
  };

  // Badge de rol
  const getRoleBadge = (role: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-purple-500', label: 'Administrador' },
      rrhh: { color: 'bg-blue-500', label: 'RRHH' },
      viewer: { color: 'bg-slate-500', label: 'Visor' },
    };
    const { color, label } = variants[role] || variants.viewer;
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  // Badge de estado de verificación
  const getVerificationBadge = (user: TenantUser) => {
    if (user.user_id && user.last_access) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          <MailCheck className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios de {clientName}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay usuarios registrados para este cliente</p>
              <p className="text-sm mt-2">Haz clic en "Invitar Usuario" para enviar la primera invitación</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
                  <TableHead className="text-slate-300">Verificación</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Último Acceso</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-slate-700">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-white">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleChangeRole(user.id, v)}
                      >
                        <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="rrhh">RRHH</SelectItem>
                          <SelectItem value="viewer">Visor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {getVerificationBadge(user)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={user.is_active ? 'bg-green-500' : 'bg-red-500'}
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        style={{ cursor: 'pointer' }}
                      >
                        {user.is_active ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {user.last_access ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(user.last_access).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-500">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Reenviar invitación solo si no ha verificado */}
                        {!user.last_access && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(user.email)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Reenviar invitación"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Resetear contraseña solo si ya verificó */}
                        {user.user_id && user.last_access && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.user_id!, user.email)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Restablecer contraseña"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.user_id)}
                          className="text-red-400 hover:text-red-300"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitar Usuario Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Invitar Usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              Invitar un nuevo usuario a {clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <Mail className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Se enviará un email de invitación. El usuario deberá hacer clic en el link para establecer su contraseña.
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                Plan gratuito: máximo 4 emails por hora
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@ejemplo.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Rol</Label>
              <Select
                value={inviteData.role}
                onValueChange={(v) => setInviteData(prev => ({ ...prev, role: v as any }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador - Acceso completo</SelectItem>
                  <SelectItem value="rrhh">RRHH - Gestión de empleados</SelectItem>
                  <SelectItem value="viewer">Visor - Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1 border-slate-600 text-slate-300"
                disabled={inviteLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInviteUser}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={inviteLoading}
              >
                {inviteLoading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Invitación
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cambiar Contraseña Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cambiar contraseña de: {passwordChangeData.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nueva Contraseña</Label>
              <Input
                type="text"
                value={passwordChangeData.newPassword}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="bg-slate-700 border-slate-600 text-white font-mono"
              />
              <p className="text-xs text-slate-500">
                Comparte esta contraseña con el usuario de forma segura
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmPasswordChange}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Guardar Contraseña
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientUserManager;
