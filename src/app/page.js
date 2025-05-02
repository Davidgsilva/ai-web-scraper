'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { ChatInterface } from '@/components/ChatInterface';
import { VerticalNavigation } from '@/components/VerticalNavigation';
import { CalendarView } from '@/components/CalendarView';

export default function Home() {
  // State for chat functionality
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('chat');
  
  // Authentication state
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user && activeTab === 'templates') {
      router.push('/');
      setActiveTab('chat');
    }
  }, [authLoading, user, activeTab, router]);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        console.error('Failed to load events');
      }
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  // Fetch reminders from API

  // Delete an event
  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };



  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    
    try {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      return dateString; // Return as is if parsing fails
    }
  };

  return (
    <div>
      {authLoading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading your personal assistant...</p>
        </div>
      ) : !user ? (
        <div className="flex flex-col justify-center items-center h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to LifeAssist AI</h2>
            <p className="text-gray-600 mb-8">Sign in to access your personal AI assistant for calendar organization.</p>
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
              onClick={signIn}
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
            <p className="mt-4 text-sm text-gray-500">You can explore the app without signing in, but your data won't be saved.</p>
          </div>
        </div>
      ) : user ? (
        <div className="flex">
          {/* Vertical Navigation */}
          <VerticalNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 overflow-auto py-6 px-8">
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="shadow rounded-lg overflow-hidden h-[600px]">
              {user ? (
                <ChatInterface 
                  initialMessages={[
                    {
                      id: 'welcome',
                      role: 'assistant',
                      content: 'Hello! I can help you with managing your calendar, summarizing news, and answering questions. What would you like to do today?'
                    }
                  ]}
                  user={user}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <h3 className="text-lg font-medium mb-2">Sign in to use the chat</h3>
                    <p className="text-muted-foreground mb-4">You need to be signed in to use the AI assistant.</p>
                    <button 
                      onClick={() => signIn('google')} 
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      Sign in with Google
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          

          
          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="shadow rounded-lg overflow-hidden p-4">
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Goal tracking functionality has been removed.</p>
              </div>
            </div>
          )}
          
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="shadow rounded-lg overflow-hidden">
              <div className="p-4">
                {/* Display the CalendarView component */}
                <CalendarView />
              </div>
            </div>
          )}
          
          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Your Reminders</h2>
                <p className="text-sm text-gray-600">Things you don't want to forget</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {reminders.length > 0 ? (
                  reminders.map(reminder => (
                    <div key={reminder.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{reminder.text}</p>
                        <div className="mt-1 text-sm text-gray-600">
                          {reminder.date && <span>Date: {formatDate(reminder.date)} </span>}
                          {reminder.time && <span>Time: {reminder.time}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No reminders set. Ask the assistant to set reminders for you.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </main>
        </div>
      ) : (
        <div className="max-w-md mx-auto mt-16 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to LifeAssist AI</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Sign in to get started with your personal AI assistant for daily life organization</p>
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            onClick={() => signIn('google')}
          >
            Sign in with Google
          </button>
        </div>
      )}
      
      {/* <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            LifeAssist AI - Powered by Claude AI
          </p>
          <p className="text-center text-gray-400 text-xs mt-1">
            Your personal AI assistant for daily life organization
          </p>
        </div>
      </footer> */}
    </div>
  );
}
