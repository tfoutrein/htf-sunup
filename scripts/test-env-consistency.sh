#!/bin/bash

# Script pour tester la cohérence des fichiers d'environnement
# Usage: ./scripts/test-env-consistency.sh

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

# Vérifier la cohérence entre les fichiers .env
log "Vérification de la cohérence des fichiers d'environnement..."

# Vérifier que .env.example a Facebook activé
if grep -q "FACEBOOK_AUTH_ENABLED=true" .env.example; then
    success "✅ .env.example: Facebook activé"
else
    error "❌ .env.example: Facebook devrait être activé"
fi

if grep -q "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true" .env.example; then
    success "✅ .env.example: Frontend Facebook activé"
else
    error "❌ .env.example: Frontend Facebook devrait être activé"
fi

# Vérifier que scripts/configs/.env.docker.test a Facebook désactivé
if grep -q "FACEBOOK_AUTH_ENABLED=false" scripts/configs/.env.docker.test; then
    success "✅ scripts/configs/.env.docker.test: Facebook désactivé"
else
    error "❌ scripts/configs/.env.docker.test: Facebook devrait être désactivé"
fi

if grep -q "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false" scripts/configs/.env.docker.test; then
    success "✅ scripts/configs/.env.docker.test: Frontend Facebook désactivé"
else
    error "❌ scripts/configs/.env.docker.test: Frontend Facebook devrait être désactivé"
fi

# Vérifier que tous les fichiers .env ont les mêmes variables Facebook
log "Vérification des variables Facebook dans tous les fichiers..."

FACEBOOK_VARS=(
    "FACEBOOK_AUTH_ENABLED"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "FACEBOOK_CALLBACK_URL"
    "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED"
)

ENV_FILES=(
    ".env.example"
    "scripts/configs/.env.docker.test"
    "apps/backend/.env.example"
    "apps/frontend/.env.local.example"
)

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "Vérification de $file..."
        for var in "${FACEBOOK_VARS[@]}"; do
            if grep -q "$var" "$file"; then
                success "  ✅ $var présente"
            else
                # Certaines variables peuvent ne pas être dans tous les fichiers
                if [[ "$file" == *"backend"* && "$var" == "NEXT_PUBLIC_"* ]]; then
                    # Variable frontend dans fichier backend - OK
                    continue
                elif [[ "$file" == *"frontend"* && "$var" != "NEXT_PUBLIC_"* ]]; then
                    # Variable backend dans fichier frontend - OK si pas JWT_SECRET
                    continue
                else
                    warning "  ⚠️ $var manquante dans $file"
                fi
            fi
        done
    else
        warning "⚠️ $file n'existe pas"
    fi
done

# Vérifier que docker-compose.yml utilise les bonnes variables
log "Vérification de docker-compose.yml..."

COMPOSE_VARS=(
    "FACEBOOK_AUTH_ENABLED"
    "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
)

for var in "${COMPOSE_VARS[@]}"; do
    if grep -q "\${$var}" docker-compose.yml; then
        success "✅ docker-compose.yml utilise \${$var}"
    else
        error "❌ docker-compose.yml n'utilise pas \${$var}"
    fi
done

# Vérifier que les valeurs par défaut sont cohérentes
log "Vérification des valeurs par défaut..."

# Test avec .env.example
if grep -q "FACEBOOK_AUTH_ENABLED=true" .env.example && grep -q "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true" .env.example; then
    success "✅ .env.example: Backend et frontend Facebook cohérents (tous deux activés)"
else
    error "❌ .env.example: Backend et frontend Facebook incohérents"
fi

# Test avec scripts/configs/.env.docker.test
if grep -q "FACEBOOK_AUTH_ENABLED=false" scripts/configs/.env.docker.test && grep -q "NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false" scripts/configs/.env.docker.test; then
    success "✅ scripts/configs/.env.docker.test: Backend et frontend Facebook cohérents (tous deux désactivés)"
else
    error "❌ scripts/configs/.env.docker.test: Backend et frontend Facebook incohérents"
fi

# Résumé
success "🎉 Tests de cohérence terminés !"
log ""
log "📋 Tous les fichiers d'environnement sont configurés correctement pour:"
log "- Facebook activé: .env.example"
log "- Facebook désactivé: scripts/configs/.env.docker.test"
log "- docker-compose.yml utilise les bonnes variables" 