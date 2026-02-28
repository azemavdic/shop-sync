# ShopSyncX - WebSocket Event Design

Socket.IO namespace: `/` (default) or `/list` for future separation.

## Connection & Authentication

### Client → Server: `authenticate`
Sent after connection with JWT to associate socket with user.

**Payload:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Server:** Validates JWT, stores `userId` in socket data, allows room joins.

---

### Client → Server: `group:join`
Join a group's room to receive real-time updates.

**Payload:**
```json
{
  "groupId": "clx..."
}
```

**Server:** Verifies user is group member, then `socket.join(\`group:${groupId}\`)`.

---

### Client → Server: `group:leave`
Leave a group's room (e.g., when user navigates away).

**Payload:**
```json
{
  "groupId": "clx..."
}
```

**Server:** `socket.leave(\`group:${groupId}\`)`.

---

## Item Events (Client → Server)

All item events require: user authenticated, user in group room, user is group member.

### `item:add`
Add a new item to the list.

**Payload:**
```json
{
  "groupId": "clx...",
  "item": {
    "name": "Milk",
    "quantity": 2
  }
}
```

**Server:** Validates, persists to DB, broadcasts `item:added` to room.

---

### `item:edit`
Edit an existing item.

**Payload:**
```json
{
  "groupId": "clx...",
  "itemId": "clx...",
  "updates": {
    "name": "Oat Milk",
    "quantity": 1
  }
}
```

**Server:** Validates, updates DB, broadcasts `item:edited` to room.

---

### `item:check`
Toggle checked state of an item.

**Payload:**
```json
{
  "groupId": "clx...",
  "itemId": "clx...",
  "checked": true
}
```

**Server:** Validates, updates DB, broadcasts `item:checked` to room.

---

### `item:delete`
Delete an item.

**Payload:**
```json
{
  "groupId": "clx...",
  "itemId": "clx..."
}
```

**Server:** Validates, deletes from DB, broadcasts `item:deleted` to room.

---

## Item Events (Server → Client)

Broadcast to room: `group:${groupId}`. All members receive these.

### `item:added`
New item was added by someone (including self if optimistic update confirmed).

**Payload:**
```json
{
  "item": {
    "id": "clx...",
    "name": "Milk",
    "quantity": 2,
    "checked": false,
    "addedById": "clx...",
    "addedByName": "John Doe",
    "createdAt": "2025-02-17T10:00:00.000Z"
  }
}
```

---

### `item:edited`
Item was edited.

**Payload:**
```json
{
  "item": {
    "id": "clx...",
    "name": "Oat Milk",
    "quantity": 1,
    "checked": false,
    "addedById": "clx...",
    "addedByName": "John Doe",
    "createdAt": "2025-02-17T10:00:00.000Z",
    "updatedAt": "2025-02-17T11:00:00.000Z"
  }
}
```

---

### `item:checked`
Item checked state was toggled.

**Payload:**
```json
{
  "itemId": "clx...",
  "checked": true
}
```

---

### `item:deleted`
Item was deleted.

**Payload:**
```json
{
  "itemId": "clx..."
}
```

---

## Error Events (Server → Client)

### `error`
General error (e.g., validation, unauthorized).

**Payload:**
```json
{
  "code": "UNAUTHORIZED",
  "message": "You must be a group member to perform this action"
}
```

---

## Event Flow Summary

| Client Action | Emit | Server Broadcast |
|---------------|------|------------------|
| Add item | `item:add` | `item:added` |
| Edit item | `item:edit` | `item:edited` |
| Check/uncheck | `item:check` | `item:checked` |
| Delete item | `item:delete` | `item:deleted` |

## Room Strategy

- **Room name:** `group:${groupId}`
- **Join:** After `group:join` and membership verification
- **Broadcast:** `io.to(\`group:${groupId}\`).emit(event, payload)` — includes sender for consistency
- **Exclude sender (optional):** `socket.to(\`group:${groupId}\`).emit(...)` if client handles own optimistic updates
