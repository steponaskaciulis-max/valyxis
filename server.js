// Simple Express server for Render deployment
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Scrape Yahoo Finance endpoint
app.get('/api/scrapeYahoo', async (req, res) => {
    const { symbol } = req.query;
    
    if (!symbol) {
        return res.status(400).json({ error: 'Symbol required' });
    }

    try {
        // Try direct API first
        const apiUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,defaultKeyStatistics,financialData,assetProfile,summaryDetail`;
        
        try {
            const apiResponse = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (apiData && apiData.quoteSummary && apiData.quoteSummary.result && apiData.quoteSummary.result[0]) {
                    const result = apiData.quoteSummary.result[0];
                    const stats = result.defaultKeyStatistics || {};
                    const detail = result.summaryDetail || {};
                    
                    return res.json({
                        sector: result.summaryProfile?.sector || result.assetProfile?.sector || null,
                        peRatio: stats.trailingPE || stats.forwardPE || null,
                        pegRatio: stats.pegRatio || null,
                        eps: stats.trailingEps || stats.forwardEps || null,
                        dividendYield: detail.dividendYield ? detail.dividendYield * 100 : null
                    });
                }
            }
        } catch (apiError) {
            console.log('Direct API failed, trying scraping');
        }
        
        // Fallback: Scrape the page
        const url = `https://finance.yahoo.com/quote/${symbol}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const data = {};
        
        // Extract JSON data
        let jsonMatch = html.match(/root\.App\.main\s*=\s*({.+?});/s);
        if (!jsonMatch) {
            jsonMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/s);
        }
        
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[1]);
                let result = null;
                
                if (jsonData?.context?.dispatcher?.stores?.QuoteSummaryStore?.quoteSummary?.result?.[0]) {
                    result = jsonData.context.dispatcher.stores.QuoteSummaryStore.quoteSummary.result[0];
                } else if (jsonData?.quoteSummary?.result?.[0]) {
                    result = jsonData.quoteSummary.result[0];
                }
                
                if (result) {
                    const stats = result.defaultKeyStatistics || {};
                    const detail = result.summaryDetail || {};
                    
                    data.sector = result.summaryProfile?.sector || result.assetProfile?.sector || null;
                    data.peRatio = stats.trailingPE || stats.forwardPE || null;
                    data.pegRatio = stats.pegRatio || null;
                    data.eps = stats.trailingEps || stats.forwardEps || null;
                    data.dividendYield = detail.dividendYield ? detail.dividendYield * 100 : null;
                }
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        }
        
        return res.json(data);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Stock chart endpoint
app.get('/api/stock', async (req, res) => {
    const { symbol } = req.query;
    
    if (!symbol) {
        return res.status(400).json({ error: 'Symbol required' });
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo&includePrePost=false`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Quote summary endpoint
app.get('/api/quoteSummary', async (req, res) => {
    const { symbol } = req.query;
    
    if (!symbol) {
        return res.status(400).json({ error: 'Symbol required' });
    }

    try {
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,defaultKeyStatistics,financialData,assetProfile,summaryDetail`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

