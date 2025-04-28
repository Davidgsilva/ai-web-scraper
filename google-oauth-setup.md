# Google OAuth Setup Guide for Development

## Issue: "Access blocked: jarvis-ai has not completed the Google verification process"

This error occurs because your Google Cloud project is using sensitive scopes (like Calendar access) but hasn't completed Google's verification process. Since your app is in development, you can work around this by configuring your project for testing.

## Solution Steps

### 1. Configure Your Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project ("jarvis-ai")
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Make sure your app is in "Testing" mode (not "Published")
5. Under "Test users", add your email address (`davidjgarciasilva@gmail.com`) and any other developer emails
   - You can add up to 100 test users in this mode

### 2. Verify OAuth Configuration

1. Check that your OAuth consent screen has:
   - App name (e.g., "Jarvis AI")
   - User support email
   - Developer contact information
   - Authorized domains (including your development domain)

2. Verify the scopes are correctly configured:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar`

### 3. Update Your Application Code

I've already updated your `authOptions.js` file to include:
```javascript
include_granted_scopes: 'true'
```

This parameter helps with scope handling during development.

### 4. Configure Redirect URIs

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Edit your OAuth 2.0 Client ID
3. Add all necessary redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback`
   - Any other development or production URLs you're using

### 5. Testing the Authentication

1. Clear your browser cookies for your development site
2. Restart your Next.js application
3. Try logging in again
4. You'll see a Google consent screen with a warning that the app is unverified
5. Since you're added as a test user, you can proceed past this warning

### 6. For Production

When you're ready to launch:
1. Complete Google's verification process
2. Submit your app for review
3. Provide the necessary documentation and privacy policy
4. Once verified, your app can be used by any Google user without warnings

## Troubleshooting

If you still encounter issues:
- Check that your environment variables are correctly set
- Verify that your Google Cloud project has the necessary APIs enabled
- Ensure your OAuth credentials (client ID and secret) are correct
- Check the browser console and server logs for specific error messages
