"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function CalendarDebugPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  // Function to fetch calendar events
  const fetchCalendarEvents = async () => {
    // Check for access token in both possible locations
    const accessToken = session?.accessToken || session?.user?.accessToken;
    
    if (!accessToken) {
      setError("No access token available. Please sign in.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching calendar events with access token...');
      
      // Fetch events from our API endpoint
      const response = await fetch('/api/calendar?maxResults=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      console.log('Calendar API response:', data);
      
      // Store the raw response for debugging
      setRawResponse(data);
      
      if (data.success) {
        setEvents(data.data);
        console.log('Calendar events:', data.data);
      } else {
        setError(data.message || 'Failed to fetch calendar events');
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session data:', {
        user: session.user ? {
          name: session.user.name,
          email: session.user.email,
          id: session.user.id
        } : 'No user data',
        accessToken: session.accessToken ? 'Present (hidden)' : 'Missing',
        expires: session.expires
      });
    }
  }, [session, status]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Calendar Debug</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <p className="mb-4">
          <span className="font-medium">Current Status:</span>{' '}
          <span className={`px-2 py-1 rounded ${
            status === 'authenticated' ? 'bg-green-100 text-green-800' : 
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        </p>
        
        {status === 'authenticated' && (
          <div>
            <p className="mb-2">
              <span className="font-medium">User:</span> {session.user?.name} ({session.user?.email})
            </p>
            <p className="mb-2">
              <span className="font-medium">Access Token:</span> {
                (session.accessToken || session.user?.accessToken) ? 'Present' : 'Missing'
              }
            </p>
            <p className="mb-2">
              <span className="font-medium">Token Location:</span> {
                session.accessToken ? 'session.accessToken' : 
                session.user?.accessToken ? 'session.user.accessToken' : 'Not found'
              }
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={fetchCalendarEvents}
            disabled={loading || status !== 'authenticated'}
            className={`px-4 py-2 rounded font-medium ${
              loading || status !== 'authenticated' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Fetching...' : 'Fetch Calendar Events'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {events.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Calendar Events</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.googleEventId} className="border-b pb-4">
                <h3 className="font-medium text-lg">{event.title}</h3>
                <p className="text-gray-600">
                  Date: {event.date} {event.time && `at ${event.time}`}
                </p>
                {event.location && (
                  <p className="text-gray-600">Location: {event.location}</p>
                )}
                {event.description && (
                  <p className="text-gray-600 mt-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {rawResponse && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Raw API Response</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
