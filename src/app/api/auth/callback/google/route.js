import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTokensFromCode, saveUserSessionWithGoogle } from '@/app/api/auth/authOptions';

export async function GET(request) {
  try {
    // Get authorization code from URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }
    
    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await getTokensFromCode(code);
    console.log('Received tokens:', { 
      access_token_prefix: tokens.access_token ? tokens.access_token.substring(0, 10) + '...' : 'none',
      refresh_token_exists: !!tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });
    
    // Save user session to Firebase and get user info
    console.log('Saving user session to Firebase...');
    const userSession = await saveUserSessionWithGoogle(tokens);
    console.log('User session saved:', { 
      id: userSession.id,
      email: userSession.email,
      accessToken_prefix: userSession.accessToken ? userSession.accessToken.substring(0, 10) + '...' : 'none'
    });
    
    // Create the response with redirect
    const redirectUrl = new URL(searchParams.get('state') || '/', request.url);
    console.log('Redirecting to:', redirectUrl.toString());
    const response = NextResponse.redirect(redirectUrl);
    
    // Set userId cookie (expires in 30 days)
    console.log('Setting userId cookie:', userSession.id);
    response.cookies.set('userId', userSession.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false, // Changed to false for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Log all cookies being set
    console.log('Cookies in response:', response.cookies);
    
    // Return the response with the cookie
    return response;
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
