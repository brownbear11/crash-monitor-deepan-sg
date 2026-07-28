import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  Download,
  Layers3,
  Plus,
  RefreshCw,
  Sparkles,
  Table2,
  Trash2,
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

function App() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const rows = useMemo(
    () => assets.map((asset) => ({ ...asset, dd: drawdown(asset.price, asset.high) })),
    [assets],
  );

  const selected = rows.find((asset) => asset.ticker === selectedTicker) ?? rows[0];
  const requiredDollar = selected.high - selected.price;
  const requiredPercent = (requiredDollar / selected.price) * 100;

  const refresh = () => {
    setAssets((current) =>
      current.map((asset) => ({
        ...asset,
        price: Number((asset.price * (1 + (Math.random() - 0.5) * 0.006)).toFixed(2)),
      })),
    );
    setLastUpdated(new Date());
  };

  const removeAsset = (ticker) => {
    setAssets((current) => current.filter((asset) => asset.ticker !== ticker));
    if (selectedTicker === ticker) setSelectedTicker(assets.find((asset) => asset.ticker !== ticker)?.ticker ?? '');
  };

  const exportCsv = () => {
    const header = ['Name', 'Ticker', 'Current Price', 'All-Time High', 'Drawdown %', 'Daily Change %'];
    const body = rows.map((asset) => [
      asset.name,
      asset.ticker,
      asset.price,
      asset.high,
      asset.dd.toFixed(2),
      asset.dayChange.toFixed(2),
    ]);
    const csv = [header, ...body].map((row) => row.join(',')).join('\n');
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
              <span className="live-pill">● LIVE</span>
            </div>
            <p>Personal tracker showing distance from adjusted all-time highs</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="button accent"><Sparkles size={17} /> AI Analysis</button>
          <button className="button"><Plus size={17} /> Add Ticker</button>
          <button className="button" onClick={refresh}><RefreshCw size={17} /> Refresh</button>
        </div>
      </header>

      <section className="toolbar">
        <div className="timestamp"><Activity size={15} /> Last viewed: {lastUpdated.toLocaleString('en-SG')}</div>
        <div className="toolbar-right">
          <div className="view-toggle"><button className="active"><Table2 size={15} /> Table</button><button><BarChart3 size={15} /> Analytics</button></div>
          <span className="auto-refresh">● Auto-refresh demo</span>
        </div>
      </section>

      <section className="content">
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
            <thead>
              <tr>
                <th>Index / Equity</th><th>Ticker</th><th>Current Price</th><th>All-Time High</th><th>Drawdown</th><th>Daily Change</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((asset) => {
                const level = severity(asset.dd);
                return (
                  <tr key={asset.ticker}>
                    <td className="asset-name">{asset.name}</td>
                    <td><span className="ticker">{asset.ticker}</span></td>
                    <td className="numeric strong">{money(asset.price)}</td>
                    <td className="numeric muted">{money(asset.high)}</td>
                    <td>
                      <div className={`drawdown ${level}`}>{asset.dd.toFixed(2)}%</div>
                      <div className="bar"><span className={level} style={{ width: `${Math.min(Math.abs(asset.dd) * 2.5, 100)}%` }} /></div>
                    </td>
                    <td className={`numeric ${asset.dayChange >= 0 ? 'positive' : 'negative'}`}>{asset.dayChange >= 0 ? '+' : ''}{asset.dayChange.toFixed(2)}%</td>
                    <td><button className="icon-button" aria-label={`Delete ${asset.ticker}`} onClick={() => removeAsset(asset.ticker)}><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="calculator-card">
          <div className="calculator-header">
            <div className="calculator-title"><span className="calculator-icon"><Calculator size={20} /></span><div><h2>All-Time High Recovery Calculator</h2><p>Calculate the gain required to erase the current drawdown</p></div></div>
            <label>Select asset
              <select value={selectedTicker} onChange={(event) => setSelectedTicker(event.target.value)}>
                {rows.map((asset) => <option key={asset.ticker} value={asset.ticker}>{asset.ticker} — {asset.name} ({asset.dd.toFixed(2)}%)</option>)}
              </select>
            </label>
          </div>
          <div className="metric-grid">
            <article><span>Current Price</span><strong>{money(selected.price)}</strong><small>Drawdown {selected.dd.toFixed(2)}%</small></article>
            <article><span>Target All-Time High</span><strong>{money(selected.high)}</strong><small>Historical adjusted peak</small></article>
            <article className="highlight"><span>Required Dollar Gain</span><strong>+{money(requiredDollar)}</strong><small>Per share to reach peak</small></article>
            <article className="highlight"><span>Required Percentage Gain</span><strong>+{requiredPercent.toFixed(2)}%</strong><small>Gain needed from current price</small></article>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
