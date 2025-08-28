# Usa una imagen base de Node.js, recomendando la versión 20 o más reciente
FROM node:20-alpine AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de manifiesto del proyecto (package.json y package-lock.json)
# para aprovechar el cache de Docker. Esto evita reinstalar las dependencias
# si solo cambian los archivos de código.
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto al contenedor
COPY . .

# Genera la build de producción del proyecto Vite
RUN npm run build

# --- Servidor de producción ---
# Usa una imagen ligera de Nginx para servir los archivos estáticos
FROM nginx:1.25-alpine

# Copia la build de producción desde la etapa 'build'
COPY --from=build /app/dist /usr/share/nginx/html

# Copia el archivo de configuración de Nginx al contenedor
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]