import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { getUserSession } from '@/lib/firebaseAuth';
import { listEvents, formatEventForFirebase } from '@/lib/googleCalendar';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    console.log('POST request received to /api/chat');
    
    // Get user ID from cookies
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;
    
    console.log('User ID from cookie:', userId);
    
    if (!userId) {
      console.error('Authentication failed: No user ID in cookies');
      return NextResponse.json(
        { error: 'You must be signed in to use this API.' },
        { status: 401 }
      );
    }
    
    // Get user session from Firebase
    const userSession = await getUserSession(userId);
    
    console.log('User session from Firebase:', {
      exists: !!userSession,
      email: userSession?.email,
      hasAccessToken: !!userSession?.accessToken
    });
    
    if (!userSession) {
      console.error('Authentication failed: No user session found in Firebase');
      return NextResponse.json(
        { error: 'Your session has expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // Parse request body
    const { messages, model } = await req.json();
    
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found in the conversation.' },
        { status: 400 }
      );
    }
    
    // Check if the message is related to calendar
    const userInput = lastUserMessage.content;
    const calendarKeywords = ['calendar', 'schedule', 'event', 'appointment', 'meeting', 'reminder', 'agenda'];
    const messageWords = userInput.toLowerCase().split(/\s+/);
    
    // Check for calendar-related keywords in the message
    const matchedKeywords = calendarKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword)));
    
    const isCalendarQuery = matchedKeywords.length > 0;
    
    // Fetch calendar events if it's a calendar-related query
    let calendarEvents = [];
    if (isCalendarQuery) {
      // Get access token from user session
      const accessToken = userSession.accessToken;
      
      console.log('Access token available for calendar query:', !!accessToken);
      
      if (accessToken) {
        try {
          const googleEvents = await listEvents(accessToken, 20);
          calendarEvents = googleEvents
            .map(event => formatEventForFirebase(event))
            .filter(event => event !== null);
        } catch (calendarError) {
          console.error('Error fetching calendar events:', calendarError);
        }
      }
    }
    
    // Create system prompt
    const systemPrompt = `You are a helpful AI assistant that can help with various tasks including calendar management.
    
    ${isCalendarQuery ? `The user's Google Calendar events are:
    ${calendarEvents.length > 0 ? JSON.stringify(calendarEvents, null, 2) : 'No calendar events available'}
    
    IMPORTANT: The app is connected to Google Calendar! When discussing calendar events, you have access to the user's actual Google Calendar data.` : ''}
    
    When the user asks about calendar-related topics, you can:
    1. Discuss calendar events - Provide information about their schedule
    2. Summarize calendar - Provide a summary of upcoming events
    3. Suggest scheduling - Help them find good times for new events
    
    For calendar events, include relevant details like:
    - Title/summary of the event
    - Date and time
    - Location (if available)
    - Description/details (if available)
    
    When summarizing calendar events:
    - Group events by day
    - Highlight important events
    - Mention conflicts or busy periods
    
    For all other topics, be a helpful and informative assistant that provides accurate and thoughtful responses.
    
    Always respond in a friendly, conversational manner.`;
    
    // Create a response using the existing Claude implementation
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: lastUserMessage.content }],
    });

    // Return the response
    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: response.content[0].text,
        id: Date.now().toString(),
      }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    // Log more detailed error information
    if (error.response) {
      console.error('Anthropic API error response:', error.response.data);
    }
    return NextResponse.json(
      { error: `Chat request failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
