import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Summary = { orders: number; customers: number; revenue: number; monthly: { month: string; revenue: number }[] };
type Segments = { as_of: string | null; counts: Record<string, number>; customers: { customer_id: string; recency_days: number; frequency: number; monetary: number; segment: string }[] };
type Metrics = { accuracy: number; precision: number; recall: number };
type Report = { status: string; message?: string; holdout_cutoff?: string; train_examples?: number; test_examples?: number; positive_rate?: number; baseline?: Metrics; logistic_regression?: Metrics };

function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [segments, setSegments] = useState<Segments | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState('Upload sample_sales.csv to begin.');
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const responses = await Promise.all(['/api/summary', '/api/segments', '/api/model-report'].map(p => fetch(p)));
      if (responses.some(r => !r.ok)) throw new Error('API request failed');
      const [s, g, m] = await Promise.all(responses.map(r => r.json()));
      setSummary(s); setSegments(g); setReport(m);
    } catch (error) { setMessage(`Could not reach API: ${String(error)}`); }
  }
  useEffect(() => { refresh(); }, []);
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    const body = new FormData(); body.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Upload failed');
      setMessage(`${result.accepted_rows} rows accepted. Uploading the same orders again updates them.`);
      await refresh();
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  return <main>
    <header><span>PORTFOLIO DEMO</span><h1>AI Sales Intelligence</h1><p>Sales validation, customer analytics, and an evaluated repeat-purchase baseline.</p></header>
    <section className="panel"><label className="button">{busy ? 'Uploading…' : 'Upload sales CSV'}<input type="file" accept=".csv" disabled={busy} onChange={e => upload(e.target.files?.[0])} /></label><p role="status">{message}</p></section>
    <section className="cards"><div><small>Revenue</small><strong>{summary?.revenue.toLocaleString() ?? 0}</strong></div><div><small>Orders</small><strong>{summary?.orders ?? 0}</strong></div><div><small>Customers</small><strong>{summary?.customers ?? 0}</strong></div></section>
    <section className="grid"><div className="panel"><h2>Monthly revenue</h2>{summary?.monthly.length ? summary.monthly.map(x => <div className="barrow" key={x.month}><span>{x.month}</span><div className="track"><div style={{width:`${100*x.revenue/Math.max(...summary.monthly.map(m=>m.revenue))}%`}} /></div><b>{x.revenue.toFixed(0)}</b></div>) : <p>No data yet</p>}</div>
    <div className="panel"><h2>Customer segments</h2><p>As of {segments?.as_of ?? 'no orders'}</p>{Object.entries(segments?.counts ?? {}).map(([name,count]) => <div className="segment" key={name}><span>{name}</span><strong>{count}</strong></div>)}<p className="muted">At risk: last order over 60 days ago. Loyal: 4+ orders and recently active.</p></div></section>
    <section className="panel"><h2>Repeat-purchase experiment</h2>{report?.status === 'ok' ? <><p>Final holdout cutoff: {report.holdout_cutoff} · Train: {report.train_examples} · Test: {report.test_examples} · Positive rate: {report.positive_rate}</p><table><thead><tr><th>Method</th><th>Accuracy</th><th>Precision</th><th>Recall</th></tr></thead><tbody>{(['baseline','logistic_regression'] as const).map(k => <tr key={k}><td>{k.replace('_',' ')}</td><td>{report[k]?.accuracy}</td><td>{report[k]?.precision}</td><td>{report[k]?.recall}</td></tr>)}</tbody></table><p className="muted">Synthetic data only. Compare with the baseline before claiming useful prediction.</p></> : <p>{report?.message ?? 'Waiting for API'}</p>}</section>
    <section className="panel"><h2>Customer detail</h2><div className="scroll"><table><thead><tr><th>ID</th><th>Recency (days)</th><th>Orders</th><th>Spend</th><th>Segment</th></tr></thead><tbody>{segments?.customers.map(c => <tr key={c.customer_id}><td>{c.customer_id}</td><td>{c.recency_days}</td><td>{c.frequency}</td><td>{c.monetary.toFixed(2)}</td><td>{c.segment}</td></tr>)}</tbody></table></div></section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
