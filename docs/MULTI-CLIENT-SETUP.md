# 🏢 Configuración Multi-Cliente

Sistema para manejar múltiples clientes con el mismo código base.

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Repository                                  │
│                            (hr-hub-signed)                                   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│   Vercel App 1    │     │   Vercel App 2    │     │   Vercel App 3    │
│  "rrhh-cliente-a" │     │  "rrhh-cliente-b" │     │  "rrhh-cliente-c" │
│                   │     │                   │     │                   │
│ Environment Vars: │     │ Environment Vars: │     │ Environment Vars: │
│ VITE_CLIENT_*     │     │ VITE_CLIENT_*     │     │ VITE_CLIENT_*     │
│ VITE_SUPABASE_*   │     │ VITE_SUPABASE_*   │     │ VITE_SUPABASE_*   │
└─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
          │                         │                         │
          ▼                         ▼                         ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  Supabase Inst 1  │     │  Supabase Inst 2  │     │  Supabase Inst 3  │
│  rrhh-cliente-a   │     │  rrhh-cliente-b   │     │  rrhh-cliente-c   │
│  (BD separada)    │     │  (BD separada)    │     │  (BD separada)    │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

---

## 🚀 Agregar Nuevo Cliente (Paso a Paso)

### 1️⃣ Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `rrhh-{nombre-cliente}` (ej: `rrhh-granjasur`)
3. Región: South America (São Paulo) - más cercano a Argentina
4. Esperar a que se cree el proyecto

### 2️⃣ Ejecutar Migraciones en Supabase

```bash
# Instalar Supabase CLI (una sola vez)
npm install -g supabase

# Login
supabase login

# Vincular al nuevo proyecto
supabase link --project-ref TU-PROJECT-REF

# Ejecutar todas las migraciones
supabase db push
```

### 3️⃣ Crear Contraseña Inicial

En el **SQL Editor** de Supabase, ejecutar:

```sql
INSERT INTO system_config (key, value, description)
VALUES ('app_password', 'contraseña-del-cliente', 'Contraseña de acceso');
```

### 4️⃣ Subir Logo del Cliente (opcional)

**Opción A:** Subir a `public/logos/` en el repo
```
public/logos/granjasur-logo.png
```

**Opción B:** Subir a Supabase Storage
1. Storage → Create Bucket → `assets`
2. Subir imagen
3. Copiar URL pública

### 5️⃣ Crear App en Vercel

1. Ir a [vercel.com](https://vercel.com) → Add New → Project
2. Seleccionar el repositorio `hr-hub-signed`
3. Nombre del proyecto: `rrhh-{cliente}` (ej: `rrhh-granjasur`)
4. **NO hacer deploy todavía**

### 6️⃣ Configurar Variables de Entorno en Vercel

En Vercel → Project → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_CLIENT_NOMBRE` | `Granja del Sur S.A.` |
| `VITE_CLIENT_NOMBRE_CORTO` | `Granja Sur` |
| `VITE_CLIENT_LOGO_URL` | `/logos/granjasur-logo.png` |
| `VITE_CLIENT_COLOR_PRIMARIO` | `#dc2626` |
| `VITE_CLIENT_COLOR_SECUNDARIO` | `#ea580c` |
| `VITE_CLIENT_DIRECCION` | `Ruta 5 Km 123, Santa Fe` |
| `VITE_CLIENT_TELEFONO` | `+54 342 555-1234` |
| `VITE_CLIENT_EMAIL` | `rrhh@granjasur.com` |
| `VITE_CLIENT_CUIT` | `30-12345678-9` |
| `VITE_CLIENT_MENSAJE_BIENVENIDA` | `Bienvenido al Sistema de RRHH` |

### 7️⃣ Deploy

En Vercel → Deployments → Redeploy (o hacer un push al repo)

### 8️⃣ Configurar Dominio (opcional)

En Vercel → Project → Settings → Domains:
- Agregar dominio: `rrhh.granjasur.com.ar`
- Configurar DNS en el proveedor del dominio

---

## 🎨 Variables de Entorno Disponibles

### Obligatorias (Supabase)
| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon key) |

### Información de la Empresa
| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_CLIENT_NOMBRE` | Nombre completo | `TalentHub RRHH` |
| `VITE_CLIENT_NOMBRE_CORTO` | Nombre corto | `TalentHub` |
| `VITE_CLIENT_LOGO_URL` | URL del logo | (vacío por defecto) |
| `VITE_CLIENT_DIRECCION` | Dirección física | - |
| `VITE_CLIENT_TELEFONO` | Teléfono | - |
| `VITE_CLIENT_EMAIL` | Email de RRHH | - |
| `VITE_CLIENT_CUIT` | CUIT de la empresa | - |

### Branding
| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_CLIENT_COLOR_PRIMARIO` | Color principal (hex) | `#16a34a` (verde) |
| `VITE_CLIENT_COLOR_SECUNDARIO` | Color secundario (hex) | `#0891b2` (cyan) |

### Personalización
| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_CLIENT_MENSAJE_BIENVENIDA` | Mensaje en login | `Bienvenido al Sistema...` |

---

## 🎨 Paleta de Colores Sugeridas

```
Verde (Default):       #16a34a / #0891b2
Rojo (Carnes):         #dc2626 / #ea580c
Azul (Corporativo):    #2563eb / #7c3aed
Naranja (Agrícola):    #ea580c / #ca8a04
Teal (Servicios):      #0d9488 / #0891b2
```

---

## ✅ Checklist Nuevo Cliente

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar migraciones (`supabase db push`)
- [ ] Crear contraseña en `system_config`
- [ ] Subir logo (repo o Supabase Storage)
- [ ] Crear app en Vercel conectada al mismo repo
- [ ] Configurar variables de entorno en Vercel
- [ ] Hacer deploy
- [ ] Configurar dominio personalizado
- [ ] Probar login y funcionalidades
- [ ] Entregar credenciales al cliente

---

## 🔧 Desarrollo Local

Para probar localmente con configuración de un cliente:

```bash
# Crear archivo .env.local con las variables del cliente
# (Este archivo no se sube al repo)

npm run dev
```

---

## 🆘 Troubleshooting

### Error: "No se pudo verificar la contraseña"
- Verificar que `system_config` tenga el registro `app_password`
- Verificar que las variables de Supabase estén correctas

### El logo no aparece
- Verificar que la URL sea accesible
- Si está en `public/logos/`, usar ruta relativa: `/logos/nombre.png`

### Los colores no cambian
- Verificar formato hex: `#16a34a` (con #)
- Hacer redeploy después de cambiar variables

---

## 📞 Soporte

- Email: soporte@talenthub.com
- WhatsApp: +54 9 11 XXXX-XXXX

