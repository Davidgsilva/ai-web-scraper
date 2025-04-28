# Adding Test Users to OAuth Consent Screen

## Important Note
Being an Owner in IAM permissions is different from being a test user for OAuth. You need to specifically add yourself as a test user in the OAuth consent screen settings.

## Step-by-Step Guide

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Select your project "jarvis-ai"

3. Navigate to "APIs & Services" > "OAuth consent screen"

4. Scroll down to the "Test users" section
   - This is separate from IAM permissions
   - You need to explicitly add your email here

5. Click "Add Users" button

6. Enter your email: `davidjgarciasilva@gmail.com`

7. Click "Save" to add yourself as a test user

8. Wait a few minutes for the changes to propagate

## Alternative Solution: Use Limited Scopes

If you continue to have issues, you can temporarily use more limited scopes:

```javascript
scope: 'openid email profile'
```

This will allow you to test basic authentication without requiring sensitive scopes that trigger verification.

## Verify Your Redirect URIs

Make sure your OAuth client has the correct redirect URIs:
- Go to "APIs & Services" > "Credentials"
- Edit your OAuth 2.0 Client ID
- Ensure `http://localhost:3000/api/auth/callback/google` is listed as an authorized redirect URI

## Clear Browser Data

After making these changes:
1. Clear your browser cookies and cache
2. Restart your application
3. Try logging in again
