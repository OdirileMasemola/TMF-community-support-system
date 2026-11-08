/**
 * The TMF website, used for the help/contact and privacy-policy links.
 * EXPO_PUBLIC_WEB_URL is optional and only needed if the website moves.
 */
export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://tmf-community-support-system.vercel.app").replace(
  /\/+$/,
  "",
);

// Public pages that Google Play asks the app to link to
export const PRIVACY_POLICY_PAGE_URL = `${WEB_APP_URL}/privacy-policy`;
export const ACCOUNT_DELETION_PAGE_URL = `${WEB_APP_URL}/account-deletion`;
