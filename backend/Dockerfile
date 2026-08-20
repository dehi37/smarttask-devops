# Image de base Node.js
FROM node:18-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install --production

#Copie du reste du code source
COPY . .

# Exposition du port de l'API
EXPOSE 5000

# Commande de démarrage de l'API
CMD ["node", "server.js"]
