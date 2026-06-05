import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_GATEKEEPER_URL,
});

export const { signIn, signUp, signOut, getSession } = authClient;
