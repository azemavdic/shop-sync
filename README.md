# ShopSyncX

A real-time collaborative grocery shopping mobile application. Multiple authenticated users in the same group (family or roommates) can see and update a shared grocery list instantly.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React Native (Expo), TypeScript, Zustand |
| Backend | Node.js, Fastify, Socket.IO |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT |

## Project Structure

```
shop-sync/
├── docs/           # Architecture, API, WebSocket, Development Plan
├── prisma/         # Database schema & migrations
├── backend/        # Fastify API + Socket.IO server
└── frontend/       # React Native Expo app
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)
- npm or pnpm

### 1. Database (PostgreSQL via Docker)

```bash
# Copy env and start PostgreSQL
cp .env.example .env
cp prisma/.env.example prisma/.env
docker compose up -d

# Wait for DB to be ready, then run migrations
cd backend
npm install
npx prisma migrate dev --name init --schema=../prisma/schema.prisma
npx prisma generate --schema=../prisma/schema.prisma
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

API runs at `http://localhost:3000`

### 4. Database GUI (Adminer)

With Docker Compose running, open **http://localhost:8081** in your browser.

- **System:** PostgreSQL
- **Server:** postgres
- **Username:** shopsyncx (or your `POSTGRES_USER`)
- **Password:** shopsyncx_secret (or your `POSTGRES_PASSWORD`)
- **Database:** shopsyncx (or your `POSTGRES_DB`)

### 3. Frontend

```bash
cd frontend
npm install
npx expo start
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design, data flow, scalability
- [API Endpoints](docs/API_ENDPOINTS.md) - REST API specification
- [WebSocket Events](docs/WEBSOCKET_EVENTS.md) - Real-time event design
- [Folder Structure](docs/FOLDER_STRUCTURE.md) - Backend & frontend layout
- [Development Plan](docs/DEVELOPMENT_PLAN.md) - Step-by-step MVP build guide

## License

MIT
