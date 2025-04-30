'use client';

import { signIn } from 'next-auth/react';
import { signOutFromAll } from '@/lib/firebaseAuth';

const AppHeader = ({ session }) => {
  const handleSignOut = async () => {
    // Set intentional sign-out flag to prevent auto-login loops
    localStorage.setItem('intentionalSignOut', 'true');
    
    // Clear cookies
    document.cookie = 'userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Sign out from Firebase and NextAuth
    await signOutFromAll();
    
    // Clear any loop prevention data
    localStorage.removeItem('lastEmailAttempt');
    localStorage.removeItem('lastAttemptTime');
    
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">LifeAssist AI</h1>
            <p className="mt-1 text-gray-600">Your personal AI assistant for daily organization</p>
          </div>
          <div className="flex items-center space-x-3">
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-50 p-2 rounded-full">
                  {session.user.image && (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full mr-2 border-2 border-white shadow-sm" 
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center shadow-sm"
                  onClick={handleSignOut}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-md"
                onClick={() => signIn('google')}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#FFFFFF" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#FFFFFF" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FFFFFF" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#FFFFFF" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                  </g>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
