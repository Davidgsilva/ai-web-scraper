"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/authContext"

export function VerticalNavigation({ activeTab, setActiveTab }) {
  const { user, signIn, signOut } = useAuth();

  const tabs = [
    { id: 'chat', label: 'Chat', icon: Icons.chat },
    { id: 'calendar', label: 'Calendar', icon: Icons.calendar },
  ]

  return (
    <div className="h-screen w-64 border-r">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <Icons.logo className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="ml-2 text-lg font-semibold dark:text-white">LifeAssist AI</span>
        </div>
        <ThemeToggle />
      </div>
      
      {/* User Profile */}
      {user && (
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            {user.image && (
              <>
                <img 
                  src={user.image.replace('=s96-c', '=s96-c-rw')} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    // Fallback to a default avatar if Google image fails
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.email);
                  }}
                />
              </>
            )}
            <span className="text-sm font-medium truncate">
              {user.name || user.email}
            </span>
          </div>
        </div>
      )}
      <nav className="flex flex-col space-y-1 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          )
        })}
      </nav>
      
      {/* Sign In/Out Button */}
      <div className="mt-auto px-4 pb-4">
        {user ? (
          <button 
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            onClick={signOut}
          >
            <Icons.logout className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        ) : (
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
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
        )}
      </div>
    </div>
  )
}
