#!/bin/bash

# Script para probar la Edge Function admin-update-user
# Primero hace login como admin, luego llama a la función

SUPABASE_URL="https://lmxyphwydubacsekkyxi.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteHlwaHd5ZHViYWNzZWtreXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzMyNDcsImV4cCI6MjA4MTcwOTI0N30.tIATNnKhUxH-L655Nr6CpuV7XfSDSUphbmQCPbfsh-8"

# Credenciales del admin de backoffice
ADMIN_EMAIL="soporte@talenthubai.com.ar"
ADMIN_PASSWORD="TalentHub2024!"

echo "🔐 Haciendo login como admin..."

# 1. Login para obtener access token
LOGIN_RESPONSE=$(curl -sk -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}")

# Extraer access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error en login. Respuesta:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login exitoso!"
echo ""

# 2. Probar crear usuario
echo "👤 Probando crear usuario..."
TEST_EMAIL="test-$(date +%s)@talenthubai.com.ar"

CREATE_RESPONSE=$(curl -sk -X POST "${SUPABASE_URL}/functions/v1/admin-update-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{\"action\": \"create_user\", \"email\": \"${TEST_EMAIL}\", \"password\": \"Test1234!\"}")

echo "Respuesta: $CREATE_RESPONSE"
echo ""

# Verificar si fue exitoso
if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Usuario creado exitosamente: ${TEST_EMAIL}"
  
  # Extraer user ID para pruebas posteriores
  USER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ ! -z "$USER_ID" ]; then
    echo ""
    echo "🔑 Probando cambiar contraseña..."
    
    PASSWORD_RESPONSE=$(curl -sk -X POST "${SUPABASE_URL}/functions/v1/admin-update-user" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -d "{\"action\": \"update_password\", \"userId\": \"${USER_ID}\", \"password\": \"NuevaPassword123!\"}")
    
    echo "Respuesta: $PASSWORD_RESPONSE"
    
    if echo "$PASSWORD_RESPONSE" | grep -q '"success":true'; then
      echo "✅ Contraseña cambiada exitosamente!"
    else
      echo "❌ Error al cambiar contraseña"
    fi
  fi
else
  echo "❌ Error al crear usuario"
fi

echo ""
echo "🎉 Prueba completada!"


