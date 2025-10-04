# Documentation API - HTF SunUp

## Vue d'ensemble

L'API HTF SunUp est une API REST construite avec Nest.js qui gère les campagnes de défis quotidiens pour les équipes Forever Living. Elle utilise l'authentification JWT et supporte deux rôles utilisateur : manager et FBO.

## Base URL

- **Développement** : `http://localhost:3001`
- **Production** : `https://htf-sunup-backend.onrender.com`

## Authentification

L'API utilise l'authentification JWT (JSON Web Token). Après connexion, utilisez le token dans l'en-tête `Authorization`.

### Endpoints d'authentification

#### POST /api/auth/login

Connexion utilisateur.

**Request Body:**

```json
{
  "email": "aurelia@htf.com",
  "password": "password"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 25,
    "email": "aurelia@htf.com",
    "name": "Aurélia",
    "role": "manager",
    "managerId": null
  }
}
```

#### POST /api/auth/register

Inscription d'un nouvel utilisateur.

**Request Body:**

```json
{
  "name": "Nouveau Utilisateur",
  "email": "nouveau@htf.com",
  "password": "motdepasse",
  "role": "fbo",
  "managerId": 26
}
```

### Utilisation du Token

Incluez le token JWT dans toutes les requêtes protégées :

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Endpoints Campagnes

### GET /campaigns

Récupère toutes les campagnes.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Les défis de l'été de la Happy Team",
    "description": "Campagne de défis pour booster l'activité pendant l'été 2025",
    "startDate": "2025-07-07T00:00:00.000Z",
    "endDate": "2025-08-31T00:00:00.000Z",
    "status": "active",
    "createdBy": 25,
    "createdAt": "2025-06-22T08:31:21.000Z",
    "updatedAt": "2025-06-22T08:31:21.000Z"
  }
]
```

### POST /campaigns

Crée une nouvelle campagne.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Nouvelle Campagne",
  "description": "Description de la campagne",
  "startDate": "2025-09-01",
  "endDate": "2025-09-30"
}
```

**Response:**

```json
{
  "id": 2,
  "name": "Nouvelle Campagne",
  "description": "Description de la campagne",
  "startDate": "2025-09-01T00:00:00.000Z",
  "endDate": "2025-09-30T00:00:00.000Z",
  "status": "inactive",
  "createdBy": 25,
  "createdAt": "2025-06-22T10:00:00.000Z",
  "updatedAt": "2025-06-22T10:00:00.000Z"
}
```

### GET /campaigns/active

Récupère uniquement les campagnes actives.

**Headers:**

```
Authorization: Bearer <token>
```

### GET /campaigns/:id

Récupère une campagne spécifique.

**Headers:**

```
Authorization: Bearer <token>
```

**Parameters:**

- `id` (integer) : ID de la campagne

### GET /campaigns/:id/challenges

Récupère une campagne avec tous ses défis.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "name": "Les défis de l'été de la Happy Team",
  "description": "Campagne de défis pour booster l'activité pendant l'été 2025",
  "startDate": "2025-07-07T00:00:00.000Z",
  "endDate": "2025-08-31T00:00:00.000Z",
  "status": "active",
  "createdBy": 25,
  "createdAt": "2025-06-22T08:31:21.000Z",
  "updatedAt": "2025-06-22T08:31:21.000Z",
  "challenges": [
    {
      "id": 1,
      "campaignId": 1,
      "date": "2025-06-22T00:00:00.000Z",
      "title": "Défi du 2025-06-22",
      "description": "Trois actions pour booster votre activité aujourd'hui",
      "createdAt": "2025-06-22T08:31:21.000Z",
      "updatedAt": "2025-06-22T08:31:21.000Z"
    }
  ]
}
```

### PATCH /campaigns/:id

Met à jour une campagne.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Nom modifié",
  "status": "completed"
}
```

### DELETE /campaigns/:id

Supprime une campagne (seulement si elle n'a pas de défis).

**Headers:**

```
Authorization: Bearer <token>
```

## Endpoints Défis

### GET /challenges

Récupère tous les défis avec filtres optionnels.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `campaignId` (integer, optionnel) : Filtrer par campagne
- `date` (string, optionnel) : Filtrer par date (format YYYY-MM-DD)

**Response:**

```json
[
  {
    "id": 1,
    "campaignId": 1,
    "date": "2025-06-22T00:00:00.000Z",
    "title": "Défi du 2025-06-22",
    "description": "Trois actions pour booster votre activité aujourd'hui",
    "createdAt": "2025-06-22T08:31:21.000Z",
    "updatedAt": "2025-06-22T08:31:21.000Z"
  }
]
```

### POST /challenges

Crée un nouveau défi.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "campaignId": 1,
  "date": "2025-06-23",
  "title": "Défi du weekend",
  "description": "Actions spéciales pour le weekend"
}
```

### GET /challenges/today

Récupère les défis du jour actuel.

**Headers:**

```
Authorization: Bearer <token>
```

### GET /challenges/:id

Récupère un défi spécifique.

**Headers:**

```
Authorization: Bearer <token>
```

### GET /challenges/:id/actions

Récupère un défi avec toutes ses actions.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "campaignId": 1,
  "date": "2025-06-22T00:00:00.000Z",
  "title": "Défi du 2025-06-22",
  "description": "Trois actions pour booster votre activité aujourd'hui",
  "createdAt": "2025-06-22T08:31:21.000Z",
  "updatedAt": "2025-06-22T08:31:21.000Z",
  "actions": [
    {
      "id": 10,
      "challengeId": 1,
      "title": "Appel prospection client",
      "description": "Contacter 3 prospects qualifiés pour présenter nos produits Aloe Vera",
      "type": "vente",
      "order": 1,
      "createdAt": "2025-06-22T08:31:21.000Z",
      "updatedAt": "2025-06-22T08:31:21.000Z"
    },
    {
      "id": 11,
      "challengeId": 1,
      "title": "Partage réseau social",
      "description": "Publier un témoignage client sur Instagram avec hashtags #ForeverLiving #AloeVera",
      "type": "reseaux_sociaux",
      "order": 2,
      "createdAt": "2025-06-22T08:31:21.000Z",
      "updatedAt": "2025-06-22T08:31:21.000Z"
    },
    {
      "id": 12,
      "challengeId": 1,
      "title": "Invitation événement",
      "description": "Inviter 2 personnes à la prochaine présentation produit",
      "type": "recrutement",
      "order": 3,
      "createdAt": "2025-06-22T08:31:21.000Z",
      "updatedAt": "2025-06-22T08:31:21.000Z"
    }
  ]
}
```

### PATCH /challenges/:id

Met à jour un défi.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

### DELETE /challenges/:id

Supprime un défi (seulement s'il n'a pas d'actions).

**Headers:**

```
Authorization: Bearer <token>
```

## Endpoints Actions

### GET /actions/challenge/:challengeId

Récupère toutes les actions d'un défi.

**Headers:**

```
Authorization: Bearer <token>
```

**Parameters:**

- `challengeId` (integer) : ID du défi

### POST /actions

Crée une nouvelle action.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "challengeId": 1,
  "title": "Nouvelle action",
  "description": "Description de l'action",
  "type": "vente",
  "order": 4
}
```

**Types d'actions disponibles:**

- `vente` : Actions de vente
- `recrutement` : Actions de recrutement
- `reseaux_sociaux` : Actions sur les réseaux sociaux

**Contraintes:**

- Maximum 6 actions par défi
- L'ordre doit être unique dans le défi (1-6)

### PATCH /actions/:id

Met à jour une action.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

### DELETE /actions/:id

Supprime une action.

**Headers:**

```
Authorization: Bearer <token>
```

## Endpoints Utilisateurs

### GET /users

Récupère tous les utilisateurs.

**Headers:**

```
Authorization: Bearer <token>
```

### POST /users

Crée un nouvel utilisateur.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Nouveau FBO",
  "email": "nouveau@htf.com",
  "password": "motdepasse",
  "role": "fbo",
  "managerId": 26
}
```

**Rôles disponibles:**

- `manager` : Gestion d'équipe et campagnes (accès selon la hiérarchie)
- `fbo` : Validation d'actions

### GET /users/:id

Récupère un utilisateur spécifique.

### PATCH /users/:id

Met à jour un utilisateur.

### DELETE /users/:id

Supprime un utilisateur.

## Codes de Statut HTTP

- `200 OK` : Requête réussie
- `201 Created` : Ressource créée avec succès
- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Token manquant ou invalide
- `403 Forbidden` : Permissions insuffisantes
- `404 Not Found` : Ressource non trouvée
- `409 Conflict` : Conflit (ex: date déjà prise pour un défi)
- `500 Internal Server Error` : Erreur serveur

## Gestion des Erreurs

Format des erreurs :

```json
{
  "message": "Description de l'erreur",
  "error": "Type d'erreur",
  "statusCode": 400
}
```

### Erreurs Communes

**401 Unauthorized:**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**400 Bad Request (validation):**

```json
{
  "message": ["name should not be empty", "startDate must be a valid date"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**409 Conflict (défi existant):**

```json
{
  "message": "Un défi existe déjà pour cette date dans cette campagne",
  "error": "Conflict",
  "statusCode": 409
}
```

## Exemples d'Utilisation

### Workflow Complet

1. **Connexion**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aurelia@htf.com","password":"password"}'
```

2. **Récupérer les campagnes**

```bash
curl -X GET http://localhost:3001/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Créer un défi**

```bash
curl -X POST http://localhost:3001/challenges \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": 1,
    "date": "2025-06-23",
    "title": "Nouveau défi",
    "description": "Description du défi"
  }'
```

4. **Ajouter des actions au défi**

```bash
curl -X POST http://localhost:3001/actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 2,
    "title": "Action de vente",
    "description": "Contacter 5 prospects",
    "type": "vente",
    "order": 1
  }'
```

## Données de Test

Le seed crée automatiquement ces comptes pour les tests :

| Rôle              | Email            | Mot de passe | Description      |
| ----------------- | ---------------- | ------------ | ---------------- |
| manager principal | aurelia@htf.com  | password     | Accès complet    |
| manager           | jeromine@htf.com | password     | Gestion d'équipe |
| manager           | gaelle@htf.com   | password     | Gestion d'équipe |
| manager           | audrey@htf.com   | password     | Gestion d'équipe |
| fbo               | marie@htf.com    | password     | Membre équipe    |
| fbo               | pierre@htf.com   | password     | Membre équipe    |
| fbo               | sophie@htf.com   | password     | Membre équipe    |

## Documentation Interactive

La documentation Swagger est disponible à l'adresse :

- **Développement** : http://localhost:3001/api
- **Production** : https://htf-sunup-backend.onrender.com/api

---

_Documentation mise à jour le 22 juin 2025_
