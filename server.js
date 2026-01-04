// Express server for Render deployment - Based on STOCKAPP template
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static('.'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Valyxis Stock API is running!', endpoints: ['/stock/:ticker', '/search?q=companyname', '/api/stock?symbol=...', '/api/quoteSummary?symbol=...'] });
});

// Get stock data by ticker (STOCKAPP template endpoint)
app.get('/stock/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const tickerUpper = ticker.toUpperCase();
    
    console.log(`📊 Fetching COMPLETE data for: ${tickerUpper}`);
    
    // Fetch comprehensive quote data
    const quote = await yahooFinance.quote(tickerUpper);
    
    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Fetch quoteSummary for additional financial metrics
    let quoteSummary = null;
    try {
      quoteSummary = await yahooFinance.quoteSummary(tickerUpper, {
        modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics', 'summaryDetail']
      });
    } catch (summaryError) {
      console.log('QuoteSummary not available, using quote data only');
    }
    
    // Fetch historical data for chart (last year for better data)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const historical = await yahooFinance.historical(tickerUpper, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    // Extract chart data (closing prices)
    const chartData = historical.map(day => day.close).filter(Boolean);
    
    // Calculate percentage changes
    const currentPrice = quote.regularMarketPrice || quote.price || 0;
    const oneDayAgo = historical[historical.length - 2]?.close || currentPrice;
    const oneWeekAgo = historical[Math.max(0, historical.length - 8)]?.close || currentPrice;
    const oneMonthAgo = historical[Math.max(0, historical.length - 30)]?.close || currentPrice;
    
    const change1D = oneDayAgo ? ((currentPrice - oneDayAgo) / oneDayAgo) * 100 : 0;
    const change1W = oneWeekAgo ? ((currentPrice - oneWeekAgo) / oneWeekAgo) * 100 : 0;
    const change1M = oneMonthAgo ? ((currentPrice - oneMonthAgo) / oneMonthAgo) * 100 : 0;
    
    // Get comprehensive data from quoteSummary if available
    const financialData = quoteSummary?.financialData || {};
    const defaultKeyStats = quoteSummary?.defaultKeyStatistics || {};
    const summaryProfile = quoteSummary?.summaryProfile || {};
    const summaryDetail = quoteSummary?.summaryDetail || {};
    
    // Get financial metrics (prioritize quoteSummary, fallback to quote)
    const pe = financialData.trailingPE || defaultKeyStats.trailingPE || quote.trailingPE || quote.peRatio || null;
    const peg = financialData.pegRatio || defaultKeyStats.pegRatio || quote.pegRatio || null;
    const eps = financialData.trailingEps || defaultKeyStats.trailingEps || quote.trailingEps || quote.eps || null;
    const dividendYield = summaryDetail.dividendYield || financialData.dividendYield || defaultKeyStats.dividendYield || quote.dividendYield || 0;
    const high52W = quote.fiftyTwoWeekHigh || defaultKeyStats.fiftyTwoWeekHigh || Math.max(...chartData) || currentPrice;
    
    const delta52W = high52W ? (((currentPrice - high52W) / high52W) * 100) : 0;
    
    // Get sector and industry
    const sector = summaryProfile.sector || quote.sector || 'N/A';
    
    console.log(`✅ Successfully fetched data for ${tickerUpper}`);
    console.log(`   P/E: ${pe}, PEG: ${peg}, EPS: ${eps}`);
    console.log(`   Sector: ${sector}`);
    
    // Build comprehensive response
    const response = {
      symbol: quote.symbol,
      ticker: quote.symbol,
      companyName: quote.longName || quote.shortName || tickerUpper,
      sector: sector,
      price: currentPrice,
      regularMarketPrice: currentPrice,
      change1D: parseFloat(change1D.toFixed(2)),
      regularMarketChangePercent: parseFloat(change1D.toFixed(2)),
      change1W: parseFloat(change1W.toFixed(2)),
      change1M: parseFloat(change1M.toFixed(2)),
      peRatio: pe,
      trailingPE: pe,
      pegRatio: peg,
      eps: eps,
      trailingEps: eps,
      dividendYield: dividendYield ? parseFloat((dividendYield * 100).toFixed(2)) : 0,
      dividendRate: dividendYield ? parseFloat((dividendYield * 100).toFixed(2)) : 0,
      fiftyTwoWeekHigh: high52W,
      high52Week: high52W,
      delta52W: parseFloat(delta52W.toFixed(2)),
      chartData: chartData.length > 0 ? chartData : [currentPrice]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(404).json({ 
      error: 'Stock not found',
      message: error.message 
    });
  }
});

// Search company by name
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    console.log(`Searching for: ${q}`);
    
    // Use Yahoo Finance search
    const searchResults = await yahooFinance.search(q);
    
    if (searchResults.quotes && searchResults.quotes.length > 0) {
      const firstResult = searchResults.quotes[0];
      res.json({
        ticker: firstResult.symbol,
        symbol: firstResult.symbol,
        name: firstResult.longname || firstResult.shortname || q
      });
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// API endpoints for valyxis frontend compatibility
app.get('/api/stock', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }
    
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    const historical = await yahooFinance.historical(symbol.toUpperCase(), {
      period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: '1d'
    });
    
    const result = {
      chart: {
        result: [{
          meta: {
            regularMarketPrice: quote.regularMarketPrice || quote.price,
            previousClose: historical[historical.length - 2]?.close || quote.regularMarketPrice,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            longName: quote.longName,
            shortName: quote.shortName
          },
          timestamp: historical.map(d => Math.floor(new Date(d.date).getTime() / 1000)),
          indicators: {
            quote: [{
              close: historical.map(d => d.close)
            }]
          }
        }]
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/quoteSummary', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }
    
    const quoteSummary = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
      modules: ['summaryProfile', 'defaultKeyStatistics', 'financialData', 'assetProfile', 'summaryDetail']
    });
    
    res.json({ quoteSummary: { result: [quoteSummary] } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Valyxis Stock API server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET /stock/:ticker`);
  console.log(`   GET /search?q=companyname`);
  console.log(`   GET /api/stock?symbol=...`);
  console.log(`   GET /api/quoteSummary?symbol=...`);
});
