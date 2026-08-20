FROM nginx:alpine

# Copie l'index.html et l'image dehi.jpg dans le dossier web de Nginx
COPY index.html /usr/share/nginx/html/
COPY dehi.jpg /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

