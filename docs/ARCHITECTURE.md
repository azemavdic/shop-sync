# ShopSyncX - High-Level System Architecture

## Overview

ShopSyncX is a real-time collaborative grocery shopping application that enables multiple authenticated users within a group (family/roommates) to manage a shared grocery list with instant synchronization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ShopSyncX System                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │  Mobile Clients  │         │  Mobile Clients  │                         │
│  │  (React Native   │         │  (React Native   │                         │
│  │   Expo)          │         │   Expo)          │                         │
│  └────────┬─────────┘         └────────┬─────────┘                         │
│           │                            │                                     │
│           │  HTTPS / WSS               │  HTTPS / WSS                        │
│           │                            │                                     │
│           └────────────┬───────────────┘                                     │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     API Gateway / Load Balancer                      │   │
│  │                    (Future: nginx, AWS ALB, etc.)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Backend Server (Node.js)                         │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                     │   │
│  │  │  Fastify HTTP API   │  │  Socket.IO Server   │                     │   │
│  │  │  - REST endpoints   │  │  - Real-time sync   │                     │   │
│  │  │  - JWT auth         │  │  - Room per group   │                     │   │
│  │  │  - CRUD operations  │  │  - Event broadcast │                     │   │
│  │  └─────────┬───────────┘  └─────────┬───────────┘                     │   │
│  │            │                        │                                  │   │
│  │            └────────────┬────────────┘                                  │   │
│  │                         │                                               │   │
│  │                         ▼                                               │   │
│  │            ┌────────────────────────┐                                   │   │
│  │            │  Services / Business   │                                   │   │
│  │            │  Logic Layer           │                                   │   │
│  │            └────────────┬───────────┘                                   │   │
│  │                         │                                               │   │
│  │                         ▼                                               │   │
│  │            ┌────────────────────────┐                                   │   │
│  │            │  Repository Layer      │                                   │   │
│  │            │  (Prisma ORM)          │                                   │   │
│  │            └────────────┬───────────┘                                   │   │
│  └────────────────────────┼───────────────────────────────────────────────┘   │
│                           │                                                    │
│                           ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PostgreSQL Database                               │    │
│  │  - users, groups, group_members, items                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Mobile Client (React Native + Expo)
- **Authentication**: Login, registration, token storage
- **Group Management**: Create/join groups via invite code
- **List UI**: Add, edit, check, delete items with optimistic updates
- **Real-time**: Socket.IO client for instant sync
- **State**: Zustand stores (auth, group, list)
- **Theme**: Dark/light mode support

### 2. Backend (Node.js + Fastify)
- **HTTP API**: RESTful endpoints for auth, groups, items
- **WebSocket**: Socket.IO for real-time events
- **Auth**: JWT validation middleware
- **Validation**: Request/response schemas (e.g., Fastify schemas)

### 3. Database (PostgreSQL)
- **Persistence**: Users, groups, memberships, items
- **Relations**: Proper foreign keys and indexes
- **Migrations**: Prisma migrations for version control

## Real-Time Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Socket.IO Room Strategy                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Room naming: group:{groupId}                                     │
│                                                                  │
│  User A (Group 1) ──┐                                            │
│  User B (Group 1) ──┼──► Room "group:abc123" ◄── Item updated    │
│  User C (Group 1) ──┘         │                                   │
│                               │ Broadcast to all members          │
│                               ▼                                   │
│  User D (Group 2) ───────────► Room "group:xyz789" (separate)     │
│                                                                  │
│  • On join: socket.join(`group:${groupId}`)                       │
│  • On item change: io.to(`group:${groupId}`).emit(...)            │
│  • Exclude sender if needed (or include for consistency)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Adding an Item (Optimistic UI)
1. User taps "Add" → Frontend immediately adds item to Zustand store (optimistic)
2. Frontend emits `item:add` via Socket.IO
3. Backend validates, persists to DB, broadcasts `item:added` to room
4. All clients (including sender) receive `item:added` → reconcile state
5. If backend fails → Frontend rolls back optimistic update

### Checking an Item
1. User taps checkbox → Frontend toggles `checked` locally (optimistic)
2. Frontend emits `item:check` via Socket.IO
3. Backend updates DB, broadcasts `item:checked` to room
4. All clients reorder list (checked items to bottom)

## Security Considerations

- **JWT**: Short-lived access tokens, refresh token strategy for production
- **Authorization**: Every request validates user belongs to group
- **Invite codes**: Random, time-limited (future enhancement)
- **Rate limiting**: Apply on auth and API endpoints (future)
- **Input validation**: Sanitize all user inputs

## Scalability Path (Future)

| Phase | Enhancement |
|-------|-------------|
| 1 | Single server, vertical scaling |
| 2 | Redis adapter for Socket.IO (multi-instance) |
| 3 | Separate read replicas for PostgreSQL |
| 4 | CDN for static assets, edge caching |
| 5 | Microservices split (auth, list, real-time) |
