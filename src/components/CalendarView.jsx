"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, parseISO, isToday, isSameDay } from "date-fns"
import { useAuth } from "@/lib/authContext"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Import the required styles for react-day-picker
import "react-day-picker/dist/style.css"

// Cache for calendar events
const eventCache = new Map();

export function CalendarView() {
  const { user } = useAuth()
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Fetch calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      // Check cache first
      const cacheKey = `${user.id}-${format(date, 'yyyy-MM')}`;
      if (eventCache.has(cacheKey)) {
        console.log('Using cached events');
        setEvents(eventCache.get(cacheKey));
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('Fetching calendar events');
        const response = await fetch('/api/calendar');
        
        if (!response.ok) {
          throw new Error(`Error fetching events: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.events) {
          // Process events to ensure they have the right format
          const processedEvents = data.events.map(event => {
            // If the event is already in the right format, return it as is
            if (event.start && (event.start.dateTime || event.start.date)) {
              return event;
            }
            
            // Otherwise, convert from the API format to the expected format
            return {
              id: event.googleEventId,
              summary: event.title,
              start: event.time 
                ? { dateTime: `${event.date}T${event.time}:00` }
                : { date: event.date },
              end: event.time 
                ? { dateTime: `${event.date}T${event.time}:00` } // This is a simplification
                : { date: event.date },
              location: event.location,
              description: event.description
            };
          });
          
          // Cache the events
          eventCache.set(cacheKey, processedEvents);
          setEvents(processedEvents);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user, date]);

  // Update selected day events when date changes
  useEffect(() => {
    if (events.length > 0) {
      const dayEvents = events.filter(event => {
        // Check if event and event.start exist
        if (!event || !event.start) return false;
        
        // Safely get the date string
        const dateString = event.start.dateTime || event.start.date;
        if (!dateString) return false;
        
        try {
          const eventDate = parseISO(dateString);
          return isSameDay(eventDate, date);
        } catch (error) {
          console.error('Error parsing event date:', error);
          return false;
        }
      });
      
      setSelectedDayEvents(dayEvents);
    } else {
      setSelectedDayEvents([]);
    }
  }, [date, events]);
  
  // Update current month when date changes
  useEffect(() => {
    if (isValidDate) {
      setCurrentMonth(new Date(displayDate.getFullYear(), displayDate.getMonth(), 1));
    }
  }, [date]);

  // Custom day render function to show events
  const renderDay = (day) => {
    // If date is invalid, return null
    if (!day || !day.date || !(day.date instanceof Date) || isNaN(day.date.getTime())) {
      return null;
    }
    
    // Ensure events array exists
    const currentEvents = events || [];
    
    // Check if there are events on this day
    let hasEvents = false;
    try {
      hasEvents = currentEvents.some(event => {
        if (!event || !event.start) return false;
        const eventDate = event.start.dateTime || event.start.date;
        if (!eventDate) return false;
        
        try {
          const parsedDate = parseISO(eventDate);
          return isSameDay(parsedDate, day.date);
        } catch (e) {
          console.error('Error parsing event date:', e);
          return false;
        }
      });
    } catch (e) {
      console.error('Error checking for events:', e);
    }
    
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center",
          hasEvents && "font-semibold"
        )}
      >
        {format(day.date, "d")}
        {hasEvents && (
          <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
        )}
      </div>
    );
  };

  // Generate calendar days for the current month view
  const generateCalendarDays = () => {
    if (!currentMonth || !(currentMonth instanceof Date)) return Array(42).fill(null);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Total days in the month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Create array for all days
    const days = Array(42).fill(null);
    
    // Fill in the days from the current month
    for (let i = 0; i < daysInMonth; i++) {
      days[i + firstDayOfWeek] = new Date(year, month, i + 1);
    }
    
    // Fill in days from previous month
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days[i] = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - (firstDayOfWeek - i - 1));
    }
    
    // Fill in days from next month
    const nextMonth = new Date(year, month + 1, 1);
    let nextMonthDay = 1;
    
    for (let i = firstDayOfWeek + daysInMonth; i < 42; i++) {
      days[i] = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay++);
    }
    
    return days;
  };

  // Ensure date is valid
  const isValidDate = date && date instanceof Date && !isNaN(date.getTime());
  const displayDate = isValidDate ? date : new Date();
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div>
        <div className="hidden md:block">
          <Calendar
            mode="single"
            selected={displayDate}
            onSelect={setDate}
            className="rounded-md border shadow"
          />
        </div>
      </div>
      <div className="flex-1">
        <div className="rounded-md border p-4">
          <h2 className="font-semibold text-lg mb-4">
            {isValidDate ? format(displayDate, "MMMM yyyy") : "Select a date"}
            {isValidDate && isToday(displayDate) && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Today</span>}
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium text-sm py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar grid */}
              {generateCalendarDays().map((day, index) => {
                // Check if there are events on this day
                const dayEvents = events.filter(event => {
                  if (!event || !event.start) return false;
                  const dateString = event.start.dateTime || event.start.date;
                  if (!dateString) return false;
                  
                  try {
                    const eventDate = parseISO(dateString);
                    return day && isSameDay(eventDate, day);
                  } catch (e) {
                    return false;
                  }
                });
                
                const isSelected = day && isSameDay(day, displayDate);
                const isCurrentMonth = day && day.getMonth() === currentMonth.getMonth();
                const isCurrentDay = day && isToday(day);
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "min-h-[80px] p-1 border rounded-md",
                      !day && "bg-gray-50",
                      day && !isCurrentMonth && "bg-gray-50 text-gray-400",
                      isSelected && "bg-blue-50 border-blue-200",
                      isCurrentDay && "border-blue-500"
                    )}
                    onClick={() => day && setDate(day)}
                  >
                    {day && (
                      <>
                        <div className="text-right text-sm font-medium">
                          {format(day, "d")}
                        </div>
                        <div className="mt-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div 
                              key={event.id || idx} 
                              className="text-xs truncate mb-1 p-1 rounded bg-blue-100 text-blue-800"
                              title={event.summary}
                            >
                              {event.start.dateTime ? format(parseISO(event.start.dateTime), "h:mm") : ""} {event.summary || event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Selected day events */}
          {selectedDayEvents.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium mb-3">
                Events for {format(displayDate, "MMMM d, yyyy")}
              </h3>
              <div className="space-y-3">
                {selectedDayEvents.map((event, index) => (
                  <div key={event.id || index} className="p-3 rounded-md border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{event.summary || event.title}</h3>
                        {event.start.dateTime && (
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.start.dateTime), "h:mm a")} - {format(parseISO(event.end.dateTime), "h:mm a")}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
