'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch news and summaries
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.articles);
        setSummaries(data.summaries);
      } else {
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      setError('Error fetching news: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Trump AI News</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchNews}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Loading...' : 'Search Google News'}
            </button>
            <div className="text-sm text-gray-500 italic">
              {articles.length > 0 && !loading ? `${articles.length} articles found` : ''}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {articles.length === 0 && !loading && !error ? (
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold text-gray-600">No articles yet</h2>
                <p className="mt-2 text-gray-500">Click "Fetch Latest News" to get started</p>
              </div>
            ) : (
              articles.map((article, index) => {
                // Find matching summary
                const summary = summaries.find(s => s.articleIndex === index) || {};
                
                return (
                  <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {article.urlToImage && (
                          <div className="md:w-1/4 flex-shrink-0">
                            <img 
                              src={article.urlToImage} 
                              alt={article.title}
                              className="w-full h-48 object-cover rounded-md"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-news.png';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className={article.urlToImage ? "md:w-3/4" : "w-full"}>
                          <div className="flex flex-wrap items-center mb-2">
                            <span className="text-sm text-gray-500 mr-2">
                              {article.source?.name || 'Unknown Source'}
                            </span>
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mr-2">
                              {new URL(article.url).hostname}
                            </a>
                            
                            {summary.sentiment && (
                              <span className={`ml-auto px-2 py-1 rounded-full text-xs ${getSentimentColor(summary.sentiment)}`}>
                                {summary.sentiment}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-4">
                            {article.description || 'No description available'}
                          </p>
                          
                          {summary.summary && (
                            <div className="bg-blue-50 p-4 rounded-md mb-4">
                              <h4 className="font-medium text-blue-800 mb-2">AI Summary</h4>
                              <p className="text-blue-900">{summary.summary}</p>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <a 
                              href={article.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Read full article →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Trump AI News - Powered by Claude AI and Google News Scraping
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            This app scrapes Google News for the latest Trump stories and uses Claude AI to summarize them
          </p>
        </div>
      </footer>
    </div>
  );
}
