# IEM Dating App

Monorepo: an Express + Prisma API and an Expo (React Native) mobile app.

```
apps/api      Express + TypeScript + Prisma + Socket.IO
apps/mobile   Expo / React Native (custom dev client)
```

---

## Daily startup

Run these three in **three separate terminals**. All must stay running.

### 1. Backend
```powershell
cd E:\IEM_Dating_App\apps\api
npm run dev
```
Wait for `Server is running on port 3000`.

### 2. ngrok tunnel
```powershell
ngrok http 3000 --url=injunctive-efrain-undecomposed.ngrok-free.dev
```
Required — the mobile app has this URL hardcoded in
`apps/mobile/src/services/api.ts` and `socket.ts`.

### 3. Metro bundler
```powershell
cd E:\IEM_Dating_App\apps\mobile
npx expo start --dev-client
```
`--dev-client` is required. This project uses `expo-dev-client`, **not Expo Go**.

### Before all of the above
Start **Docker Desktop**. Redis runs as a container and starts itself.

---

## Connecting your phone

API traffic goes through ngrok, so the phone reaches the backend from **any
network**. Only Metro (the JS bundler) needs a local connection.

### USB
One-time on phone: Settings → About phone → tap **Build number** 7x →
Developer options → enable **USB debugging**.

```powershell
adb devices          # accept the popup on your phone
npx expo start --dev-client
```

### Wireless (Android 11+)
Phone and PC must be on the **same Wi-Fi**.
On phone: Developer options → **Wireless debugging** → *Pair device with pairing code*.

```powershell
adb pair 192.168.x.x:41234    # pairing port + 6-digit code
adb connect 192.168.x.x:5555  # port from the MAIN wireless debugging screen
adb devices
```

The two ports are different. The pairing port is single-use.

### Phone can't reach Metro
Different network, or Wi-Fi client isolation (common on campus networks):
```powershell
npx expo start --dev-client --tunnel
```

### First run only
Builds and installs the dev APK. Not needed afterwards.
```powershell
npx expo run:android
```

---

## First-time setup

```powershell
cd E:\IEM_Dating_App
npm install
```

Create `apps/api/.env` from `apps/api/.env.example`. Key values:

```
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...     # AWS RDS
PORT=3000
```

Start Redis (one time; it auto-restarts afterwards):
```powershell
docker run -d --name iem-redis --restart unless-stopped -p 6379:6379 -v iem-redis-data:/data redis:7-alpine redis-server --appendonly yes
```

`.env` is gitignored and must never be committed.

---

## Health checks

```powershell
curl http://localhost:3000/health                                    # API
docker exec iem-redis redis-cli ping                                 # Redis -> PONG
curl https://injunctive-efrain-undecomposed.ngrok-free.dev/health    # full chain
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE: port 3000` | Stale node process. `netstat -ano \| findstr ":3000"` then `Stop-Process -Id <PID> -Force`. Caused by closing a terminal with X instead of Ctrl+C. |
| App loads, every API call fails | ngrok isn't running. |
| Redis connection errors | Docker Desktop isn't started. |
| `adb devices` shows `unauthorized` | Unaccepted popup on phone. Replug, tap **Always allow**. |
| `adb devices` empty over USB | Charge-only cable. Try another. |
| Metro "no bundle URL" | Phone can't reach PC. Use `--tunnel`. |
| ngrok flagged as a virus | False positive (`Trojan:Win32/Kepavll!rfn`). The binary is EV-signed by ngrok, Inc. Do **not** run `ngrok update` — re-download from ngrok.com instead. |

### Redis note
This project previously used Upstash. Free Upstash databases are
**auto-deleted after 14 days of inactivity**, which is why it broke. Local
Redis via Docker has no expiry. The code uses `ioredis` over the standard
Redis protocol, so any Redis works.

Redis backs OTP login, swipe rate limits, auth caching, and the Socket.IO
adapter — the app cannot log users in without it.
