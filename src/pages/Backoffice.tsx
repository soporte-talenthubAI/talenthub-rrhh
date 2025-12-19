/**
 * Panel de Administración TalentHub (Backoffice)
 * 
 * Acceso: /backoffice
 * Login: soporte@talenthub.com / TalentHub2024!
 * 
 * Funcionalidades:
 * - Gestionar clientes
 * - Habilitar/deshabilitar módulos por cliente
 * - Ver estadísticas generales
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Users, Settings, LogOut, Plus, Search, 
  CheckCircle, XCircle, Clock, CreditCard, Palette,
  LayoutDashboard, Shield, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackoffice, TalentHubClient } from "@/hooks/useBackoffice";
import { supabase } from "@/integrations/supabase/client";
import TemplateEditor from "@/components/backoffice/TemplateEditor";
import ClientConfigEditor from "@/components/backoffice/ClientConfigEditor";
import UserManagement from "@/components/backoffice/UserManagement";

const Backoffice = () => {
  const { toast } = useToast();
  const { 
    clients, 
    modules, 
    loading, 
    isBackofficeAvailable,
    createClient,
    updateClient,
    getClientModules,
    toggleClientModule 
  } = useBackoffice();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<TalentHubClient | null>(null);
  const [clientModules, setClientModules] = useState<Record<string, boolean>>({});
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    nombre_corto: '',
    email_contacto: '',
    telefono: '',
    plan: 'basic' as const,
    status: 'active' as const,
  });

  // Check auth on mount
  useEffect(() => {
    const auth = localStorage.getItem('backoffice_auth');
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login handler
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      // Verificar credenciales contra la tabla de admins
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

      // TODO: Verificar password hash con bcrypt
      // Por ahora, verificación simple para desarrollo
      if (loginData.password === 'TalentHub2024!' && data.email === 'soporte@talenthub.com') {
        localStorage.setItem('backoffice_auth', JSON.stringify({ 
          id: data.id, 
          email: data.email,
          nombre: data.nombre,
          role: data.role 
        }));
        
        // Actualizar último login
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

  // Load client modules when selecting a client
  const handleSelectClient = async (client: TalentHubClient) => {
    setSelectedClient(client);
    const mods = await getClientModules(client.id);
    const modMap: Record<string, boolean> = {};
    modules.forEach(m => {
      const clientMod = mods.find(cm => cm.module_id === m.id);
      modMap[m.id] = clientMod?.is_enabled ?? m.is_core;
    });
    setClientModules(modMap);
  };

  // Toggle module for client
  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    if (!selectedClient) return;
    
    const success = await toggleClientModule(selectedClient.id, moduleId, enabled);
    if (success) {
      // Actualizar estado local
      const newModules = { ...clientModules, [moduleId]: enabled };
      setClientModules(newModules);
      
      // Sincronizar con client_config.modulos_habilitados
      // Obtener lista de módulos habilitados (incluyendo core modules)
      const enabledModuleIds = modules
        .filter(m => m.is_core || newModules[m.id])
        .map(m => m.key);
      
      // Actualizar client_config si existe
      try {
        await supabase
          .from('client_config')
          .update({ modulos_habilitados: enabledModuleIds })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // update all
        console.log('✅ Módulos sincronizados con client_config:', enabledModuleIds);
      } catch (e) {
        console.log('⚠️ client_config no existe, solo se actualizó talenthub_client_modules');
      }
    }
  };

  // Create new client
  const handleCreateClient = async () => {
    try {
      await createClient(newClient as any);
      setShowNewClientDialog(false);
      setNewClient({
        nombre: '',
        nombre_corto: '',
        email_contacto: '',
        telefono: '',
        plan: 'basic',
        status: 'active',
      });
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TalentHub Backoffice</h1>
              <p className="text-sm text-slate-400">Panel de Administración</p>
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
            <TabsTrigger value="templates" className="data-[state=active]:bg-emerald-600">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-emerald-600">
              <Settings className="h-4 w-4 mr-2" />
              Config Cliente
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
                      <p className="text-sm text-slate-400">Activos</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {clients.filter(c => c.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">En Prueba</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {clients.filter(c => c.status === 'trial').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Enterprise</p>
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
                        <TableRow key={client.id} className="border-slate-700">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectClient(client)}
                              className="text-slate-300 hover:text-white"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Configurar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Client Config Panel */}
            {selectedClient && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Configuración: {selectedClient.nombre}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Plan actual: <span className="font-semibold text-emerald-400">{selectedClient.plan.toUpperCase()}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedClient.plan}
                        onValueChange={async (newPlan) => {
                          await updateClient(selectedClient.id, { plan: newPlan as any });
                          setSelectedClient({ ...selectedClient, plan: newPlan as any });
                        }}
                      >
                        <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClient(null)}
                        className="text-slate-400"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Leyenda de planes */}
                  <div className="flex gap-4 mb-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-500"></span> Basic</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Professional</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500"></span> Enterprise</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => {
                      // Verificar si el módulo está disponible para el plan del cliente
                      const planOrder = { basic: 1, professional: 2, enterprise: 3 };
                      const moduleMinPlan = module.plan_minimo || 'basic';
                      const clientPlan = selectedClient.plan || 'basic';
                      const isAvailableForPlan = planOrder[clientPlan as keyof typeof planOrder] >= planOrder[moduleMinPlan as keyof typeof planOrder];
                      
                      // Color según plan mínimo
                      const planColors = {
                        basic: 'border-slate-500',
                        professional: 'border-blue-500',
                        enterprise: 'border-purple-500',
                      };
                      
                      return (
                        <div
                          key={module.id}
                          className={`flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border-2 ${planColors[moduleMinPlan as keyof typeof planColors] || 'border-slate-600'} ${!isAvailableForPlan ? 'opacity-50' : ''}`}
                        >
                          <div>
                            <p className="font-medium text-white">{module.nombre}</p>
                            <p className="text-sm text-slate-400">{module.descripcion}</p>
                            <div className="flex gap-1 mt-1">
                              {module.is_core && (
                                <Badge variant="secondary" className="text-xs">
                                  Core
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  moduleMinPlan === 'enterprise' ? 'border-purple-500 text-purple-400' :
                                  moduleMinPlan === 'professional' ? 'border-blue-500 text-blue-400' :
                                  'border-slate-500 text-slate-400'
                                }`}
                              >
                                {moduleMinPlan}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={clientModules[module.id] ?? module.is_core}
                            onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                            disabled={module.is_core || !isAvailableForPlan}
                            title={!isAvailableForPlan ? `Requiere plan ${moduleMinPlan}` : ''}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Módulos Tab */}
          <TabsContent value="modules">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Catálogo de Módulos</CardTitle>
                <CardDescription className="text-slate-400">
                  Todos los módulos disponibles en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{module.nombre}</p>
                          <p className="text-sm text-slate-400 mt-1">{module.descripcion}</p>
                        </div>
                        {module.is_core && (
                          <Badge className="bg-emerald-600">Core</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                          Plan: {module.plan_minimo}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <TemplateEditor />
          </TabsContent>

          {/* Usuarios Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Config Cliente Tab */}
          <TabsContent value="config">
            <ClientConfigEditor showTitle={true} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Backoffice;

