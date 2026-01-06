/**
 * Gestión de Usuarios por Cliente
 *
 * Permite:
 * - Ver usuarios asignados a un cliente
 * - Invitar nuevos usuarios
 * - Cambiar roles de usuarios
 * - Desactivar usuarios
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'rrhh' | 'viewer';
  is_active: boolean;
  invited_at: string;
  last_access: string | null;
}

interface ClientUserManagerProps {
  clientId: string | null;
  clientName: string | null;
}

const ClientUserManager = ({ clientId, clientName }: ClientUserManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', password: '', role: 'viewer' as const });
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

  // Crear usuario - usa Edge Function para crear en Auth (sin confirmación de email)
  const handleInviteUser = async () => {
    if (!inviteData.email || !inviteData.password) {
      toast({
        title: 'Error',
        description: 'Ingresa email y contraseña',
        variant: 'destructive',
      });
      return;
    }

    if (inviteData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
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

      // 1. Crear usuario en Supabase Auth usando Edge Function (sin confirmación de email)
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lmxyphwydubacsekkyxi.supabase.co'}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_user',
          email: inviteData.email,
          password: inviteData.password,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      // 2. Crear el registro en tenant_users
      const { data, error } = await (supabase as any)
        .from('tenant_users')
        .insert({
          user_id: result.user?.id || null,
          tenant_id: clientId,
          email: inviteData.email,
          role: inviteData.role,
          is_active: true,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data, ...prev]);
      setShowInviteDialog(false);
      setInviteData({ email: '', password: '', role: 'viewer' });

      toast({
        title: 'Usuario creado exitosamente',
        description: `${inviteData.email} puede acceder inmediatamente con la contraseña definida`,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el usuario',
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
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const { error } = await (supabase as any)
        .from('tenant_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado',
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
              Agregar Usuario
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
              <p className="text-sm mt-2">Haz clic en "Agregar Usuario" para invitar al primer usuario</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Restablecer contraseña"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Crear Usuario Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              Crear un nuevo usuario para {clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
              <Label className="text-slate-300">Contraseña</Label>
              <Input
                type="password"
                value={inviteData.password}
                onChange={(e) => setInviteData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
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
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInviteUser}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Crear Usuario
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
                type="password"
                value={passwordChangeData.newPassword}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="bg-slate-700 border-slate-600 text-white"
              />
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
