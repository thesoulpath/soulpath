#!/bin/bash

# Script para gestionar Rasa con Docker
# Uso: ./scripts/rasa-docker.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
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

# Función para verificar si Docker está ejecutándose
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker no está ejecutándose. Por favor inicia Docker y vuelve a intentarlo."
        exit 1
    fi
}

# Función para verificar si docker-compose está disponible
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "docker-compose no está instalado."
        exit 1
    fi
}

# Función para usar docker-compose (compatible con versiones nuevas)
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Comando principal
COMMAND=${1:-"help"}

case $COMMAND in
    "start")
        print_info "Iniciando servicios de Rasa..."
        check_docker
        check_docker_compose

        print_info "Construyendo y iniciando contenedores..."
        docker_compose_cmd up -d --build

        print_info "Esperando a que Rasa esté listo..."
        sleep 10

        print_success "Rasa está ejecutándose en http://localhost:5005"
        print_info "Puedes probar el endpoint con:"
        print_info "curl http://localhost:5005/webhooks/rest/webhook -X POST -H 'Content-Type: application/json' -d '{\"sender\": \"test\", \"message\": \"hola\"}'"
        ;;

    "stop")
        print_info "Deteniendo servicios de Rasa..."
        check_docker_compose
        docker_compose_cmd down
        print_success "Servicios detenidos."
        ;;

    "restart")
        print_info "Reiniciando servicios de Rasa..."
        check_docker_compose
        docker_compose_cmd restart
        print_success "Servicios reiniciados."
        ;;

    "logs")
        print_info "Mostrando logs de Rasa..."
        check_docker_compose
        docker_compose_cmd logs -f rasa
        ;;

    "train")
        print_info "Entrenando modelo de Rasa..."
        check_docker

        print_info "Ejecutando entrenamiento..."
        docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full train --domain domain.yml --data data --out models

        print_success "Modelo entrenado. Puedes iniciar los servicios con: ./scripts/rasa-docker.sh start"
        ;;

    "shell")
        print_info "Iniciando shell interactivo de Rasa..."
        check_docker

        docker run -it --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full shell --model models
        ;;

    "test")
        print_info "Probando configuración de Rasa..."
        check_docker

        docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full data validate
        print_success "Validación completada."
        ;;

    "clean")
        print_info "Limpiando contenedores y volúmenes..."
        check_docker_compose
        docker_compose_cmd down -v
        docker system prune -f
        print_success "Limpieza completada."
        ;;

    "status")
        print_info "Verificando estado de servicios..."

        if docker_compose_cmd ps | grep -q "rasa"; then
            print_success "Rasa está ejecutándose"
            docker_compose_cmd ps
        else
            print_warning "Rasa no está ejecutándose"
            print_info "Inicia con: ./scripts/rasa-docker.sh start"
        fi
        ;;

    "help"|*)
        echo "Script de gestión de Rasa con Docker"
        echo ""
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  start     Iniciar servicios de Rasa"
        echo "  stop      Detener servicios de Rasa"
        echo "  restart   Reiniciar servicios de Rasa"
        echo "  logs      Ver logs de Rasa"
        echo "  train     Entrenar modelo de Rasa"
        echo "  shell     Abrir shell interactivo de Rasa"
        echo "  test      Validar configuración de Rasa"
        echo "  clean     Limpiar contenedores y volúmenes"
        echo "  status    Ver estado de servicios"
        echo "  help      Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  $0 start    # Iniciar Rasa"
        echo "  $0 train    # Entrenar modelo"
        echo "  $0 logs     # Ver logs en tiempo real"
        ;;
esac

