"use client"

import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { Send, Square, ThumbsUp, ThumbsDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function Chat({
  messages = [],
  input = "",
  handleInputChange,
  handleSubmit,
  isGenerating = false,
  stop,
  append,
  suggestions = [],
  setMessages,
  onRateResponse,
  className,
  transcribeAudio,
}) {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  return (
    <div className={cn("flex flex-col w-full h-full", className)}>
      {isEmpty ? (
        <PromptSuggestions append={append} suggestions={suggestions} />
      ) : (
        <ChatMessages messages={messages} onRateResponse={onRateResponse} />
      )}

      <ChatForm
        className="mt-auto"
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <MessageInput
            value={input}
            onChange={handleInputChange}
            files={files}
            setFiles={setFiles}
            stop={stop}
            isGenerating={isGenerating}
            transcribeAudio={transcribeAudio}
          />
        )}
      </ChatForm>
    </div>
  )
}

export function ChatContainer({ children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col w-full h-full rounded-lg border bg-background overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ChatMessages({ children, className, messages, onRateResponse }) {
  const containerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isBottom = scrollHeight - scrollTop - clientHeight < 10
      setIsScrolledToBottom(isBottom)
      setAutoScroll(isBottom)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !autoScroll) return

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight
    }

    scrollToBottom()
    const observer = new MutationObserver(scrollToBottom)
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [messages, autoScroll])

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-y-auto p-4 flex flex-col gap-4",
        className
      )}
    >
      <MessageList messages={messages} onRateResponse={onRateResponse} />
      {!isScrolledToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-6 rounded-full shadow-md"
          onClick={() => {
            setAutoScroll(true)
            containerRef.current?.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            })
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      )}
    </div>
  )
}

export function MessageList({ messages, isTyping, onRateResponse }) {
  if (!messages.length) return null

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <Message
          key={message.id || index}
          message={message}
          onRateResponse={
            message.role === "assistant" && onRateResponse
              ? (rating) => onRateResponse(message.id, rating)
              : undefined
          }
        />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  )
}

export function Message({ message, onRateResponse }) {
  const [rating, setRating] = useState(null)

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const isSystem = message.role === "system"

  if (isSystem) {
    return (
      <div className="flex items-center justify-center">
        <div className="bg-muted text-muted-foreground text-sm px-3 py-1.5 rounded-md">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "flex-1 rounded-lg px-4 py-2 max-w-[85%] text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
          </svg>
        </div>
      )}

      {isAssistant && onRateResponse && (
        <div
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              rating === "thumbs-up" && "text-green-500"
            )}
            onClick={() => {
              setRating("thumbs-up")
              onRateResponse("thumbs-up")
            }}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              rating === "thumbs-down" && "text-red-500"
            )}
            onClick={() => {
              setRating("thumbs-down")
              onRateResponse("thumbs-down")
            }}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
      </div>
      <span>AI is thinking...</span>
    </div>
  )
}

export function ChatForm({ children, isPending, handleSubmit, className }) {
  const [files, setFiles] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    handleSubmit(e, { data: { files } })
    setFiles(null)
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("p-4 flex items-end gap-2", className)}
    >
      {typeof children === "function"
        ? children({ files, setFiles })
        : children}
      <Button
        type="submit"
        size="icon"
        disabled={isPending}
        className="rounded-lg shrink-0"
      >
        {isPending ? (
          <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}

export function MessageInput({
  value,
  onChange,
  files,
  setFiles,
  stop,
  isGenerating,
  transcribeAudio,
}) {
  const textareaRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.form.requestSubmit()
    }
  }

  const startRecording = async () => {
    if (!transcribeAudio) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setAudioChunks([])

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        try {
          const transcript = await transcribeAudio(audioBlob)
          onChange({ target: { value: transcript } })
        } catch (error) {
          console.error("Transcription failed:", error)
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-h-10 resize-none pr-12 py-3"
        rows={1}
      />
      <div className="absolute right-2 bottom-1 flex gap-1">
        {isGenerating && stop && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={stop}
          >
            <Square className="h-4 w-4" />
          </Button>
        )}

        {transcribeAudio && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isRecording && "text-red-500 animate-pulse"
            )}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

export function PromptSuggestions({ suggestions, append }) {
  if (!append || !suggestions?.length) return null

  return (
    <div className="p-8 flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">How can I help you today?</h2>
          <p className="text-sm text-muted-foreground">
            Choose a suggestion or ask your own question
          </p>
        </div>
        <div className="grid gap-2 w-full">
          {suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              className="justify-start h-auto p-3 text-sm"
              onClick={() => append({ role: "user", content: suggestion })}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
