'use client';

import { useState, useEffect, useRef } from 'react';

const JiraBoard = ({ tasks, onTaskUpdate, onTaskDelete, onTaskCreate }) => {
  // Define columns for the JIRA board
  const [columns, setColumns] = useState({
    todo: {
      id: 'todo',
      title: 'To Do',
      taskIds: []
    },
    inProgress: {
      id: 'inProgress',
      title: 'In Progress',
      taskIds: []
    },
    review: {
      id: 'review',
      title: 'Review',
      taskIds: []
    },
    done: {
      id: 'done',
      title: 'Done',
      taskIds: []
    }
  });
  
  // State for new task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  // Organize tasks into columns when tasks prop changes
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    // Create a copy of columns to update
    const newColumns = { ...columns };
    
    // Reset all taskIds arrays
    Object.keys(newColumns).forEach(colId => {
      newColumns[colId].taskIds = [];
    });
    
    // Distribute tasks into columns based on their status
    tasks.forEach(task => {
      const status = task.status || 'todo'; // Default to todo if no status
      if (newColumns[status]) {
        newColumns[status].taskIds.push(task.id);
      } else {
        // If status doesn't match a column, put in todo
        newColumns.todo.taskIds.push(task.id);
      }
    });
    
    setColumns(newColumns);
  }, [tasks]);

  // Drag state
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Handle drag start
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Store task ID in dataTransfer
    e.dataTransfer.setData('text/plain', task.id);
    // Set a ghost image
    const ghostElement = e.target.cloneNode(true);
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 20, 20);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };
  
  // Handle drag over
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop
  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== columnId) {
      // Update task status
      onTaskUpdate(task.id, { ...task, status: columnId });
    }
    
    setDraggedTask(null);
  };

  // Handle creating a new task
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onTaskCreate({
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'todo',
      completed: false
    });
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowNewTaskForm(false);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Task Board</h2>
          <p className="text-sm text-gray-600">Drag and drop tasks between columns to update their status</p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>
      
      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="p-4 border-b bg-blue-50">
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Task Title</label>
              <input
                type="text"
                id="taskTitle"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter task title"
                required
              />
            </div>
            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                id="taskDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter task description"
                rows="2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewTaskForm(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* JIRA Board */}
      <div className="p-4 grid grid-cols-4 gap-4 h-[600px] overflow-auto">
        {Object.values(columns).map(column => (
          <div key={column.id} className="bg-gray-100 rounded-md p-2">
            <h3 className="font-medium text-gray-700 mb-2 px-2 py-1 bg-gray-200 rounded-md flex justify-between items-center">
              {column.title}
              <span className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full">
                {column.taskIds.length}
              </span>
            </h3>
            <div 
              className={`min-h-[500px] transition-colors rounded-md p-2 ${draggedTask ? 'bg-blue-50' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {column.taskIds.map((taskId, index) => {
                const task = tasks.find(t => t.id === taskId);
                if (!task) return null;
                
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-white p-3 mb-2 rounded-md shadow-sm border-l-4 cursor-move ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    } ${
                      column.id === 'done' ? 'border-green-500' : 
                      column.id === 'inProgress' ? 'border-blue-500' : 
                      column.id === 'review' ? 'border-yellow-500' : 'border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <button
                        onClick={() => onTaskDelete(task.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JiraBoard;
