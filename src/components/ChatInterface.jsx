"use client"

import { useState, useCallback, useEffect } from "react"

import { cn } from "@/lib/utils"
import { transcribeAudio } from "@/lib/utils/audio"
import { Chat } from "@/components/ui/chat"
import { getUserSession } from "@/lib/firebaseAuth"

export function ChatInterface({ initialMessages = [], user }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])
  
  const append = useCallback(async (message) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setAuthError(null)
    
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated. No user session found.')
        throw new Error('You must be signed in to use the chat.')
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data])
      } else {
        if (data.error && data.error.includes('must be signed in')) {
          setAuthError('Authentication error: ' + data.error)
        }
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error in chat:', error)
      // Log more detailed information about the response
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${error.message || 'Sorry, there was an error processing your request. Please try again.'}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [messages])
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    append(input)
    setInput('')
  }, [append, input, isLoading])
  
  const stop = useCallback(() => {
    // This is a no-op since we're not using streaming
    setIsLoading(false)
  }, [])

  return (
    <div className={cn("flex flex-col h-full w-full")}>
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {authError}</span>
          <span className="block mt-1">Session status: {user ? 'Authenticated' : 'Not authenticated'}</span>
        </div>
      )}
      
      {!user ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Chat
          className="grow"
          messages={messages}
          handleSubmit={handleSubmit}
          input={input}
          handleInputChange={handleInputChange}
          isGenerating={isLoading}
          stop={stop}
          append={append}
          setMessages={setMessages}
          transcribeAudio={transcribeAudio}
          suggestions={[
            "What's on my calendar for tomorrow?",
            "Tell me about the latest technology trends",
            "How can I improve my productivity?",
            "Do I have any meetings this week?",
          ]}
        />
      )}
    </div>
  )
}
