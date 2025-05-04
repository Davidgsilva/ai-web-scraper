import { google } from 'googleapis';
import { saveUserSession, getUserSession } from '@/lib/firebaseAuth';

// NextAuth.js compatibility for routes that expect it
export const authOptions = {
  providers: [],
  callbacks: {
    async session({ session }) {
      return session;
    },
    async jwt({ token }) {
      return token;
    }
  },
  // This is a minimal implementation to make existing routes work
  // The actual authentication is handled by our custom Google OAuth implementation
};

// Simple Google OAuth configuration without NextAuth
export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google',
  scopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};

// Create OAuth2 client
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    googleOAuthConfig.clientId,
    googleOAuthConfig.clientSecret,
    googleOAuthConfig.redirectUri
  );
}

// Generate authorization URL
export function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: googleOAuthConfig.scopes,
    prompt: 'consent',
    include_granted_scopes: true
  });
}

// Exchange code for tokens
export async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens from code:', error);
    throw error;
  }
}

// Get user info from access token
export async function getUserInfo(accessToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  
  try {
    const { data } = await oauth2.userinfo.get();
    return data;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    
    console.log('Refreshing access token...');
    const oauth2Client = createOAuth2Client();
    
    // Set the refresh token in the client
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Get a new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    console.log('Token refreshed successfully');
    
    return {
      accessToken: credentials.access_token,
      accessTokenExpires: credentials.expiry_date || Date.now() + (credentials.expires_in * 1000),
      refreshToken: credentials.refresh_token || refreshToken // Use new refresh token if provided
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Save user session to Firebase
export async function saveUserSessionWithGoogle(tokens) {
  try {
    // Get user info from access token
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Calculate token expiry
    const accessTokenExpires = tokens.expiry_date || Date.now() + 3600 * 1000;
    
    // Create user session object
    const userSession = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpires,
      lastLogin: new Date().toISOString(),
      lastUpdated: new Date()
    };
    
    // Save to Firebase
    await saveUserSession(userInfo.id, userSession);
    
    return userSession;
  } catch (error) {
    console.error('Error saving user session with Google:', error);
    throw error;
  }
}
