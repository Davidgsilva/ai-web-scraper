'use client';

import { useState } from 'react';

const CalendarView = ({ events, deleteEvent }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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

  // Group events by date for grid view
  const groupEventsByDate = () => {
    const grouped = {};
    
    events.forEach(event => {
      const date = event.date ? new Date(event.date).toDateString() : 'No Date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    return grouped;
  };

  // Get event color based on type or category
  const getEventColor = (event) => {
    const categories = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      appointment: 'bg-purple-100 text-purple-800 border-purple-200',
      deadline: 'bg-red-100 text-red-800 border-red-200',
      reminder: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      social: 'bg-green-100 text-green-800 border-green-200'
    };
    
    // Default to a neutral color if no category matches
    return categories[event.category?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Calendar</h2>
          <p className="text-sm text-gray-600">Upcoming events and appointments</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:bg-white/50'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:bg-white/50'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {events.length > 0 ? (
            events.map(event => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        event.category === 'meeting' ? 'bg-blue-500' :
                        event.category === 'appointment' ? 'bg-purple-500' :
                        event.category === 'deadline' ? 'bg-red-500' :
                        event.category === 'social' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 ml-6">
                      <div className="flex items-center mb-1">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.date)}</span>
                      </div>
                      {event.time && (
                        <div className="flex items-center mb-1">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-150"
                      aria-label="Delete event"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="bg-blue-50 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No events scheduled</h3>
              <p className="text-gray-500">
                Ask the assistant to add events to your calendar
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {events.length > 0 ? (
            Object.entries(groupEventsByDate()).map(([date, dateEvents]) => (
              <div key={date} className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2 sticky top-0 bg-white p-2 border-b z-10">
                  {date !== 'No Date' ? new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No Date Specified'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dateEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`p-3 rounded-lg border ${getEventColor(event)} transition-all duration-200 hover:shadow-md`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{event.title}</h4>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-150"
                          aria-label="Delete event"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 text-sm">
                        {event.time && (
                          <div className="flex items-center mb-1">
                            <svg className="h-3 w-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <svg className="h-3 w-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="bg-blue-50 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No events scheduled</h3>
              <p className="text-gray-500">
                Ask the assistant to add events to your calendar
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
