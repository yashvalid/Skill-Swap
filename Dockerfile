FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 9000

CMD ["node", "server.js"]
