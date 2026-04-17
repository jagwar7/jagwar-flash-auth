FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm run build

COPY . .

# EXPOSE CONTAINER PORT
EXPOSE 5800  

CMD ["node", "dist/server.ts"]
