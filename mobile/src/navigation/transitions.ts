/**
 * One set of screen transitions for the whole app, so every navigator moves
 * the same way instead of each falling back to its own platform default.
 *
 * - push: opening a page on top of the current one (Help, Register, a
 *   portal's Notifications / Profile / Settings). Slides in from the right
 *   and can be swiped back.
 * - swap: replacing what is on screen rather than stacking on it (welcome to
 *   a portal after sign-in, switching between portal tabs). A short
 *   cross-fade, because a slide implies there is somewhere to go back to.
 *
 * `animationDuration` is only honoured by iOS for these animation types;
 * Android uses its own native timing, which is already in the same range.
 */

/** Total time for a push/swap on iOS, in milliseconds. */
export const PUSH_DURATION_MS = 280;
export const SWAP_DURATION_MS = 220;

export const pushTransition = {
  // iOS-style slide on Android; resolves to the native push on iOS.
  animation: "ios_from_right",
  animationDuration: PUSH_DURATION_MS,
  animationTypeForReplace: "push",
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
} as const;

export const swapTransition = {
  animation: "fade",
  animationDuration: SWAP_DURATION_MS,
  animationTypeForReplace: "push",
  // Nothing sensible sits behind a swapped-in screen, so no swipe-back.
  gestureEnabled: false,
} as const;

/** The very first screen appears without any transition. */
export const noTransition = {
  animation: "none",
  gestureEnabled: false,
} as const;
