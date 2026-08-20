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

## 🔐 Matrice des Rôles et Droits (RBAC)

| Rôle | Visibilité Tâches | Édition Statut | Gestion Utilisateurs | Gestion Services | Audit & Monitoring |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **USER** | Ses tâches créées | ❌ | ❌ | ❌ | ❌ |
| **TECHNICIEN** | Tâches assignées |  | ❌ | ❌ | ❌ |
| **SUPERVISEUR** | Toutes les tâches |  | ❌ | ❌ | ❌ |
| **ADMIN** | Toutes les tâches |  |  (Création/Suppression) |  (Création) | ❌ |
| **SUPER_ADMIN** | Accès global |  |  (Accès total) |  (Accès total) |  **Exclusif** |

---

## 🌿 Stratégie de Gestion des Branches Git

Le projet applique le modèle de branching suivant :

```text
  main / prod ───(Livraison Stable)─────────────────────────►
                    ▲
                    │ (Merge Requests / Pull Requests)
                    │
   dev ─────────────┴──(Développements & Intégration)──────►
