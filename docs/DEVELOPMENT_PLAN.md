# ShopSyncX - Step-by-Step Development Plan

## Phase 0: Project Setup (Day 1)

### 0.1 Repository & Monorepo Setup
- [ ] Initialize git repository
- [ ] Create root `README.md` with project overview
- [ ] Add `.gitignore` (node_modules, .env, dist, .expo, etc.)
- [ ] Create root `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `API_URL`, `SOCKET_URL`

### 0.2 Backend Scaffold
- [ ] Create `backend/` directory
- [ ] `npm init -y` in backend
- [ ] Install: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@prisma/client`, `socket.io`, `bcrypt`, `zod`
- [ ] Install dev: `typescript`, `tsx`, `prisma`, `@types/node`, `@types/bcrypt`
- [ ] Configure `tsconfig.json` (strict, ES2022)
- [ ] Copy/link Prisma schema to backend or use root prisma
- [ ] Create `src/index.ts` - minimal Fastify server that listens

### 0.3 Frontend Scaffold
- [ ] `npx create-expo-app@latest frontend --template blank-typescript`
- [ ] Install: `@tanstack/react-query`, `zustand`, `socket.io-client`, `expo-router`, `expo-secure-store`
- [ ] Configure Expo Router in `app.json`
- [ ] Create basic `app/_layout.tsx` and `app/index.tsx`
- [ ] Add `.env.example` with `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`

### 0.4 Database
- [ ] Set up PostgreSQL (local or Docker)
- [ ] Run `prisma migrate dev --name init`
- [ ] Run `prisma generate`

---

## Phase 1: Authentication (Days 2–3)

### 1.1 Backend Auth
- [ ] Create `auth.repository.ts` - user CRUD
- [ ] Create `auth.service.ts` - register (hash password), login (verify), getMe
- [ ] Create `auth.controller.ts` - handle requests, return responses
- [ ] Create `auth.schemas.ts` - Zod schemas for validation
- [ ] Create `auth.routes.ts` - POST /register, POST /login, GET /me
- [ ] Create JWT middleware - verify token, attach user to request
- [ ] Register auth routes with Fastify
- [ ] Test with Postman/curl

### 1.2 Frontend Auth
- [ ] Create `authStore.ts` (Zustand) - user, token, isAuthenticated, login, register, logout
- [ ] Create `api.ts` - axios/fetch base with auth header interceptor
- [ ] Create `auth.service.ts` - API calls for login, register, me
- [ ] Create `useAuth` hook
- [ ] Build `(auth)/login.tsx` and `(auth)/register.tsx` screens
- [ ] Build `app/index.tsx` - redirect to login if not auth, else to home
- [ ] Persist token with `expo-secure-store`
- [ ] Add loading state during auth check

---

## Phase 2: Groups (Days 4–5)

### 2.1 Backend Groups
- [ ] Create `groups.repository.ts` - group CRUD, membership CRUD
- [ ] Create `invite-code` util - generate 6-char alphanumeric, ensure unique
- [ ] Create `groups.service.ts` - create group (add creator as admin), join by code, list user groups
- [ ] Create `groups.controller.ts` and `groups.routes.ts`
- [ ] Routes: POST /groups, POST /groups/join, GET /groups, GET /groups/:id
- [ ] Add group membership check middleware
- [ ] Test endpoints

### 2.2 Frontend Groups
- [ ] Create `groupStore.ts` - groups list, currentGroup, createGroup, joinGroup, fetchGroups
- [ ] Create `groups.service.ts` - API calls
- [ ] Build `(tabs)/index.tsx` - list groups, "Create Group" and "Join Group" buttons
- [ ] Build `CreateGroupModal` and `JoinGroupModal` components
- [ ] Navigate to list when group selected (store currentGroup)

---

## Phase 3: Items CRUD (HTTP) (Days 6–7)

### 3.1 Backend Items
- [ ] Create `items.repository.ts` - item CRUD, getByGroupId with ordering
- [ ] Create `items.service.ts` - add, update, delete, list (ordered: unchecked first, then checked)
- [ ] Create `items.controller.ts` and `items.routes.ts`
- [ ] Routes: GET /groups/:groupId/items, POST, PATCH, DELETE
- [ ] Ensure all routes verify group membership
- [ ] Test endpoints

### 3.2 Frontend Items (HTTP only, no real-time yet)
- [ ] Create `listStore.ts` - items, addItem, updateItem, deleteItem, fetchItems
- [ ] Create `items.service.ts` - API calls
- [ ] Build `(tabs)/list.tsx` - show list when currentGroup set
- [ ] Build `ListItem` - name, quantity, checkbox, edit/delete actions
- [ ] Build `AddItemForm` - input + quantity, submit
- [ ] Order items: unchecked first, checked at bottom
- [ ] Empty state when no items

---

## Phase 4: Real-Time (Socket.IO) (Days 8–9)

### 4.1 Backend Socket.IO
- [ ] Integrate Socket.IO with Fastify (e.g. `@fastify/websocket` or custom integration)
- [ ] Create `socket/auth.handler.ts` - authenticate event, validate JWT, store userId
- [ ] Create `socket/group.handler.ts` - group:join (verify membership, join room), group:leave
- [ ] Create `socket/items.handler.ts` - item:add, item:edit, item:check, item:delete
- [ ] Each handler: validate, call items.service, broadcast to room
- [ ] Emit `item:added`, `item:edited`, `item:checked`, `item:deleted` to room
- [ ] Emit `error` on validation/authorization failures
- [ ] Test with multiple clients (e.g. two browser tabs with socket.io client)

### 4.2 Frontend Socket.IO
- [ ] Create `socket.service.ts` - connect, disconnect, authenticate, joinGroup, leaveGroup
- [ ] Create `useSocket` hook - connect on mount when authenticated
- [ ] In `listStore`, subscribe to socket events: item:added, item:edited, item:checked, item:deleted
- [ ] On add/edit/check/delete: emit socket event first (optimistic), then reconcile on server broadcast
- [ ] Handle `error` event - show toast, rollback optimistic update if needed
- [ ] Ensure socket connects after login and disconnects on logout

---

## Phase 5: Optimistic UI & Polish (Days 10–11)

### 5.1 Optimistic Updates
- [ ] Add item: immediately add to store with temp id, replace with server id on `item:added`
- [ ] Edit item: immediately update in store, revert on error
- [ ] Check item: immediately toggle, move to bottom in UI
- [ ] Delete item: immediately remove from store
- [ ] Add loading/error states for failed operations

### 5.2 Animations
- [ ] Use `react-native-reanimated` or `LayoutAnimation` for list changes
- [ ] Animate item appearance when added
- [ ] Animate item move when checked (slide to bottom)
- [ ] Subtle feedback on check/uncheck

### 5.3 Theme (Dark/Light)
- [ ] Create `theme/colors.ts` - light and dark palettes
- [ ] Create `useTheme` hook with context or Zustand
- [ ] Add theme toggle in settings
- [ ] Persist theme preference (AsyncStorage)
- [ ] Apply colors to all screens and components

---

## Phase 6: Onboarding & UX (Day 12)

### 6.1 Onboarding
- [ ] Create `onboarding/index.tsx` - 2–3 slides explaining: create/join group, share list, sync in real-time
- [ ] Show only on first launch (check AsyncStorage flag)
- [ ] Skip button, "Get Started" on last slide

### 6.2 Settings
- [ ] Build `(tabs)/settings.tsx` - theme toggle, logout, app version
- [ ] Optional: change name, delete account (future)

### 6.3 Polish
- [ ] Consistent spacing and typography
- [ ] Loading skeletons where appropriate
- [ ] Error boundaries
- [ ] Accessibility labels

---

## Phase 7: Testing & Deployment Prep (Days 13–14)

### 7.1 Testing
- [ ] Backend: unit tests for services (auth, groups, items)
- [ ] Backend: integration tests for critical routes
- [ ] Frontend: smoke tests for main flows (optional with Detox or Jest)

### 7.2 Deployment
- [ ] Backend: Dockerfile for Node.js
- [ ] Database: production migration strategy
- [ ] Environment: separate .env for dev/staging/prod
- [ ] Frontend: EAS Build for Expo (optional)

---

## Summary Timeline

| Phase | Focus | Duration |
|-------|-------|----------|
| 0 | Setup | 1 day |
| 1 | Auth | 2 days |
| 2 | Groups | 2 days |
| 3 | Items (HTTP) | 2 days |
| 4 | Real-Time | 2 days |
| 5 | Optimistic UI & Theme | 2 days |
| 6 | Onboarding & UX | 1 day |
| 7 | Testing & Deploy | 2 days |

**Total MVP: ~14 days** (adjust based on pace)

---

## Post-MVP Enhancements

- Refresh tokens
- Invite code expiration
- Push notifications (item added by someone)
- Item categories
- Multiple lists per group
- Offline support with sync
- Redis adapter for Socket.IO (horizontal scaling)
