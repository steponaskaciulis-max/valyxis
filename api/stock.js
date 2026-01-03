// Vercel serverless function to proxy stock data
// This avoids CORS issues completely

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol required' });
    }

    try {
        // Fetch from Yahoo Finance
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo&includePrePost=false`;
        const response = await fetch(yahooUrl);
        
        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
}

