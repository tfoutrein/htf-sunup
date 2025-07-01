-- Script pour faire d'Aurelia le manager des autres managers
-- À exécuter sur la base de données Render

-- 1. Vérifier que Aurelia existe
SELECT id, name, email, role, manager_id as current_manager_id 
FROM users 
WHERE email = 'aurelia@example.com';

-- 2. Voir la hiérarchie actuelle
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.manager_id,
    m.name as manager_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
ORDER BY u.role, u.name;

-- 3. Mettre à jour tous les managers (sauf Aurelia) pour qu'Aurelia soit leur manager
UPDATE users 
SET manager_id = (SELECT id FROM users WHERE email = 'aurelia@example.com')
WHERE role = 'manager' 
  AND email != 'aurelia@example.com';

-- 4. S'assurer qu'Aurelia n'a pas de manager (elle est au sommet de la hiérarchie)
UPDATE users 
SET manager_id = NULL
WHERE email = 'aurelia@example.com';

-- 5. Vérifier la hiérarchie finale
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.manager_id,
    CASE 
        WHEN m.name IS NOT NULL THEN m.name
        ELSE 'Top Manager'
    END as manager_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
ORDER BY u.role, u.name;

-- 6. Compter les utilisateurs par rôle avec leur manager
SELECT 
    u.role,
    COUNT(*) as count,
    CASE 
        WHEN m.name IS NOT NULL THEN m.name
        ELSE 'No Manager'
    END as manager_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
GROUP BY u.role, m.name
ORDER BY u.role; 