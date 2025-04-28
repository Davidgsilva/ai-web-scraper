# Google OAuth Production Guide

When moving your application from testing to production, you'll need to complete Google's verification process to allow all users to access your app with sensitive scopes.

## Verification Process Overview

1. **Prepare Required Information**:
   - Privacy policy URL (must be publicly accessible)
   - Terms of service URL (recommended)
   - Application homepage URL
   - Justification for each sensitive scope
   - App logo (minimum 120x120px)
   - Screenshots of your OAuth implementation
   - Demo video (if requested by Google)

2. **Update OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Fill in all required fields with production information
   - Add all scopes your app will use
   - Upload your app logo
   - Add links to privacy policy and terms of service

3. **Submit for Verification**:
   - Click "Submit for verification" button
   - Complete the questionnaire about your app's usage of sensitive scopes
   - Provide detailed explanations for why each scope is necessary
   - Explain the user benefit of each requested permission

4. **Verification Timeline**:
   - Basic verification typically takes 3-5 business days
   - More complex apps may take 4-6 weeks
   - Google may request additional information during review

5. **Post-Verification**:
   - Once verified, remove the `include_granted_scopes: 'true'` parameter
   - Update your app status from "Testing" to "Production"
   - Your app can now be used by any Google user

## Code Changes for Production

In your `authOptions.js` file, you'll need to remove the development-specific parameters:

```javascript
// Before (Development)
authorization: {
  params: {
    scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    prompt: "consent",
    access_type: "offline",
    response_type: "code",
    include_granted_scopes: 'true'  // Remove this in production
  }
}

// After (Production)
authorization: {
  params: {
    scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    prompt: "consent",
    access_type: "offline",
    response_type: "code"
  }
}
```

## Production Best Practices

1. **Implement Token Refresh**:
   - Ensure your token refresh logic is robust
   - Handle expired tokens gracefully
   - Store refresh tokens securely in Firebase

2. **Error Handling**:
   - Add comprehensive error handling for auth failures
   - Provide clear user messaging for permission issues
   - Implement graceful fallbacks when API access is limited

3. **Security Considerations**:
   - Never expose your client secret in client-side code
   - Use environment variables for all sensitive credentials
   - Implement rate limiting for your API endpoints

4. **User Experience**:
   - Clearly explain to users why you need each permission
   - Only request scopes that are absolutely necessary
   - Provide an option to revoke access within your application

5. **Compliance**:
   - Ensure your privacy policy covers data usage
   - Comply with Google API terms of service
   - Follow data retention best practices
