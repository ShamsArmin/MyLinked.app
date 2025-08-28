export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

export const GOOGLE_CALLBACK_PATH =
  process.env.GOOGLE_CALLBACK_PATH || '/auth/google/callback';

export const GOOGLE_CALLBACK_URL = `${PUBLIC_BASE_URL}${GOOGLE_CALLBACK_PATH}`;

console.log('[OAuth] GOOGLE_CALLBACK_URL:', GOOGLE_CALLBACK_URL);
