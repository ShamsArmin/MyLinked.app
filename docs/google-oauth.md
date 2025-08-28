# Google OAuth Setup

To enable Google sign-in locally and on Render:

## Environment Variables

Set the following variables either in a local `.env` file or in the Render dashboard.

```
PUBLIC_BASE_URL=http://localhost:3000        # local development
# PUBLIC_BASE_URL=https://your-render-domain  # Render (no trailing slash)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_PATH=/auth/google/callback  # optional override
```

## Google Cloud Console

1. Navigate to **APIs & Services → Credentials**.
2. Create or edit your OAuth 2.0 Client ID.
3. Add the following:
   - **Authorized JavaScript origins**
     - `http://localhost:3000`
     - `https://your-render-domain`
   - **Authorized redirect URIs**
     - `http://localhost:3000/auth/google/callback`
     - `https://your-render-domain/auth/google/callback`

Ensure the scheme, host, and path match exactly.
