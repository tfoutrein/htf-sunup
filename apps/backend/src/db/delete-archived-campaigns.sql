-- =====================================================
-- Script de suppression des campagnes archivées
-- =====================================================
-- Ce script supprime toutes les campagnes archivées et leurs données associées
-- en respectant l'ordre des contraintes de clés étrangères.
--
-- ATTENTION : Cette opération est IRREVERSIBLE !
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter ce script.
--
-- Usage :
-- 1. Connectez-vous à votre base de données PostgreSQL
-- 2. Exécutez ce script dans l'ordre des sections
-- 3. Vérifiez les résultats après chaque étape
-- =====================================================

-- Étape 0 : Vérification préliminaire
-- Afficher les campagnes archivées qui seront supprimées
SELECT 
    id,
    name,
    description,
    start_date,
    end_date,
    status,
    archived,
    created_at
FROM campaigns 
WHERE archived = true
ORDER BY created_at DESC;

-- Afficher le nombre d'éléments associés qui seront supprimés
SELECT 
    'Campagnes archivées' as type,
    COUNT(*) as count
FROM campaigns 
WHERE archived = true

UNION ALL

SELECT 
    'Défis associés' as type,
    COUNT(*) as count
FROM challenges c
INNER JOIN campaigns cam ON c.campaign_id = cam.id
WHERE cam.archived = true

UNION ALL

SELECT 
    'Actions associées' as type,
    COUNT(*) as count
FROM actions a
INNER JOIN challenges c ON a.challenge_id = c.id
INNER JOIN campaigns cam ON c.campaign_id = cam.id
WHERE cam.archived = true

UNION ALL

SELECT 
    'Actions utilisateur associées' as type,
    COUNT(*) as count
FROM user_actions ua
INNER JOIN campaigns cam ON ua.challenge_id IN (
    SELECT c.id FROM challenges c WHERE c.campaign_id = cam.id
)
WHERE cam.archived = true

UNION ALL

SELECT 
    'Bonus quotidiens associés' as type,
    COUNT(*) as count
FROM daily_bonus db
INNER JOIN campaigns cam ON db.campaign_id = cam.id
WHERE cam.archived = true

UNION ALL

SELECT 
    'Preuves associées' as type,
    COUNT(*) as count
FROM proofs p
WHERE p.user_action_id IN (
    SELECT ua.id FROM user_actions ua
    INNER JOIN challenges c ON ua.challenge_id = c.id
    INNER JOIN campaigns cam ON c.campaign_id = cam.id
    WHERE cam.archived = true
)
OR p.daily_bonus_id IN (
    SELECT db.id FROM daily_bonus db
    INNER JOIN campaigns cam ON db.campaign_id = cam.id
    WHERE cam.archived = true
)

UNION ALL

SELECT 
    'Configurations bonus associées' as type,
    COUNT(*) as count
FROM campaign_bonus_config cbc
INNER JOIN campaigns cam ON cbc.campaign_id = cam.id
WHERE cam.archived = true;

-- =====================================================
-- ATTENTION : POINT DE NON-RETOUR
-- Les opérations suivantes sont IRREVERSIBLES !
-- Décommentez et exécutez UNIQUEMENT si vous êtes sûr
-- =====================================================

-- Étape 1 : Supprimer les preuves associées aux campagnes archivées
/*
DELETE FROM proofs 
WHERE user_action_id IN (
    SELECT ua.id 
    FROM user_actions ua
    INNER JOIN challenges c ON ua.challenge_id = c.id
    INNER JOIN campaigns cam ON c.campaign_id = cam.id
    WHERE cam.archived = true
)
OR daily_bonus_id IN (
    SELECT db.id 
    FROM daily_bonus db
    INNER JOIN campaigns cam ON db.campaign_id = cam.id
    WHERE cam.archived = true
);
*/

-- Étape 2 : Supprimer les actions utilisateur associées aux campagnes archivées
/*
DELETE FROM user_actions 
WHERE challenge_id IN (
    SELECT c.id 
    FROM challenges c
    INNER JOIN campaigns cam ON c.campaign_id = cam.id
    WHERE cam.archived = true
);
*/

-- Étape 3 : Supprimer les bonus quotidiens associés aux campagnes archivées
/*
DELETE FROM daily_bonus 
WHERE campaign_id IN (
    SELECT id FROM campaigns WHERE archived = true
);
*/

-- Étape 4 : Supprimer les configurations de bonus associées aux campagnes archivées
/*
DELETE FROM campaign_bonus_config 
WHERE campaign_id IN (
    SELECT id FROM campaigns WHERE archived = true
);
*/

-- Étape 5 : Supprimer les actions associées aux campagnes archivées
/*
DELETE FROM actions 
WHERE challenge_id IN (
    SELECT c.id 
    FROM challenges c
    INNER JOIN campaigns cam ON c.campaign_id = cam.id
    WHERE cam.archived = true
);
*/

-- Étape 6 : Supprimer les défis associés aux campagnes archivées
/*
DELETE FROM challenges 
WHERE campaign_id IN (
    SELECT id FROM campaigns WHERE archived = true
);
*/

-- Étape 7 : Supprimer les campagnes archivées
/*
DELETE FROM campaigns 
WHERE archived = true;
*/

-- =====================================================
-- Vérification post-suppression
-- =====================================================
-- Décommentez après avoir exécuté les suppressions pour vérifier
/*
SELECT 
    'Campagnes archivées restantes' as type,
    COUNT(*) as count
FROM campaigns 
WHERE archived = true

UNION ALL

SELECT 
    'Défis orphelins' as type,
    COUNT(*) as count
FROM challenges c
LEFT JOIN campaigns cam ON c.campaign_id = cam.id
WHERE cam.id IS NULL

UNION ALL

SELECT 
    'Actions orphelines' as type,
    COUNT(*) as count
FROM actions a
LEFT JOIN challenges c ON a.challenge_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Actions utilisateur orphelines' as type,
    COUNT(*) as count
FROM user_actions ua
LEFT JOIN challenges c ON ua.challenge_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Bonus quotidiens orphelins' as type,
    COUNT(*) as count
FROM daily_bonus db
LEFT JOIN campaigns cam ON db.campaign_id = cam.id
WHERE cam.id IS NULL

UNION ALL

SELECT 
    'Preuves orphelines' as type,
    COUNT(*) as count
FROM proofs p
LEFT JOIN user_actions ua ON p.user_action_id = ua.id
LEFT JOIN daily_bonus db ON p.daily_bonus_id = db.id
WHERE ua.id IS NULL AND db.id IS NULL AND (p.user_action_id IS NOT NULL OR p.daily_bonus_id IS NOT NULL)

UNION ALL

SELECT 
    'Configurations bonus orphelines' as type,
    COUNT(*) as count
FROM campaign_bonus_config cbc
LEFT JOIN campaigns cam ON cbc.campaign_id = cam.id
WHERE cam.id IS NULL;
*/

-- =====================================================
-- Script d'urgence pour restaurer (si sauvegarde disponible)
-- =====================================================
-- Si vous avez une sauvegarde et devez restaurer :
-- 1. Connectez-vous avec des privilèges admin
-- 2. Restaurez depuis votre sauvegarde :
--    pg_restore -d htf_sunup_db backup_file.sql
-- 3. Ou utilisez votre méthode de restauration préférée

-- =====================================================
-- Notes importantes :
-- =====================================================
-- 1. Ce script utilise des transactions implicites
-- 2. Pour plus de sécurité, encapsulez dans une transaction :
--    BEGIN; ... COMMIT; (ou ROLLBACK; en cas de problème)
-- 3. Testez d'abord sur une base de données de développement
-- 4. Assurez-vous que personne n'utilise l'application pendant la suppression
-- 5. Les URLs de preuves stockées dans des services externes (S3, etc.) 
--    ne seront PAS supprimées automatiquement par ce script 