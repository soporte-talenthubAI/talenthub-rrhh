# TalentHub Backoffice

## Acceso

- **URL:** `/backoffice`
- **Email:** `soporte@talenthub.com`
- **Password:** `TalentHub2024!`

---

## Funcionalidades

### 1. Gestión de Clientes
- Crear nuevos clientes
- Ver lista de clientes activos/trial/suspendidos
- Editar información de clientes
- Asignar planes (basic/professional/enterprise)

### 2. Control de Módulos
- Habilitar/deshabilitar módulos por cliente
- Módulos core (Dashboard, Empleados) siempre activos
- Configuración de módulos según plan

### 3. Editor de Templates
- Editar templates HTML de documentos
- Preview en tiempo real con datos de ejemplo
- Placeholders disponibles para personalizar

---

## Migraciones Requeridas

Ejecutar en Supabase SQL Editor (en orden):

1. `supabase/migrations/20251219000001_talenthub_backoffice.sql`
2. `supabase/migrations/20251219000002_document_templates.sql`

---

## Notas Técnicas

- El backoffice usa autenticación simple (localStorage)
- Las tablas del backoffice tienen prefijo `talenthub_`
- Los templates se almacenan en `document_templates`

