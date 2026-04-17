FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# EXPOSE CONTAINER PORT
EXPOSE 5800  

CMD ["npx", "tsx", "server.ts"]
