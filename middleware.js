import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the request is for an API route
  const isApiRoute = path.startsWith('/api');
  
  // Only apply this middleware to API routes
  if (isApiRoute) {
    // Get the token from the request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Add debugging headers to help diagnose issues
    const response = NextResponse.next();
    
    // Add the session information to the response headers for debugging
    response.headers.set('x-auth-status', token ? 'authenticated' : 'unauthenticated');
    
    if (token) {
      // If we have a token, add the user ID to the headers
      response.headers.set('x-auth-user-id', token.id || 'unknown');
    }
    
    return response;
  }
  
  // For non-API routes, just continue
  return NextResponse.next();
}
