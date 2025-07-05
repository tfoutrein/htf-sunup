#!/bin/bash

# Script pour tester l'affichage conditionnel du "ou" sur la page de connexion
# Usage: ./scripts/test-facebook-ui.sh

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

# Vérifier que le frontend tourne
check_frontend() {
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        success "✅ Frontend accessible sur http://localhost:3000"
        return 0
    else
        error "❌ Frontend non accessible sur http://localhost:3000"
        log "Démarrez le frontend avec: npm run front:dev"
        return 1
    fi
}

# Test avec Facebook activé
test_facebook_enabled() {
    log "🔧 Test avec Facebook ACTIVÉ..."
    
    # Créer un fichier .env.local temporaire avec Facebook activé
    cat > apps/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true
NEXT_PUBLIC_FACEBOOK_APP_ID=test-app-id
EOF

    log "Configuration Facebook activée dans apps/frontend/.env.local"
    log "Redémarrez le frontend pour voir les changements"
    log ""
    log "✅ Attendu: Le bouton Facebook ET le 'ou' doivent être visibles"
    log "📍 URL: http://localhost:3000/login"
}

# Test avec Facebook désactivé
test_facebook_disabled() {
    log "🔧 Test avec Facebook DÉSACTIVÉ..."
    
    # Créer un fichier .env.local temporaire avec Facebook désactivé
    cat > apps/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false
NEXT_PUBLIC_FACEBOOK_APP_ID=disabled-for-testing
EOF

    log "Configuration Facebook désactivée dans apps/frontend/.env.local"
    log "Redémarrez le frontend pour voir les changements"
    log ""
    log "✅ Attendu: NI le bouton Facebook NI le 'ou' ne doivent être visibles"
    log "📍 URL: http://localhost:3000/login"
}

# Restaurer la configuration par défaut
restore_config() {
    if [ -f "apps/frontend/.env.local.example" ]; then
        cp apps/frontend/.env.local.example apps/frontend/.env.local 2>/dev/null || true
        log "Configuration restaurée depuis .env.local.example"
    else
        rm -f apps/frontend/.env.local 2>/dev/null || true
        log "Fichier .env.local supprimé"
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "🧪 Test de l'interface Facebook - Page de connexion"
    echo "=================================================="
    echo "1. Tester Facebook ACTIVÉ"
    echo "2. Tester Facebook DÉSACTIVÉ" 
    echo "3. Restaurer configuration par défaut"
    echo "4. Vérifier l'état du frontend"
    echo "5. Quitter"
    echo ""
    read -p "Choisissez une option (1-5): " choice
}

# Vérification initiale
if ! check_frontend; then
    exit 1
fi

# Boucle du menu
while true; do
    show_menu
    case $choice in
        1)
            test_facebook_enabled
            ;;
        2)
            test_facebook_disabled
            ;;
        3)
            restore_config
            success "✅ Configuration restaurée"
            ;;
        4)
            check_frontend
            ;;
        5)
            log "👋 Au revoir !"
            exit 0
            ;;
        *)
            warning "⚠️ Option invalide. Choisissez entre 1 et 5."
            ;;
    esac
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
done 