// Edge Function para que el admin pueda actualizar usuarios
// Requiere la clave de servicio de Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el request viene de un admin del backoffice
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Verificar si es admin de TalentHub
    const { data: adminCheck } = await supabaseAdmin
      .from('talenthub_admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!adminCheck) {
      throw new Error('No autorizado - Solo administradores de TalentHub')
    }

    const { action, userId, email, password } = await req.json()

    let result

    switch (action) {
      case 'update_password':
        // Actualizar contraseña
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        )
        if (updateError) throw updateError
        result = { success: true, message: 'Contraseña actualizada' }
        break

      case 'update_email':
        // Actualizar email
        const { data: emailData, error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { email }
        )
        if (emailError) throw emailError
        result = { success: true, message: 'Email actualizado' }
        break

      case 'delete_user':
        // Eliminar usuario de Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        result = { success: true, message: 'Usuario eliminado' }
        break

      case 'create_user':
        // Crear usuario sin confirmación de email
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Usuario ya confirmado
        })
        if (createError) throw createError
        result = { success: true, user: createData.user, message: 'Usuario creado' }
        break

      default:
        throw new Error('Acción no válida')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

