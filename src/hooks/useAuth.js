'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to handle authentication and API requests
 * This ensures that API requests include the proper authentication headers
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      });
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      setUser(null);
      setIsLoading(false);
    }
  }, [session, status]);

  /**
   * Make an authenticated API request
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  const authFetch = async (url, options = {}) => {
    if (!session) {
      throw new Error('No active session');
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    authFetch,
    session,
    status
  };
}
