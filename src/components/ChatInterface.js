'use client';

import { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ 
  session, 
  chatHistory, 
  setChatHistory, 
  loading, 
  setLoading, 
  error, 
  setError, 
  fetchTasks, 
  fetchEvents, 
  fetchGoals 
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

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
      
      const response = await fetch('/api/ai', {
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
        fetchGoals();
        console.log('Refreshing tasks, events, and goals');
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

  return (
    <div className="shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600">Ask me to help organize your life, manage tasks, set reminders, or schedule events</p>
      </div>
      
      <div className="p-4 h-[500px] overflow-y-auto">
        {chatHistory.length > 0 ? (
          <div className="space-y-6">
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm transition-all duration-200 
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'}`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center">
            <div className="bg-blue-100 rounded-full p-5 mb-4">
              <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Start a conversation</h3>
            <p className="mt-2 text-gray-500 max-w-sm">
              Ask me to add tasks, schedule events, set reminders, or help organize your day
            </p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center transition-colors duration-200 shadow-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
