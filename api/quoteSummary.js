// Vercel serverless function to proxy quote summary
export default async function handler(req, res) {
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
        // Get comprehensive data from Yahoo Finance
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,defaultKeyStatistics,financialData,assetProfile,summaryDetail`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching quote summary:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
}

