#!/bin/bash

# Script para desplegar Rasa en diferentes plataformas
# Uso: ./scripts/deploy-rasa.sh [plataforma] [comando]

set -e

PLATFORM=${1:-"help"}
COMMAND=${2:-"deploy"}

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

# Verificar dependencias
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Instálalo primero."
        exit 1
    fi

    case $PLATFORM in
        "railway")
            if ! command -v railway &> /dev/null; then
                print_warning "Railway CLI no está instalado."
                print_info "Instálalo con: npm install -g @railway/cli"
                exit 1
            fi
            ;;
        "render")
            if ! command -v render &> /dev/null; then
                print_warning "Render CLI no está instalado."
                print_info "Descárgalo de: https://docs.render.com/cli"
            fi
            ;;
    esac
}

# Función para Railway
deploy_railway() {
    print_info "Desplegando Rasa en Railway..."

    # Verificar login
    if ! railway status &> /dev/null; then
        print_info "Necesitas hacer login en Railway:"
        print_info "railway login"
        exit 1
    fi

    # Crear proyecto
    print_info "Creando proyecto en Railway..."
    railway init rasa-server --name "Rasa Astrology Assistant"

    # Configurar variables de entorno
    print_info "Configurando variables de entorno..."
    railway variables set RASA_ENVIRONMENT=production
    railway variables set RASA_TELEMETRY_ENABLED=false
    railway variables set RASA_CORS_ORIGIN=*

    # Desplegar
    print_info "Desplegando..."
    railway up

    print_success "Rasa desplegado en Railway!"
    print_info "URL del servicio: $(railway domain)"
}

# Función para Render
deploy_render() {
    print_info "Desplegando Rasa en Render..."

    # Verificar Render CLI
    if command -v render &> /dev/null; then
        print_info "Usando Render CLI..."

        # Login (interactive)
        render login

        # Crear servicio web
        render services create \
            --name rasa-astrology \
            --type web \
            --repo https://github.com/your-username/your-repo \
            --branch main \
            --dockerfile ./Dockerfile.rasa \
            --plan starter

    else
        print_info "Configuración manual para Render:"
        echo ""
        print_info "1. Ve a https://dashboard.render.com"
        print_info "2. Crea un nuevo 'Web Service'"
        print_info "3. Conecta tu repositorio de GitHub"
        print_info "4. Selecciona 'Docker' como runtime"
        print_info "5. Especifica 'Dockerfile.rasa' como Dockerfile path"
        echo ""
        print_info "Variables de entorno necesarias:"
        echo "  RASA_ENVIRONMENT=production"
        echo "  RASA_TELEMETRY_ENABLED=false"
        echo "  RASA_CORS_ORIGIN=*"
    fi

    print_success "Configuración de Render completada!"
}

# Función para Docker local
deploy_docker() {
    print_info "Desplegando Rasa con Docker local..."

    # Verificar que no esté ejecutándose
    if docker ps | grep -q rasa; then
        print_warning "Rasa ya está ejecutándose. Deteniéndolo primero..."
        docker-compose down
    fi

    # Construir y desplegar
    print_info "Construyendo imagen..."
    docker-compose build

    print_info "Iniciando servicios..."
    docker-compose up -d

    print_success "Rasa ejecutándose en http://localhost:5005"
}

# Función para probar despliegue
test_deployment() {
    print_info "Probando despliegue de Rasa..."

    case $PLATFORM in
        "railway")
            RASA_URL=$(railway domain)
            ;;
        "render")
            print_info "Ingresa la URL de tu servicio Render:"
            read -r RASA_URL
            ;;
        "docker")
            RASA_URL="http://localhost:5005"
            ;;
        *)
            print_error "Plataforma no reconocida para testing"
            exit 1
            ;;
    esac

    print_info "Probando endpoint de salud..."
    if curl -f "${RASA_URL}/" &> /dev/null; then
        print_success "Endpoint de salud OK"
    else
        print_error "Endpoint de salud falló"
        exit 1
    fi

    print_info "Probando procesamiento de mensaje..."
    RESPONSE=$(curl -s -X POST "${RASA_URL}/webhooks/rest/webhook" \
        -H "Content-Type: application/json" \
        -d '{"sender": "test", "message": "hola"}')

    if echo "$RESPONSE" | grep -q "intent"; then
        print_success "Procesamiento de mensajes OK"
    else
        print_error "Procesamiento de mensajes falló"
        echo "Respuesta: $RESPONSE"
        exit 1
    fi

    print_success "¡Despliegue probado exitosamente!"
}

# Función principal
case $PLATFORM in
    "railway")
        case $COMMAND in
            "deploy")
                check_dependencies
                deploy_railway
                ;;
            "test")
                test_deployment
                ;;
            *)
                print_error "Comando no reconocido. Usa: deploy o test"
                ;;
        esac
        ;;

    "render")
        case $COMMAND in
            "deploy")
                check_dependencies
                deploy_render
                ;;
            "test")
                test_deployment
                ;;
            *)
                print_error "Comando no reconocido. Usa: deploy o test"
                ;;
        esac
        ;;

    "docker")
        case $COMMAND in
            "deploy")
                deploy_docker
                ;;
            "test")
                test_deployment
                ;;
            *)
                print_error "Comando no reconocido. Usa: deploy o test"
                ;;
        esac
        ;;

    "help"|*)
        echo "Script de despliegue de Rasa"
        echo ""
        echo "Uso: $0 [plataforma] [comando]"
        echo ""
        echo "Plataformas soportadas:"
        echo "  railway    Desplegar en Railway"
        echo "  render     Desplegar en Render"
        echo "  docker     Ejecutar localmente con Docker"
        echo ""
        echo "Comandos:"
        echo "  deploy     Desplegar el servicio"
        echo "  test       Probar el despliegue"
        echo ""
        echo "Ejemplos:"
        echo "  $0 railway deploy    # Desplegar en Railway"
        echo "  $0 render deploy     # Desplegar en Render"
        echo "  $0 docker deploy     # Ejecutar localmente"
        echo "  $0 docker test       # Probar despliegue local"
        ;;
esac

