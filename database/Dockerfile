FROM postgres:15-alpine

# Copie du script d'initialisation dans le dossier d'auto-exécution de PostgreSQL
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
