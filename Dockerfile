# 1. Build the Vite Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend-app
COPY frontend-app/package*.json ./
RUN npm install
COPY frontend-app/ ./
RUN npm run build

# 2. Build the Express Backend & Serve Frontend
FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend directly into the image so the backend can serve it
COPY --from=frontend-builder /app/frontend-app/dist /app/frontend-app/dist

# Expose standard Cloud Run port
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start Express server
CMD ["node", "server.js"]
