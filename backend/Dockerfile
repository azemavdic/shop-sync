FROM node:20-alpine AS builder

WORKDIR /app

# Copy prisma first (shared)
COPY prisma ./prisma/

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

COPY backend .
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/prisma ../prisma

ENV NODE_ENV=production
EXPOSE 3000

# Run migrations then start (migrate deploy for production)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../prisma/schema.prisma && node dist/index.js"]
