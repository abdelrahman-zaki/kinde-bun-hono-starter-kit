# Kinde Bun + Hono Starter Kit

A community starter kit for regular web apps served with **Bun + Hono**, inspired by Kinde's ExpressJS starter kit.

## What this includes

This starter kit keeps the same simple auth flow and route names as the ExpressJS starter kit:

- `/`
- `/login`
- `/register`
- `/kinde_callback`
- `/logout`
- `/admin`

## 1. Clone the project

```bash
git clone https://github.com/abdelrahman-zaki/kinde-bun-hono-starter-kit.git
cd kinde-bun-hono-starter-kit
```

## 2. Install dependencies

```bash
bun install
```

## 3. Create your environment file

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

Then add your Kinde values:

```env
KINDE_SITE_URL=http://localhost:3000
KINDE_ISSUER_URL=https://<YOUR_SUBDOMAIN>.kinde.com
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_CLIENT_ID=<YOUR_CLIENT_ID>
KINDE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
KINDE_REDIRECT_URL=http://localhost:3000/kinde_callback
SESSION_SECRET=replace-this-with-a-long-random-string
```

## 4. Set callback and logout URLs in Kinde

In your Kinde backend application, add:

- Allowed callback URL: `http://localhost:3000/kinde_callback`
- Allowed logout redirect URL: `http://localhost:3000`

## 5. Start the app

```bash
bun run dev
```

Then open:

```txt
http://localhost:3000
```

## Notes

- `/login` sends the user to the Kinde sign-in page.
- `/register` sends the user to the Kinde sign-up page.
- `/admin` is protected and requires a signed-in session.

## Project structure

```txt
public/
  assets/
src/
  components/
  lib/
.env.example
README.md
SECURITY.md
LICENSE.md
package.json
```
