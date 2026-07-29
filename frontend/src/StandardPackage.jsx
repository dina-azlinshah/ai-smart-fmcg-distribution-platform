import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, Users, Building, DollarSign, 
  Package, Calendar, Award, CheckCircle, BarChart3,
  Target, AlertTriangle, UserCheck
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const fetchData = async (endpoint) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return await res.json();
  } catch { return null; }
};

// --- COMPONENTS ---

const InsightCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="insight-card">
    <div className="insight-icon" style={{ background: color }}>
      <Icon size={24} />
    </div>
    <div className="insight-content">
      <h4>{title}</h4>
      <div className="insight-value">{value}</div>
      <p className="insight-subtitle">{subtitle}</p>
    </div>
  </div>
);

const BusinessValueSection = () => {
  const values = [
    "Improves visibility of sales performance",
    "Identifies profitable products and customers",
    "Helps detect declining sales trends early",
    "Supports better pricing and discount control",
    "Measures salesperson and branch effectiveness",
    "Helps management make data-driven decisions"
  ];

  return (
    <div className="business-value-section">
      <div className="section-icon-title">
        <Award size={28} />
        <h3>Business Value</h3>
      </div>
      <div className="value-grid">
        {values.map((value, index) => (
          <div key={index} className="value-item">
            <CheckCircle size={20} className="value-check" />
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PackageComparisonTable = () => {
  const packages = [
    {
      name: 'Standard',
      price: 'RM30,000',
      features: {
        'Business Analyst': 'Basic workflow review',
        'ERP Integration': 'Sales & inventory',
        'Dashboard': 'Basic operational dashboard',
        'AI Capability': 'Sales analytics',
        'Inventory Monitoring': 'Stock alerts',
        'Warehouse Monitoring': 'Single warehouse',
        'Training': 'User training'
      }
    },
    {
      name: 'Professional',
      price: 'RM60,000',
      features: {
        'Business Analyst': 'Detailed analysis',
        'ERP Integration': 'Sales, inventory, purchasing',
        'Dashboard': 'Customised dashboard',
        'AI Capability': 'Demand forecasting',
        'Inventory Monitoring': 'Smart reorder',
        'Warehouse Monitoring': 'Multi-location',
        'Training': 'User + management training'
      }
    },
    {
      name: 'Enterprise',
      price: 'RM100,000',
      features: {
        'Business Analyst': 'Full operational study',
        'ERP Integration': 'Multi-module integration',
        'Dashboard': 'Executive dashboard',
        'AI Capability': 'Distribution intelligence',
        'Inventory Monitoring': 'Inventory optimisation',
        'Warehouse Monitoring': 'Multi-warehouse',
        'Training': 'Full operational training'
      }
    }
  ];

  const featureNames = Object.keys(packages[0].features);

  return (
    <div className="package-comparison-section">
      <div className="section-icon-title">
        <Package size={28} />
        <h3>Implementation Packages</h3>
      </div>
      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="feature-header">Feature</th>
              {packages.map((pkg) => (
                <th key={pkg.name} className={`package-header-cell ${pkg.name === 'Standard' ? 'highlight' : ''}`}>
                  <div className="package-header-content">
                    <span className="package-name">{pkg.name}</span>
                    <span className="package-price">{pkg.price}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureNames.map((feature, index) => (
              <tr key={feature} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td className="feature-name-cell">{feature}</td>
                {packages.map((pkg) => (
                  <td key={pkg.name} className={`feature-value-cell ${pkg.name === 'Standard' ? 'highlight' : ''}`}>
                    {pkg.features[feature]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InsightsDashboard = ({ data }) => {
  const { 
    topCategories = [], 
    topCustomers = [], 
    branchPerformance = [],
    salesByAgent = [],
    monthlySales = [],
    productMargins = []
  } = data;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="insights-dashboard">
      <div className="charts-grid">
        {/* Insight 1: Product Category Revenue */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Package size={20} color="#3b82f6" />
            Which product category contributes the highest revenue?
          </div>
          <div style={{width: '100%', height: 350, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories} layout="vertical" margin={{top: 10, right: 30, left: 20, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={120} />
                <Tooltip 
                  formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-summary" style={{marginTop: '1.5rem'}}>
            <div className="top-performer">
              <div className="label">Top Category</div>
              <div className="value">{topCategories[0]?.name || 'N/A'}</div>
              <div className="amount">RM {topCategories[0]?.revenue?.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>

        {/* Insight 2: Customer Group Frequency */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Users size={20} color="#10b981" />
            Which customer group buys most frequently?
          </div>
          <div style={{width: '100%', height: 350, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCustomers}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="invoices"
                  nameKey="name"
                >
                  {topCustomers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value} invoices`, props.payload.name]}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-summary" style={{marginTop: '1.5rem'}}>
            <div className="top-performer">
              <div className="label">Most Frequent Buyer</div>
              <div className="value">{topCustomers[0]?.name || 'N/A'}</div>
              <div className="amount">{topCustomers[0]?.invoices?.toLocaleString() || '0'} invoices</div>
            </div>
          </div>
        </div>

        {/* Insight 3: Branch Performance */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Building size={20} color="#8b5cf6" />
            Which branch is underperforming?
          </div>
          <div style={{width: '100%', height: 350, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPerformance} margin={{top: 10, right: 30, left: 20, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-summary" style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div className="performance-indicator">
              <div className="label">Lowest Performing</div>
              <div className="value" style={{ color: '#ef4444' }}>
                {branchPerformance[branchPerformance.length - 1]?.name || 'N/A'}
              </div>
              <div className="amount">
                RM {branchPerformance[branchPerformance.length - 1]?.sales?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="performance-indicator top">
              <div className="label">Top Performing</div>
              <div className="value" style={{ color: '#10b981' }}>
                {branchPerformance[0]?.name || 'N/A'}
              </div>
              <div className="amount">
                RM {branchPerformance[0]?.sales?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Insight 4: Salesperson Performance */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <UserCheck size={20} color="#f59e0b" />
            Which salesperson closes the most sales?
          </div>
          <div style={{width: '100%', height: 350, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesByAgent} layout="vertical" margin={{top: 10, right: 30, left: 20, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={100} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'sales') return [`RM ${Number(value).toLocaleString()}`, 'Revenue'];
                    return [value, 'Invoices'];
                  }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Legend />
                <Bar dataKey="sales" name="Revenue (RM)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-summary" style={{marginTop: '1.5rem'}}>
            <div className="top-performer">
              <div className="label">Top Salesperson</div>
              <div className="value">{salesByAgent[0]?.name || 'N/A'}</div>
              <div className="amount">RM {salesByAgent[0]?.sales?.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>

        {/* Insight 5: Monthly Sales Volume */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Calendar size={20} color="#ec4899" />
            Which months have the highest sales volume?
          </div>
          <div style={{width: '100%', height: 350, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{top: 10, right: 30, left: 20, bottom: 10}}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  formatter={(value) => `RM ${Number(value).toLocaleString()}`}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-summary" style={{marginTop: '1.5rem'}}>
            <div className="top-performer">
              <div className="label">Peak Month</div>
              <div className="value">{monthlySales.reduce((max, m) => m.sales > max.sales ? m : max, monthlySales[0] || {})?.month || 'N/A'}</div>
              <div className="amount">
                RM {monthlySales.reduce((max, m) => m.sales > max.sales ? m : max, monthlySales[0] || {})?.sales?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Insight 6: Product Margins */}
        <div className="glass-card">
          <div className="chart-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <AlertTriangle size={20} color="#ef4444" />
            Which products have high sales but low profit margin?
          </div>
          <div style={{width: '100%', height: 400, margin: '0 -10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMargins} margin={{top: 10, right: 30, left: 20, bottom: 20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" stroke="var(--text-secondary)" />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Sales') return [`RM ${Number(value).toLocaleString()}`, 'Sales'];
                    return [`${value}%`, 'Margin'];
                  }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" name="Sales (RM)" fill="#3b82f6" />
                <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="margin-alert" style={{marginTop: '1.5rem'}}>
            <AlertTriangle size={20} />
            <span>Products highlighted need pricing review - high volume but low profitability</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function StandardPackage({ onBack, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Set initial data immediately
      setData({
        topCategories: [
          { name: 'Electronics', revenue: 450000 },
          { name: 'Home & Garden', revenue: 320000 },
          { name: 'Sports', revenue: 280000 },
          { name: 'Fashion', revenue: 210000 },
          { name: 'Books', revenue: 150000 }
        ],
        topCustomers: [],
        branchPerformance: [
          { name: 'HQ KL', sales: 580000 },
          { name: 'Penang', sales: 420000 },
          { name: 'Johor', sales: 350000 },
          { name: 'Sabah', sales: 180000 }
        ],
        salesByAgent: [],
        monthlySales: [],
        productMargins: [
          { name: 'Product A', sales: 150000, margin: 45 },
          { name: 'Product B', sales: 120000, margin: 15 },
          { name: 'Product C', sales: 98000, margin: 38 },
          { name: 'Product D', sales: 85000, margin: 12 },
          { name: 'Product E', sales: 72000, margin: 52 }
        ]
      });
      
      // Fetch data with timeout
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
      
      // Load data progressively
      const [topCustomers, monthlySales, salesByAgent] = await Promise.all([
        fetchWithTimeout('/charts/top-customers'),
        fetchWithTimeout('/charts/monthly-sales-12m'),
        fetchWithTimeout('/tables/sales-agent')
      ]);
      
      setData(prev => ({
        ...prev,
        topCustomers: topCustomers?.slice(0, 5).map(c => ({
          name: c.name?.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
          invoices: c.count || 0
        })) || [],
        salesByAgent: salesByAgent?.slice(0, 5).map(a => ({
          name: a.agent?.length > 12 ? a.agent.substring(0, 12) + '...' : a.agent || 'Unknown',
          sales: a.total_sales || 0,
          invoices: a.invoices || 0
        })) || [],
        monthlySales: monthlySales?.map(m => ({
          month: m.name,
          sales: m.sales || 0
        })) || []
      }));
      
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="standard-package-page">
      {/* Header */}
      <header className="package-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Packages
        </button>
        <div className="package-title">
          <span className="package-badge">Standard Package</span>
          <h1>Sales Performance Insights Dashboard</h1>
          <p>Comprehensive analytics to answer your key business questions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="package-content">
        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={() => onNavigate && onNavigate('demo-features')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <BarChart3 size={18} />
            Access Business Analysis
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate && onNavigate('business-analyst')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>

        {/* Package Comparison Table */}
        <PackageComparisonTable />

        {/* Business Value Section */}
        <BusinessValueSection />

        {/* Insights Section Header */}
        <div className="insights-header">
          <BarChart3 size={28} />
          <h3>Key Insights</h3>
          <p>Data-driven answers to critical business questions</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading insights...</p>
          </div>
        ) : (
          <InsightsDashboard data={data} />
        )}

        {/* CTA Section */}
        <div className="package-cta">
          <h3>Ready to unlock these insights for your business?</h3>
          <p>Get the Standard Package for RM30,000 and transform your sales visibility</p>
          <button className="btn-primary btn-large" onClick={onBack}>
            Get Standard Package
          </button>
        </div>
      </main>
    </div>
  );
}
