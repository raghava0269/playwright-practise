import path from 'path';

/** Where the setup project saves the logged-in browser state (cookies + localStorage). */
export const STORAGE_STATE = path.join(__dirname, '..', 'playwright', '.auth', 'user.json');

/** An empty storage state — use it to run a test as a logged-out user. */
export const EMPTY_STORAGE_STATE = { cookies: [], origins: [] };

/** Getters so values are read lazily — after dotenv has loaded .env. */
export const USERS = {
  get standard() { return process.env.STANDARD_USER || 'standard_user'; },
  get password() { return process.env.PASSWORD || 'secret_sauce'; },
};
