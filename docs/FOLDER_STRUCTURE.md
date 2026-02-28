# ShopSyncX - Folder Structure

## Backend Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (or link to root prisma/)
│   └── migrations/            # Prisma migrations
├── src/
│   ├── index.ts               # Entry point (Fastify + Socket.IO)
│   ├── config/
│   │   └── env.ts             # Environment variables validation
│   ├── plugins/
│   │   ├── prisma.ts          # Prisma Fastify plugin
│   │   └── socket.ts          # Socket.IO setup
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.schemas.ts
│   │   │   └── auth.routes.ts
│   │   ├── groups/
│   │   │   ├── groups.controller.ts
│   │   │   ├── groups.service.ts
│   │   │   ├── groups.repository.ts
│   │   │   ├── groups.schemas.ts
│   │   │   └── groups.routes.ts
│   │   └── items/
│   │       ├── items.controller.ts
│   │       ├── items.service.ts
│   │       ├── items.repository.ts
│   │       ├── items.schemas.ts
│   │       └── items.routes.ts
│   ├── socket/
│   │   ├── handlers/
│   │   │   ├── auth.handler.ts    # authenticate event
│   │   │   ├── group.handler.ts   # group:join, group:leave
│   │   │   └── items.handler.ts  # item:add, item:edit, item:check, item:delete
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts # JWT validation for socket
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT validation for HTTP
│   │   └── error-handler.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts           # bcrypt helpers
│   │   └── invite-code.ts        # Generate unique invite codes
│   └── types/
│       └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Frontend Structure (React Native Expo)

```
frontend/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout (theme, auth provider)
│   ├── index.tsx                 # Redirect: auth check → home or login
│   ├── (auth)/                   # Auth group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main app (tabs)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home / Group selection
│   │   ├── list.tsx              # Shopping list (when group selected)
│   │   └── settings.tsx
│   └── onboarding/
│       └── index.tsx
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Checkbox.tsx
│   ├── list/
│   │   ├── ListItem.tsx          # Single item with check, edit, delete
│   │   ├── AddItemForm.tsx
│   │   └── EmptyList.tsx
│   ├── group/
│   │   ├── GroupCard.tsx
│   │   ├── CreateGroupModal.tsx
│   │   └── JoinGroupModal.tsx
│   └── layout/
│       ├── ScreenContainer.tsx
│       └── Header.tsx
├── stores/
│   ├── authStore.ts
│   ├── groupStore.ts
│   └── listStore.ts
├── services/
│   ├── api.ts                    # Axios/fetch base + interceptors
│   ├── auth.service.ts
│   ├── groups.service.ts
│   ├── items.service.ts
│   └── socket.service.ts         # Socket.IO client
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   └── useTheme.ts
├── theme/
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
├── types/
│   └── index.ts
├── constants/
│   └── config.ts                 # API URL, etc.
├── .env.example
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Root Project Structure

```
shop-sync/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_ENDPOINTS.md
│   ├── WEBSOCKET_EVENTS.md
│   ├── FOLDER_STRUCTURE.md
│   └── DEVELOPMENT_PLAN.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── backend/                      # See above
├── frontend/                     # See above
├── .env.example                  # Root env template
├── .gitignore
└── README.md
```
