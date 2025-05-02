"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { CalendarView } from '@/components/CalendarView';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      router.push('/auth/signin?callbackUrl=/calendar');
      return;
    }

    // Only fetch events if authenticated
    if (!isLoading && user) {
      console.log('User authenticated, fetching events');
      fetchCalendarEvents();
    }
  }, [isLoading, user, router]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      
      // Make the API request
      const response = await fetch('/api/calendar?maxResults=20');
      
      const data = await response.json();
      console.log('Calendar API response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch calendar events');
      }

      setEvents(data.events || []);
      console.log('Calendar events:', data.events);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'All day';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Calendar</h1>
      
      {/* New shadcn Calendar UI */}
      <div className="mb-8">
        <CalendarView />
      </div>
    </div>
  );
}
