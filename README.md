# Themba Molefe Foundation — Community Support System

This repository contains two apps that share the same Supabase backend:

| Folder | App |
| --- | --- |
| `web/` | Vite + React website (public site and dashboards) |
| `mobile/` | Expo / React Native app (dashboard users) |

## Website

```bash
cd web
npm install
cp .env.example .env.local   # if you do not already have one
npm run dev
```

Website environment variables live in `web/.env.local`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Mobile app

```bash
cd mobile
npm install
cp .env.example .env.local
npm start
```

Mobile environment variables live in `mobile/.env.local` and must use the `EXPO_PUBLIC_` prefix. See `mobile/README.md` for details.
