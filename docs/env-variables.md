# Variables de Entorno - TalentHub RRHH

## Arquitectura de Configuración

La app usa un sistema híbrido:
1. **Variables de entorno**: Solo para conexión a Supabase (obligatorias)
2. **Tabla `client_config`**: Para toda la configuración del cliente (recomendado)

Esto permite cambiar nombre, logo, colores, etc. **sin hacer redeploy**.

---

## Para Vercel

Ir a **Vercel** → **Project Settings** → **Environment Variables** y agregar:

### Variables Obligatorias

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://lmxyphwydubacsekkyxi.supabase.co` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Obtener de Supabase → Settings → API → anon public |

### Variables Opcionales (Fallback)

Estas solo se usan si la tabla `client_config` no existe:

| Variable | Valor Ejemplo | Descripción |
|----------|---------------|-------------|
| `VITE_CLIENT_NOMBRE` | `Mi Empresa S.A.` | Nombre completo |
| `VITE_CLIENT_NOMBRE_CORTO` | `Mi Empresa` | Nombre corto |
| `VITE_CLIENT_LOGO_URL` | `https://...logo.png` | URL del logo |
| `VITE_CLIENT_COLOR_PRIMARIO` | `#16a34a` | Color primario |
| `VITE_CLIENT_COLOR_SECUNDARIO` | `#0891b2` | Color secundario |

---

## Configuración Recomendada

En lugar de variables de entorno, usar el **Backoffice**:

1. Ir a `/backoffice`
2. Login: `soporte@talenthub.com` / `TalentHub2024!`
3. Tab **Config Cliente**
4. Configurar nombre, logo, colores, etc.
5. Guardar → cambios inmediatos sin redeploy

---

## Nueva BD (TalentHub Master)

```
URL: https://lmxyphwydubacsekkyxi.supabase.co
Host: db.lmxyphwydubacsekkyxi.supabase.co
Password: talenthub1717.
```

### Tablas disponibles (21):

**Core:**
- employees, documents, absences, attendance
- vacation_requests, vacation_balances
- sanctions, payroll, trainings, uniforms
- performance_evaluations
- declaraciones_domicilio, visitas_consultores

**Backoffice:**
- talenthub_admins, talenthub_clients
- talenthub_modules, talenthub_client_modules
- talenthub_admin_logs

**Templates:**
- document_template_types
- document_templates
- template_placeholders

---

## Configurar en Vercel

1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto
3. Settings → Environment Variables
4. Agregar cada variable con su valor
5. Hacer un nuevo deploy para que tome los cambios

