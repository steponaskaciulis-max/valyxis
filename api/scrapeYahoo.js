// Vercel serverless function to scrape Yahoo Finance quote page
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
        // Scrape Yahoo Finance quote page
        const url = `https://finance.yahoo.com/quote/${symbol}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Extract data from the page
        // Yahoo Finance embeds data in multiple ways
        const data = {};
        
        // Method 1: Try to find the JSON data embedded in root.App.main
        let jsonMatch = html.match(/root\.App\.main\s*=\s*({.+?});/s);
        if (!jsonMatch) {
            // Try alternative pattern
            jsonMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/s);
        }
        if (!jsonMatch) {
            // Try another pattern
            jsonMatch = html.match(/__PRELOADED_STATE__\s*=\s*({.+?});/s);
        }
        
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[1]);
                
                // Try multiple paths to find the data
                let result = null;
                
                // Path 1: context.dispatcher.stores.QuoteSummaryStore
                if (jsonData?.context?.dispatcher?.stores?.QuoteSummaryStore?.quoteSummary?.result?.[0]) {
                    result = jsonData.context.dispatcher.stores.QuoteSummaryStore.quoteSummary.result[0];
                }
                // Path 2: quoteSummary.result[0]
                else if (jsonData?.quoteSummary?.result?.[0]) {
                    result = jsonData.quoteSummary.result[0];
                }
                // Path 3: result[0]
                else if (jsonData?.result?.[0]) {
                    result = jsonData.result[0];
                }
                
                if (result) {
                    // Extract all the data we need
                    data.sector = result.summaryProfile?.sector || 
                                 result.assetProfile?.sector || 
                                 null;
                    
                    data.peRatio = result.defaultKeyStatistics?.trailingPE || 
                                  result.defaultKeyStatistics?.forwardPE || 
                                  null;
                    
                    data.pegRatio = result.defaultKeyStatistics?.pegRatio || null;
                    
                    data.eps = result.defaultKeyStatistics?.trailingEps || 
                             result.defaultKeyStatistics?.forwardEps || 
                             null;
                    
                    if (result.summaryDetail?.dividendYield !== null && result.summaryDetail?.dividendYield !== undefined) {
                        data.dividendYield = result.summaryDetail.dividendYield * 100;
                    } else if (result.summaryDetail?.dividendRate) {
                        const price = result.price?.regularMarketPrice?.raw || 
                                     result.price?.regularMarketPrice ||
                                     result.regularMarketPrice;
                        if (price && price > 0) {
                            data.dividendYield = (result.summaryDetail.dividendRate / price) * 100;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing embedded JSON:', e);
            }
        }
        
        // Method 2: Try to extract from HTML patterns as fallback
        if (!data.sector) {
            const sectorMatch = html.match(/Sector[^>]*>([^<]+)</i) || 
                               html.match(/<td[^>]*>Sector<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
            if (sectorMatch) {
                data.sector = sectorMatch[1].trim();
            }
        }
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error scraping Yahoo Finance:', error);
        return res.status(500).json({ error: 'Failed to scrape data' });
    }
}

