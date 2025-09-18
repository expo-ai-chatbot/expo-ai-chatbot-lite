# OAuth Provider Setup Guide

## Setting up Discord OAuth

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Note down the Application ID (this is your Client ID)

2. **Configure OAuth2**
   - Go to the "OAuth2" section in your application
   - Copy the Client Secret
   - Add redirect URI: `lite.expoaichatbot.com://auth/discord/callback`
   - Add another redirect URI: `http://localhost:8081/api/auth/callback/discord` (for development testing)

3. **Update Environment Variables**
   ```
   DISCORD_CLIENT_ID=your_application_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here
   ```

## Database Setup

1. **Install Prisma CLI** (if not already installed):
   ```bash
   pnpm add -D @prisma/client
   pnpm prisma generate
   ```

2. **Create Database**:
   ```bash
   pnpm prisma db push
   ```

3. **Generate Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

## Testing the Setup

1. Start your development server:
   ```bash
   pnpm start
   ```

2. Open the app on a device/simulator
3. You should see the login screen with Discord and Google buttons
4. Test the authentication flow

## Important Notes

- The redirect URIs must match exactly (including the scheme)
- For production, update the BETTER_AUTH_URL and EXPO_PUBLIC_API_URL to your production URLs
- Generate a strong secret for BETTER_AUTH_SECRET in production
- The app scheme `lite.expoaichatbot.com` is already configured in your app.json

## File Structure Created

```
src/
├── lib/
│   ├── auth.ts              # Server-side auth configuration
│   └── auth-client.ts       # Client-side auth configuration
├── contexts/
│   └── auth-context.tsx     # React context for auth state
├── components/
│   └── auth-guard.tsx       # Protected route component
├── app/
│   ├── api/auth/[...auth].ts # Auth API routes
│   └── login.tsx            # Login screen
└── providers.tsx            # Updated with AuthProvider
```