import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  Settings,
  LogOut,
  Building2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { clientConfig } from "@/config/client";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    toast({
      title: "Sesión cerrada",
      description: "Has salido del sistema exitosamente",
    });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {clientConfig.logoUrl ? (
              <img 
                src={clientConfig.logoUrl} 
                alt={clientConfig.nombre} 
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                RRHH {clientConfig.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de gestión de personal • TalentHub
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Usuario Admin</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">UA</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
