# ShopSyncX - API Endpoints Design

Base URL: `https://api.shopsyncx.com/v1` (or `http://localhost:3000/api/v1` for dev)

All endpoints return JSON. Use `Content-Type: application/json` for request bodies.

---

## Authentication

### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-02-17T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

**Errors:** 400 (validation), 409 (email exists)

---

### POST `/auth/login`
Authenticate and get JWT.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

**Errors:** 401 (invalid credentials)

---

### GET `/auth/me`
Get current user (requires JWT).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "clx...",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-02-17T10:00:00.000Z"
}
```

**Errors:** 401 (unauthorized)

---

## Groups

### POST `/groups`
Create a new group (requires JWT).

**Request:**
```json
{
  "name": "Family Groceries"
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "name": "Family Groceries",
  "inviteCode": "ABC123",
  "createdAt": "2025-02-17T10:00:00.000Z"
}
```

---

### POST `/groups/join`
Join a group via invite code (requires JWT).

**Request:**
```json
{
  "inviteCode": "ABC123"
}
```

**Response (200):**
```json
{
  "group": {
    "id": "clx...",
    "name": "Family Groceries",
    "inviteCode": "ABC123"
  },
  "message": "Joined group successfully"
}
```

**Errors:** 404 (invalid code), 409 (already a member)

---

### GET `/groups`
List groups the user belongs to (requires JWT).

**Response (200):**
```json
{
  "groups": [
    {
      "id": "clx...",
      "name": "Family Groceries",
      "inviteCode": "ABC123",
      "memberCount": 3
    }
  ]
}
```

---

### GET `/groups/:groupId`
Get group details (requires JWT, must be member).

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Family Groceries",
  "inviteCode": "ABC123",
  "members": [
    {
      "id": "clx...",
      "name": "John Doe",
      "role": "admin"
    }
  ]
}
```

**Errors:** 403 (not a member), 404 (group not found)

---

### DELETE `/groups/:groupId`
Leave a group (requires JWT). Admin cannot leave if last admin.

**Response (200):**
```json
{
  "message": "Left group successfully"
}
```

---

## Items (Shopping List)

### GET `/groups/:groupId/items`
Get all items for a group (requires JWT, must be member).

**Response (200):**
```json
{
  "items": [
    {
      "id": "clx...",
      "name": "Milk",
      "quantity": 2,
      "checked": false,
      "addedById": "clx...",
      "addedByName": "John Doe",
      "createdAt": "2025-02-17T10:00:00.000Z"
    }
  ]
}
```

Items ordered: unchecked first (by createdAt), then checked (by createdAt).

---

### POST `/groups/:groupId/items`
Add an item (requires JWT, must be member).

**Request:**
```json
{
  "name": "Milk",
  "quantity": 2
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "name": "Milk",
  "quantity": 2,
  "checked": false,
  "addedById": "clx...",
  "addedByName": "John Doe",
  "createdAt": "2025-02-17T10:00:00.000Z"
}
```

---

### PATCH `/groups/:groupId/items/:itemId`
Update an item (requires JWT, must be member).

**Request (partial):**
```json
{
  "name": "Oat Milk",
  "quantity": 1,
  "checked": true
}
```

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Oat Milk",
  "quantity": 1,
  "checked": true,
  "addedById": "clx...",
  "addedByName": "John Doe",
  "createdAt": "2025-02-17T10:00:00.000Z",
  "updatedAt": "2025-02-17T11:00:00.000Z"
}
```

---

### DELETE `/groups/:groupId/items/:itemId`
Delete an item (requires JWT, must be member).

**Response (200):**
```json
{
  "message": "Item deleted successfully"
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```
