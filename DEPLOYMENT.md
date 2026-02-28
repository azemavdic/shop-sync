# ShopSyncX Deployment Guide

Deploy the backend + database on a server, then build an Android APK to install on your phone.

---

## Part 1: Deploy Backend & Database on Server

### Prerequisites

- A server (VPS: DigitalOcean, Hetzner, AWS EC2, etc.) with Docker installed
- Domain or server IP (e.g. `api.yourdomain.com` or `123.45.67.89`)

### 1. Prepare the server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker (if not already)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group to apply
```

### 2. Clone the project and configure

```bash
git clone <your-repo-url> shopsyncx
cd shopsyncx
```

### 3. Create production `.env`

Create `.env` in the project root:

```env
# Required - use a strong random password
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_at_least_16_chars

# Optional - change if needed
POSTGRES_USER=shopsyncx
POSTGRES_DB=shopsyncx
PORT=3000
# DB_HOST=postgres   # default; only set if using Coolify's separate Postgres
# DB_PORT=5432      # default

# OAuth (optional)
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### 4. Deploy with Docker

```bash
docker compose -f docker-compose.production.yml up -d
```

### 5. Verify

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 6. Expose to the internet

**Option A: Direct port (simple, no HTTPS)**

- Open port 3000 in your firewall
- Use `http://YOUR_SERVER_IP:3000` as your API URL

**Option B: Nginx reverse proxy with HTTPS (recommended)**

Install Nginx and Certbot, then configure a reverse proxy. Your API URL would be `https://api.yourdomain.com`.

---

## Part 2: Build Android APK

### Prerequisites

- [Expo account](https://expo.dev) (free)
- EAS CLI: `npm install -g eas-cli`
- Log in: `eas login`

### 1. Set your server URL

Edit `eas.json` and replace `your-server.com` with your actual server URL:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api/v1",
  "EXPO_PUBLIC_SOCKET_URL": "https://api.yourdomain.com"
}
```

Or use HTTP if you didn't set up HTTPS:
```json
"EXPO_PUBLIC_API_URL": "http://your-server-ip:3000/api/v1",
"EXPO_PUBLIC_SOCKET_URL": "http://your-server-ip:3000"
```

**Alternative:** Use EAS Secrets (so you don't commit URLs):

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.yourdomain.com/api/v1"
eas secret:create --name EXPO_PUBLIC_SOCKET_URL --value "https://api.yourdomain.com"
```

Then remove the `env` block from `eas.json` – EAS will use secrets.

### 2. Build the APK

```bash
cd frontend
eas build --platform android --profile production
```

### 3. Download and install

- When the build finishes, EAS will give you a download link
- Or go to [expo.dev](https://expo.dev) → your project → Builds
- Download the APK and transfer to your phone (USB, cloud, etc.)
- On your phone: enable "Install from unknown sources" and install the APK

---

## Quick Reference

| Step | Command |
|------|---------|
| Deploy backend | `docker compose -f docker-compose.production.yml up -d` |
| View logs | `docker compose -f docker-compose.production.yml logs -f` |
| Stop | `docker compose -f docker-compose.production.yml down` |
| Build APK | `cd frontend && eas build --platform android --profile production` |

---

## Troubleshooting

**Backend won't start:** Check `docker compose logs backend`. Often a missing `POSTGRES_PASSWORD` or `JWT_SECRET`.

**`Can't reach database server at shopsyncx:8` (or wrong host):** The `DATABASE_URL` is malformed. When using this compose file, the DB host must be `postgres` (the service name) and port `5432`. In Coolify:
- Do **not** override `DATABASE_URL` in the UI if postgres is in the same compose file
- Ensure `POSTGRES_PASSWORD` is set (required)
- If postgres is a separate Coolify resource: enable "Connect to Predefined Network" on the Service Stack, then set `DB_HOST` to the host from Coolify's Postgres "Internal URL" (e.g. `postgres-abc123`)

**Password with special characters:** If `POSTGRES_PASSWORD` contains `@`, `:`, or `#`, URL-encode it (e.g. `@` → `%40`, `:` → `%3A`).

**App can't connect:** Ensure your phone can reach the server (same network or server has public IP). If using HTTPS, the certificate must be valid.

**CORS errors:** The backend has `cors: { origin: true }` which allows all origins. For production you may want to restrict this.
