import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  Download,
  Eye,
  Layers3,
  Plus,
  RefreshCw,
  Sparkles,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import './styles.css';

const INITIAL_ASSETS = [
  { name: 'Tesla, Inc.', ticker: 'TSLA', price: 309.22, high: 498.83, dayChange: 1.84 },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', price: 196.51, high: 236.54, dayChange: 0.92 },
  { name: 'Invesco QQQ Trust', ticker: 'QQQ', price: 682.12, high: 748.65, dayChange: -0.38 },
  { name: 'iShares Russell 2000 ETF', ticker: 'IWM', price: 292.91, high: 302.72, dayChange: 0.46 },
  { name: 'SPDR S&P 500 ETF Trust', ticker: 'SPY', price: 739.09, high: 760.4, dayChange: 0.24 },
  { name: 'iShares MSCI World ETF', ticker: 'URTH', price: 201.26, high: 206.33, dayChange: -0.11 },
  { name: 'SPDR Dow Jones Industrial Average ETF', ticker: 'DIA', price: 521.26, high: 532.54, dayChange: 0.18 },
  { name: 'Apple Inc.', ticker: 'AAPL', price: 336.91, high: 339.57, dayChange: 0.72 },
];

const thresholds = [15, 20, 25];
const WATCHLIST_KEY = 'crash-monitor-watchlist';
const VIEW_KEY = 'crash-monitor-view-count';

function drawdown(price, high) {
  return ((price - high) / high) * 100;
}

function money(value) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function severity(dd) {
  const absolute = Math.abs(dd);
  if (absolute >= 25) return 'critical';
  if (absolute >= 20) return 'danger';
  if (absolute >= 15) return 'warning';
  if (absolute >= 8) return 'watch';
  return 'safe';
}

function loadAssets() {
  try {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  } catch {
    return INITIAL_ASSETS;
  }
}

function App() {
  const [assets, setAssets] = useState(loadAssets);
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [viewCount, setViewCount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', ticker: '', price: '', high: '' });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    const next = Number(localStorage.getItem(VIEW_KEY) || 0) + 1;
    localStorage.setItem(VIEW_KEY, String(next));
    setViewCount(next);
  }, []);

  const rows = useMemo(
    () => assets.map((asset) => ({ ...asset, dd: drawdown(asset.price, asset.high) })),
    [assets],
  );

  const selected = rows.find((asset) => asset.ticker === selectedTicker) ?? rows[0];
  const requiredDollar = selected ? selected.high - selected.price : 0;
  const requiredPercent = selected ? (requiredDollar / selected.price) * 100 : 0;

  const refresh = async () => {
    setIsRefreshing(true);
    setNotice('Refreshing demo prices…');
    await new Promise((resolve) => setTimeout(resolve, 650));
    setAssets((current) => current.map((asset) => {
      const previous = asset.price;
      const price = Number((previous * (1 + (Math.random() - 0.5) * 0.006)).toFixed(2));
      return {
        ...asset,
        price,
        high: Math.max(asset.high, price),
        dayChange: Number((((price - previous) / previous) * 100).toFixed(2)),
      };
    }));
    setLastUpdated(new Date());
    setIsRefreshing(false);
    setNotice('Demo prices refreshed. Live market data is not connected yet.');
  };

  const addAsset = (event) => {
    event.preventDefault();
    const ticker = form.ticker.trim().toUpperCase();
    const price = Number(form.price);
    const high = Number(form.high);

    if (!form.name.trim() || !ticker || !Number.isFinite(price) || !Number.isFinite(high) || price <= 0 || high <= 0) {
      setNotice('Enter a valid name, ticker, current price and all-time high.');
      return;
    }
    if (assets.some((asset) => asset.ticker === ticker)) {
      setNotice(`${ticker} is already in the watchlist.`);
      return;
    }
    if (high < price) {
      setNotice('All-time high cannot be below the current price.');
      return;
    }

    setAssets((current) => [...current, {
      name: form.name.trim(),
      ticker,
      price,
      high,
      dayChange: 0,
    }]);
    setSelectedTicker(ticker);
    setForm({ name: '', ticker: '', price: '', high: '' });
    setIsAdding(false);
    setNotice(`${ticker} added to your local watchlist.`);
  };

  const removeAsset = (ticker) => {
    setAssets((current) => {
      const next = current.filter((asset) => asset.ticker !== ticker);
      if (selectedTicker === ticker) setSelectedTicker(next[0]?.ticker ?? '');
      return next;
    });
    setNotice(`${ticker} removed from your local watchlist.`);
  };

  const exportCsv = () => {
    const header = ['Name', 'Ticker', 'Current Price', 'All-Time High', 'Drawdown %', 'Daily Change %'];
    const body = rows.map((asset) => [asset.name, asset.ticker, asset.price, asset.high, asset.dd.toFixed(2), asset.dayChange.toFixed(2)]);
    const csv = [header, ...body].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'equity-drawdowns.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="logo">Q</div>
          <div>
            <div className="title-row">
              <h1>Global Equity <span>Drawdown Monitor</span></h1>
              <span className="live-pill">● DEMO</span>
            </div>
            <p>Personal tracker showing distance from adjusted all-time highs</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="button accent" onClick={() => setNotice('AI analysis will be connected after live market data.')}><Sparkles size={17} /> AI Analysis</button>
          <button className="button" onClick={() => setIsAdding(true)}><Plus size={17} /> Add Ticker</button>
          <button className="button" onClick={refresh} disabled={isRefreshing}><RefreshCw className={isRefreshing ? 'spin' : ''} size={17} /> {isRefreshing ? 'Refreshing' : 'Refresh'}</button>
        </div>
      </header>

      <section className="toolbar">
        <div className="tracker-stack">
          <div className="timestamp"><Activity size={15} /> Last viewed: {lastUpdated.toLocaleString('en-SG')}</div>
          <div className="view-counter"><Eye size={15} /> Views on this browser: {viewCount.toLocaleString('en-SG')}</div>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle"><button className="active"><Table2 size={15} /> Table</button><button onClick={() => setNotice('Analytics view is planned for the next iteration.')}><BarChart3 size={15} /> Analytics</button></div>
          <span className="auto-refresh">● Manual demo refresh</span>
        </div>
      </section>

      <section className="content">
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
        <div className="section-heading">
          <div><Layers3 size={17} /> Tracking {rows.length} global benchmark assets</div>
          <button className="button small" onClick={exportCsv}><Download size={15} /> Export CSV</button>
        </div>

        <div className="threshold-strip">
          <Bell size={17} /> Alert levels:
          {thresholds.map((threshold) => <span key={threshold}>{threshold}%</span>)}
          <small>Notifications are not connected yet.</small>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Index / Equity</th><th>Ticker</th><th>Current Price</th><th>All-Time High</th><th>Drawdown</th><th>Latest Refresh</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((asset) => {
                const level = severity(asset.dd);
                return (
                  <tr key={asset.ticker}>
                    <td className="asset-name">{asset.name}</td>
                    <td><span className="ticker">{asset.ticker}</span></td>
                    <td className="numeric strong">{money(asset.price)}</td>
                    <td className="numeric muted">{money(asset.high)}</td>
                    <td><div className={`drawdown ${level}`}>{asset.dd.toFixed(2)}%</div><div className="bar"><span className={level} style={{ width: `${Math.min(Math.abs(asset.dd) * 2.5, 100)}%` }} /></div></td>
                    <td className={`numeric ${asset.dayChange >= 0 ? 'positive' : 'negative'}`}>{asset.dayChange >= 0 ? '+' : ''}{asset.dayChange.toFixed(2)}%</td>
                    <td><button className="icon-button" aria-label={`Delete ${asset.ticker}`} onClick={() => removeAsset(asset.ticker)}><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan="7" className="empty-state">No tickers yet. Use Add Ticker to create your watchlist.</td></tr>}
            </tbody>
          </table>
        </div>

        {selected && <section className="calculator-card">
          <div className="calculator-header">
            <div className="calculator-title"><span className="calculator-icon"><Calculator size={20} /></span><div><h2>All-Time High Recovery Calculator</h2><p>Calculate the gain required to erase the current drawdown</p></div></div>
            <label>Select asset<select value={selectedTicker} onChange={(event) => setSelectedTicker(event.target.value)}>{rows.map((asset) => <option key={asset.ticker} value={asset.ticker}>{asset.ticker} — {asset.name} ({asset.dd.toFixed(2)}%)</option>)}</select></label>
          </div>
          <div className="metric-grid">
            <article><span>Current Price</span><strong>{money(selected.price)}</strong><small>Drawdown {selected.dd.toFixed(2)}%</small></article>
            <article><span>Target All-Time High</span><strong>{money(selected.high)}</strong><small>Historical adjusted peak</small></article>
            <article className="highlight"><span>Required Dollar Gain</span><strong>+{money(requiredDollar)}</strong><small>Per share to reach peak</small></article>
            <article className="highlight"><span>Required Percentage Gain</span><strong>+{requiredPercent.toFixed(2)}%</strong><small>Gain needed from current price</small></article>
          </div>
        </section>}
      </section>

      {isAdding && <div className="modal-backdrop" onMouseDown={() => setIsAdding(false)}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-ticker-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header"><div><h2 id="add-ticker-title">Add ticker</h2><p>Enter values manually for now. Live lookup comes with the market-data service.</p></div><button className="icon-button" onClick={() => setIsAdding(false)} aria-label="Close"><X size={19} /></button></div>
          <form onSubmit={addAsset}>
            <label>Company or fund name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Microsoft Corporation" autoFocus /></label>
            <label>Ticker symbol<input value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value.toUpperCase() })} placeholder="e.g. MSFT" /></label>
            <div className="form-grid"><label>Current price<input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="420.00" /></label><label>All-time high<input type="number" min="0.01" step="0.01" value={form.high} onChange={(event) => setForm({ ...form, high: event.target.value })} placeholder="468.35" /></label></div>
            <div className="modal-actions"><button type="button" className="button" onClick={() => setIsAdding(false)}>Cancel</button><button type="submit" className="button accent"><Plus size={16} /> Add to watchlist</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);