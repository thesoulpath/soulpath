#!/bin/bash

# Script para configurar despliegue en Render.com
# Uso: ./scripts/setup-render-deployment.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🚀 Configuración de Despliegue en Render.com${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Función principal
main() {
    print_header

    print_info "Este script te ayudará a configurar Rasa para Render.com"
    echo ""

    # Verificar archivos necesarios
    print_info "Verificando archivos necesarios..."

    required_files=(
        "Dockerfile.rasa"
        "render-deployment.yml"
        "rasa/config.yml"
        "rasa/domain.yml"
        "rasa/data/nlu.yml"
        "rasa/credentials.yml"
    )

    missing_files=()

    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "✓ $file"
        else
            print_error "✗ $file"
            missing_files+=("$file")
        fi
    done

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "Archivos faltantes. Ejecuta primero:"
        echo "  ./scripts/rasa-docker.sh train"
        exit 1
    fi

    echo ""
    print_success "Todos los archivos necesarios están presentes!"

    # Crear archivo .env.render
    print_info "Creando archivo de configuración para Render..."
    cat > .env.render << 'EOF'
# Render.com Environment Variables
# Copy these to your Render service settings

# Rasa Configuration
RASA_ENVIRONMENT=production
RASA_TELEMETRY_ENABLED=false
RASA_CORS_ORIGIN=*
RASA_MODEL_SERVER=https://your-render-app.onrender.com

# Security (Optional)
RASA_CREDENTIALS_REST_VERIFY=your_webhook_secret_here
RASA_CREDENTIALS_REST_SECRET=your_webhook_secret_here

# Logging
RASA_LOG_LEVEL=INFO

# Performance
RASA_CORE_ENDPOINTS_FALLBACK_TIMEOUT=10
RASA_CORE_ENDPOINTS_FALLBACK_RETRY_COUNT=3
EOF

    print_success "Archivo .env.render creado!"

    # Mostrar instrucciones
    echo ""
    print_info "📋 PASOS PARA DESPLEGAR EN RENDER.COM:"
    echo ""
    echo "1️⃣  Ve a https://dashboard.render.com"
    echo "2️⃣  Clic en 'New' → 'Web Service'"
    echo "3️⃣  Conecta tu repositorio de GitHub"
    echo "4️⃣  Configura:"
    echo "   • Name: rasa-astrology-assistant"
    echo "   • Runtime: Docker"
    echo "   • Dockerfile Path: ./Dockerfile.rasa"
    echo "   • Plan: Starter (\$7/mes)"
    echo ""
    print_info "5️⃣  VARIABLES DE ENTORNO (copia de .env.render):"
    echo ""
    echo "   RASA_ENVIRONMENT=production"
    echo "   RASA_TELEMETRY_ENABLED=false"
    echo "   RASA_CORS_ORIGIN=*"
    echo "   RASA_LOG_LEVEL=INFO"
    echo ""
    print_info "6️⃣  HEALTH CHECK:"
    echo "   • Path: /"
    echo "   • Timeout: 30s"
    echo ""
    print_info "7️⃣  Una vez desplegado, actualiza tu .env.local en Vercel:"
    echo ""
    echo "   RASA_URL=https://tu-rasa-service.onrender.com"
    echo "   API_BASE_URL=https://tu-nextjs-app.vercel.app/api"
    echo ""

    # Crear resumen
    echo ""
    print_success "🎉 CONFIGURACIÓN COMPLETADA!"
    echo ""
    print_info "Resumen de archivos creados:"
    echo "  ✓ Dockerfile.rasa - Configuración Docker"
    echo "  ✓ render-deployment.yml - Configuración Render"
    echo "  ✓ .env.render - Variables de entorno"
    echo "  ✓ rasa/ - Directorio completo de Rasa"
    echo ""
    print_info "Próximos pasos:"
    echo "1. Push estos archivos a tu repositorio GitHub"
    echo "2. Crear servicio en Render.com siguiendo los pasos arriba"
    echo "3. Esperar ~5 minutos al primer despliegue"
    echo "4. Probar el endpoint: curl https://tu-service.onrender.com/"
    echo "5. Actualizar configuración en Vercel"
    echo ""
    print_warning "💡 Recuerda:"
    echo "• El primer despliegue puede tomar 10-15 minutos"
    echo "• Render tiene un 'cooldown' de 15 minutos entre deploys"
    echo "• Puedes ver logs en tiempo real en el dashboard de Render"
    echo ""

    # Preguntar si quiere continuar con el despliegue
    echo ""
    read -p "¿Quieres que abra el navegador para crear el servicio en Render? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Abriendo Render.com en tu navegador..."
        if command -v open &> /dev/null; then
            open "https://dashboard.render.com"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://dashboard.render.com"
        else
            print_info "Ve a: https://dashboard.render.com"
        fi
    fi

    print_success "¡Configuración completada! 🚀"
}

# Ejecutar función principal
main "$@"

