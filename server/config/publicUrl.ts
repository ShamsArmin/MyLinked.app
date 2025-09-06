export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:3000";

export const GOOGLE_CALLBACK_URL = `${PUBLIC_BASE_URL}/api/auth/google/callback`;
