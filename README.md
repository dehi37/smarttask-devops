# 🚀 SmartTask DevOps | Plateforme de Gestion de Tâches d'Entreprise

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-3--Tier-blue.svg" alt="Architecture">
  <img src="https://img.shields.io/badge/Docker-Containers-blue?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins" alt="Jenkins">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=nodedotjs" alt="NodeJS">
</p>

---

## 📌 À propos du projet

**SmartTask** est une solution web d'entreprise dédiée à la gestion de tâches multi-services avec attribution de rôles granulaire (RBAC). Ce dépôt contient l'ensemble du code source de l'application ainsi que les configurations d'infrastructure et de conteneurisation automatisée (DevOps).

---

## 🏗️ Architecture Technique

L'application repose sur un modèle multi-tier totalement conteneurisé :

* **Frontend** : Interface dynamique HTML5 / Bootstrap 5 / JavaScript vanilla hébergée sous Nginx.
* **Backend** : API RESTful développée avec Node.js / Express et sécurisée par JSON Web Tokens (JWT).
* **Base de données** : PostgreSQL 15 pour la persistance des tâches, utilisateurs, services et journaux d'audit.

---

## 📁 Structure du Projet

```text
.
├── backend
│   ├── Dockerfile          # Configuration du conteneur Node.js pour l'API REST
│   ├── package.json        # Dépendances Node.js (Express, bcryptjs, pg, jwt, etc.)
│   └── server.js           # Code source backend (endpoints API, logique RBAC, requêtes BDD)
├── database
│   ├── Dockerfile          # Image BDD basée sur postgres:15-alpine embarquant init.sql
│   └── init.sql            # Script SQL d'initialisation (création des tables & données initiales)
├── docker-compose.yml      # Orchestration multi-conteneurs, réseaux et volumes persistants
├── frontend
│   ├── dehi.jpg            # Ressource image utilisée dans l'interface utilisateur
│   ├── Dockerfile          # Configuration du serveur Web Nginx pour servir le client
│   └── index.html          # Single Page Application (SPA) HTML5/JS/Bootstrap
├── Jenkinsfile              # Pipeline CI/CD multibranche (DevOps : Build, Tag, Push Docker Hub)
└── README.md                # Documentation technique complète du projet
```

---

## 🔐 Matrice des Rôles et Droits (RBAC)

| Rôle | Visibilité Tâches | Édition Statut | Gestion Utilisateurs | Gestion Services | Audit & Monitoring |
|---|---|---|---|---|---|
| **USER** | Ses tâches créées | ❌ | ❌ | ❌ | ❌ |
| **TECHNICIEN** | Tâches assignées | ✔️ | ❌ | ❌ | ❌ |
| **SUPERVISEUR** | Toutes les tâches | ✔️ | ❌ | ❌ | ❌ |
| **ADMIN** | Toutes les tâches | ✔️ | ✔️ (Création/Suppression) | ✔️ (Création) | ❌ |
| **SUPER_ADMIN** | Accès global | ✔️ (Accès total) | ✔️ (Accès total) | ✔️ (Accès total) | ✔️ Exclusif |

---

## 🌿 Stratégie de Gestion des Branches Git

Le projet applique le modèle de branching suivant :

```text
  prod ───────────(Environnement de Production / Releases)─────►
                    ▲
                    │ (Merge & Pull Requests)
                    │
   dev ─────────────┴──(Développements & Intégration Continue)──►
```

* **dev** : Branche dédiée à l'intégration continue, au développement des fonctionnalités et à la conteneurisation.
* **prod** : Branche principale contenant le code stable prêt à être déployé en production.

---

## 🔄 Cinématique et Flux CI/CD (Pipeline Jenkins)

```text
  [ Developer Push ] ──► ( GitHub: dev / prod )
                                 │
                                 ▼
                         [ Jenkins Pipeline ]
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     [ Build Backend ]    [ Build Frontend ]    [ Build Database ]
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 ▼
                     [ Docker Hub Register ]
                 ( Tagging: dev-latest / latest )
                                 │
                                 ▼
                     [ Deployment / Runtime ]
                     ( Docker Compose Stack )
```

---

## 🛠️ Progression des Projets et Commandes

### 🔹 Projet 1 : Conteneurisation des microservices

Création des Dockerfiles dédiés pour le backend Node.js, l'interface Nginx et l'initialisation PostgreSQL.

```bash
# Build individuel des images
docker build -t repsmarttask-backend ./backend
docker build -t repsmarttask-frontend ./frontend
docker build -t repsmarttask-db ./database
```

### 🔹 Projet 2 : Orchestration multi-conteneurs avec Docker Compose

Mise en place de l'orchestration locale avec réseau isolé et persistance des données.

```bash
# Démarrer l'ensemble de la stack en arrière-plan
docker compose up -d

# Vérifier le statut des conteneurs
docker compose ps

# Arrêter la stack
docker compose down
```

### 🔹 Projet 3 : Gestion du code source avec GitHub (`smarttask-devops`)

Initialisation du dépôt Git local, structuration multi-branches (`dev` et `prod`), mise à jour des mots de passe en BDD avec hachage Bcrypt et push du projet complet vers GitHub.

```bash
# 1. Initialisation du dépôt et création de la branche dev
git init
git checkout -b dev

# 2. Ajout des fichiers et premier commit
git add .
git commit -m "feat: initialisation du projet smarttask-devops"

# 3. Liaison avec GitHub et push des branches dev et prod
git remote add origin https://github.com/dehi37/smarttask-devops.git
git push -u origin dev

git checkout -b prod
git push -u origin prod
git checkout dev

# 4. (Optionnel) Mise à jour directe des hashs Bcrypt en base de données PostgreSQL
HASH=$(docker exec smarttask-backend node -e 'console.log(require("bcryptjs").hashSync("password123", 10))')
docker exec -i smarttask-postgres psql -U smartuser -d smarttask_db -c "UPDATE users SET password = '$HASH';"
```

### 🔹 Projet 4 : Automatisation CI/CD avec Pipeline Multibranche Jenkins

Intégration d'un Jenkinsfile gérant les branches `dev` et `prod`, le build automatique, l'authentification et le push sur Docker Hub.

```bash
# Workflow de synchronisation inter-branches
git checkout dev
git add .
git commit -m "feat: mise à jour du pipeline et de la structure du projet"
git push origin dev

# Fusion vers la branche de production
git checkout prod
git merge dev
git push origin prod
git checkout dev
```

---

## ✅ Test Final et Validation

Dans cette phase finale de validation sur le serveur client, nous déployons la stack SmartTask à l'aide du fichier `docker-compose.yml` configuré pour récupérer les images publiées sur Docker Hub. Nous vérifions la création des images, l'état d'exécution des conteneurs, puis nous appliquons le script Post-Install de hachage des mots de passe avant de valider l'accès Web depuis le navigateur.

### 1. Fichier de configuration `docker-compose.yml` (Serveur Client)

Le fichier `docker-compose.yml` présent sur le serveur client s'appuie sur les images pré-construites et hébergées sur Docker Hub :

```yaml
version: '3.8'

services:
  frontend:
    image: dehilegod/repsmarttask-frontend:latest
    container_name: smarttask-frontend
    ports:
      - "8082:80"
    restart: always
    networks:
      - smarttask-net
    depends_on:
      - backend

  backend:
    image: dehilegod/repsmarttask-backend:latest
    container_name: smarttask-backend
    ports:
      - "5000:5000"
    environment:
      - POSTGRES_HOST=smarttask-postgres
      - POSTGRES_USER=smartuser
      - POSTGRES_PASSWORD=smartpass
      - POSTGRES_DB=smarttask_db
      - DB_HOST=smarttask-postgres
      - DB_USER=smartuser
      - DB_PASSWORD=smartpass
      - DB_NAME=smarttask_db
    restart: always
    networks:
      - smarttask-net
    depends_on:
      - postgres

  postgres:
    image: dehilegod/repsmarttask-db:latest
    container_name: smarttask-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=smartuser
      - POSTGRES_PASSWORD=smartpass
      - POSTGRES_DB=smarttask_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - smarttask-net

networks:
  smarttask-net:
    driver: bridge

volumes:
  postgres_data:
```

### 2. Déploiement et vérification des images Docker

Après le lancement des services via la commande `docker compose up -d`, nous contrôlons les images qui ont été téléchargées et créées localement sur le serveur :

```bash
docker images
```

**Résultat attendu** : Affichage des images `dehilegod/repsmarttask-frontend`, `dehilegod/repsmarttask-backend` et `dehilegod/repsmarttask-db`.

### 3. Vérification des conteneurs en cours d'exécution

Nous vérifions l'état opérationnel des conteneurs déployés :

```bash
docker ps
```

**Résultat attendu** : Trois conteneurs doivent être au statut `Up` :

* `smarttask-frontend` (Exposé sur le port `8082:80`)
* `smarttask-backend` (Exposé sur le port `5000:5000`)
* `smarttask-postgres` (Exposé sur le port `5432:5432`)

### 4. Hachage des mots de passe en base de données

Après l'initialisation des conteneurs, nous exécutons les commandes suivantes pour générer dynamiquement l'empreinte sécurisée de `password123` via la librairie `bcryptjs` du backend, puis mettre à jour la base PostgreSQL :

```bash
# 1. Génération du hash du mot de passe 'password123'
HASH=$(docker exec smarttask-backend node -e 'console.log(require("bcryptjs").hashSync("password123", 10))')

# 2. Injection de la mise à jour dans PostgreSQL
docker exec -i smarttask-postgres psql -U smartuser -d smarttask_db -c "UPDATE users SET password = '$HASH';"
```

### 5. Validation de l'accès navigateur

L'application est entièrement validée en accédant à l'interface depuis un poste client :

* **URL d'accès** : `http://192.168.20.21:8082`
* **Mot de passe réinitialisé** : `password123`

### 6. Synthèse des résultats

1. **Stack Docker Compose** : Les services Frontend, Backend et PostgreSQL démarrent en toute autonomie via les images du Docker Hub.
2. **Post-traitement SQL** : Le script de hachage s'exécute à travers les conteneurs et met à jour la table `users` en toute sécurité.
3. **Accès Web** : L'application Web répond correctement sur l'IP du serveur au port `8082`.
