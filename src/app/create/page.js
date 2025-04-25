'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CreateTemplate() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'business',
    premium: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Add creator information from session
      const templateData = {
        ...formData,
        creator: session?.user?.name || session?.user?.email || 'Anonymous User'
      };
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          title: '',
          description: '',
          prompt: '',
          category: 'business',
          premium: false
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create template');
      }
    } catch (err) {
      setError('Error creating template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Template</h1>
              <p className="mt-2 text-gray-600">Add your own AI content template to the marketplace</p>
            </div>
            <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Template created successfully! Redirecting to marketplace...
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Business Report Generator"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="A brief description of what your template does"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="design">Design</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Prompt
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={8}
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="Write the prompt that will be used to generate content. Be specific about the format, sections, and style you want."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This is the instruction that will be sent to the AI. Be clear and specific about what you want the AI to generate.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="premium"
                  name="premium"
                  checked={formData.premium}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="premium" className="ml-2 block text-sm text-gray-700">
                  Make this a premium template (requires subscription)
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Template Guidelines:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Be clear and specific in your prompt instructions</li>
                  <li>• Avoid requesting harmful, illegal, or unethical content</li>
                  <li>• Premium templates should provide significant value</li>
                  <li>• Templates may be reviewed before being published</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

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
