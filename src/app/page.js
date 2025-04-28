'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { signOutFromAll } from '@/lib/firebaseAuth';

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Redirect to sign-in if not authenticated, but give time for session restoration
  useEffect(() => {
    // Create a flag to track if we're in the process of redirecting
    let redirecting = false;
    
    // Only redirect if we're definitely not authenticated after a delay
    // This gives time for the session restoration process to complete
    const redirectTimer = setTimeout(() => {
      if (status === 'unauthenticated' && !redirecting) {
        console.log('Session not restored after delay, redirecting to sign-in');
        redirecting = true;
        router.push('/auth/signin');
      }
    }, 2000); // 2 second delay before redirecting
    
    // Clear the timeout if the status changes or component unmounts
    return () => clearTimeout(redirectTimer);
  }, [status, router]);

  // Fetch user data on component mount if authenticated
  useEffect(() => {
    if (session && session.user) {
      fetchTasks();
      fetchEvents();
      fetchReminders();
    }
  }, [session]);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data);
      } else {
        console.error('Failed to load tasks');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

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
  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders');
      const data = await response.json();
      
      if (data.success) {
        setReminders(data.data);
      } else {
        console.error('Failed to load reminders');
      }
    } catch (err) {
      console.error('Error loading reminders:', err);
    }
  };

  // Handle sending a message to the AI assistant
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      console.log('Empty message, not sending');
      return;
    }
    
    console.log('Sending message to assistant:', message.trim());
    
    // Add user message to chat history
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    setLoading(true);
    setError(null);
    const messageToSend = message.trim(); // Store before clearing input
    setMessage('');
    
    try {
      // Make sure we have session and user ID
      if (!session || !session.user || !session.user.id) {
        console.error('No valid session found:', session);
        throw new Error('You must be signed in to use the assistant');
      }
      
      console.log('Session data:', {
        id: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.accessToken,
        hasUserAccessToken: !!session.user.accessToken
      });
      
      // Get access token from session
      const accessToken = session.accessToken || session.user.accessToken;
      console.log('Access token available:', !!accessToken);
      
      // Headers with authorization if we have a token
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('Added Authorization header');
      }
      
      // Prepare request body
      const requestBody = {
        message: messageToSend,
        userId: session.user.id
      };
      
      console.log('Sending request with body:', JSON.stringify(requestBody));
      console.log('Headers:', JSON.stringify(headers));
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Successfully received assistant response');
        // Add assistant response to chat history
        const assistantMessage = { role: 'assistant', content: data.data.content };
        setChatHistory(prev => [...prev, assistantMessage]);
        
        // Refresh data after AI might have updated it
        fetchTasks();
        fetchEvents();
        fetchReminders();
      } else {
        console.error('API returned error:', data.message);
        setError(data.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('Error in sendMessage:', err);
      setError('Error communicating with assistant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark a task as complete
  const completeTask = async (taskId) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          completed: true
        }),
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

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

  // Delete a reminder
  const deleteReminder = async (reminderId) => {
    try {
      const response = await fetch(`/api/reminders?id=${reminderId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchReminders();
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LifeAssist AI</h1>
              <p className="mt-1 text-gray-600">Your personal AI assistant for daily life organization</p>
            </div>
            <div className="flex space-x-3">
              {session ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                  <button 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    onClick={async () => {
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
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => signIn('google')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {status === 'loading' ? (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading your personal assistant...</p>
        </div>
      ) : status === 'authenticated' ? (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`py-4 px-1 ${activeTab === 'chat' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button
                className={`py-4 px-1 ${activeTab === 'tasks' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium`}
                onClick={() => setActiveTab('tasks')}
              >
                Tasks
              </button>
              <button
                className={`py-4 px-1 ${activeTab === 'calendar' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium`}
                onClick={() => setActiveTab('calendar')}
              >
                Calendar
              </button>
              <button
                className={`py-4 px-1 ${activeTab === 'reminders' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium`}
                onClick={() => setActiveTab('reminders')}
              >
                Reminders
              </button>
            </nav>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-sm text-gray-600">Ask me to help organize your life, manage tasks, set reminders, or schedule events</p>
              </div>
              
              <div className="p-4 h-[400px] overflow-y-auto">
                {chatHistory.length > 0 ? (
                  <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-gray-100 text-gray-900'}`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">Start a conversation</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm">
                      Ask me to add tasks, schedule events, set reminders, or help organize your day
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
                <p className="text-sm text-gray-600">Manage your to-do list</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div key={task.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => completeTask(task.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className={`ml-3 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
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
                    <p>No tasks yet. Ask the assistant to add some tasks for you.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Your Calendar</h2>
                <p className="text-sm text-gray-600">Upcoming events and appointments</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {events.length > 0 ? (
                  events.map(event => (
                    <div key={event.id} className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>Date: {formatDate(event.date)}</p>
                            {event.time && <p>Time: {event.time}</p>}
                            {event.location && <p>Location: {event.location}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No events scheduled. Ask the assistant to add events to your calendar.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
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
      ) : (
        <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to LifeAssist AI</h2>
          <p className="text-gray-600 mb-6">Sign in to get started with your personal AI assistant for daily life organization</p>
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => signIn('google')}
          >
            Sign in with Google
          </button>
        </div>
      )}
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            LifeAssist AI - Powered by Claude AI
          </p>
          <p className="text-center text-gray-400 text-xs mt-1">
            Your personal AI assistant for daily life organization
          </p>
        </div>
      </footer>
    </div>
  );
}
