'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: session } = useSession();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
        setFilteredTemplates(data.data);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Error loading templates: ' + err.message);
    }
  };

  // Filter templates by category
  const filterByCategory = (category) => {
    setActiveCategory(category);
    
    if (category === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(template => template.category === category));
    }
  };

  // Handle template selection
  const selectTemplate = (template) => {
    if (template.premium && !session) {
      setShowSubscribeModal(true);
      return;
    }
    
    setSelectedTemplate(template);
    setUserPrompt('');
    setGeneratedContent(null);
  };

  // Generate content using selected template and user prompt
  const generateContent = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      setError('Please select a template first');
      return;
    }
    
    if (!userPrompt) {
      setError('Please enter your prompt');
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
          templateId: selectedTemplate.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedContent(data.data);
      } else {
        setError(data.message || 'Failed to generate content');
      }
    } catch (err) {
      setError('Error generating content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from templates
  const categories = ['all', ...new Set(templates.map(template => template.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Content Marketplace</h1>
              <p className="mt-2 text-gray-600">Create professional content with AI-powered templates</p>
            </div>
            <div className="flex space-x-3">
              <a 
                href="/create" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Template
              </a>
              {session ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                  <button 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => signIn('google')}
                >
                  Sign In / Subscribe
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Category Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  activeCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => filterByCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Content Templates</h2>
                <p className="text-sm text-gray-600">Select a template to get started</p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map(template => (
                    <div 
                      key={template.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectTemplate(template)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-medium text-gray-900">{template.title}</h3>
                        {template.premium && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                      <p className="mt-2 text-xs text-gray-500">By {template.creator}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No templates found in this category
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Content Generation Panel */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.title}</h2>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
                
                <div className="p-4">
                  <form onSubmit={generateContent}>
                    <div className="mb-4">
                      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Input
                      </label>
                      <textarea
                        id="prompt"
                        rows={5}
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Enter your specific requirements or details..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        {loading ? 'Generating...' : 'Generate Content'}
                      </button>
                    </div>
                  </form>
                </div>
                
                {loading && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="ml-4 text-gray-600">Generating content...</p>
                    </div>
                  </div>
                )}
                
                {generatedContent && !loading && (
                  <div className="p-4 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Generated Content</h3>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-black">
                      {generatedContent.content}
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                      <div>
                        Tokens used: {generatedContent.usage.totalTokens} 
                        ({generatedContent.usage.promptTokens} prompt, {generatedContent.usage.completionTokens} completion)
                      </div>
                      <button 
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedContent.content);
                        }}
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a template</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a content template from the list to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Premium Content</h2>
            <p className="text-gray-600 mb-4">
              This template is only available to premium subscribers. Sign in now to access all premium templates.
            </p>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h3 className="font-medium text-blue-800 mb-2">Premium Subscription Benefits:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Access to all premium templates</li>
                <li>• Unlimited content generation</li>
                <li>• Priority support</li>
                <li>• Advanced customization options</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setShowSubscribeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  signIn('google');
                  setShowSubscribeModal(false);
                }}
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            AI Content Marketplace - Powered by Claude AI
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            Create professional content with AI-powered templates
          </p>
        </div>
      </footer>
    </div>
  );
}
