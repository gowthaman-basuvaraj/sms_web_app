# SMS Web App

Companion web UI for [`sms_web_api`](https://github.com/gowthaman-basuvaraj/sms_web_api).
It shows SMS forwarded from the Android app in a chat-style interface: a live list of
senders, per-sender message history, one-click OTP copy, and a per-sender mute toggle.
New messages arrive in real time over socket.io, with a sound + desktop notification when
the sender isn't muted.

## Stack

- React 18 + Vite
- Redux Toolkit (auth/session + mute preferences)
- Keycloak (OIDC login via `keycloak-js`, with automatic token refresh)
- socket.io-client (live updates)
- Tailwind CSS

## Setup

```bash
npm install
cp .env.sample .env   # then fill in the values below
npm run dev
```

### Environment (`.env`)

| Variable | Description |
| --- | --- |
| `VITE_KEYCLOAK_URL` | Keycloak base URL, e.g. `https://auth.example.com` |
| `VITE_KEYCLOAK_REALM` | Realm name |
| `VITE_KEYCLOAK_CLIENTID` | Public client id (PKCE enabled) |
| `VITE_REALM_ACCESS` | Realm role required to read SMS (default `READ_SMS`) |
| `VITE_BACKEND_API` | `sms_web_api` base URL, e.g. `http://localhost:3000` |

The Keycloak client must be **public** with **PKCE (S256)** and have this app's origin
registered as a valid redirect URI / web origin. Only users holding the `VITE_REALM_ACCESS`
role can read messages; others see an access-denied screen.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

## How it works

- `store/Auth.jsx` initializes Keycloak (`login-required`) and mirrors the access token into
  the Redux store, refreshing it automatically via `keycloak.onTokenExpired`.
- `store/AccessHandle.jsx` derives the user + access role from the token and registers the
  user with the backend.
- `Component/SocketProvider.jsx` fetches recent chats and subscribes to `newMessage`; the
  socket instance is shared via context so open conversations update live.
- All backend requests send the `Authorization: Bearer <token>` header.
