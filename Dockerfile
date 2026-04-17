FROM node:22-alpine

WORKDIR /app

COPY package.json ./


RUN npm install --include=dev


COPY . .


RUN npm run build


# EXPOSE CONTAINER PORT
EXPOSE 5800  


CMD ["node", "dist/server.js"]
