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

> **First time on a new phone?** Run `npx expo run:android` *instead* of this -
> it builds and installs the app **and** starts Metro. Do not run both, or they
> fight over port 8081.

### Before all of the above
Start **Docker Desktop**. Redis runs as a container and starts itself.

---

## Connecting your phone

API traffic goes through ngrok, so the phone reaches the backend from **any
network**. Only Metro (the JS bundler) needs a local connection to the PC.

`adb` lives at `%LOCALAPPDATA%\Android\Sdk\platform-tools`. If `adb` is
"not recognized", see [PATH setup](#path-setup).

---

### Wireless (recommended, Android 11+)

Phone and PC must be on the **same Wi-Fi**.

#### One time only - pair the phone

On phone: **Settings -> Developer options -> Wireless debugging -> On**
-> *Pair device with pairing code*. A dialog shows a 6-digit code and an
`IP:PORT`.

```powershell
adb pair 192.168.3.186:40687     # the PAIRING port from the dialog
# paste the 6-digit code when prompted
```

Pairing is permanent. Once your PC appears under **Paired devices** on the
phone, you never pair again.

> The pairing dialog port and the main-screen port are **different numbers**.
> The pairing port is single use and changes every time the dialog opens.

#### Every session - connect

```powershell
cd E:\IEM_Dating_App\apps\mobile
npm run connect
```

Finds the phone over mDNS and connects. The wireless port changes every time
Wireless debugging is toggled or the phone reboots, and stale ports linger in
adb's discovery list, so the script tries every advertised endpoint until one
answers. No need to read the port off the phone.

If auto-detection fails, pass the port from the phone's **main** Wireless
debugging screen:

```powershell
npm run connect -- -Port 41987
```

Or do it by hand:

```powershell
adb connect 192.168.3.186:41987
adb devices
```

Expected:

```
List of devices attached
192.168.3.186:41987   device
```

> `offline` or `actively refused` means the port is stale - the usual cause of
> a failed connect. Re-run `npm run connect`, or toggle Wireless debugging off
> and on and run it again.

#### Disconnecting

```powershell
adb disconnect 192.168.3.186:36749   # one device
adb disconnect                       # all
adb kill-server                      # full reset when adb misbehaves
```

---

### USB

One time on phone: **Settings -> About phone -> tap Build number 7x**
-> **Developer options -> USB debugging -> On**.

Plug in, then:

```powershell
adb devices     # accept "Allow USB debugging?" on the phone -> Always allow
```

No IP or port needed. Metro reaches the phone over the cable automatically.

#### USB to wireless handoff

For older Androids, or when pairing fails. Plug in USB once:

```powershell
adb tcpip 5555
adb shell ip route          # phone IP is the last value on the last line
adb connect <phone-ip>:5555
```

Unplug. Holds until the phone reboots.

---

### Running the app

**First time on a phone** (dev client not installed yet):

```powershell
cd E:\IEM_Dating_App\apps\mobile
npx expo run:android
```

Full Gradle build + install + starts Metro. **10-20 minutes** the first time.
Watch the phone for an OPPO **"Install via USB?"** prompt - the build stalls
until you accept it.

**Every day after:**

```powershell
cd E:\IEM_Dating_App\apps\mobile
npx expo start --dev-client
```

Metro only, starts in seconds.

> Run **one or the other, never both** - they both bind port 8081 and will
> fight. `run:android` already starts Metro.

Re-run `npx expo run:android` only when native code changes:

- New phone, or the app was uninstalled
- You add a library containing native code
- You edit `app.json` plugins or permissions
- You change `patches/react-native+0.81.5.patch`

Editing JS/TSX **never** needs a rebuild - Metro hot-reloads those.

---

### Phone can't reach Metro

Different network, or Wi-Fi client isolation (common on campus and hostel
networks):

```powershell
npx expo start --dev-client --tunnel
```

Slower, but works from anywhere.

---

### PATH setup

Run once, then **fully restart VS Code**. A new terminal tab is not enough -
tabs inherit VS Code's stale environment.

```powershell
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User').TrimEnd(';') + ';C:\Users\subha\AppData\Local\Android\Sdk\platform-tools;C:\Users\subha\bin', 'User')
```

Adds both `adb` and `ngrok`. Run it **once** - repeats create duplicates.

Current session only, no restart needed:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
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
| `adb` not recognized | Not on PATH, or VS Code holds a stale environment. See [PATH setup](#path-setup), then fully restart VS Code. |
| `adb devices` empty over Wi-Fi | Not connected this session. Run `adb connect <ip>:<port>` with the port from the phone's Wireless debugging screen. |
| `adb connect` fails / times out | Port changed after a reboot or toggle. Re-read it off the phone. Also confirm both devices are on the same Wi-Fi. |
| `failed to authenticate` on connect | Pairing was lost. Re-pair with *Pair device with pairing code*. |
| `Port 8081 is being used` | A Metro is already running. Answer `n`, kill it (`netstat -ano \| findstr ":8081"`), then re-run. Never run `expo start` and `expo run:android` together. |
| Build hangs at "Installing" | Accept the **"Install via USB?"** prompt on the phone. |
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
