#!/bin/bash

# Script pour valider la configuration Docker sans démarrer les services
# Usage: ./scripts/validate-docker-config.sh

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

# Vérifier les fichiers requis
log "Vérification des fichiers de configuration Docker..."

FILES_TO_CHECK=(
    "docker-compose.yml"
    ".env.example"
    "scripts/configs/.env.docker.test"
    "apps/backend/Dockerfile"
    "apps/frontend/Dockerfile"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        success "✅ $file existe"
    else
        error "❌ $file manquant"
        exit 1
    fi
done

# Vérifier les variables d'environnement dans docker-compose.yml
log "Vérification des variables d'environnement dans docker-compose.yml..."

REQUIRED_VARS=(
    "FACEBOOK_AUTH_ENABLED"
    "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var" docker-compose.yml; then
        success "✅ $var présente dans docker-compose.yml"
    else
        error "❌ $var manquante dans docker-compose.yml"
        exit 1
    fi
done

# Vérifier le contenu des fichiers .env
log "Vérification du contenu des fichiers .env..."

# Vérifier .env.example (Facebook activé)
if grep -q "FACEBOOK_AUTH_ENABLED=true" .env.example; then
    success "✅ .env.example configure Facebook comme activé"
else
    error "❌ .env.example ne configure pas Facebook comme activé"
fi

# Vérifier scripts/configs/.env.docker.test (Facebook désactivé)
if grep -q "FACEBOOK_AUTH_ENABLED=false" scripts/configs/.env.docker.test; then
    success "✅ scripts/configs/.env.docker.test configure Facebook comme désactivé"
else
    error "❌ scripts/configs/.env.docker.test ne configure pas Facebook comme désactivé"
fi

# Vérifier la syntaxe YAML du docker-compose
log "Vérification de la syntaxe docker-compose..."
if command -v docker-compose &> /dev/null; then
    if docker-compose config > /dev/null 2>&1; then
        success "✅ docker-compose.yml syntaxe valide"
    else
        error "❌ docker-compose.yml syntaxe invalide"
        docker-compose config
        exit 1
    fi
else
    warning "⚠️ docker-compose non disponible, validation syntaxe ignorée"
fi

# Vérifier les ports
log "Vérification des ports..."
if lsof -i :3000 &> /dev/null; then
    warning "⚠️ Port 3000 déjà utilisé"
else
    success "✅ Port 3000 disponible"
fi

if lsof -i :3001 &> /dev/null; then
    warning "⚠️ Port 3001 déjà utilisé"
else
    success "✅ Port 3001 disponible"
fi

if lsof -i :5432 &> /dev/null; then
    warning "⚠️ Port 5432 (PostgreSQL) déjà utilisé"
else
    success "✅ Port 5432 disponible"
fi

# Résumé
success "🎉 Configuration Docker validée avec succès !"
log ""
log "📋 Prochaines étapes pour tester:"
log "1. Démarrer Docker: colima start (ou Docker Desktop)"
log "2. Tester Facebook désactivé: ./scripts/test-docker-facebook.sh disabled"
log "3. Tester Facebook activé: ./scripts/test-docker-facebook.sh enabled"
log ""
log "📚 Documentation complète: DOCKER_FACEBOOK_TESTING.md" 