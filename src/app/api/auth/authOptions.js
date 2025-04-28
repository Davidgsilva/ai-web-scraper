import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { saveUserSession, getUserSession, getUserSessionByEmail } from '@/lib/firebaseAuth';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Add this to bypass the verification requirement during development
          include_granted_scopes: 'true'
        }
      },
      // Ensure profile is properly mapped
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        }
      }
    }),
    // Add credentials provider for session restoration from Firebase
    CredentialsProvider({
      name: 'Firebase Session',
      credentials: {
        id: { label: "User ID", type: "text" },
        accessToken: { label: "Access Token", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        try {
          console.log('Credentials authorize called with:', credentials?.id ? 'ID present' : 'No ID');
          
          // First try by ID if provided
          if (credentials?.id && credentials?.accessToken) {
            console.log('Trying to authorize with ID:', credentials.id);
            const savedSession = await getUserSession(credentials.id);
            
            if (savedSession && savedSession.accessToken) {
              console.log('Successfully authorized with ID');
              return {
                id: savedSession.id,
                name: savedSession.name,
                email: savedSession.email,
                image: savedSession.image,
                accessToken: savedSession.accessToken,
                refreshToken: savedSession.refreshToken || null,
                accessTokenExpires: savedSession.accessTokenExpires || null
              };
            }
          }
          
          // Try by email as fallback
          if (credentials?.email) {
            console.log('Trying to authorize with email');
            const savedSession = await getUserSessionByEmail(credentials.email);
            
            if (savedSession && savedSession.accessToken) {
              console.log('Successfully authorized with email');
              return {
                id: savedSession.id,
                name: savedSession.name,
                email: savedSession.email,
                image: savedSession.image,
                accessToken: savedSession.accessToken,
                refreshToken: savedSession.refreshToken || null,
                accessTokenExpires: savedSession.accessTokenExpires || null
              };
            }
          }
          
          console.log('Failed to authorize with credentials');
          return null;
        } catch (error) {
          console.error('Error authorizing from Firebase:', error);
          return null;
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',    // use JWT-based sessions (no database needed)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user, profile, trigger }) {
      // Log the JWT callback trigger for debugging
      console.log('JWT callback triggered by:', trigger);
      
      // Initial sign in or when token is refreshed
      if (account && profile) {
        console.log('JWT: Initial sign-in or token refresh');
        
        // Store the tokens and expiry time
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000; // Default to 1 hour if no expiry
        
        // Store user information
        token.id = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
        
        console.log('JWT: Access token stored in token object');
        
        // Save user credentials to Firebase
        try {
          await saveUserSession(profile.sub, {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: token.accessTokenExpires
          });
          console.log('JWT: User session saved to Firebase');
        } catch (error) {
          console.error('JWT: Error saving user session to Firebase:', error);
        }
      }
      
      // If we have an expiry time and it's not expired, return the token
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log('JWT: Using existing token (not expired)');
        return token;
      }
      
      // If we don't have a token or it's expired, try to get it from Firebase
      if (!token.accessToken || (token.accessTokenExpires && Date.now() >= token.accessTokenExpires)) {
        console.log('JWT: Token expired or missing, trying to retrieve from Firebase');
        
        try {
          // Try to get the session from Firebase using the user ID
          if (token.id) {
            const userData = await getUserSession(token.id);
            if (userData && userData.accessToken) {
              console.log('JWT: Retrieved token from Firebase');
              token.accessToken = userData.accessToken;
              token.refreshToken = userData.refreshToken;
              token.accessTokenExpires = userData.accessTokenExpires;
              return token;
            }
          }
          
          // If we couldn't get by ID, try by email
          if (token.email) {
            const userData = await getUserSessionByEmail(token.email);
            if (userData && userData.accessToken) {
              console.log('JWT: Retrieved token from Firebase by email');
              token.id = userData.id;
              token.accessToken = userData.accessToken;
              token.refreshToken = userData.refreshToken;
              token.accessTokenExpires = userData.accessTokenExpires;
              return token;
            }
          }
          
          // If we still don't have a token, mark as error
          console.log('JWT: Could not retrieve token from Firebase');
          token.error = "RefreshAccessTokenError";
        } catch (error) {
          console.error("JWT: Error retrieving user session from Firebase:", error);
          token.error = "RefreshAccessTokenError";
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Make sure to include the user ID
        session.user.id = token.id || token.sub;
        
        // Explicitly add the access token to both the session and user object
        session.accessToken = token.accessToken;
        session.user.accessToken = token.accessToken;
        
        // Log token presence for debugging
        console.log('Session callback called, access token present:', !!token.accessToken);
        
        // Save session data to Firebase if we have a user ID and access token
        if (session.user.id && token.accessToken) {
          try {
            await saveUserSession(session.user.id, {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
              accessTokenExpires: token.accessTokenExpires
            });
            console.log('User session saved to Firebase');
          } catch (error) {
            console.error('Error saving user session to Firebase:', error);
          }
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
