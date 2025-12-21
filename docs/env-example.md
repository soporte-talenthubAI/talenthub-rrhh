# Variables de Entorno - TalentHub RRHH

## Para Vercel

Ir a **Vercel** → **Project Settings** → **Environment Variables** y agregar:

---

## 🔴 OBLIGATORIAS (Supabase)

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://lmxyphwydubacsekkyxi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteHlwaHd5ZHViYWNzZWtreXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzMyNDcsImV4cCI6MjA4MTcwOTI0N30.tIATNnKhUxH-L655Nr6CpuV7XfSDSUphbmQCPbfsh-8` |

---

## 🟡 OPCIONALES (Personalización del Cliente)

Estas variables son fallback si la tabla `client_config` no existe en Supabase.
Si configuras `client_config` en la BD, estas se ignoran.

| Variable | Valor Ejemplo | Descripción |
|----------|---------------|-------------|
| `VITE_CLIENT_NOMBRE` | `Mi Empresa S.A.` | Nombre completo de la empresa |
| `VITE_CLIENT_NOMBRE_CORTO` | `Mi Empresa` | Nombre corto |
| `VITE_CLIENT_LOGO_URL` | `https://...logo.png` | URL del logo |
| `VITE_CLIENT_FAVICON_URL` | `https://...favicon.ico` | URL del favicon |
| `VITE_CLIENT_COLOR_PRIMARIO` | `#16a34a` | Color primario (hex) |
| `VITE_CLIENT_COLOR_SECUNDARIO` | `#0891b2` | Color secundario (hex) |
| `VITE_CLIENT_COLOR_FONDO` | `#f8fafc` | Color de fondo |
| `VITE_CLIENT_DIRECCION` | `Av. Principal 123` | Dirección física |
| `VITE_CLIENT_TELEFONO` | `+54 11 1234-5678` | Teléfono |
| `VITE_CLIENT_EMAIL` | `rrhh@empresa.com` | Email de contacto |
| `VITE_CLIENT_CUIT` | `30-12345678-9` | CUIT de la empresa |
| `VITE_CLIENT_APP_TITLE` | `Sistema RRHH` | Título de la app |

---

## Valores por Defecto

Si no configuras las variables opcionales, se usan estos valores:

```
nombre: TalentHub RRHH
nombreCorto: TalentHub
colorPrimario: #16a34a (verde)
colorSecundario: #0891b2 (cyan)
colorFondo: #f8fafc
appTitle: Sistema RRHH
```

---

## Desarrollo Local

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local
VITE_SUPABASE_URL=https://lmxyphwydubacsekkyxi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Luego ejecutar:

```bash
npm run dev
```

