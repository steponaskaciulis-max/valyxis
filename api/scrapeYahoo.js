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
        // Yahoo Finance embeds data in JSON-LD and script tags
        const data = {};
        
        // Try to find the JSON data embedded in the page
        const jsonMatch = html.match(/root\.App\.main\s*=\s*({.+?});/s);
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[1]);
                const context = jsonData?.context?.dispatcher?.stores;
                
                if (context?.QuoteSummaryStore?.quoteSummary?.result?.[0]) {
                    const result = context.QuoteSummaryStore.quoteSummary.result[0];
                    
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
                        const price = result.price?.regularMarketPrice?.raw || result.price?.regularMarketPrice;
                        if (price) {
                            data.dividendYield = (result.summaryDetail.dividendRate / price) * 100;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing embedded JSON:', e);
            }
        }
        
        // Fallback: Try to extract from meta tags and other patterns
        if (!data.sector) {
            const sectorMatch = html.match(/<span[^>]*>Sector<\/span>[^<]*<span[^>]*>([^<]+)<\/span>/i);
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

