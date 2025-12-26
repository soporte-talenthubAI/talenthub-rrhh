/**
 * Panel de Administración TalentHub (Backoffice)
 *
 * Acceso: /backoffice
 * Login: soporte@talenthub.com / TalentHub2024!
 *
 * Funcionalidades:
 * - Gestionar clientes (CRUD)
 * - Gestionar módulos por cliente
 * - Gestionar usuarios por cliente
 * - Templates de documentos
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Users, Settings, LogOut, Plus, Search,
  CheckCircle, XCircle, Clock, CreditCard,
  LayoutDashboard, Shield, FileText, Pencil, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackoffice, TalentHubClient } from "@/hooks/useBackoffice";
import { supabase } from "@/integrations/supabase/client";
import TemplateEditor from "@/components/backoffice/TemplateEditor";
import SubscriptionManager from "@/components/backoffice/SubscriptionManager";
import ClientUserManager from "@/components/backoffice/ClientUserManager";

const Backoffice = () => {
  const { toast } = useToast();
  const {
    clients,
    modules,
    loading,
    isBackofficeAvailable,
    createClient,
    updateClient,
    deleteClient,
  } = useBackoffice();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<TalentHubClient | null>(null);
  const [newClient, setNewClient] = useState({
    nombre: '',
    nombre_corto: '',
    email_contacto: '',
    telefono: '',
    plan: 'basic' as const,
    status: 'active' as const,
  });
  const [editClient, setEditClient] = useState<Partial<TalentHubClient>>({});

  // Obtener cliente seleccionado
  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  // Check auth on mount
  useEffect(() => {
    const auth = localStorage.getItem('backoffice_auth');
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Seleccionar primer cliente cuando se cargan
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Login handler
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase
        .from('talenthub_admins')
        .select('*')
        .eq('email', loginData.email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Error de autenticación",
          description: "Credenciales inválidas",
          variant: "destructive",
        });
        return;
      }

      if (loginData.password === 'TalentHub2024!' && data.email === 'soporte@talenthub.com') {
        localStorage.setItem('backoffice_auth', JSON.stringify({
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          role: data.role
        }));

        await supabase
          .from('talenthub_admins')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);

        setIsAuthenticated(true);
        toast({
          title: "Bienvenido",
          description: `Hola ${data.nombre}, has iniciado sesión correctamente`,
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Credenciales inválidas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Error al intentar iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('backoffice_auth');
    setIsAuthenticated(false);
  };

  // Create new client
  const handleCreateClient = async () => {
    try {
      const created = await createClient(newClient as any);
      setShowNewClientDialog(false);
      setNewClient({
        nombre: '',
        nombre_corto: '',
        email_contacto: '',
        telefono: '',
        plan: 'basic',
        status: 'active',
      });
      // Seleccionar el cliente recién creado
      if (created?.id) {
        setSelectedClientId(created.id);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (client: TalentHubClient) => {
    setEditClient({
      id: client.id,
      nombre: client.nombre,
      nombre_corto: client.nombre_corto || '',
      email_contacto: client.email_contacto || '',
      telefono: client.telefono || '',
      cuit: client.cuit || '',
      direccion: client.direccion || '',
      plan: client.plan,
      status: client.status,
      color_primario: client.color_primario,
      color_secundario: client.color_secundario,
    });
    setShowEditClientDialog(true);
  };

  // Update client
  const handleUpdateClient = async () => {
    if (!editClient.id) return;
    try {
      await updateClient(editClient.id, editClient);
      setShowEditClientDialog(false);
      setEditClient({});
    } catch (error) {
      // Error handled in hook
    }
  };

  // Delete client
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      setShowDeleteConfirm(false);
      // Si se eliminó el cliente seleccionado, seleccionar otro
      if (selectedClientId === clientToDelete.id) {
        const remaining = clients.filter(c => c.id !== clientToDelete.id);
        setSelectedClientId(remaining[0]?.id || '');
      }
      setClientToDelete(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email_contacto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle },
      suspended: { variant: 'destructive', icon: XCircle },
      trial: { variant: 'secondary', icon: Clock },
      cancelled: { variant: 'outline', icon: XCircle },
    };
    const { variant, icon: Icon } = variants[status] || variants.active;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Shield className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">TalentHub Backoffice</CardTitle>
            <CardDescription className="text-slate-400">
              Panel de administración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="soporte@talenthub.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={authLoading}
            >
              {authLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if backoffice tables exist
  if (!isBackofficeAvailable) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>Las tablas de backoffice no están configuradas en esta base de datos.</p>
            <p>Ejecute la migración:</p>
            <code className="block bg-slate-900 p-3 rounded text-sm text-emerald-400">
              20251219000001_talenthub_backoffice.sql
            </code>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TalentHub Backoffice</h1>
                <p className="text-sm text-slate-400">Panel de Administración</p>
              </div>
            </div>

            {/* Selector de Cliente Global */}
            <div className="flex items-center gap-2 ml-8">
              <Building2 className="h-4 w-4 text-slate-400" />
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: client.color_primario }}
                        />
                        {client.nombre}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {client.plan}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleLogout} variant="ghost" className="text-slate-300 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="clients" className="data-[state=active]:bg-emerald-600">
              <Building2 className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-emerald-600">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Módulos
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-emerald-600">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Clientes Tab */}
          <TabsContent value="clients" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Clientes</p>
                      <p className="text-2xl font-bold text-white">{clients.length}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Plan Basic</p>
                      <p className="text-2xl font-bold text-slate-400">
                        {clients.filter(c => c.plan === 'basic').length}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Plan Professional</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {clients.filter(c => c.plan === 'professional').length}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Plan Enterprise</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {clients.filter(c => c.plan === 'enterprise').length}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clients List */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Clientes</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white w-64"
                      />
                    </div>
                    <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Nuevo Cliente</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Registra un nuevo cliente en el sistema
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Nombre</Label>
                              <Input
                                value={newClient.nombre}
                                onChange={(e) => setNewClient(prev => ({ ...prev, nombre: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Nombre Corto</Label>
                              <Input
                                value={newClient.nombre_corto}
                                onChange={(e) => setNewClient(prev => ({ ...prev, nombre_corto: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Email</Label>
                              <Input
                                type="email"
                                value={newClient.email_contacto}
                                onChange={(e) => setNewClient(prev => ({ ...prev, email_contacto: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Teléfono</Label>
                              <Input
                                value={newClient.telefono}
                                onChange={(e) => setNewClient(prev => ({ ...prev, telefono: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Plan</Label>
                              <Select
                                value={newClient.plan}
                                onValueChange={(v) => setNewClient(prev => ({ ...prev, plan: v as any }))}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Estado</Label>
                              <Select
                                value={newClient.status}
                                onValueChange={(v) => setNewClient(prev => ({ ...prev, status: v as any }))}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Activo</SelectItem>
                                  <SelectItem value="trial">Prueba</SelectItem>
                                  <SelectItem value="suspended">Suspendido</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button onClick={handleCreateClient} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Crear Cliente
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Cliente</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Plan</TableHead>
                      <TableHead className="text-slate-300">Estado</TableHead>
                      <TableHead className="text-slate-300">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                          Cargando...
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                          No se encontraron clientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow
                          key={client.id}
                          className={`border-slate-700 cursor-pointer transition-colors ${selectedClientId === client.id ? 'bg-emerald-900/20' : 'hover:bg-slate-700/50'}`}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: client.color_primario }}
                              >
                                {client.nombre_corto?.[0] || client.nombre[0]}
                              </div>
                              <div>
                                <p className="font-medium text-white">{client.nombre}</p>
                                <p className="text-sm text-slate-400">{client.nombre_corto}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{client.email_contacto}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {client.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(client.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(client)}
                                className="text-blue-400 hover:text-blue-300"
                                title="Editar cliente"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setClientToDelete(client);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-400 hover:text-red-300"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Client Dialog */}
            <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Editar Cliente</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Modifica los datos del cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Nombre *</Label>
                      <Input
                        value={editClient.nombre || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, nombre: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Nombre Corto</Label>
                      <Input
                        value={editClient.nombre_corto || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, nombre_corto: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={editClient.email_contacto || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, email_contacto: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Teléfono</Label>
                      <Input
                        value={editClient.telefono || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, telefono: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">CUIT</Label>
                      <Input
                        value={editClient.cuit || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, cuit: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="XX-XXXXXXXX-X"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Dirección</Label>
                      <Input
                        value={editClient.direccion || ''}
                        onChange={(e) => setEditClient(prev => ({ ...prev, direccion: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Plan</Label>
                      <Select
                        value={editClient.plan || 'basic'}
                        onValueChange={(v) => setEditClient(prev => ({ ...prev, plan: v as any }))}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Estado</Label>
                      <Select
                        value={editClient.status || 'active'}
                        onValueChange={(v) => setEditClient(prev => ({ ...prev, status: v as any }))}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="trial">Prueba</SelectItem>
                          <SelectItem value="suspended">Suspendido</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Color Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editClient.color_primario || '#10b981'}
                          onChange={(e) => setEditClient(prev => ({ ...prev, color_primario: e.target.value }))}
                          className="w-12 h-10 p-1 bg-slate-700 border-slate-600"
                        />
                        <Input
                          value={editClient.color_primario || '#10b981'}
                          onChange={(e) => setEditClient(prev => ({ ...prev, color_primario: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Color Secundario</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editClient.color_secundario || '#064e3b'}
                          onChange={(e) => setEditClient(prev => ({ ...prev, color_secundario: e.target.value }))}
                          className="w-12 h-10 p-1 bg-slate-700 border-slate-600"
                        />
                        <Input
                          value={editClient.color_secundario || '#064e3b'}
                          onChange={(e) => setEditClient(prev => ({ ...prev, color_secundario: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditClientDialog(false)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateClient}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Confirmar Eliminación</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    ¿Estás seguro de que deseas eliminar al cliente <span className="font-semibold text-white">{clientToDelete?.nombre}</span>?
                    Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setClientToDelete(null);
                    }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteClient}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Módulos Tab - usa el cliente seleccionado */}
          <TabsContent value="modules">
            <SubscriptionManager
              tenantId={selectedClientId || null}
              tenantName={selectedClient?.nombre || null}
            />
          </TabsContent>

          {/* Usuarios Tab - gestión de usuarios por cliente */}
          <TabsContent value="users">
            <ClientUserManager
              clientId={selectedClientId || null}
              clientName={selectedClient?.nombre || null}
            />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <TemplateEditor />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Backoffice;
