import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/app/api/auth/authOptions';

export async function GET() {
  try {
    // Generate Google OAuth URL
    const authUrl = getAuthUrl();
    
    // Redirect to Google OAuth page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
