'use client';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', name: 'Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'board', name: 'Task Board', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'goals', name: 'Goals', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'calendar', name: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <div className="h-screen flex flex-col border-r shadow-sm">
      <nav className="flex flex-col space-y-2 p-4 h-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-3 px-4 flex items-center space-x-2 transition-all duration-200 rounded-md ${
              activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg 
              className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
            </svg>
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
