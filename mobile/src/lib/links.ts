/**
 * The TMF website. Password reset emails send people here because the reset
 * journey lives on the web. EXPO_PUBLIC_WEB_URL is optional and only needed
 * if the website moves.
 */
export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://tmf-community-support-system.vercel.app").replace(
  /\/+$/,
  "",
);
