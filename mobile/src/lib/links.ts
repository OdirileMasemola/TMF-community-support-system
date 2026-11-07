/**
 * The TMF website, used for the help/contact and privacy-policy links.
 * EXPO_PUBLIC_WEB_URL is optional and only needed if the website moves.
 */
export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://tmf-community-support-system.vercel.app").replace(
  /\/+$/,
  "",
);
