"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';

export default function CalendarDebugPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  // Function to fetch calendar events
  const fetchCalendarEvents = async () => {
    // Check for access token
    const accessToken = user?.accessToken;
    
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
        // The API returns events in data.events, not data.data
        setEvents(data.events || []);
        console.log('Calendar events:', data.events || []);
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
    if (user) {
      console.log('User data:', {
        name: user.displayName,
        email: user.email,
        id: user.uid,
        accessToken: user.accessToken ? 'Present (hidden)' : 'Missing'
      });
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Calendar Debug</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <p className="mb-4">
          <span className="font-medium">Current Status:</span>{' '}
          <span className={`px-2 py-1 rounded ${
            user ? 'bg-green-100 text-green-800' : 
            authLoading ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {authLoading ? 'loading' : user ? 'authenticated' : 'unauthenticated'}
          </span>
        </p>
        
        {user && (
          <div>
            <p className="mb-2">
              <span className="font-medium">User:</span> {user.displayName} ({user.email})
            </p>
            <p className="mb-2">
              <span className="font-medium">Access Token:</span> {
                user.accessToken ? 'Present' : 'Missing'
              }
            </p>
            <p className="mb-2">
              <span className="font-medium">User ID:</span> {user.uid}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={fetchCalendarEvents}
            disabled={loading || authLoading || !user}
            className={`px-4 py-2 rounded font-medium ${
              loading || authLoading || !user 
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
      
      {events && events.length > 0 && (
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
