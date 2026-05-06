#!/bin/sh

set -e

echo "🔍 Verificando contenedores..."
docker compose ps

echo ""
echo "🔍 Verificando salud de contenedores..."
BACKEND_HEALTH=$(docker compose exec -T hmr-backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health'); print('OK')" 2>/dev/null || echo "FAIL")
FRONTEND_HEALTH=$(curl -sf http://localhost:5173/ >/dev/null 2>&1 && echo "OK" || echo "FAIL")

echo "Backend: $BACKEND_HEALTH"
echo "Frontend: $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" != "OK" ]; then
  echo "❌ Backend no está saludable"
  docker compose logs hmr-backend | tail -20
  exit 1
fi

if [ "$FRONTEND_HEALTH" != "OK" ]; then
  echo "❌ Frontend no está saludable"
  docker compose logs hmr-app | tail -20
  exit 1
fi

echo ""
echo "🔍 Verificando dependencias críticas en frontend..."
docker compose exec -T hmr-app sh -c 'test -d node_modules/@radix-ui/react-separator && echo "✅ @radix-ui/react-separator" || echo "❌ @radix-ui/react-separator"'
docker compose exec -T hmr-app sh -c 'test -d node_modules/vite && echo "✅ vite" || echo "❌ vite"'
docker compose exec -T hmr-app sh -c 'test -d node_modules/react && echo "✅ react" || echo "❌ react"'

echo ""
echo "✅ Verificación completada"