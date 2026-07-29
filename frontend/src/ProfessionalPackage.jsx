import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, Package, Calendar, 
  AlertTriangle, CheckCircle, Award, Brain
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const fetchData = async (endpoint) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return await res.json();
  } catch { return null; }
};

// --- MAIN COMPONENT ---

export default function ProfessionalPackage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const businessValues = [
    "Reduces stockout risk",
    "Minimizes overstock and dead stock",
    "Improves purchasing and production planning",
    "Helps manage warehouse space better",
    "Supports seasonal and promotional planning",
    "Increases inventory efficiency and working capital control"
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Set initial empty data so UI renders immediately
      setData({
        salesForecast: [],
        topProducts: [],
        monthlySales: [],
        topCustomers: [],
        salesByLocation: []
      });
      
      // Fetch data with timeout to prevent hanging
      const fetchWithTimeout = async (endpoint, timeout = 5000) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const res = await fetch(`${API_BASE}${endpoint}`, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          
          if (!res.ok) return [];
          return await res.json();
        } catch { 
          return []; 
        }
      };
      
      // Load data progressively - don't wait for all
      const loadEndpoint = async (endpoint, key) => {
        const result = await fetchWithTimeout(endpoint);
        setData(prev => ({
          ...prev,
          [key]: Array.isArray(result) ? result : []
        }));
      };
      
      // Start all requests but update UI as they complete
      Promise.all([
        loadEndpoint('/tables/sales-forecast', 'salesForecast'),
        loadEndpoint('/tables/top-products', 'topProducts'),
        loadEndpoint('/charts/monthly-sales-12m', 'monthlySales'),
        loadEndpoint('/tables/top-customers', 'topCustomers'),
        loadEndpoint('/charts/sales-by-location', 'salesByLocation')
      ]).finally(() => {
        setLoading(false);
      });
    };

    loadData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="standard-package-page">
      {/* Header */}
      <header className="package-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Packages
        </button>
        <div className="package-title">
          <span className="package-badge">Professional Package</span>
          <h1>Demand Forecasting & Inventory Intelligence</h1>
          <p>AI-powered predictions to optimize your inventory and purchasing decisions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="package-content">
        {/* Business Value Section */}
        <div className="business-value-section">
          <div className="section-icon-title">
            <Award size={28} />
            <h3>Business Value</h3>
          </div>
          <div className="value-grid">
            {businessValues.map((value, index) => (
              <div key={index} className="value-item">
                <CheckCircle size={20} className="value-check" />
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading insights...</p>
          </div>
        ) : (
        <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          
          {/* Chart 1: Sales Forecast */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Brain size={20} color="#3b82f6" />
              Sales Forecast vs Actual
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <LineChart data={data.salesForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="period" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value) => value ? `RM ${Number(value).toLocaleString()}` : '-'}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Top Products by Quantity */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Package size={20} color="#10b981" />
              Top Products by Quantity Sold
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <BarChart data={data.topProducts.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-secondary)" />
                  <YAxis type="category" dataKey="item_code" stroke="var(--text-secondary)" width={100} />
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString()} units`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Monthly Sales Trend */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <TrendingUp size={20} color="#8b5cf6" />
              Monthly Sales Trend
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <AreaChart data={data.monthlySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Product Revenue Distribution */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Package size={20} color="#f59e0b" />
              Top Products Revenue Share
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.topProducts.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="item_code"
                  >
                    {data.topProducts.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Sales by Location */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Calendar size={20} color="#ec4899" />
              Sales Distribution by Location
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <BarChart data={data.salesByLocation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Bar dataKey="sales" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Customer Purchase Frequency */}
          <div className="glass-card">
            <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <AlertTriangle size={20} color="#ef4444" />
              Customer Purchase Frequency
            </div>
            <div style={{width: '100%', height: 400}}>
              <ResponsiveContainer>
                <ComposedChart data={data.topCustomers.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-secondary)" />
                  <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={120} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Revenue') return [`RM ${Number(value).toLocaleString()}`, 'Revenue'];
                      return [value, 'Invoices'];
                    }}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  />
                  <Legend />
                  <Bar dataKey="invoices" name="Invoice Count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  <Line dataKey="revenue" name="Revenue (RM)" stroke="#ef4444" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        )}

        {/* CTA Section */}
        <div className="package-cta">
          <h3>Ready to optimize your inventory with AI forecasting?</h3>
          <p>Get the Professional Package for RM60,000 and transform your demand planning</p>
          <button className="btn-primary btn-large" onClick={onBack}>
            Get Professional Package
          </button>
        </div>
      </main>
    </div>
  );
}
