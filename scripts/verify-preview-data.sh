#!/bin/bash
# Script de vérification des données copiées dans un preview

echo "🔍 Vérification des données du preview..."
echo ""

# Utiliser l'URL de la base de preview
if [ -z "$PREVIEW_DB_URL" ]; then
  echo "❌ Erreur: définissez PREVIEW_DB_URL"
  echo "   Export: export PREVIEW_DB_URL='postgresql://...'"
  exit 1
fi

echo "📊 Comptage des lignes par table:"
psql "$PREVIEW_DB_URL" -t -c "
SELECT 
  'users: ' || COUNT(*) FROM users
UNION ALL SELECT 'campaigns: ' || COUNT(*) FROM campaigns  
UNION ALL SELECT 'user_actions: ' || COUNT(*) FROM user_actions
UNION ALL SELECT 'daily_bonus: ' || COUNT(*) FROM daily_bonus
UNION ALL SELECT 'proofs: ' || COUNT(*) FROM proofs
;"

echo ""
echo "✅ Vérification terminée"

