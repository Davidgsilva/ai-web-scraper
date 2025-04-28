"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    if (session) {
      // Create a safe copy of the session for display
      const safeSession = {
        user: session.user ? {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          id: session.user.id || 'Not available'
        } : 'No user data',
        expires: session.expires,
        accessToken: session.accessToken ? 'Present (hidden for security)' : 'Missing',
        error: session.error || 'None'
      };
      
      setSessionDetails(safeSession);
    }
  }, [session]);

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/debug' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Session Status</h2>
        <p className="mb-2">
          <span className="font-medium">Current Status:</span>{' '}
          <span className={`px-2 py-1 rounded ${
            status === 'authenticated' ? 'bg-green-100 text-green-800' : 
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        </p>
        
        {status === 'authenticated' && sessionDetails && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Session Details</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(sessionDetails, null, 2)}
            </pre>
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="mt-4">
            <p className="mb-4 text-red-600">You are not authenticated. Try signing in again.</p>
            <button
              onClick={handleSignIn}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TestEndpoint endpoint="/api/calendar" title="Calendar API" />
          <TestEndpoint endpoint="/api/events" title="Events API" />
          <TestEndpoint endpoint="/api/tasks" title="Tasks API" />
          <TestEndpoint endpoint="/api/reminders" title="Reminders API" />
        </div>
      </div>
    </div>
  );
}

function TestEndpoint({ endpoint, title }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{endpoint}</p>
      
      <button
        onClick={testEndpoint}
        disabled={loading}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded text-sm mb-3"
      >
        {loading ? 'Testing...' : 'Test Endpoint'}
      </button>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-2">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="text-sm">
          <p className={`font-medium ${
            result.status >= 200 && result.status < 300 ? 'text-green-600' : 'text-red-600'
          }`}>
            Status: {result.status} {result.statusText}
          </p>
          <div className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
            <pre className="text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
