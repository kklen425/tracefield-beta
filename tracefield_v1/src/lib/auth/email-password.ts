/**
 * Public TRACEFIELD uses Better Auth email/password so the app can run on a
 * normal Vercel deployment without depending on the workspace OAuth broker.
 * Social sign-in can be added later, but the paid entitlement must always be
 * tied to this app's own verified server session.
 */
export const emailAndPasswordEnabled = true;
