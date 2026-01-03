// State Management
let watchlists = JSON.parse(localStorage.getItem('valyxis_watchlists')) || [];
let currentWatchlistId = null;
let currentStockSymbol = null;
let autoRefreshInterval = null;
let stockDataCache = {};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupWatchlists();
    setupModals();
    setupEventListeners();
    loadWatchlists();
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Handle hash navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash === 'home' || hash === '') {
            navigateToPage('home');
        } else if (hash === 'watchlists') {
            navigateToPage('watchlists');
        }
    });

    // Initial page load
    const hash = window.location.hash.substring(1);
    if (hash === 'watchlists') {
        navigateToPage('watchlists');
    } else {
        navigateToPage('home');
    }
}

function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    // Update URL
    if (page === 'home') {
        window.history.pushState(null, '', '#home');
    } else if (page === 'watchlists') {
        window.history.pushState(null, '', '#watchlists');
    }
}

// Watchlists Management
function setupWatchlists() {
    const createBtn = document.getElementById('create-watchlist-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            document.getElementById('create-watchlist-modal').classList.add('active');
            document.getElementById('new-watchlist-name').value = '';
            document.getElementById('new-watchlist-name').focus();
        });
    }

    const confirmCreateBtn = document.getElementById('confirm-create-watchlist');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', () => {
            const name = document.getElementById('new-watchlist-name').value.trim();
            if (name) {
                createWatchlist(name);
                document.getElementById('create-watchlist-modal').classList.remove('active');
            }
        });
    }

    const backBtn = document.getElementById('back-to-watchlists');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            stopAutoRefresh();
            navigateToPage('watchlists');
        });
    }

    const editNameBtn = document.getElementById('edit-watchlist-name');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            const watchlist = watchlists.find(w => w.id === currentWatchlistId);
            if (watchlist) {
                document.getElementById('edit-watchlist-name-input').value = watchlist.name;
                document.getElementById('edit-watchlist-modal').classList.add('active');
            }
        });
    }

    const confirmEditBtn = document.getElementById('confirm-edit-watchlist');
    if (confirmEditBtn) {
        confirmEditBtn.addEventListener('click', () => {
            const name = document.getElementById('edit-watchlist-name-input').value.trim();
            if (name) {
                editWatchlistName(currentWatchlistId, name);
                document.getElementById('edit-watchlist-modal').classList.remove('active');
            }
        });
    }

    const deleteBtn = document.getElementById('delete-watchlist');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this watchlist?')) {
                deleteWatchlist(currentWatchlistId);
                navigateToPage('watchlists');
            }
        });
    }
}

function createWatchlist(name) {
    const newWatchlist = {
        id: Date.now().toString(),
        name: name,
        stocks: []
    };
    watchlists.push(newWatchlist);
    saveWatchlists();
    loadWatchlists();
}

function editWatchlistName(id, name) {
    const watchlist = watchlists.find(w => w.id === id);
    if (watchlist) {
        watchlist.name = name;
        saveWatchlists();
        loadWatchlists();
        if (currentWatchlistId === id) {
            document.getElementById('watchlist-title').textContent = name;
        }
    }
}

function deleteWatchlist(id) {
    watchlists = watchlists.filter(w => w.id !== id);
    saveWatchlists();
    loadWatchlists();
}

function loadWatchlists() {
    const container = document.getElementById('watchlists-container');
    if (!container) return;

    if (watchlists.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📊</div>
                <h3>No Watchlists Yet</h3>
                <p>Create your first watchlist to start tracking stocks</p>
            </div>
        `;
        return;
    }

    container.innerHTML = watchlists.map(watchlist => `
        <div class="watchlist-card" data-id="${watchlist.id}">
            <div class="watchlist-card-header">
                <div>
                    <h3>${escapeHtml(watchlist.name)}</h3>
                    <div class="watchlist-stock-count">${watchlist.stocks.length} stock${watchlist.stocks.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="watchlist-card-actions">
                    <button class="btn btn-icon" onclick="event.stopPropagation(); editWatchlistName('${watchlist.id}', prompt('Enter new name:', '${escapeHtml(watchlist.name)}'))" title="Edit">✏️</button>
                    <button class="btn btn-icon btn-danger" onclick="event.stopPropagation(); if(confirm('Delete this watchlist?')) { deleteWatchlist('${watchlist.id}'); }" title="Delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.watchlist-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.watchlist-card-actions')) {
                const id = card.getAttribute('data-id');
                openWatchlist(id);
            }
        });
    });
}

function openWatchlist(id) {
    currentWatchlistId = id;
    const watchlist = watchlists.find(w => w.id === id);
    if (!watchlist) return;

    document.getElementById('watchlist-title').textContent = watchlist.name;
    document.getElementById('stocks-container').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Show watchlist detail page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('watchlist-detail-page').classList.add('active');

    // Load stocks
    loadWatchlistStocks(watchlist.stocks);
}

function loadWatchlistStocks(stocks) {
    const container = document.getElementById('stocks-container');
    if (stocks.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📈</div>
                <h3>No Stocks Yet</h3>
                <p>Add stocks to this watchlist to start tracking</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Fetch all stock data in parallel
    Promise.all(stocks.map(symbol => fetchStockData(symbol)))
        .then(results => {
            displayStocks(results.filter(r => r !== null));
        })
        .catch(error => {
            console.error('Error loading stocks:', error);
            container.innerHTML = '<div class="empty-state"><p>Error loading stocks. Please try again.</p></div>';
        });
}

function displayStocks(stocksData) {
    const container = document.getElementById('stocks-container');
    if (stocksData.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📈</div>
                <h3>No Stocks Available</h3>
                <p>Unable to load stock data</p>
            </div>
        `;
        return;
    }

    container.innerHTML = stocksData.map(stock => {
        const change1D = stock.change1D || 0;
        const changeClass = change1D >= 0 ? 'positive' : 'negative';
        const changeSign = change1D >= 0 ? '+' : '';

        return `
            <div class="stock-card" data-symbol="${stock.symbol}">
                <div class="stock-card-header">
                    <div>
                        <div class="stock-ticker">${stock.symbol}</div>
                        <div class="stock-company">${stock.companyName || 'N/A'}</div>
                    </div>
                    <div>
                        <div class="stock-price">$${formatNumber(stock.price)}</div>
                        <div class="stock-change ${changeClass}">${changeSign}${formatNumber(change1D)}%</div>
                    </div>
                </div>
                <div class="stock-metrics">
                    <div class="metric-item">
                        <span class="metric-label">Sector</span>
                        <span class="metric-value">${stock.sector || 'N/A'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">1W%</span>
                        <span class="metric-value ${(stock.change1W || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber(stock.change1W || 0)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">1M%</span>
                        <span class="metric-value ${(stock.change1M || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber(stock.change1M || 0)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">P/E</span>
                        <span class="metric-value">${formatNumber(stock.peRatio) || 'N/A'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">52W High</span>
                        <span class="metric-value">$${formatNumber(stock.high52Week)}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Δ from 52W</span>
                        <span class="metric-value ${((stock.price / stock.high52Week - 1) * 100 || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber((stock.price / stock.high52Week - 1) * 100 || 0)}%</span>
                    </div>
                </div>
                <div class="stock-spark-container" data-symbol="${stock.symbol}">
                    <canvas id="spark-${stock.symbol}"></canvas>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners for stock cards
    container.querySelectorAll('.stock-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.stock-spark-container')) {
                const symbol = card.getAttribute('data-symbol');
                openStockDetail(symbol);
            }
        });
    });

    // Render spark charts
    stocksData.forEach(stock => {
        if (stock.historicalData && stock.historicalData.length > 0) {
            renderSparkChart(stock.symbol, stock.historicalData);
        }
    });

    // Add click listeners for spark charts
    container.querySelectorAll('.stock-spark-container').forEach(container => {
        container.addEventListener('click', (e) => {
            const symbol = container.getAttribute('data-symbol');
            openStockDetail(symbol);
        });
    });
}

// Stock Management
function setupEventListeners() {
    const addStockBtn = document.getElementById('add-stock-btn');
    const stockInput = document.getElementById('stock-input');

    if (addStockBtn) {
        addStockBtn.addEventListener('click', addStockToWatchlist);
    }

    if (stockInput) {
        stockInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addStockToWatchlist();
            }
        });
    }

    const refreshBtn = document.getElementById('refresh-stocks-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshStocks);
    }

    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }

    const backToWatchlistBtn = document.getElementById('back-to-watchlist');
    if (backToWatchlistBtn) {
        backToWatchlistBtn.addEventListener('click', () => {
            if (currentWatchlistId) {
                openWatchlist(currentWatchlistId);
            } else {
                navigateToPage('watchlists');
            }
        });
    }

    const removeStockBtn = document.getElementById('remove-stock-btn');
    if (removeStockBtn) {
        removeStockBtn.addEventListener('click', () => {
            if (currentStockSymbol && currentWatchlistId) {
                removeStockFromWatchlist(currentWatchlistId, currentStockSymbol);
                if (currentWatchlistId) {
                    openWatchlist(currentWatchlistId);
                } else {
                    navigateToPage('watchlists');
                }
            }
        });
    }
}

async function addStockToWatchlist() {
    const input = document.getElementById('stock-input');
    const symbolOrName = input.value.trim().toUpperCase();
    
    if (!symbolOrName) return;
    if (!currentWatchlistId) return;

    const watchlist = watchlists.find(w => w.id === currentWatchlistId);
    if (!watchlist) return;

    // Check if stock already exists
    if (watchlist.stocks.includes(symbolOrName)) {
        alert('Stock already in watchlist');
        return;
    }

    // Try to fetch stock data to validate
    input.disabled = true;
    const addBtn = document.getElementById('add-stock-btn');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    try {
        const stockData = await fetchStockData(symbolOrName);
        if (stockData && stockData.symbol) {
            watchlist.stocks.push(stockData.symbol);
            saveWatchlists();
            input.value = '';
            loadWatchlistStocks(watchlist.stocks);
        } else {
            alert('Stock not found. Please check the ticker symbol.');
        }
    } catch (error) {
        console.error('Error adding stock:', error);
        alert('Error adding stock. Please try again.');
    } finally {
        input.disabled = false;
        addBtn.disabled = false;
        addBtn.textContent = 'Add Stock';
    }
}

function removeStockFromWatchlist(watchlistId, symbol) {
    const watchlist = watchlists.find(w => w.id === watchlistId);
    if (watchlist) {
        watchlist.stocks = watchlist.stocks.filter(s => s !== symbol);
        saveWatchlists();
    }
}

function refreshStocks() {
    if (!currentWatchlistId) return;
    const watchlist = watchlists.find(w => w.id === currentWatchlistId);
    if (watchlist) {
        loadWatchlistStocks(watchlist.stocks);
    }
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    autoRefreshInterval = setInterval(() => {
        refreshStocks();
    }, 30000); // Refresh every 30 seconds
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Stock Data Fetching
async function fetchStockData(symbol) {
    // Check cache first (5 minute cache)
    const cacheKey = symbol;
    const cached = stockDataCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < 300000) {
        return cached.data;
    }

    try {
        // Use Alpha Vantage API (free tier)
        // Note: In production, you'd want to use your own API key
        // Get a free API key from: https://www.alphavantage.co/support/#api-key
        const apiKey = 'demo'; // Replace with your API key for better rate limits
        const baseUrl = 'https://www.alphavantage.co/query';

        // Fetch multiple data points in parallel
        const [quoteData, overviewData, timeSeriesData] = await Promise.all([
            fetch(`${baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`).then(r => r.json()),
            fetch(`${baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`).then(r => r.json()),
            fetch(`${baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`).then(r => r.json())
        ]);

        // Parse quote data
        const quote = quoteData['Global Quote'] || {};
        const price = parseFloat(quote['05. price']) || 0;
        const change = parseFloat(quote['09. change']) || 0;
        const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

        // Parse overview data
        const sector = overviewData.Sector || 'N/A';
        const companyName = overviewData.Name || symbol;
        const peRatio = parseFloat(overviewData.PERatio) || null;
        const pegRatio = parseFloat(overviewData.PEGRatio) || null;
        const eps = parseFloat(overviewData.EPS) || null;
        const dividendYield = parseFloat(overviewData.DividendYield) || null;
        const high52Week = parseFloat(overviewData['52WeekHigh']) || price;

        // Parse time series data
        let historicalData = [];
        let change1W = 0;
        let change1M = 0;

        if (timeSeriesData['Time Series (Daily)']) {
            const timeSeries = timeSeriesData['Time Series (Daily)'];
            const dates = Object.keys(timeSeries).sort();
            
            // Get data points for spark chart (last 30 days)
            historicalData = dates.slice(-30).map(date => ({
                date: date,
                close: parseFloat(timeSeries[date]['4. close'])
            }));

            // Calculate 1W and 1M changes
            if (dates.length >= 5) {
                const weekAgoPrice = parseFloat(timeSeries[dates[dates.length - 5]]['4. close']);
                change1W = ((price - weekAgoPrice) / weekAgoPrice) * 100;
            }
            if (dates.length >= 20) {
                const monthAgoPrice = parseFloat(timeSeries[dates[dates.length - 20]]['4. close']);
                change1M = ((price - monthAgoPrice) / monthAgoPrice) * 100;
            }
        }

        const stockData = {
            symbol: symbol,
            companyName: companyName,
            price: price,
            change1D: changePercent,
            change1W: change1W,
            change1M: change1M,
            sector: sector,
            peRatio: peRatio,
            pegRatio: pegRatio,
            eps: eps,
            dividendYield: dividendYield ? dividendYield * 100 : null,
            high52Week: high52Week,
            historicalData: historicalData
        };

        // Cache the data
        stockDataCache[cacheKey] = {
            data: stockData,
            timestamp: Date.now()
        };

        return stockData;
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        // Fallback: try Yahoo Finance API via proxy
        return await fetchStockDataYahoo(symbol);
    }
}

// Fallback to Yahoo Finance API
async function fetchStockDataYahoo(symbol) {
    try {
        // Using a CORS proxy for Yahoo Finance
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
        const data = await response.json();

        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            const price = meta.regularMarketPrice || meta.previousClose || 0;
            const change = meta.regularMarketPrice - meta.previousClose || 0;
            const changePercent = (change / meta.previousClose) * 100 || 0;

            // Build historical data
            const historicalData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (closes[i] !== null) {
                    historicalData.push({
                        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                        close: closes[i]
                    });
                }
            }

            // Calculate 1W and 1M changes
            let change1W = 0;
            let change1M = 0;
            if (historicalData.length >= 5) {
                const weekAgoPrice = historicalData[historicalData.length - 5].close;
                change1W = ((price - weekAgoPrice) / weekAgoPrice) * 100;
            }
            if (historicalData.length >= 20) {
                const monthAgoPrice = historicalData[historicalData.length - 20].close;
                change1M = ((price - monthAgoPrice) / monthAgoPrice) * 100;
            }

            return {
                symbol: symbol,
                companyName: meta.longName || symbol,
                price: price,
                change1D: changePercent,
                change1W: change1W,
                change1M: change1M,
                sector: 'N/A',
                peRatio: null,
                pegRatio: null,
                eps: null,
                dividendYield: null,
                high52Week: meta.fiftyTwoWeekHigh || price,
                historicalData: historicalData.slice(-30)
            };
        }
    } catch (error) {
        console.error(`Error fetching Yahoo data for ${symbol}:`, error);
    }
    return null;
}

// Stock Detail Page
async function openStockDetail(symbol) {
    currentStockSymbol = symbol;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('stock-detail-page').classList.add('active');

    const container = document.getElementById('stock-detail-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const stockData = await fetchStockData(symbol);
        if (stockData) {
            displayStockDetail(stockData);
        } else {
            container.innerHTML = '<div class="empty-state"><p>Unable to load stock data</p></div>';
        }
    } catch (error) {
        console.error('Error loading stock detail:', error);
        container.innerHTML = '<div class="empty-state"><p>Error loading stock data</p></div>';
    }
}

async function displayStockDetail(stock) {
    const container = document.getElementById('stock-detail-container');
    
    // Fetch extended historical data for detailed chart
    const extendedData = await fetchExtendedHistoricalData(stock.symbol);
    const historicalData = extendedData || stock.historicalData || [];

    const change1D = stock.change1D || 0;
    const changeClass = change1D >= 0 ? 'positive' : 'negative';
    const changeSign = change1D >= 0 ? '+' : '';

    container.innerHTML = `
        <div class="stock-detail-header">
            <div class="stock-detail-title">
                <div>
                    <h2>${stock.symbol}</h2>
                    <div class="stock-detail-company">${stock.companyName || 'N/A'}</div>
                </div>
                <div class="stock-detail-price-section">
                    <div class="stock-detail-price">$${formatNumber(stock.price)}</div>
                    <div class="stock-change ${changeClass}" style="font-size: 1.2rem;">${changeSign}${formatNumber(change1D)}%</div>
                </div>
            </div>
            <div class="stock-detail-metrics-grid">
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">Sector</div>
                    <div class="stock-detail-metric-value">${stock.sector || 'N/A'}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">1 Day Change</div>
                    <div class="stock-detail-metric-value ${changeClass}">${changeSign}${formatNumber(change1D)}%</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">1 Week Change</div>
                    <div class="stock-detail-metric-value ${(stock.change1W || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber(stock.change1W || 0)}%</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">1 Month Change</div>
                    <div class="stock-detail-metric-value ${(stock.change1M || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber(stock.change1M || 0)}%</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">P/E Ratio</div>
                    <div class="stock-detail-metric-value">${formatNumber(stock.peRatio) || 'N/A'}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">PEG Ratio</div>
                    <div class="stock-detail-metric-value">${formatNumber(stock.pegRatio) || 'N/A'}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">EPS</div>
                    <div class="stock-detail-metric-value">${formatNumber(stock.eps) || 'N/A'}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">Dividend Yield</div>
                    <div class="stock-detail-metric-value">${stock.dividendYield ? formatNumber(stock.dividendYield) + '%' : 'N/A'}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">52 Week High</div>
                    <div class="stock-detail-metric-value">$${formatNumber(stock.high52Week)}</div>
                </div>
                <div class="stock-detail-metric">
                    <div class="stock-detail-metric-label">Δ from 52W High</div>
                    <div class="stock-detail-metric-value ${((stock.price / stock.high52Week - 1) * 100 || 0) >= 0 ? 'positive' : 'negative'}">${formatNumber((stock.price / stock.high52Week - 1) * 100 || 0)}%</div>
                </div>
            </div>
        </div>
        <div class="stock-detail-chart-container">
            <div class="chart-controls">
                <button class="chart-timeframe-btn active" data-timeframe="1D">1D</button>
                <button class="chart-timeframe-btn" data-timeframe="1W">1W</button>
                <button class="chart-timeframe-btn" data-timeframe="1M">1M</button>
                <button class="chart-timeframe-btn" data-timeframe="3M">3M</button>
                <button class="chart-timeframe-btn" data-timeframe="6M">6M</button>
                <button class="chart-timeframe-btn" data-timeframe="1Y">1Y</button>
                <button class="chart-timeframe-btn" data-timeframe="ALL">ALL</button>
            </div>
            <div class="chart-container">
                <canvas id="stock-detail-chart"></canvas>
            </div>
        </div>
    `;

    // Setup chart timeframe buttons
    container.querySelectorAll('.chart-timeframe-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            container.querySelectorAll('.chart-timeframe-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const timeframe = btn.getAttribute('data-timeframe');
            const data = await fetchHistoricalDataForTimeframe(stock.symbol, timeframe);
            renderDetailChart(data, stock.symbol);
        });
    });

    // Render initial chart
    renderDetailChart(historicalData, stock.symbol);
}

async function fetchExtendedHistoricalData(symbol) {
    try {
        const apiKey = 'demo';
        const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`);
        const data = await response.json();
        
        if (data['Time Series (Daily)']) {
            const timeSeries = data['Time Series (Daily)'];
            const dates = Object.keys(timeSeries).sort();
            return dates.map(date => ({
                date: date,
                close: parseFloat(timeSeries[date]['4. close'])
            }));
        }
    } catch (error) {
        console.error('Error fetching extended data:', error);
    }
    return null;
}

async function fetchHistoricalDataForTimeframe(symbol, timeframe) {
    try {
        const apiKey = 'demo';
        let outputsize = 'compact';
        let interval = 'daily';
        
        if (timeframe === '1D') {
            interval = 'intraday';
            outputsize = 'compact';
        } else if (timeframe === '1W' || timeframe === '1M') {
            outputsize = 'compact';
        } else {
            outputsize = 'full';
        }

        const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_${interval === 'intraday' ? 'INTRADAY&interval=5min' : 'DAILY'}&symbol=${symbol}&apikey=${apiKey}&outputsize=${outputsize}`);
        const data = await response.json();
        
        if (data['Time Series (Daily)'] || data['Time Series (5min)']) {
            const timeSeries = data['Time Series (Daily)'] || data['Time Series (5min)'];
            const dates = Object.keys(timeSeries).sort();
            
            // Filter by timeframe
            let filteredDates = dates;
            const now = new Date();
            if (timeframe === '1W') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredDates = dates.filter(d => new Date(d) >= weekAgo);
            } else if (timeframe === '1M') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredDates = dates.filter(d => new Date(d) >= monthAgo);
            } else if (timeframe === '3M') {
                const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                filteredDates = dates.filter(d => new Date(d) >= threeMonthsAgo);
            } else if (timeframe === '6M') {
                const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                filteredDates = dates.filter(d => new Date(d) >= sixMonthsAgo);
            } else if (timeframe === '1Y') {
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                filteredDates = dates.filter(d => new Date(d) >= yearAgo);
            }
            
            return filteredDates.map(date => ({
                date: date,
                close: parseFloat(timeSeries[date][interval === 'intraday' ? '4. close' : '4. close'])
            }));
        }
    } catch (error) {
        console.error('Error fetching timeframe data:', error);
    }
    return [];
}

// Chart Rendering
function renderSparkChart(symbol, data) {
    const canvas = document.getElementById(`spark-${symbol}`);
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 80;
    canvas.width = width;
    canvas.height = height;

    const prices = data.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = prices[prices.length - 1] >= prices[0] ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((point.close - minPrice) / range) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();
}

let detailChart = null;

function renderDetailChart(data, symbol) {
    const canvas = document.getElementById('stock-detail-chart');
    if (!canvas || !data || data.length === 0) return;

    // Destroy existing chart
    if (detailChart) {
        detailChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const prices = data.map(d => d.close);
    const isPositive = prices[prices.length - 1] >= prices[0];

    detailChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: isPositive ? '#10b981' : '#ef4444',
                backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#2d3748',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Price: $${formatNumber(context.parsed.y)}`;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(45, 55, 72, 0.5)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(45, 55, 72, 0.5)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// Modals
function setupModals() {
    // Close modals on outside click or close button
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        const cancelBtn = modal.querySelector('.modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
    });
}

// Utility Functions
function saveWatchlists() {
    localStorage.setItem('valyxis_watchlists', JSON.stringify(watchlists));
}

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return num.toFixed(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

