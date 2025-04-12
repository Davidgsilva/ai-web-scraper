# Trump AI News

A Next.js application that scrapes Google News for stories about President Trump, displays them, and uses Claude AI to provide summaries and sentiment analysis of each article.

## Features

- Scrapes Google News for the latest articles about President Trump
- Uses Puppeteer and Cheerio for web scraping
- Uses Claude AI (Anthropic) to generate concise summaries of each article
- Provides sentiment analysis (positive, negative, neutral) for each article
- Modern, responsive UI built with Next.js and TailwindCSS

## Prerequisites

You'll need the following API key:

1. **Anthropic API Key** - For Claude AI integration
   - Sign up at [https://console.anthropic.com/](https://console.anthropic.com/)

## Environment Setup

Create a `.env` file in the root directory with the following variable:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

1. Click the "Search Google News" button to scrape the most recent articles about President Trump
2. The application uses Puppeteer to scrape Google News search results
3. The scraped articles are sent to Claude AI for summarization and sentiment analysis
4. Results are displayed in a clean, card-based interface with original article links

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Puppeteer](https://pptr.dev/) - Headless browser for web scraping
- [Cheerio](https://cheerio.js.org/) - HTML parsing and manipulation
- [Anthropic Claude API](https://docs.anthropic.com/) - AI summarization
- [TailwindCSS](https://tailwindcss.com/) - Styling

## Customization

You can modify the news search query in `src/app/api/news/route.js` by changing the `searchQuery` variable. You can also adjust the Claude prompt to customize the summarization style or to search for different topics.
