#!/bin/bash

# Script pour tester la fonctionnalité Facebook avec Docker
# Usage: ./scripts/test-docker-facebook.sh [enabled|disabled]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [enabled|disabled]"
    echo "  enabled  - Teste avec Facebook activé"
    echo "  disabled - Teste avec Facebook désactivé"
    exit 1
fi

MODE=$1

# Nettoyer les conteneurs existants
log "Nettoyage des conteneurs existants..."
docker-compose down -v 2>/dev/null || true

# Configurer les variables d'environnement
if [ "$MODE" = "enabled" ]; then
    log "Configuration avec Facebook ACTIVÉ..."
    export FACEBOOK_AUTH_ENABLED=true
    export NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true
    export FACEBOOK_APP_ID="test-app-id"
    export FACEBOOK_APP_SECRET="test-app-secret"
elif [ "$MODE" = "disabled" ]; then
    log "Configuration avec Facebook DÉSACTIVÉ..."
    export FACEBOOK_AUTH_ENABLED=false
    export NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false
    export FACEBOOK_APP_ID="disabled-for-testing"
    export FACEBOOK_APP_SECRET="disabled-for-testing"
else
    error "Mode invalide: $MODE. Utilisez 'enabled' ou 'disabled'"
    exit 1
fi

# Utiliser le fichier .env approprié
if [ "$MODE" = "disabled" ]; then
    ENV_FILE="scripts/configs/.env.docker.test"
else
    ENV_FILE=".env.example"
fi

if [ ! -f "$ENV_FILE" ]; then
    error "Fichier d'environnement introuvable: $ENV_FILE"
    exit 1
fi

log "Utilisation du fichier d'environnement: $ENV_FILE"

# Démarrer les services
log "Démarrage des services Docker..."
docker-compose --env-file "$ENV_FILE" up -d

# Attendre que les services soient prêts
log "Attente que les services soient prêts..."
sleep 10

# Vérifier les logs
log "Vérification des logs backend..."
docker-compose logs backend | tail -20

log "Vérification des logs frontend..."
docker-compose logs frontend | tail -20

# Vérifier les variables d'environnement dans les conteneurs
log "Vérification des variables d'environnement dans le backend..."
docker-compose exec backend env | grep FACEBOOK || true

log "Vérification des variables d'environnement dans le frontend..."
docker-compose exec frontend env | grep FACEBOOK || true

# Tests de santé
log "Test de santé du backend..."
sleep 5
if curl -s -f http://localhost:3001/api > /dev/null; then
    success "Backend accessible sur http://localhost:3001/api"
else
    error "Backend non accessible"
fi

log "Test de santé du frontend..."
if curl -s -f http://localhost:3000 > /dev/null; then
    success "Frontend accessible sur http://localhost:3000"
else
    error "Frontend non accessible"
fi

if [ "$MODE" = "enabled" ]; then
    success "✅ Test avec Facebook ACTIVÉ terminé"
    log "Vérifiez manuellement:"
    log "- Frontend: http://localhost:3000 (bouton Facebook visible)"
    log "- Backend Facebook endpoints: http://localhost:3001/api/auth/facebook"
elif [ "$MODE" = "disabled" ]; then
    success "✅ Test avec Facebook DÉSACTIVÉ terminé"
    log "Vérifiez manuellement:"
    log "- Frontend: http://localhost:3000 (bouton Facebook masqué)"
    log "- Backend Facebook endpoints devraient retourner une erreur"
fi

log "Pour arrêter les services: docker-compose down" 