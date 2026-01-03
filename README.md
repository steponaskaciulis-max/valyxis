# Valyxis - Professional Stock Watch

A modern, professional stock market tracking application with real-time data, interactive charts, and comprehensive watchlist management.

## Features

- **Real-Time Stock Data**: Live stock prices and market data from Alpha Vantage API
- **Interactive Charts**: Beautiful, interactive charts with multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- **Watchlist Management**: Create, edit, and delete multiple watchlists
- **Comprehensive Metrics**: 
  - Ticker & Company Name
  - Sector
  - Current Price
  - 1 Day, 1 Week, 1 Month Changes
  - P/E Ratio
  - PEG Ratio
  - EPS
  - Dividend Yield
  - 52 Week High
  - Delta from 52W High
- **Auto-Refresh**: Automatic stock data updates every 30 seconds
- **Spark Charts**: Mini charts for quick visual reference
- **Dark Theme**: Modern, professional dark UI
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```

### API Keys

The app uses Alpha Vantage API for stock data. For production use, you should:

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Update the `apiKey` variable in `app.js` (line ~280)

Note: The demo API key has rate limits. For production, use your own API key.

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel for automatic deployments.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js for interactive charts
- Alpha Vantage API for stock data
- LocalStorage for data persistence

## License

MIT License

