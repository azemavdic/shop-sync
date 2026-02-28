# ShopSyncX - Project Context Summary

> **Purpose:** Preserve context across AI sessions. Reference this file with `@docs/PROJECT_CONTEXT.md` when continuing work.

## What We Built

**ShopSyncX** is a real-time collaborative grocery shopping app. Users invite others to **channels**, create **groups** within channels, and share **shopping lists** per group.

### Hierarchy
```
User → Channels → Groups → List (items)
```
- **Channel**: Invite users via 6-char invite code. Create/join channels.
- **Group**: Lives inside a channel. Create/join groups within a channel.
- **List**: One shared list per group. Add, check, delete items.

### Navigation Flow
1. **Channels tab** – List channels. Create or join via invite code. Tap channel → Groups.
2. **Groups screen** (`channel/[channelId]`) – Groups in that channel. Create or join. Tap group → List.
3. **List tab** – Shopping list for selected group. Add items, check/uncheck, delete.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React Native (Expo SDK 54), TypeScript, Zustand, Expo Router |
| Backend | Node.js, Fastify, Socket.IO (planned), Prisma |
| Database | PostgreSQL (Docker), Adminer on port 8081 |
| Auth | JWT, expo-secure-store |
| i18n | Custom (Bosnian default, English), AsyncStorage for locale |

---

## Key Paths

### Backend (`backend/`)
- `src/index.ts` – Entry, registers auth, channels, groups, items routes
- `src/modules/auth/` – Register, login, /me
- `src/modules/channels/` – Create, join, list, leave, update channels
- `src/modules/groups/` – Channel-scoped: create in channel, list by channel, join by code, leave, update
- `src/modules/items/` – CRUD items per group

### Frontend (`frontend/`)
- `app/(tabs)/index.tsx` – Channels screen
- `app/(tabs)/channel/[channelId].tsx` – Groups in channel (hidden from tab bar)
- `app/(tabs)/list.tsx` – List for current group
- `app/(tabs)/settings.tsx` – Profile, language, logout
- `stores/` – channelStore, groupStore, listStore, authStore
- `services/` – channels, groups, items, auth API calls
- `i18n/` – translations (bs, en), useTranslation hook

### API Base
- `http://localhost:3000/api/v1` (or PC IP for physical device)
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Channels: `/channels`, `/channels/join`, `/channels/:id`
- Groups: `/channels/:channelId/groups`, `/groups/join`, `/groups/:groupId`
- Items: `/groups/:groupId/items`

---

## Environment

- **Backend**: `.env` at root. `DATABASE_URL`, `JWT_SECRET`, `PORT`
- **Frontend**: `frontend/.env`. `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL` (use PC IP for physical device)
- **Prisma**: `prisma/.env` with `DATABASE_URL` (Prisma loads from schema dir)

---

## Not Yet Implemented

- **Socket.IO** real-time sync (items add/edit/check/delete)
- **Optimistic UI** with rollback
- **Onboarding** flow
- **Dark/light theme** toggle (UI is dark by default)

---

## Common Fixes

- **Import path errors**: Files in `app/(tabs)/channel/` need `../../../` to reach root (stores, services, i18n).
- **Network failed on device**: Set `EXPO_PUBLIC_API_URL` to PC IP (e.g. `http://192.168.100.6:3000/api/v1`).
- **Adminer**: `http://localhost:8081`, server=postgres, user=shopsyncx, pass=shopsyncx_secret.

---

*Last updated: Feb 2025*
