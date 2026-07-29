import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  ArrowLeft, Warehouse, Truck, MapPin,
  AlertTriangle, CheckCircle, Award, Globe
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const fetchData = async (endpoint) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return await res.json();
  } catch { return null; }
};

// --- MAIN COMPONENT ---

export default function EnterprisePackage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const businessValues = [
    "Improves stock allocation across locations",
    "Reduces unnecessary stock transfers",
    "Improves branch and warehouse replenishment",
    "Enhances delivery planning and route efficiency",
    "Reduces logistics and distribution costs",
    "Improves product availability in high-demand areas"
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Set initial empty data so UI renders immediately
      setData({
        shippingInsights: [],
        salesByLocation: [],
        salesByDay: [],
        topCustomers: [],
        salesByAgent: [],
        monthlySales: []
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
        loadEndpoint('/tables/shipping-insights', 'shippingInsights'),
        loadEndpoint('/charts/sales-by-location', 'salesByLocation'),
        loadEndpoint('/charts/sales-by-day', 'salesByDay'),
        loadEndpoint('/tables/top-customers', 'topCustomers'),
        loadEndpoint('/tables/sales-agent', 'salesByAgent'),
        loadEndpoint('/charts/monthly-sales-12m', 'monthlySales')
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
          <span className="package-badge">Enterprise Package</span>
          <h1>Multi-Location Distribution Intelligence</h1>
          <p>Optimize stock allocation and logistics across all your warehouses and branches</p>
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
          <div className="charts-grid" style={{ marginTop: '2rem' }}>

            {/* Chart 1: Shipping Routes Performance */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="#3b82f6" />
                Shipping Routes by Volume
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.shippingInsights.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis type="category" dataKey="route" stroke="var(--text-secondary)" width={100} />
                    <Tooltip
                      formatter={(value) => `${Number(value).toLocaleString()} shipments`}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    />
                    <Bar dataKey="shipments" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Location Revenue Distribution */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#10b981" />
                Revenue by Location
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.salesByLocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="sales"
                      nameKey="name"
                    >
                      {data.salesByLocation.map((entry, index) => (
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

            {/* Chart 3: Sales by Day of Week */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={20} color="#f59e0b" />
                Sales Distribution by Day
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={data.salesByDay}>
                    <defs>
                      <linearGradient id="colorDaySales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDaySales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Route Value Analysis */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="#8b5cf6" />
                Route Value vs Shipments
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.shippingInsights.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="route" stroke="var(--text-secondary)" />
                    <YAxis yAxisId="left" stroke="var(--text-secondary)" />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Value') return [`RM ${Number(value).toLocaleString()}`, 'Total Value'];
                        return [value, 'Shipments'];
                      }}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="shipments" name="Shipments" fill="#10b981" />
                    <Line yAxisId="right" type="monotone" dataKey="value" name="Value (RM)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Top Customers by Region */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#ec4899" />
                Top Customers Revenue
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.topCustomers.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={120} />
                    <Tooltip
                      formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    />
                    <Bar dataKey="revenue" fill="#ec4899" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Agent Performance by Location */}
            <div className="glass-card">
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Warehouse size={20} color="#06b6d4" />
                Sales Agent Performance
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.salesByAgent.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis type="category" dataKey="agent" stroke="var(--text-secondary)" width={100} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Revenue') return [`RM ${Number(value).toLocaleString()}`, 'Revenue'];
                        return [value, 'Invoices'];
                      }}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    />
                    <Legend />
                    <Bar dataKey="invoices" name="Invoices" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    <Line dataKey="total_sales" name="Revenue (RM)" stroke="#f59e0b" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* CTA Section */}
        <div className="package-cta">
          <h3>Ready to optimize your multi-location distribution?</h3>
          <p>Get the Enterprise Package for RM100,000 and transform your logistics operations</p>
          <button className="btn-primary btn-large" onClick={onBack}>
            Get Enterprise Package
          </button>
        </div>
      </main>
    </div>
  );
}
