import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, RadialBarChart, RadialBar, ScatterChart
} from 'recharts';
import { 
  BarChart3, TrendingUp, Users, Package, 
  MessageSquare, X, Send, Sun, Moon, LogOut, Download, FileText, ArrowLeft
} from 'lucide-react';
import BusinessAnalystPage from './BusinessAnalystPage';
import DemoFeatures from './DemoFeatures';
import StandardPackage from './StandardPackage';
import ProfessionalPackage from './ProfessionalPackage';
import EnterprisePackage from './EnterprisePackage';
import PackagesPage from './PackagesPage';
import StandardPackageFeatures from './StandardPackageFeatures';
import ProfessionalPackageFeatures from './ProfessionalPackageFeatures';
import EnterprisePackageFeatures from './EnterprisePackageFeatures';
import CompanyDataEntry from './CompanyDataEntry';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const fetchData = async (endpoint) => {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        return await res.json();
    } catch { return null; }
};

// --- CHATBOT COMPONENT ---
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ sender: 'ai', text: 'Hi! Ask me anything about your sales data.' }]);
  const [input, setInput] = useState('');

  const sendMsg = async () => {
    if(!input.trim()) return;
    const userMsg = input.trim();
    setMsgs(m => [...m, { sender: 'user', text: userMsg }]);
    setInput('');
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMsgs(m => [...m, { sender: 'ai', text: data.reply }]);
    } catch (e) {
      setMsgs(m => [...m, { sender: 'ai', text: 'Oops, backend is not reachable.' }]);
    }
  };

  return (
    <div className="chatbot-widget">
      {!open && (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Sales AI Assistant</span>
            <X size={18} cursor="pointer" onClick={() => setOpen(false)} />
          </div>
          <div className="chatbot-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`message ${m.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendMsg()} 
              placeholder="Ask a question..." 
            />
            <button onClick={sendMsg}><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- LOGIN COMPONENT ---
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if(username === 'admin' && password === 'password') {
      onLogin();
    } else {
      alert('Invalid admin/password');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <h2 style={{color: 'white', marginBottom: '2rem'}}>Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username (admin)" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password (password)" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Log In</button>
        </form>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION ---
export default function App() {
  const [currentView, setCurrentView] = useState('business-analyst'); // 'business-analyst', 'demo-features', 'login', 'dashboard'
  const [previousView, setPreviousView] = useState('');
  const [loggedIn, setLoggedIn] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('dashboard'); // 'dashboard', 'revenue', 'monthly', 'agent'
  const [selectedYear, setSelectedYear] = useState('All');
  const [availableYears, setAvailableYears] = useState([]);
  
  // Dashboard Metrics
  const [kpi, setKpi] = useState({ total_revenue: 0, total_invoices: 0 });
  const [monthlySales, setMonthlySales] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [yoyGrowth, setYoyGrowth] = useState([]);
  const [topMonths, setTopMonths] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [salesByLocation, setSalesByLocation] = useState([]);
  const [dashboardTopProducts, setDashboardTopProducts] = useState([]);

  // Table Data State
  const [tableRevenue, setTableRevenue] = useState([]);
  const [tableMonthly, setTableMonthly] = useState([]);
  const [tableAgent, setTableAgent] = useState([]);
  const [tableCustomerInsights, setTableCustomerInsights] = useState([]);
  const [tableTopCustomersDetails, setTableTopCustomersDetails] = useState([]);
  const [tableInvoiceList, setTableInvoiceList] = useState([]);
  const [chartInvoiceStatus, setChartInvoiceStatus] = useState([]);
  const [tableShippingInsights, setTableShippingInsights] = useState([]);
  const [tableSalesForecast, setTableSalesForecast] = useState([]);
  const [tableCustomerIntelligence, setTableCustomerIntelligence] = useState([]);
  const [tableAnomalyDetection, setTableAnomalyDetection] = useState([]);
  const [tableTopProducts, setTableTopProducts] = useState([]);

  // Search state for tables
  const [searchRevenue, setSearchRevenue] = useState('');
  const [searchAgent, setSearchAgent] = useState('');
  const [searchCustomerInsights, setSearchCustomerInsights] = useState('');
  const [searchTopCustomers, setSearchTopCustomers] = useState('');
  const [searchInvoiceList, setSearchInvoiceList] = useState('');
  const [searchShipping, setSearchShipping] = useState('');
  const [searchCustomerIntelligence, setSearchCustomerIntelligence] = useState('');
  const [searchAnomalyDetection, setSearchAnomalyDetection] = useState('');

  useEffect(() => {
    if(loggedIn) {
      // Fetch available years from database
      if(availableYears.length === 0) {
        fetch(`${API_BASE}/available-years`)
          .then(res => res.json())
          .then(data => {
            if(Array.isArray(data)) {
              setAvailableYears(data);
            }
          })
          .catch(err => console.error('Error fetching years:', err));
      }
      
      if(view === 'dashboard') {
        const query = selectedYear !== 'All' ? `?year=${selectedYear}` : '';
        fetchData(`/kpi/summary${query}`).then(d => d && !d.detail && setKpi(d));
        fetchData(`/charts/monthly-sales-12m${query}`).then(d => Array.isArray(d) && setMonthlySales(d));
        fetchData(`/charts/top-customers${query}`).then(d => Array.isArray(d) && setTopCustomers(d));
        fetchData(`/charts/yoy-growth${query}`).then(d => Array.isArray(d) && setYoyGrowth(d));
        fetchData(`/charts/top-sales-months${query}`).then(d => Array.isArray(d) && setTopMonths(d));
        fetchData(`/charts/sales-by-day${query}`).then(d => Array.isArray(d) && setSalesByDay(d));
        fetchData(`/charts/sales-by-location${query}`).then(d => Array.isArray(d) && setSalesByLocation(d));
        fetchData(`/charts/top-products${query}`).then(d => Array.isArray(d) && setDashboardTopProducts(d.slice(0, 5)));
      } else if (view === 'revenue' && tableRevenue.length === 0) {
        fetchData('/tables/revenue-analysis').then(d => Array.isArray(d) && setTableRevenue(d));
      } else if (view === 'monthly' && tableMonthly.length === 0) {
        fetchData('/tables/monthly-performance').then(d => Array.isArray(d) && setTableMonthly(d));
      } else if (view === 'agent' && tableAgent.length === 0) {
        fetchData('/tables/sales-agent').then(d => Array.isArray(d) && setTableAgent(d));
      } else if (view === 'customer-insights' && tableCustomerInsights.length === 0) {
        fetchData('/tables/customer-insights').then(d => Array.isArray(d) && setTableCustomerInsights(d));
      } else if (view === 'top-customers' && tableTopCustomersDetails.length === 0) {
        fetchData('/tables/top-customers').then(d => Array.isArray(d) && setTableTopCustomersDetails(d));
      } else if (view === 'invoice-list' && tableInvoiceList.length === 0) {
        fetchData('/tables/invoice-list').then(d => Array.isArray(d) && setTableInvoiceList(d));
      } else if (view === 'invoice-status' && chartInvoiceStatus.length === 0) {
        fetchData('/charts/invoice-status').then(d => Array.isArray(d) && setChartInvoiceStatus(d));
      } else if (view === 'shipping' && tableShippingInsights.length === 0) {
        fetchData('/tables/shipping-insights').then(d => Array.isArray(d) && setTableShippingInsights(d));
      } else if (view === 'sales-forecast' && tableSalesForecast.length === 0) {
        fetchData('/tables/sales-forecast').then(d => Array.isArray(d) && setTableSalesForecast(d));
      } else if (view === 'customer-intelligence' && tableCustomerIntelligence.length === 0) {
        fetchData('/tables/customer-intelligence').then(d => Array.isArray(d) && setTableCustomerIntelligence(d));
      } else if (view === 'anomaly-detection' && tableAnomalyDetection.length === 0) {
        fetchData('/tables/anomaly-detection').then(d => Array.isArray(d) && setTableAnomalyDetection(d));
      } else if (view === 'top-products' && tableTopProducts.length === 0) {
        fetchData('/tables/top-products').then(d => Array.isArray(d) && setTableTopProducts(d));
      }
    }
  }, [loggedIn, view, selectedYear]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const exportPDF = () => window.print();

  // Handle navigation
  const handleNavigate = (destination) => {
    if (destination === 'dashboard') {
      setCurrentView('login');
    } else {
      setPreviousView(currentView);
      setCurrentView(destination);
    }
  };

  // Show Business Analyst page (default)
  if (currentView === 'business-analyst') {
    return <BusinessAnalystPage onNavigate={handleNavigate} />;
  }

  // Show Demo Features page after signup
  if (currentView === 'demo-features') {
    return (
      <DemoFeatures 
        onBack={() => setCurrentView('business-analyst')} 
        onViewPackages={() => setCurrentView('packages-page')}
      />
    );
  }

  // Show Standard Package page
  if (currentView === 'standard-package') {
    return <StandardPackage 
      onBack={() => setCurrentView('business-analyst')} 
      onNavigate={(view) => {
        setPreviousView(currentView);
        setCurrentView(view);
      }}
    />;
  }

  // Show Professional Package page
  if (currentView === 'professional-package') {
    return <ProfessionalPackage onBack={() => setCurrentView('business-analyst')} />;
  }

  // Show Enterprise Package page
  if (currentView === 'enterprise-package') {
    return <EnterprisePackage onBack={() => setCurrentView('business-analyst')} />;
  }

  // Show Packages page (from dashboard View Packages button)
  if (currentView === 'packages-page') {
    return <PackagesPage 
      onBack={() => setCurrentView('demo-features')} 
      onNavigate={(view) => {
        setPreviousView(currentView);
        setCurrentView(view);
      }}
    />;
  }

  // Show Standard Package Features page
  if (currentView === 'standard-package-features') {
    return <StandardPackageFeatures onBack={() => setCurrentView('packages-page')} onNavigate={(view) => {
        setPreviousView(currentView);
        setCurrentView(view);
      }} />;
  }

  // Show Professional Package Features page
  if (currentView === 'professional-package-features') {
    return <ProfessionalPackageFeatures onBack={() => setCurrentView('packages-page')} onNavigate={(view) => {
        setPreviousView(currentView);
        setCurrentView(view);
      }} />;
  }

  // Show Enterprise Package Features page
  if (currentView === 'enterprise-package-features') {
    return <EnterprisePackageFeatures onBack={() => setCurrentView('packages-page')} onNavigate={(view) => {
        setPreviousView(currentView);
        setCurrentView(view);
      }} />;
  }

  // Show Company Data Entry page
  if (currentView === 'company-data-entry') {
    return <CompanyDataEntry onBack={() => setCurrentView(previousView || 'business-analyst')} />;
  }

  if(!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8b5cf6'];

  // VIEW RENDERING LOGIC
  const renderDashboardView = () => (
    <>
      <div className="kpi-grid">
        <div className="glass-card">
          <div className="kpi-label">Total Valid Sales (All Time)</div>
          <div className="kpi-value">RM {kpi.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass-card">
          <div className="kpi-label">Total Valid Invoices</div>
          <div className="kpi-value">{kpi.total_invoices.toLocaleString()}</div>
        </div>
        {yoyGrowth.length > 0 && (
          <div className="glass-card">
            <div className="kpi-label">Growth from Previous Year ({yoyGrowth[yoyGrowth.length - 1].year})</div>
            <div className="kpi-value" style={{color: yoyGrowth[yoyGrowth.length - 1].growth.includes('-') ? '#ef4444' : '#10b981'}}>
              {yoyGrowth[yoyGrowth.length - 1].growth}
            </div>
          </div>
        )}
      </div>

      <div className="charts-grid" style={{marginTop: '1.5rem'}}>
        <div className="glass-card">
          <div className="chart-title">1. Monthly Sales (9 Recent Months)</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <AreaChart data={monthlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" width={80} />
                <Tooltip 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Sales']}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales (RM)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">2. Top 5 Customers by Revenue</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <ComposedChart data={topCustomers} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Total Spent']}
                />
                <Legend />
                <Bar dataKey="sales" name="Total Spent (RM)" barSize={20} fill="#10b981" radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">3. Top 5 by Revenue</div>
          <div style={{width: '100%', height: 300, overflow: 'hidden'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardTopProducts} layout="vertical" margin={{top: 5, right: 20, left: 100, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/>
                <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 11}} />
                <YAxis type="category" dataKey="item_code" stroke="var(--text-secondary)" width={90} tick={{fontSize: 10, width: 85}} />
                <Tooltip 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Total Revenue']}
                />
                <Legend />
                <Bar dataKey="sales" name="Total Revenue (RM)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">4. Year-Over-Year Sales Comparison</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <ComposedChart data={yoyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/>
                <XAxis dataKey="year" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" width={80}/>
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Sales Output']}
                />
                <Legend />
                <Bar dataKey="current_sales" name="Sales Output (RM)" fill="#f59e0b" barSize={40} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">5. Top 5 Best Performing Months</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <BarChart data={topMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" width={80} />
                <Tooltip 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Record Sales']}
                />
                <Bar dataKey="sales" name="Record Sales (RM)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">6. Sales Distribution by Day of Week (Spider)</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <RadarChart data={salesByDay} outerRadius={90}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="name" stroke="var(--text-secondary)" />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="transparent" tick={false} axisLine={false} />
                <Tooltip 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Sales Volume']}
                />
                <Radar name="Sales Volume" dataKey="sales" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">7. Revenue by Location</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={salesByLocation} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="sales" name="Sales (RM)" nameKey="name" stroke="var(--bg-primary)">
                  {salesByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff'}} 
                  formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Sales']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderRevenueAnalysisTable = () => {
    const filteredData = tableRevenue.filter(row => 
      row.debtor_name.toLowerCase().includes(searchRevenue.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Revenue Analysis (Last 50 Invoices)</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name..." 
          value={searchRevenue}
          onChange={(e) => setSearchRevenue(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Doc No</th>
            <th>Debtor Name</th>
            <th>Agent</th>
            <th style={{textAlign: 'right'}}>Net Total (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td>{row.date}</td>
              <td>{row.doc_no}</td>
              <td style={{fontWeight: 500, color: 'var(--accent-color)'}}>{row.debtor_name}</td>
              <td>{row.agent || 'N/A'}</td>
              <td align="right">{row.net_total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{padding: '2rem'}}>{searchRevenue ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderMonthlyPerformanceTable = () => (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Monthly Performance Breakdown</div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Period (Year-Month)</th>
            <th style={{textAlign: 'right'}}>Total Invoices Generated</th>
            <th style={{textAlign: 'right'}}>Total Sales Revenue (RM)</th>
          </tr>
        </thead>
        <tbody>
          {tableMonthly.map((row, i) => (
            <tr key={i}>
              <td style={{fontWeight: 600}}>{row.period}</td>
              <td align="right">{row.invoices.toLocaleString()}</td>
              <td align="right" style={{color: 'var(--success)', fontWeight: 600}}>
                {row.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {tableMonthly.length === 0 && <tr><td colSpan="3" align="center" style={{padding: '2rem'}}>Loading Data...</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderSalesByAgentTable = () => {
    const filteredData = tableAgent.filter(row => 
      row.agent.toLowerCase().includes(searchAgent.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Sales by Agent Performance Matrix</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by agent name..." 
          value={searchAgent}
          onChange={(e) => setSearchAgent(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Sales Agent Name</th>
            <th style={{textAlign: 'right'}}>Total Invoices Handled</th>
            <th style={{textAlign: 'right'}}>Total Revenue Driven (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Users size={16} color="var(--accent-color)" />
                <span style={{fontWeight: 600}}>{row.agent}</span>
              </td>
              <td align="right">{row.invoices.toLocaleString()}</td>
              <td align="right" style={{fontWeight: 700, color: 'var(--accent-color)'}}>
                {row.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="3" align="center" style={{padding: '2rem'}}>{searchAgent ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderCustomerInsightsTable = () => {
    const filteredData = tableCustomerInsights.filter(row => 
      row.name.toLowerCase().includes(searchCustomerInsights.toLowerCase()) ||
      row.code.toLowerCase().includes(searchCustomerInsights.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Global Customer Insights Database</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name or code..." 
          value={searchCustomerInsights}
          onChange={(e) => setSearchCustomerInsights(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Debtor Code</th>
            <th>Company Name</th>
            <th>First Order</th>
            <th>Last Order</th>
            <th style={{textAlign: 'center'}}>Invoices</th>
            <th style={{textAlign: 'right'}}>Lifetime Value (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{color: 'var(--text-secondary)'}}>{row.code}</td>
              <td style={{fontWeight: 500}}>{row.name}</td>
              <td>{row.first_purchase}</td>
              <td>{row.last_purchase}</td>
              <td align="center">{row.invoices.toLocaleString()}</td>
              <td align="right" style={{fontWeight: 600, color: '#10b981'}}>
                {row.spend.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="6" align="center" style={{padding: '2rem'}}>{searchCustomerInsights ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderTopCustomersTable = () => {
    const filteredData = tableTopCustomersDetails
      .map((row, index) => ({...row, originalRank: index + 1}))
      .filter(row => 
        row.name.toLowerCase().includes(searchTopCustomers.toLowerCase())
      );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Top 50 Most Valuable Customers</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name..." 
          value={searchTopCustomers}
          onChange={(e) => setSearchTopCustomers(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Company Name</th>
            <th style={{textAlign: 'center'}}>Invoices</th>
            <th style={{textAlign: 'right'}}>Average Order Value (RM)</th>
            <th style={{textAlign: 'right'}}>Total Revenue (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{fontWeight: 700, color: row.originalRank <= 3 ? '#f59e0b' : 'var(--text-secondary)'}}>#{row.originalRank}</td>
              <td style={{fontWeight: 600}}>{row.name}</td>
              <td align="center">{row.invoices.toLocaleString()}</td>
              <td align="right">{row.aov.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td align="right" style={{fontWeight: 700, color: 'var(--accent-color)'}}>
                {row.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{padding: '2rem'}}>{searchTopCustomers ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderInvoiceListTable = () => {
    const filteredData = tableInvoiceList.filter(row => 
      row.debtor_name.toLowerCase().includes(searchInvoiceList.toLowerCase()) ||
      row.doc_no.toLowerCase().includes(searchInvoiceList.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Global Invoice Registry</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name or invoice number..." 
          value={searchInvoiceList}
          onChange={(e) => setSearchInvoiceList(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Doc No</th>
            <th>Debtor Name</th>
            <th>Sales Agent</th>
            <th style={{textAlign: 'center'}}>Status</th>
            <th style={{textAlign: 'right'}}>Net Total (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i} style={{opacity: row.cancelled === 'T' ? 0.6 : 1}}>
              <td>{row.date}</td>
              <td style={{fontFamily: 'monospace', color: 'var(--text-secondary)'}}>{row.doc_no}</td>
              <td style={{fontWeight: 500}}>{row.debtor_name}</td>
              <td>{row.agent}</td>
              <td align="center">
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  backgroundColor: row.cancelled === 'T' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: row.cancelled === 'T' ? '#ef4444' : '#10b981'
                }}>
                  {row.cancelled === 'T' ? 'CANCELLED' : 'VALID'}
                </span>
              </td>
              <td align="right" style={{color: row.cancelled === 'T' ? 'inherit' : 'var(--accent-color)', fontWeight: 600}}>
                {row.net_total.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="6" align="center" style={{padding: '2rem'}}>{searchInvoiceList ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderInvoiceStatusChart = () => {
    const STATUS_COLORS = ['#10b981', '#ef4444'];
    return (
      <div className="charts-grid" style={{marginTop: '1.5rem'}}>
        <div className="glass-card table-wrapper">
          <div className="chart-title">1. Invoice Validity Status (Count)</div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Status</th>
                <th style={{textAlign: 'right'}}>Invoice Count</th>
                <th style={{textAlign: 'right'}}>Total Monetary Value (RM)</th>
              </tr>
            </thead>
            <tbody>
              {chartInvoiceStatus.map((row, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 600, color: row.status === 'Cancelled' ? '#ef4444' : '#10b981'}}>{row.status}</td>
                  <td align="right">{row.count.toLocaleString()}</td>
                  <td align="right" style={{fontWeight: 700}}>{row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
              {chartInvoiceStatus.length === 0 && <tr><td colSpan="3" align="center" style={{padding: '2rem'}}>Loading Data...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="glass-card">
          <div className="chart-title">2. Value Distribution Overview</div>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartInvoiceStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="status">
                  {chartInvoiceStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'Cancelled' ? STATUS_COLORS[1] : STATUS_COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Total Value']}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderShippingInsightsTable = () => {
    const filteredData = tableShippingInsights.filter(row => 
      row.route.toLowerCase().includes(searchShipping.toLowerCase()) ||
      row.location.toLowerCase().includes(searchShipping.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Shipping Routes & Logistics Performance</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by route or location..." 
          value={searchShipping}
          onChange={(e) => setSearchShipping(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Platform / Ship Via</th>
            <th>Location</th>
            <th style={{textAlign: 'right'}}>Total Shipments</th>
            <th style={{textAlign: 'right'}}>Total Built Value (RM)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{fontWeight: 600, color: 'var(--accent-color)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Package size={16} />
                  {row.route}
                </div>
              </td>
              <td>{row.location}</td>
              <td align="right">{row.shipments.toLocaleString()}</td>
              <td align="right" style={{fontWeight: 700}}>
                {row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="4" align="center" style={{padding: '2rem'}}>{searchShipping ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderSalesForecastChart = () => (
    <div className="charts-grid" style={{marginTop: '1.5rem'}}>
      <div className="glass-card">
        <div className="chart-title">Sales Trend & AI Forecast</div>
        <div style={{width: '100%', height: 350}}>
          <ResponsiveContainer>
            <LineChart data={tableSalesForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)"/>
              <XAxis dataKey="period" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" width={80} />
              <Tooltip 
                wrapperStyle={{backgroundColor: 'var(--bg-secondary)', border: 'none'}} 
                formatter={(value) => [`RM ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]}
              />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}}/>
              <Line type="monotone" dataKey="forecast" name="AI Projected" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card table-wrapper">
        <div className="chart-title">Forecast Data Output</div>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Period</th>
              <th style={{textAlign: 'right'}}>Actual Sales (RM)</th>
              <th style={{textAlign: 'right'}}>Forecast (RM)</th>
            </tr>
          </thead>
          <tbody>
            {tableSalesForecast.map((row, i) => (
               <tr key={i}>
                <td style={{fontWeight: 600}}>{row.period}</td>
                <td align="right">{row.actual ? row.actual.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                <td align="right" style={{color: '#f59e0b', fontWeight: 600}}>{row.forecast ? row.forecast.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
               </tr>
            ))}
            {tableSalesForecast.length === 0 && <tr><td colSpan="3" align="center" style={{padding: '2rem'}}>Loading Data...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomerIntelligenceTable = () => {
    const filteredData = tableCustomerIntelligence.filter(row => 
      row.name.toLowerCase().includes(searchCustomerIntelligence.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Customers at Risk of Leaving</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name..." 
          value={searchCustomerIntelligence}
          onChange={(e) => setSearchCustomerIntelligence(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th style={{textAlign: 'center'}}>Days Since Last Order</th>
            <th style={{textAlign: 'right'}}>Lifetime Value (RM)</th>
            <th style={{textAlign: 'center'}}>AI Risk Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{fontWeight: 600}}>{row.name}</td>
              <td align="center" style={{color: row.days > 180 ? '#ef4444' : 'inherit'}}>{row.days} Days</td>
              <td align="right" style={{fontWeight: 700}}>{row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td align="center">
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  backgroundColor: row.status === 'At Risk' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: row.status === 'At Risk' ? '#ef4444' : '#10b981'
                }}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="4" align="center" style={{padding: '2rem'}}>{searchCustomerIntelligence ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderAnomalyDetectionTable = () => {
    const filteredData = tableAnomalyDetection.filter(row => 
      row.customer.toLowerCase().includes(searchAnomalyDetection.toLowerCase())
    );
    
    return (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Unusually High Invoice Amounts</div>
      <div style={{marginBottom: '1rem'}}>
        <input 
          type="text" 
          placeholder="Search by company name..." 
          value={searchAnomalyDetection}
          onChange={(e) => setSearchAnomalyDetection(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Anomaly Date</th>
            <th>Document No</th>
            <th>Target Customer</th>
            <th style={{textAlign: 'right'}}>Spike Value (RM)</th>
            <th style={{textAlign: 'center'}}>Anomaly Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{color: 'var(--text-secondary)'}}>{row.date}</td>
              <td>{row.doc_no}</td>
              <td style={{fontWeight: 600}}>{row.customer}</td>
              <td align="right" style={{color: '#8b5cf6', fontWeight: 700}}>
                {row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
              <td align="center">
                <span style={{padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6'}}>
                  {row.anomaly_type}
                </span>
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{padding: '2rem'}}>{searchAnomalyDetection ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
  };

  const renderTopProductsTable = () => (
    <div className="glass-card table-wrapper">
      <div className="chart-title">Top Selling Products (Invoice Details)</div>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th style={{textAlign: 'center'}}>Total Quantity Sold</th>
            <th style={{textAlign: 'right'}}>Average Unit Price (RM)</th>
            <th style={{textAlign: 'right'}}>Total Generated Revenue (RM)</th>
          </tr>
        </thead>
        <tbody>
          {tableTopProducts.map((row, i) => (
            <tr key={i}>
              <td style={{fontWeight: 700, color: 'var(--text-secondary)'}}>{row.item_code}</td>
              <td style={{fontWeight: 500}}>{row.description || 'No Description'}</td>
              <td align="center">{row.qty.toLocaleString()}</td>
              <td align="right">{row.avg_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td align="right" style={{fontWeight: 700, color: 'var(--accent-color)'}}>
                {row.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          ))}
          {tableTopProducts.length === 0 && <tr><td colSpan="5" align="center" style={{padding: '2rem'}}>Loading Data...</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', margin: '0 0 2rem 0' }}>
          <img src="/logo.png" alt="SalesBooster Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          SalesBooster
        </h1>
        
        <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <BarChart3 size={20} /> <span>Dashboard</span>
        </div>

        <div className="nav-category">Sales</div>
        <div className={`nav-sub-item ${view === 'revenue' ? 'active' : ''}`} onClick={() => setView('revenue')}>Revenue Analysis</div>
        <div className={`nav-sub-item ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>Monthly Performance</div>
        <div className={`nav-sub-item ${view === 'agent' ? 'active' : ''}`} onClick={() => setView('agent')}>Sales by Agent</div>

        <div className="nav-category">Products</div>
        <div className={`nav-sub-item ${view === 'top-products' ? 'active' : ''}`} onClick={() => setView('top-products')}>Top Products Details</div>

        <div className="nav-category">Customers</div>
        <div className={`nav-sub-item ${view === 'customer-insights' ? 'active' : ''}`} onClick={() => setView('customer-insights')}>Customer Insights</div>
        <div className={`nav-sub-item ${view === 'top-customers' ? 'active' : ''}`} onClick={() => setView('top-customers')}>Top Customers</div>

        <div className="nav-category">Invoices</div>
        <div className={`nav-sub-item ${view === 'invoice-list' ? 'active' : ''}`} onClick={() => setView('invoice-list')}>Invoice List</div>
        <div className={`nav-sub-item ${view === 'invoice-status' ? 'active' : ''}`} onClick={() => setView('invoice-status')}>Invoice Status</div>

        <div className="nav-category">Logistics</div>
        <div className={`nav-sub-item ${view === 'shipping' ? 'active' : ''}`} onClick={() => setView('shipping')}>Shipping Insights</div>

        <div className="nav-category">AI Insights</div>
        <div className={`nav-sub-item ${view === 'sales-forecast' ? 'active' : ''}`} onClick={() => setView('sales-forecast')}>Sales Forecast</div>
        <div className={`nav-sub-item ${view === 'customer-intelligence' ? 'active' : ''}`} onClick={() => setView('customer-intelligence')}>At-Risk Customers</div>
        <div className={`nav-sub-item ${view === 'anomaly-detection' ? 'active' : ''}`} onClick={() => setView('anomaly-detection')}>Unusual Transactions</div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            {view === 'dashboard' && 'Executive Overview'}
            {view === 'revenue' && 'Revenue Analysis Data'}
            {view === 'monthly' && 'Monthly Performance Tracking'}
            {view === 'agent' && 'Agent Sales Matrix'}
            {view === 'top-products' && 'Top Performing Item Details'}
            {view === 'customer-insights' && 'Customer Lifetime Database'}
            {view === 'top-customers' && 'High Value Customer Rankings'}
            {view === 'invoice-list' && 'Comprehensive Invoice Registry'}
            {view === 'invoice-status' && 'Invoice Health & Status Tracking'}
            {view === 'shipping' && 'Global Shipping & Logistics Data'}
            {view === 'sales-forecast' && 'AI-Powered Sales Trend Forecast'}
            {view === 'customer-intelligence' && 'Customers Who May Leave (At-Risk Analysis)'}
            {view === 'anomaly-detection' && 'Unusual or Suspicious Transaction Detection'}
          </div>
                    <div className="header-actions">
            {view === 'dashboard' && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{marginRight: '1rem', padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none'}}>
                <option value="All">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}

            <button className="btn-icon" onClick={exportPDF} title="Export to PDF"><Download size={18} /></button>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-icon" onClick={() => setLoggedIn(false)} title="Log Out"><LogOut size={18} /></button>
          </div>
        </header>
        <div style={{ padding: '0 2rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.5' }}>
          {view === 'dashboard' && 'A comprehensive executive summary of global sales performance, KPIs, and revenue distribution trends.'}
          {view === 'revenue' && 'Detailed list of recent invoices displaying net totals, debtor names, and specific document records.'}
          {view === 'monthly' && 'Historical performance breakdown detailing total invoice counts and generated revenue on a month-by-month basis.'}
          {view === 'agent' && 'Performance tracking matrix showcasing total generated revenue and invoice volume for each sales agent.'}
          {view === 'customer-insights' && 'Global tracking of customer acquisition dates and their total lifetime spending value.'}
          {view === 'top-customers' && 'Ranked breakdown of the top highest-value customers based on their average order value and overall revenue contribution.'}
          {view === 'invoice-list' && 'Complete registry of all processed invoices including their status (Valid/Cancelled) and net totals.'}
          {view === 'invoice-status' && 'Visual overview of invoice validity to track potential revenue loss from cancelled transactions.'}
          {view === 'shipping' && 'Logistics overview highlighting shipping routes alongside their total shipment volumes and monetary value.'}
          {view === 'sales-forecast' && 'AI-driven projected sales forecast comparing actual historical output against expected future volume trends.'}
          {view === 'customer-intelligence' && 'Identifies customers who may stop buying from you. Shows how many days since their last purchase and flags at-risk customers so you can follow up with them.'}
          {view === 'anomaly-detection' && 'Finds unusual or abnormally high invoice amounts that stand out from normal sales patterns. Helps spot potential errors, fraud, or exceptional transactions.'}
          {view === 'top-products' && 'Deep dive into item-level performance tracking individual SKUs and their contribution to the total revenue.'}
        </div>

        {view === 'dashboard' && renderDashboardView()}
        {view === 'revenue' && renderRevenueAnalysisTable()}
        {view === 'monthly' && renderMonthlyPerformanceTable()}
        {view === 'agent' && renderSalesByAgentTable()}
        {view === 'customer-insights' && renderCustomerInsightsTable()}
        {view === 'top-customers' && renderTopCustomersTable()}
        {view === 'invoice-list' && renderInvoiceListTable()}
        {view === 'invoice-status' && renderInvoiceStatusChart()}
        {view === 'shipping' && renderShippingInsightsTable()}
        {view === 'sales-forecast' && renderSalesForecastChart()}
        {view === 'customer-intelligence' && renderCustomerIntelligenceTable()}
        {view === 'anomaly-detection' && renderAnomalyDetectionTable()}
        {view === 'top-products' && renderTopProductsTable()}

      </main>

      <Chatbot />
    </div>
  );
}
