import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Function to fetch news about Trump using web scraping
async function fetchTrumpNews() {
  console.log('Starting web scraping for Trump news...');
  
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Puppeteer browser launched');
    const page = await browser.newPage();
    
    // Set a user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to Google News search for Trump
    const searchQuery = 'Trump news';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`;
    
    console.log('Navigating to:', searchUrl);
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // Wait for search results to load
    await page.waitForSelector('div[role="main"]');
    
    // Get the page content
    const content = await page.content();
    console.log('Page content retrieved, parsing results...');
    
    // Close the browser
    await browser.close();
    
    // Parse the HTML with cheerio
    const $ = cheerio.load(content);
    const articles = [];
    
    // Extract news articles
    $('div.SoaBEf').each((i, el) => {
      if (i >= 10) return false; // Limit to 10 articles
      
      const titleElement = $(el).find('div.n0jPhd');
      const title = titleElement.text().trim();
      
      const linkElement = $(el).find('a');
      const url = linkElement.attr('href');
      
      const sourceElement = $(el).find('div.CEMjEf span');
      const source = sourceElement.first().text().trim();
      
      const timeElement = $(el).find('div.OSrXXb span');
      const publishedTime = timeElement.text().trim();
      
      const snippetElement = $(el).find('div.GI74Re');
      const description = snippetElement.text().trim();
      
      // Create a structure similar to NewsAPI for compatibility
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('/url?q=') ? decodeURIComponent(url.substring(7).split('&')[0]) : url,
          source: { name: source || 'Unknown Source' },
          publishedAt: publishedTime ? new Date().toISOString() : new Date().toISOString(), // Approximate date
          description,
          content: description,
          urlToImage: null // We don't extract images in this basic version
        });
      }
    });
    
    console.log(`Scraped ${articles.length} articles about Trump`);
    return articles;
  } catch (error) {
    console.error('Error scraping news:', error);
    return [];
  }
}

// Function to summarize news using Claude
async function summarizeWithClaude(articles) {
  console.log('summarizeWithClaude called with', articles.length, 'articles');
  if (!articles.length) {
    console.log('No articles to summarize, returning empty array');
    return [];
  }
  
  // For debugging, let's print the first article's structure
  if (articles.length > 0) {
    console.log('First article structure:', JSON.stringify(articles[0]).substring(0, 300) + '...');
  }
  
  // Prepare content for Claude
  const articlesText = articles.slice(0, 5).map((article, index) => 
    `Article ${index + 1}: "${article.title}"
    Source: ${article.source.name}
    URL: ${article.url}
    Content: ${article.description || 'No description available'}`
  ).join('\n\n');
  
  const prompt = `Here are some recent news articles about President Trump that were scraped from Google News:
  
${articlesText}

Please provide a concise summary of each article (2-3 sentences per article). 
For each article, identify the main topic, key points, and any notable quotes or claims.
Format your response as a JSON array with objects containing: 
{
  "articleIndex": number,
  "title": string,
  "source": string,
  "summary": string,
  "sentiment": string (one of: "positive", "negative", "neutral")
}`;

  try {
    console.log('Calling Anthropic API with prompt...');
    console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    
    // Parse the JSON from Claude's response
    const content = response.content[0].text;
    // Extract JSON array from response (Claude might include markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if Claude doesn't return proper JSON
    console.log('Failed to parse JSON from Claude response');
    return [{ 
      articleIndex: 0, 
      title: "Summary Error", 
      source: "System", 
      summary: "Failed to parse Claude's response as JSON. Please try again.", 
      sentiment: "neutral" 
    }];
  } catch (error) {
    console.error('Error summarizing with Claude:', error);
    console.log('Claude API error details:', error.stack || error.message);
    return [{ 
      articleIndex: 0, 
      title: "API Error", 
      source: "System", 
      summary: `Error communicating with Claude: ${error.message}`, 
      sentiment: "neutral" 
    }];
  }
}

export async function GET() {
  console.log('API route GET handler called');
  try {
    // Fetch news articles
    console.log('Calling fetchTrumpNews()...');
    const articles = await fetchTrumpNews();
    console.log('Articles returned:', articles.length);
    
    if (!articles.length) {
      console.log('No articles found, returning error response');
      return Response.json({ 
        success: false, 
        message: "No articles found",
        articles: [],
        summaries: []
      });
    }
    
    // Get summaries from Claude
    console.log('Calling summarizeWithClaude with', articles.length, 'articles');
    const summaries = await summarizeWithClaude(articles);
    console.log('Summaries returned:', summaries.length);
    
    // Return both articles and summaries
    console.log('Returning successful response with articles and summaries');
    return Response.json({ 
      success: true, 
      articles: articles.slice(0, 5), // Limit to first 5 articles
      summaries 
    });
  } catch (error) {
    console.error('API route error:', error);
    console.log('Error details:', error.stack || error.message);
    return Response.json({ 
      success: false, 
      message: error.message,
      articles: [],
      summaries: []
    }, { status: 500 });
  }
}
