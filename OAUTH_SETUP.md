# Google OAuth Setup Guide

This application uses NextAuth.js (Auth.js) for Google OAuth authentication. Follow these steps to set up Google OAuth:

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - For development: `http://localhost:3000`
     - For production: `https://v0-remix-of-agent-chain-workflow-system-fo9p-przhmeqnf.vercel.app`
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://v0-remix-of-agent-chain-workflow-system-fo9p-przhmeqnf.vercel.app/api/auth/callback/google`
   - Click "Create"
   - Copy the Client ID and Client Secret

## 2. Configure Environment Variables

### For Local Development

Create a `.env.local` file in the root of your project and add:

\`\`\`env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
\`\`\`

To generate a secure NEXTAUTH_SECRET, run:
\`\`\`bash
openssl rand -base64 32
\`\`\`

### For Vercel/Production Deployment

**IMPORTANT**: You must add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following variables:

\`\`\`env
NEXTAUTH_URL=https://v0-remix-of-agent-chain-workflow-system-fo9p-przhmeqnf.vercel.app
NEXTAUTH_SECRET=your-generated-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
\`\`\`

**Note**: The `NEXTAUTH_URL` must match your exact Vercel deployment URL. If you're using a custom domain, use that instead.

4. After adding the environment variables, **redeploy your application** for the changes to take effect.

## 3. Fix for "Internal Server Error" / CLIENT_FETCH_ERROR

If you're seeing errors like:
- `[next-auth][error][CLIENT_FETCH_ERROR]`
- `Failed to execute 'json' on 'Response': Unexpected token 'I', "Internal s"...`

This means the `NEXTAUTH_URL` environment variable is missing or incorrect. Follow these steps:

1. **Verify your Google Cloud Console settings** match your deployment URL exactly
2. **Add NEXTAUTH_URL** to your Vercel environment variables (see step 2 above)
3. **Redeploy** your application after adding the environment variable
4. The application will automatically use `VERCEL_URL` as a fallback, but setting `NEXTAUTH_URL` explicitly is recommended

## 4. Authentication Flow

The authentication flow works as follows:
1. User clicks "Login" button
2. User is redirected to Google's official "Choose an Account" page
3. User selects their Google account and grants permissions
4. User is redirected back to the homepage (authenticated)
5. All buttons (Submit Ticket, Review Tickets) now work with the authenticated session

## 5. Testing

1. Start your development server: `npm run dev`
2. Click the "Login" button
3. You should be redirected to Google's account selection page
4. After selecting an account, you'll be redirected back to the homepage
5. Your email should appear in the navigation bar

## 6. Troubleshooting

### Error: redirect_uri_mismatch
Make sure the redirect URI in Google Console matches exactly with your NEXTAUTH_URL + `/api/auth/callback/google`

### Error: invalid_client
Check that your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Error: CLIENT_FETCH_ERROR / Internal Server Error
- **Missing NEXTAUTH_URL**: Add it to your Vercel environment variables
- **Incorrect NEXTAUTH_URL**: Make sure it matches your deployment URL exactly (including https://)
- **Missing NEXTAUTH_SECRET**: Generate one and add it to environment variables
- After adding variables, always **redeploy** your application

### Session not persisting
Ensure NEXTAUTH_SECRET is set and the same across all instances

### Google OAuth not working in production
1. Verify all environment variables are set in Vercel
2. Check that authorized redirect URIs in Google Console include your production URL
3. Redeploy after making any changes to environment variables
