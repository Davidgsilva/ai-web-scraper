"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, parseISO, isToday, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { useAuth } from "@/lib/authContext"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { getUserHabits, addHabit as addUserHabit, deleteHabit as deleteUserHabit, toggleHabitCompletion as toggleUserHabitCompletion, getHabitCompletions } from "@/lib/firebaseAuth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TrendingUp, Plus, X, Check } from "lucide-react"

// Import the required styles for react-day-picker
import "react-day-picker/dist/style.css"

// Cache for calendar events only
const eventCache = new Map();

export function CalendarView() {
  const { user } = useAuth()
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Habit tracking state
  const [habits, setHabits] = useState([])
  const [newHabitName, setNewHabitName] = useState('')
  const [habitCompletions, setHabitCompletions] = useState({})
  const [habitStats, setHabitStats] = useState([])
  const [loadingHabits, setLoadingHabits] = useState(false)

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
    if (date && !isNaN(date.getTime())) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [date]);
  
  // Fetch habits from Firebase
  useEffect(() => {
    const fetchHabits = async () => {
      if (!user) return;
      
      setLoadingHabits(true);
      
      try {
        // Use the new getUserHabits function
        const habitsData = await getUserHabits(user.id);
        setHabits(habitsData);
        
        // Fetch habit completions for the current month
        await fetchHabitCompletionsForMonth(currentMonth);
      } catch (error) {
        console.error('Error fetching habits:', error);
      } finally {
        setLoadingHabits(false);
      }
    };
    
    fetchHabits();
  }, [user, currentMonth]);
  
  // Fetch habit completions for the current month
  const fetchHabitCompletionsForMonth = async (month) => {
    if (!user || !habits.length) return;
    
    try {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      // Use the new getHabitCompletions function
      console.log('Fetching habit completions from Firebase for', format(month, 'MMMM yyyy'));
      const completions = await getHabitCompletions(user.id, start, end);
      
      setHabitCompletions(completions);
      calculateHabitStats(completions);
    } catch (error) {
      console.error('Error fetching habit completions:', error);
    }
  };
  
  // Calculate habit statistics for the bar chart
  const calculateHabitStats = (completions) => {
    if (!habits.length) return;
    
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    
    const stats = habits.map(habit => {
      let completed = 0;
      
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (completions[dateKey] && completions[dateKey][habit.id]) {
          completed++;
        }
      });
      
      return {
        name: habit.name,
        completed,
        total: days.length,
        percentage: Math.round((completed / days.length) * 100)
      };
    });
    
    setHabitStats(stats);
  };
  
  // Add a new habit
  const addHabit = async () => {
    if (!user || !newHabitName.trim()) return;
    
    try {
      // Use the new addUserHabit function
      const newHabit = await addUserHabit(user.id, newHabitName.trim());
      
      if (newHabit) {
        console.log('Successfully added habit to Firebase:', newHabit);
        setHabits([...habits, newHabit]);
        setNewHabitName('');
        
        // Refresh habit data
        fetchHabitCompletionsForMonth(currentMonth);
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };
  
  // Delete a habit
  const deleteHabit = async (habitId) => {
    if (!user) return;
    
    try {
      // Use the new deleteUserHabit function
      const success = await deleteUserHabit(user.id, habitId);
      
      if (success) {
        console.log('Successfully deleted habit from Firebase:', habitId);
        setHabits(habits.filter(habit => habit.id !== habitId));
        
        // Refresh habit data
        fetchHabitCompletionsForMonth(currentMonth);
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };
  
  // Toggle habit completion for a specific day
  const toggleHabitCompletion = async (habitId, date) => {
    if (!user) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const isCompleted = habitCompletions[dateKey] && habitCompletions[dateKey][habitId];
    
    try {
      // Use the new toggleUserHabitCompletion function
      const result = await toggleUserHabitCompletion(user.id, habitId, date);
      
      if (result.success) {
        // Update local state based on the new completion status
        const newCompletions = { ...habitCompletions };
        
        if (result.completed) {
          // Add completion
          if (!newCompletions[dateKey]) {
            newCompletions[dateKey] = {};
          }
          newCompletions[dateKey][habitId] = true;
        } else {
          // Remove completion
          if (newCompletions[dateKey]) {
            delete newCompletions[dateKey][habitId];
            if (Object.keys(newCompletions[dateKey]).length === 0) {
              delete newCompletions[dateKey];
            }
          }
        }
        
        setHabitCompletions(newCompletions);
        calculateHabitStats(newCompletions);
        
        console.log('Successfully toggled habit completion in Firebase:', result.completed ? 'completed' : 'uncompleted');
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
    }
  };
  
  // Handle month navigation
  const goToPreviousMonth = () => {
    const newDate = subMonths(date, 1);
    setDate(newDate);
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };
  
  const goToNextMonth = () => {
    const newDate = addMonths(date, 1);
    setDate(newDate);
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div>
          <div className="hidden md:block">
            {/* Calendar component */}
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Previous month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 className="font-semibold text-lg flex items-center">
                {format(date, 'MMMM yyyy')}
                {isToday(date) && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Today</span>}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Next month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2">
                    {day}
                  </div>
                ))}
                {/* Calendar grid */}
                {generateCalendarDays().map((day, index) => (
                  <div key={index} className="min-h-[80px] p-1 border">
                    {day && (
                      <>
                        <div className="text-center text-sm font-medium">
                          {format(day, 'd')}
                        </div>
                        <div className="mt-1">
                          {/* Events for the day */}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Selected day events */}
            {selectedDayEvents.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium mb-3">
                  Events for {format(date, 'MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {selectedDayEvents.map((event, index) => (
                    <div key={event.id || index} className="p-3 rounded-md border bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{event.summary || event.title}</h3>
                          {event.start.dateTime && (
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(event.start.dateTime), 'h:mm a')} -{' '}
                              {format(parseISO(event.end.dateTime), 'h:mm a')}
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
      {/* Habit Tracking Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Habit List and Form */}
        <div className="flex-1">
          {/* Habit list and form component */}
          <Card>
            <CardHeader>
              <CardTitle>Habit Tracker</CardTitle>
              <CardDescription>Track your daily habits</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHabits ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Add Habit Form */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="New habit name"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                    />
                    <Button onClick={addHabit} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {/* Habits List */}
                  <div className="space-y-3">
                    {habits.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No habits yet. Add one to get started!</p>
                    ) : (
                      habits.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`habit-${habit.id}`}
                              checked={habitCompletions[format(date, 'yyyy-MM-dd')]?.[habit.id] || false}
                              onCheckedChange={() => toggleHabitCompletion(habit.id, date)}
                            />
                            <label htmlFor={`habit-${habit.id}`} className="text-sm font-medium">
                              {habit.name}
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHabit(habit.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Habit Stats Chart */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Habit Progress</CardTitle>
              <CardDescription>{format(currentMonth, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              {habitStats.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={habitStats}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 20, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, 'Completion Rate']}
                        labelFormatter={(value, entry) => {
                          // Safe access to avoid undefined errors
                          return entry && entry.payload && entry.payload[0] ? entry.payload[0].name : '';
                        }}
                      />
                      <Bar
                        dataKey="percentage"
                        fill="var(--primary)"
                        radius={[0, 4, 4, 0]}
                        label={{ position: 'right', formatter: (value) => `${value}%` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <p className="text-muted-foreground">Add habits to see your progress</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                {habitStats.length > 0 && (
                  <>
                    <Check className="h-4 w-4" />
                    {Math.round(habitStats.reduce((acc, stat) => acc + stat.percentage, 0) / habitStats.length)}% average completion
                  </>
                )}
              </div>
              <div className="leading-none text-muted-foreground">
                Showing habit progress for {format(currentMonth, 'MMMM yyyy')}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
  }
