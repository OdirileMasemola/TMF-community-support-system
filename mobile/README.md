# TMF Dashboard (mobile)

An Expo / React Native app for signed-in TMF dashboard users. It covers the five
role portals (administrator, donor, volunteer, beneficiary, sponsor) and
deliberately leaves out the public marketing pages, which stay web only.

## Getting started

```bash
cd mobile
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm start
```

Press `a` for an Android emulator, `i` for an iOS simulator (macOS only), or scan
the QR code with Expo Go.

## Environment

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL, the same project as the web app |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key |

Expo inlines `EXPO_PUBLIC_*` variables into the bundle, so never put a service
role key here. Access control has to come from row level security.

## How this relates to the web app

`src/services/`, `src/types/` and `src/lib/display.ts` are **copies** of the same
files in the web app's `src/`. They are pure TypeScript over `supabase-js` and
work unchanged on native.

> Because they are copies rather than a shared package, a schema change means
> editing both `src/` and `mobile/src/`. Keep them in the same commit.

Three files are intentionally different on native:

| File | Why it differs |
| --- | --- |
| `src/lib/supabaseClient.ts` | The web app uses `createBrowserClient` from `@supabase/ssr`, which persists the session in cookies. React Native has no cookie store, so this uses `createClient` with an AsyncStorage adapter and restarts token auto-refresh when the app returns to the foreground. |
| `src/lib/errors.ts` | `import.meta.env.DEV` is a Vite feature; native uses `__DEV__`. |
| `src/services/storage.ts` | Native file pickers return a local URI, not a DOM `File`, so uploads read the bytes first. |

## Structure

```
app/
  _layout.tsx          providers + the auth and role gate
  login.tsx            email/password sign in
  complete-profile.tsx shown when a signed-in user has no profiles row
  admin/               administrator portal
  donor/               donor portal
  volunteer/           volunteer portal
  beneficiary/         beneficiary portal
  sponsor/             sponsor portal
src/
  auth/                AuthProvider: session, profile and role
  components/          shared native UI primitives
  hooks/               useRoleProfile and friends
  lib/ services/ types/ theme/
```

Routes mirror the web paths (`/admin/dashboard`, `/donor/dashboard`, ...), so
`roleHomePath()` from `src/lib/display.ts` is reused verbatim to decide where a
user lands after signing in.

## Google sign in

The login screen has a "Continue with Google" button. Because there is no page to
redirect, the native flow differs from the web one: Supabase returns an
authorisation URL, the app opens it in the system browser with
`WebBrowser.openAuthSessionAsync`, and a deep link brings the result back to be
exchanged for a session.

**This needs one setting in Supabase to work.** Add the redirect URLs under
*Authentication → URL Configuration → Redirect URLs*:

| When | URL to allow |
| --- | --- |
| Running in Expo Go / dev | `exp://127.0.0.1:8081/--/auth/callback` (and your LAN address, e.g. `exp://192.168.0.10:8081/--/auth/callback`) |
| Built app | `tmfdashboard://auth/callback` |

Without these, Google sign in fails with a redirect mismatch. To see the exact URL
the app is using, log the value of `Linking.createURL("auth/callback")`.

## Not implemented yet

- **Registration and role selection.** New users still sign up on the web app;
  the mobile app sends them there.
- **Charts and PDF export.** The admin dashboard's recharts views and the jspdf
  report export have no native equivalent yet.
- Each portal currently has a dashboard screen only; the remaining screens
  (campaigns, donations, applications, requests, notifications, settings) are
  still to come.
