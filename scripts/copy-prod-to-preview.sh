#!/bin/bash
set -e

echo "🔄 Copie des données de production vers preview..."

# Vérifier que nous sommes bien dans un environnement de preview
if [ -z "$IS_PULL_REQUEST" ] && [ -z "$RENDER_SERVICE_NAME" ]; then
  echo "⚠️  Ce script ne doit s'exécuter que dans un environnement de preview"
  exit 0
fi

# Vérifier que nous avons les URLs nécessaires
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non définie"
  exit 1
fi

if [ -z "$PRODUCTION_DATABASE_URL" ]; then
  echo "❌ PRODUCTION_DATABASE_URL non définie"
  exit 1
fi

echo "📊 Source: Base de production"
echo "🎯 Destination: Base de preview"

# Créer un fichier temporaire pour le dump
DUMP_FILE="/tmp/prod_dump_$(date +%s).sql"

echo "📥 Dump de la base de production..."
pg_dump "$PRODUCTION_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f "$DUMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du dump de la production"
  rm -f "$DUMP_FILE"
  exit 1
fi

echo "✅ Dump réussi ($(du -h "$DUMP_FILE" | cut -f1))"

echo "📤 Restauration dans la base de preview..."
psql "$DATABASE_URL" -f "$DUMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la restauration"
  rm -f "$DUMP_FILE"
  exit 1
fi

# Nettoyage
rm -f "$DUMP_FILE"

echo "✅ Copie terminée avec succès!"
echo "🎉 La base de preview contient maintenant les données de production"

# Optionnel : Anonymiser certaines données sensibles
echo "🔒 Anonymisation des données sensibles (optionnel)..."
psql "$DATABASE_URL" <<EOF
-- Exemple : Anonymiser les emails des utilisateurs
-- UPDATE users SET email = 'test_' || id || '@preview.local' WHERE email NOT LIKE '%@example.com';

-- Exemple : Réinitialiser les tokens d'authentification
-- UPDATE users SET facebook_id = NULL, facebook_access_token = NULL;

-- Afficher un résumé
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM campaigns) as total_campaigns,
  (SELECT COUNT(*) FROM user_actions) as total_actions;
EOF

echo "✅ Script terminé!"

