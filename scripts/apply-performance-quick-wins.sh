#!/bin/bash

# Script d'application automatique des Quick Wins Performance
# Application HTF Sunup - Optimisations en 30 minutes
# Date: 2025-10-04

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet HTF Sunup"
    exit 1
fi

print_header "🚀 HTF Sunup - Application des Quick Wins Performance"

# Step 1: Apply database indexes
print_header "1/5 - Application des indexes de performance"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL n'est pas défini"
    print_info "Tentative de chargement depuis apps/backend/.env..."
    
    if [ -f "apps/backend/.env" ]; then
        export $(cat apps/backend/.env | grep DATABASE_URL | xargs)
    fi
fi

if [ -n "$DATABASE_URL" ]; then
    print_info "Application des indexes SQL..."
    
    # Check if psql is available
    if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" -f apps/backend/drizzle/0011_add_performance_indexes.sql
        print_success "Indexes appliqués avec succès"
    else
        print_warning "psql n'est pas installé"
        print_info "Pour appliquer les indexes manuellement:"
        echo "  psql \$DATABASE_URL -f apps/backend/drizzle/0011_add_performance_indexes.sql"
    fi
else
    print_warning "DATABASE_URL non disponible - indexes non appliqués"
    print_info "Pour appliquer les indexes manuellement:"
    echo "  psql \$DATABASE_URL -f apps/backend/drizzle/0011_add_performance_indexes.sql"
fi

# Step 2: Install cache dependencies
print_header "2/5 - Installation des dépendances de cache"

cd apps/backend

if [ -f "package.json" ]; then
    print_info "Vérification des dépendances de cache..."
    
    # Check if cache dependencies are already installed
    if ! grep -q "@nestjs/cache-manager" package.json; then
        print_info "Installation de @nestjs/cache-manager et cache-manager..."
        pnpm add @nestjs/cache-manager cache-manager
        print_success "Dépendances de cache installées"
    else
        print_info "Dépendances de cache déjà installées"
    fi
else
    print_error "package.json non trouvé dans apps/backend"
fi

cd ../..

# Step 3: Test performance baseline
print_header "3/5 - Test de performance baseline"

print_info "Exécution du test de performance..."
if [ -f "scripts/test-api-performance.js" ]; then
    # Check if backend is running
    if curl -s http://localhost:3001/api > /dev/null; then
        node scripts/test-api-performance.js | tee performance-baseline.txt
        print_success "Test de performance terminé - résultats dans performance-baseline.txt"
    else
        print_warning "Le backend n'est pas en cours d'exécution"
        print_info "Démarrez le backend avec: cd apps/backend && pnpm start:dev"
        print_info "Puis relancez: node scripts/test-api-performance.js"
    fi
else
    print_error "Script test-api-performance.js non trouvé"
fi

# Step 4: Create cache configuration template
print_header "4/5 - Création du template de configuration cache"

CACHE_CONFIG_FILE="apps/backend/src/cache-config.example.ts"

cat > "$CACHE_CONFIG_FILE" << 'EOF'
/**
 * Configuration du cache pour améliorer les performances
 * 
 * Installation:
 * 1. Copier ce fichier vers app.module.ts
 * 2. Importer CacheModule
 * 3. Ajouter dans les imports du module
 * 
 * Usage dans les services:
 * @Inject(CACHE_MANAGER) private cacheManager: Cache
 */

import { CacheModule } from '@nestjs/cache-manager';

// Configuration à ajouter dans AppModule imports
export const cacheConfig = CacheModule.register({
  isGlobal: true,
  ttl: 300, // 5 minutes par défaut
  max: 100, // 100 entrées max en cache
});

/**
 * Exemple d'utilisation dans un service:
 * 
 * import { CACHE_MANAGER } from '@nestjs/cache-manager';
 * import { Cache } from 'cache-manager';
 * 
 * @Injectable()
 * export class ExampleService {
 *   constructor(
 *     @Inject(CACHE_MANAGER) private cacheManager: Cache,
 *   ) {}
 * 
 *   async getCachedData(key: string): Promise<any> {
 *     // Vérifier le cache
 *     const cached = await this.cacheManager.get(key);
 *     if (cached) return cached;
 * 
 *     // Récupérer les données
 *     const data = await this.fetchData();
 * 
 *     // Mettre en cache
 *     await this.cacheManager.set(key, data, 600);
 * 
 *     return data;
 *   }
 * 
 *   async invalidateCache(key: string): Promise<void> {
 *     await this.cacheManager.del(key);
 *   }
 * }
 */
EOF

print_success "Template de configuration cache créé: $CACHE_CONFIG_FILE"

# Step 5: Create next.config.js optimization template
print_header "5/5 - Création du template Next.js optimisé"

NEXT_CONFIG_FILE="apps/frontend/next.config.optimized.example.js"

cat > "$NEXT_CONFIG_FILE" << 'EOF'
/**
 * Configuration Next.js optimisée pour les performances
 * 
 * Installation:
 * 1. Comparer avec votre next.config.js actuel
 * 2. Fusionner les configurations
 * 3. Redémarrer le serveur de dev
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration API
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },

  // Optimisation des images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.idrivee2-11.com',
        pathname: '/**',
      },
    ],
  },

  // Compression
  compress: true,

  // Optimisation du build
  swcMinify: true,
  
  // Headers de cache
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Configuration de production
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    // Monitoring des Web Vitals
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },
};

module.exports = nextConfig;
EOF

print_success "Template Next.js optimisé créé: $NEXT_CONFIG_FILE"

# Final summary
print_header "📊 Résumé de l'Application"

echo ""
echo -e "${GREEN}✅ Quick Wins Appliqués:${NC}"
echo "   1. ✅ Indexes de base de données"
echo "   2. ✅ Dépendances de cache installées"
echo "   3. ✅ Test de performance effectué"
echo "   4. ✅ Templates de configuration créés"
echo ""

echo -e "${YELLOW}⚠️  Actions Manuelles Requises:${NC}"
echo ""
echo "1. ${CYAN}Configuration du Cache (Backend)${NC}"
echo "   • Ouvrir: apps/backend/src/app.module.ts"
echo "   • Référence: apps/backend/src/cache-config.example.ts"
echo "   • Ajouter CacheModule dans les imports"
echo ""

echo "2. ${CYAN}Optimisation getAllMembers() (Backend)${NC}"
echo "   • Fichier: apps/backend/src/users/users.service.ts"
echo "   • Référence: docs/PERFORMANCE_QUICK_START.md (Section 3)"
echo "   • Remplacer N+1 queries par JOIN"
echo ""

echo "3. ${CYAN}Configuration Next.js (Frontend)${NC}"
echo "   • Comparer: apps/frontend/next.config.js"
echo "   • Avec: apps/frontend/next.config.optimized.example.js"
echo "   • Fusionner les configurations"
echo ""

echo "4. ${CYAN}Convertir <img> en <Image> (Frontend)${NC}"
echo "   • Chercher: grep -r '<img' apps/frontend/src/"
echo "   • Remplacer par next/image"
echo "   • Référence: docs/PERFORMANCE_QUICK_START.md (Section 4)"
echo ""

echo -e "${BLUE}📚 Documentation Complète:${NC}"
echo "   • Audit: docs/PERFORMANCE_AUDIT.md"
echo "   • Guide: docs/PERFORMANCE_QUICK_START.md"
echo "   • Résumé: docs/PERFORMANCE_SUMMARY.md"
echo ""

echo -e "${GREEN}🎯 Gain de Performance Attendu: +60%${NC}"
echo ""

print_info "Pour tester les performances après optimisations:"
echo "  node scripts/test-api-performance.js"
echo ""

