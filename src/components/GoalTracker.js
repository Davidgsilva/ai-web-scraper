'use client';

import { useState } from 'react';

const GoalTracker = ({ goals, onGoalCreate, onGoalUpdate, onGoalDelete }) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  
  // Handle creating a new goal
  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    
    onGoalCreate({
      title: newGoalTitle,
      target: newGoalTarget,
      deadline: newGoalDeadline,
      progress: 0,
      completed: false
    });
    
    // Reset form
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalDeadline('');
    setShowNewGoalForm(false);
  };
  
  // Handle updating goal progress
  const handleProgressChange = (goalId, newProgress) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Ensure progress is between 0 and 100
    newProgress = Math.min(100, Math.max(0, newProgress));
    
    onGoalUpdate(goalId, { 
      ...goal, 
      progress: newProgress,
      completed: newProgress === 100
    });
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Goals & Progress</h2>
          <p className="text-sm text-gray-600">Track your goals and monitor progress</p>
        </div>
        <button
          onClick={() => setShowNewGoalForm(!showNewGoalForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>
      
      {/* New Goal Form */}
      {showNewGoalForm && (
        <div className="p-4 border-b bg-blue-50">
          <form onSubmit={handleCreateGoal} className="space-y-3">
            <div>
              <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700">Goal Title</label>
              <input
                type="text"
                id="goalTitle"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter goal title"
                required
              />
            </div>
            <div>
              <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700">Target (optional)</label>
              <input
                type="text"
                id="goalTarget"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="E.g., Complete 10 tasks"
              />
            </div>
            <div>
              <label htmlFor="goalDeadline" className="block text-sm font-medium text-gray-700">Deadline (optional)</label>
              <input
                type="date"
                id="goalDeadline"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewGoalForm(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Goals List */}
      <div className="p-4">
        {goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{goal.title}</h3>
                    {goal.target && (
                      <p className="text-sm text-gray-600">Target: {goal.target}</p>
                    )}
                    {goal.deadline && (
                      <p className="text-sm text-gray-600">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onGoalDelete(goal.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        goal.completed ? 'bg-green-600' : 'bg-blue-600'
                      }`} 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress Controls */}
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => handleProgressChange(goal.id, goal.progress - 10)}
                      className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                      disabled={goal.progress <= 0}
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => handleProgressChange(goal.id, goal.progress + 10)}
                      className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                      disabled={goal.progress >= 100}
                    >
                      +10%
                    </button>
                    <button
                      onClick={() => handleProgressChange(goal.id, 100)}
                      className={`px-2 py-1 rounded-md text-sm ${
                        goal.completed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {goal.completed ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No goals yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first goal to start tracking progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
