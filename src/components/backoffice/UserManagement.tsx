/**
 * Gestión de Usuarios de la App
 * 
 * Permite desde el backoffice:
 * - Ver usuarios existentes
 * - Crear nuevos usuarios (invitar por email)
 * - Cambiar roles (admin, rrhh, viewer)
 * - Activar/desactivar usuarios
 * - Resetear contraseñas
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, UserPlus, Mail, Shield, 
  CheckCircle, XCircle, Key, Trash2, RefreshCw,
  User, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: 'admin' | 'rrhh' | 'viewer';
  is_active: boolean;
  ultimo_acceso: string | null;
  created_at: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  // Form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: 'viewer' as const,
  });

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as AppUser[]) || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear usuario
  const handleCreateUser = async () => {
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            nombre: newUser.nombre,
            apellido: newUser.apellido,
            rol: newUser.rol,
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: "Usuario creado",
        description: `Se envió un email de confirmación a ${newUser.email}`,
      });

      setShowCreateDialog(false);
      setNewUser({ email: '', password: '', nombre: '', apellido: '', rol: 'viewer' });
      loadUsers();
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      
      let message = 'No se pudo crear el usuario';
      if (error.message?.includes('already registered')) {
        message = 'Este email ya está registrado';
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Cambiar rol
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ rol: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, rol: newRole as any } : u
      ));

      toast({
        title: "Rol actualizado",
        description: `El rol se cambió a ${newRole}`,
      });
    } catch (error) {
      console.error('Error actualizando rol:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  // Activar/desactivar usuario
  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: isActive } : u
      ));

      toast({
        title: isActive ? "Usuario activado" : "Usuario desactivado",
        description: `El usuario fue ${isActive ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Resetear contraseña
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        selectedUser.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: `Se envió un link de recuperación a ${selectedUser.email}`,
      });

      setShowResetDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error reseteando contraseña:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación",
        variant: "destructive",
      });
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Badge de rol
  const getRoleBadge = (rol: string) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/50',
      rrhh: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    };
    const labels = {
      admin: 'Admin',
      rrhh: 'RRHH',
      viewer: 'Viewer',
    };
    return (
      <Badge variant="outline" className={styles[rol as keyof typeof styles]}>
        {labels[rol as keyof typeof labels] || rol}
      </Badge>
    );
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios de la Aplicación
            </CardTitle>
            <CardDescription className="text-slate-400">
              Gestiona los usuarios que pueden acceder a la app del cliente
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUsers}
              className="border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    El usuario recibirá un email para confirmar su cuenta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Nombre</Label>
                      <Input
                        value={newUser.nombre}
                        onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Juan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Apellido</Label>
                      <Input
                        value={newUser.apellido}
                        onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Pérez"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Contraseña inicial</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Rol</Label>
                    <Select
                      value={newUser.rol}
                      onValueChange={(value) => setNewUser({ ...newUser, rol: value as any })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Acceso total</SelectItem>
                        <SelectItem value="rrhh">RRHH - Gestión de personal</SelectItem>
                        <SelectItem value="viewer">Viewer - Solo lectura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={!newUser.email || !newUser.password || !newUser.nombre}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {filteredUsers.length} usuarios
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-sm text-slate-400">Total</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">
              {users.filter(u => u.is_active).length}
            </div>
            <div className="text-sm text-slate-400">Activos</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.rol === 'admin').length}
            </div>
            <div className="text-sm text-slate-400">Admins</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.rol === 'rrhh').length}
            </div>
            <div className="text-sm text-slate-400">RRHH</div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-400">Usuario</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Rol</TableHead>
              <TableHead className="text-slate-400">Estado</TableHead>
              <TableHead className="text-slate-400">Último acceso</TableHead>
              <TableHead className="text-slate-400 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-700">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                        {user.nombre[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {user.nombre} {user.apellido}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.rol}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-28 bg-transparent border-0 p-0">
                        {getRoleBadge(user.rol)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="rrhh">RRHH</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                      />
                      <span className={user.is_active ? 'text-emerald-400' : 'text-red-400'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {user.ultimo_acceso 
                      ? new Date(user.ultimo_acceso).toLocaleDateString('es-AR')
                      : 'Nunca'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetDialog(true);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Reset Password Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Resetear Contraseña</DialogTitle>
              <DialogDescription className="text-slate-400">
                Se enviará un email a {selectedUser?.email} con un link para crear una nueva contraseña.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleResetPassword}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;

