import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Users, Package,
  Calendar, ArrowLeft, Download, Sparkles, Loader2,
  FileText, Ship, DollarSign, Brain, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, LineChart, Line
} from 'recharts';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Fallback data for tables when backend is not available
const FALLBACK_TABLE_DATA = {
  'revenue': Array.from({ length: 50 }, (_, i) => ({
    date: `2026-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    doc_no: `IV-2026-${String(i + 1).padStart(3, '0')}`,
    debtor_name: ["MEGALIVE BIOSCIENCES", "BIO-LIFE MARKETING", "ABBOTT LABORATORIES", "DKSH (M)", "ZUELLIG PHARMA"][i % 5],
    agent: ["John", "Sarah", "Mike", "Lisa"][i % 4],
    net_total: Math.floor(Math.random() * 40000) + 5000
  })),
  'monthly': [
    { period: "2026-02", invoices: 45, total_sales: 145000 },
    { period: "2026-01", invoices: 52, total_sales: 135000 },
    { period: "2025-12", invoices: 48, total_sales: 120000 },
    { period: "2025-11", invoices: 42, total_sales: 98000 },
    { period: "2025-10", invoices: 38, total_sales: 85000 },
    { period: "2025-09", invoices: 35, total_sales: 72000 },
    { period: "2025-08", invoices: 40, total_sales: 68000 },
    { period: "2025-07", invoices: 55, total_sales: 108000 },
  ],
  'agent': [
    { agent: "John Smith", invoices: 156, total_sales: 450000 },
    { agent: "Sarah Lee", invoices: 134, total_sales: 380000 },
    { agent: "Mike Chen", invoices: 142, total_sales: 320000 },
    { agent: "Lisa Wong", invoices: 124, total_sales: 280000 },
  ],
  'customer-insights': [
    { code: "D001", name: "MEGALIVE BIOSCIENCES", first_purchase: "2023-01-15", last_purchase: "2026-02-15", invoices: 45, spend: 850000 },
    { code: "D002", name: "BIO-LIFE MARKETING", first_purchase: "2023-03-20", last_purchase: "2026-02-14", invoices: 38, spend: 420000 },
    { code: "D003", name: "ABBOTT LABORATORIES", first_purchase: "2022-11-10", last_purchase: "2026-02-13", invoices: 52, spend: 380000 },
    { code: "D004", name: "DKSH (M)", first_purchase: "2023-06-05", last_purchase: "2026-02-12", invoices: 41, spend: 290000 },
    { code: "D005", name: "ZUELLIG PHARMA", first_purchase: "2023-08-12", last_purchase: "2026-02-11", invoices: 28, spend: 180000 },
  ],
  'top-customers': [
    { name: "MEGALIVE BIOSCIENCES SDN BHD", invoices: 45, aov: 18888.89, revenue: 850000.00 },
    { name: "BIO-LIFE MARKETING SDN BHD", invoices: 38, aov: 11052.63, revenue: 420000.00 },
    { name: "ABBOTT LABORATORIES (M) SDN BHD", invoices: 52, aov: 7307.69, revenue: 380000.00 },
    { name: "DKSH (M) SDN BHD", invoices: 41, aov: 7073.17, revenue: 290000.00 },
    { name: "ZUELLIG PHARMA S/B", invoices: 28, aov: 6428.57, revenue: 180000.00 },
    { name: "SUNWAY PHARMA SDN BHD", invoices: 35, aov: 4714.29, revenue: 165000.00 },
    { name: "WATSONS MALAYSIA", invoices: 48, aov: 4583.33, revenue: 220000.00 },
    { name: "GUARDIAN HEALTH", invoices: 42, aov: 4642.86, revenue: 195000.00 },
    { name: "ALPRO PHARMACY", invoices: 33, aov: 4242.42, revenue: 140000.00 },
    { name: "BIG PHARMACY", invoices: 29, aov: 4137.93, revenue: 120000.00 },
    { name: "CARING PHARMACY", invoices: 31, aov: 3870.97, revenue: 120000.00 },
    { name: "HEALTH LANE", invoices: 26, aov: 3846.15, revenue: 100000.00 },
    { name: "AA PHARMACY", invoices: 24, aov: 3750.00, revenue: 90000.00 },
    { name: "FARMASIA", invoices: 22, aov: 3636.36, revenue: 80000.00 },
    { name: "MEDICARE", invoices: 20, aov: 3500.00, revenue: 70000.00 },
    { name: "PHARMAPLUS", invoices: 19, aov: 3421.05, revenue: 65000.00 },
    { name: "HEALTHCARE SDN BHD", invoices: 18, aov: 3333.33, revenue: 60000.00 },
    { name: "LIFE CARE", invoices: 17, aov: 3235.29, revenue: 55000.00 },
    { name: "MEDI CARE", invoices: 16, aov: 3125.00, revenue: 50000.00 },
    { name: "WELLNESS PHARMA", invoices: 15, aov: 3000.00, revenue: 45000.00 },
    { name: "VITALITY HEALTH", invoices: 14, aov: 2857.14, revenue: 40000.00 },
    { name: "NUTRILIFE", invoices: 13, aov: 2692.31, revenue: 35000.00 },
    { name: "HERBALIFE", invoices: 12, aov: 2500.00, revenue: 30000.00 },
    { name: "AMWAY", invoices: 11, aov: 2272.73, revenue: 25000.00 },
    { name: "COSWAY", invoices: 10, aov: 2000.00, revenue: 20000.00 },
    { name: "AEON WELLNESS", invoices: 9, aov: 1888.89, revenue: 17000.00 },
    { name: "GINTELL", invoices: 8, aov: 1750.00, revenue: 14000.00 },
    { name: "OSIM", invoices: 7, aov: 1571.43, revenue: 11000.00 },
    { name: "WATSONS PERSONAL CARE", invoices: 6, aov: 1333.33, revenue: 8000.00 },
    { name: "GUARDIAN BEAUTY", invoices: 5, aov: 1000.00, revenue: 5000.00 },
  ],
  'invoice-list': Array.from({ length: 50 }, (_, i) => ({
    date: `2026-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    doc_no: `IV-2026-${String(i + 1).padStart(3, '0')}`,
    debtor_name: ["MEGALIVE BIOSCIENCES", "BIO-LIFE MARKETING", "ABBOTT LABORATORIES"][i % 3],
    agent: ["John", "Sarah", "Mike"][i % 3],
    cancelled: i % 10 === 0 ? 'T' : 'F',
    net_total: Math.floor(Math.random() * 40000) + 5000
  })),
  'shipping': [
    { route: "Self Collect", location: "HQ", shipments: 245, value: 850000 },
    { route: "Courier", location: "KL", shipments: 180, value: 420000 },
    { route: "Lorry", location: "PJ", shipments: 95, value: 280000 },
    { route: "Express", location: "SHAH ALAM", shipments: 67, value: 150000 },
  ],
  'sales-forecast': [
    { period: "2025-09", actual: 85000, forecast: 82000 },
    { period: "2025-10", actual: 92000, forecast: 90000 },
    { period: "2025-11", actual: 98000, forecast: 95000 },
    { period: "2025-12", actual: 115000, forecast: 118000 },
    { period: "2026-01", actual: 128000, forecast: 125000 },
    { period: "2026-02", actual: 135000, forecast: 138000 },
    { period: "2026-03", actual: null, forecast: 145000 },
    { period: "2026-04", actual: null, forecast: 152000 },
  ],
  'customer-intelligence': [
    { name: "MEGALIVE BIOSCIENCES", days: 15, value: 850000, status: "Active" },
    { name: "BIO-LIFE MARKETING", days: 32, value: 420000, status: "Active" },
    { name: "ABBOTT LABORATORIES", days: 45, value: 380000, status: "Active" },
    { name: "OLD CUSTOMER A", days: 195, value: 120000, status: "At Risk" },
    { name: "OLD CUSTOMER B", days: 210, value: 85000, status: "At Risk" },
  ],
  'anomaly-detection': [
    { date: "2026-02-15", doc_no: "IV-2026-001", customer: "MEGALIVE BIOSCIENCES", value: 125000, anomaly_type: "High Value" },
    { date: "2026-01-20", doc_no: "IV-2026-089", customer: "BIO-LIFE MARKETING", value: 98000, anomaly_type: "Spike" },
    { date: "2025-12-10", doc_no: "IV-2025-234", customer: "ABBOTT LABORATORIES", value: 87000, anomaly_type: "Unusual" },
  ],
  'top-products': [
    { item_code: "00017", description: "2025 LOYALTY PROGRAM TARGET ACHIEVEMENT", qty: 1.0, avg_price: 68433.29, revenue: 68433.29 },
    { item_code: "00017", description: "2024 LOYALTY PROGRAM TARGET ACHIEVEMENT", qty: 1.0, avg_price: 41069.12, revenue: 41069.12 },
    { item_code: "00017", description: "MEGALIVE 2023 LOYALTY PROGRAM TARGET ACHIEVEMENT", qty: 1.0, avg_price: 32436.05, revenue: 32436.05 },
    { item_code: "00017", description: "MEGALIVE QUARTERLY TARGET INCENTIVE (OCT-DEC) 2025", qty: 1.0, avg_price: 28933.53, revenue: 28933.53 },
    { item_code: "00017", description: "MEGALIVE STAFF INCENTIVE 2023 Q4 (OCT-DEC)", qty: 1.0, avg_price: 26986.25, revenue: 26986.25 },
    { item_code: "00019", description: "LOYALTY PROGRAM TARGET ACHIEVEMENT 2022", qty: 1.0, avg_price: 26163.64, revenue: 26163.64 },
    { item_code: "00017", description: "Staff Incentive Q1 (Jan-Mar) 2024", qty: 1.0, avg_price: 25419.00, revenue: 25419.00 },
    { item_code: "00017", description: "STAFF INCENTIVE Q3 (JUL-SEPT) 2023", qty: 1.0, avg_price: 24687.00, revenue: 24687.00 },
    { item_code: "00017", description: "Staff Incentive Q3 (Jul-Sept) 2024 ", qty: 1.0, avg_price: 23738.25, revenue: 23738.25 },
    { item_code: "00017", description: "Staff Incentive Q4 (Oct-Dec) 2024", qty: 1.0, avg_price: 23038.50, revenue: 23038.50 },
  ],
  'finance-debtors': [
    {doc_no: "I-2602-005", doc_date: "2026-02-12", debtor_name: "MEGALIVE BIOSCIENCES SDN BHD", term: "C.O.D.", total: 19623.0},
    {doc_no: "I-2602-006", doc_date: "2026-02-12", debtor_name: "MEGALIVE BIOSCIENCES SDN BHD", term: "C.O.D.", total: 11630.46},
    {doc_no: "I-2602-007", doc_date: "2026-02-12", debtor_name: "VGROUP TRADING SDN BHD", term: "C.O.D.", total: 85.7},
    {doc_no: "I-2602-003", doc_date: "2026-02-06", debtor_name: "iNova Pharmaceuticals (Singapore) Pte Ltd", term: "C.O.D.", total: 417.0},
    {doc_no: "I-2601-020", doc_date: "2026-02-01", debtor_name: "VIATRIS SDN BHD", term: "Net 30 days", total: 200.0},
    {doc_no: "I-2601-017", doc_date: "2026-01-27", debtor_name: "MEGALIVE BIOSCIENCES SDN BHD", term: "Net 60 days", total: 28933.53}
  ],
  'supplier-location': [
    {debtor_name: "MEGALIVE BIOSCIENCES SDN BHD", product: "2025 LOYALTY PROGRAM TARGET ACHIEVEMENT", location: "HQ", qty: 1.0, revenue: 68433.29}, 
    {debtor_name: "VGROUP TRADING SDN BHD", product: "DISPLAY-GLUCERNA RPB NOV-DEC 2021", location: "HQ", qty: 5.0, revenue: 5000.00},
    {debtor_name: "iNova Pharmaceuticals", product: "PROVITAL IMMUNA PLUS 900G", location: "PUCHONG", qty: 10.0, revenue: 8500.00},
    {debtor_name: "VIATRIS SDN BHD", product: "ENSURE GOLD VANILLA 850G", location: "TA", qty: 2.0, revenue: 1500.00},
    {debtor_name: "ABBOTT LABORATORIES", product: "SPONSORSHIPS FOR MAILER", location: "HQ", qty: 1.0, revenue: 12000.00},
    {debtor_name: "BIO-LIFE MARKETING", product: "HEALTH SUPPLEMENT X", location: "STORE", qty: 50.0, revenue: 2400.00},
    {debtor_name: "ZUELIG PHARMA", product: "VITAMIN C 1000MG", location: "SS14", qty: 200.0, revenue: 15000.00},
    {debtor_name: "I PROCARE MALAYSIA", product: "MEDICAL EQUIPMENT Y", location: "NUSA.B", qty: 3.0, revenue: 4500.00}
  ]
};

// Tooltip with bright colors
const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '13px',
  fontWeight: 600,
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
};

// Components
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <div className={`demo-nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={18} />
    <span>{label}</span>
  </div>
);

const NavSubItem = ({ label, active, onClick }) => (
  <div className={`demo-nav-sub-item ${active ? 'active' : ''}`} onClick={onClick}>
    {label}
  </div>
);

const NavCategory = ({ label }) => <div className="demo-nav-category">{label}</div>;

const KPICard = ({ title, value, loading, color }) => (
  <div className="demo-kpi-card-v2">
    <p className="demo-kpi-title-v2">{title}</p>
    {loading ? <Loader2 className="demo-spinner" size={24} /> : (
      <h3 className="demo-kpi-value-v2" style={{ color: color || '#3b82f6' }}>{value}</h3>
    )}
  </div>
);

const ChartCard = ({ title, number, children }) => (
  <div className="demo-chart-card-v2">
    <h3 className="demo-chart-title-v2">{number}. {title}</h3>
    <div className="demo-chart-content-v2">{children}</div>
  </div>
);

const TableCard = ({ title, children }) => (
  <div className="demo-table-card">
    <h3 className="demo-chart-title-v2">{title}</h3>
    <div className="demo-table-content">{children}</div>
  </div>
);

// Loading Screen Component
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const steps = [
      { pct: 15, msg: 'Connecting to AED_FM Database...', delay: 400 },
      { pct: 35, msg: 'Loading Invoice Data...', delay: 600 },
      { pct: 55, msg: 'Processing Sales Analytics...', delay: 500 },
      { pct: 75, msg: 'Generating AI Forecasts...', delay: 600 },
      { pct: 90, msg: 'Finalizing Dashboard...', delay: 400 },
      { pct: 100, msg: 'Ready!', delay: 300 },
    ];

    let currentStep = 0;
    const runStep = () => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].pct);
        setStatus(steps[currentStep].msg);
        setTimeout(() => {
          currentStep++;
          runStep();
        }, steps[currentStep].delay);
      } else {
        setTimeout(onComplete, 200);
      }
    };

    runStep();
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      {/* Animated Logo */}
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        animation: 'pulse 2s ease-in-out infinite',
        boxShadow: '0 0 60px rgba(59, 130, 246, 0.5)',
      }}>
        <Sparkles size={48} color="white" />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 700,
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem',
      }}>
        DistributionAI
      </h1>
      <p style={{ color: '#64748b', marginBottom: '3rem' }}>Loading Demo Dashboard...</p>

      {/* Progress Bar Container */}
      <div style={{ width: '400px', maxWidth: '90%' }}>
        {/* Status Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          fontSize: '0.9rem',
        }}>
          <span style={{ color: '#94a3b8' }}>{status}</span>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(148, 163, 184, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          }} />
        </div>
      </div>

      {/* Loading Stats */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '3rem',
        opacity: progress > 30 ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>556</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Invoices</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>30+</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Customers</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>AI</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Powered</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default function DemoFeatures({ onBack, onViewPackages }) {
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [view, setView] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState('All');

  // Data states
  const [kpiData, setKpiData] = useState({ total_revenue: 0, total_invoices: 0 });
  const [monthlySales, setMonthlySales] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesByLocation, setSalesByLocation] = useState([]);
  const [yoyGrowth, setYoyGrowth] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topSalesMonths, setTopSalesMonths] = useState([]);
  const [invoiceStatus, setInvoiceStatus] = useState([]);
  const [topProductsRevenue, setTopProductsRevenue] = useState([]);

  // Table data
  const [tableData, setTableData] = useState({});

  // Search state for tables
  const [searchRevenue, setSearchRevenue] = useState('');
  const [searchAgent, setSearchAgent] = useState('');
  const [searchCustomerInsights, setSearchCustomerInsights] = useState('');
  const [searchTopCustomers, setSearchTopCustomers] = useState('');
  const [searchInvoiceList, setSearchInvoiceList] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [expandedDebtor, setExpandedDebtor] = useState(null);
  const [searchTopProducts, setSearchTopProducts] = useState('');
  const [searchFinanceDebtors, setSearchFinanceDebtors] = useState('');
  const [searchCustomerIntelligence, setSearchCustomerIntelligence] = useState('');
  const [searchAnomalyDetection, setSearchAnomalyDetection] = useState('');

  // Fetch data when year changes
  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  // Fetch table data when view changes
  useEffect(() => {
    fetchTableData();
  }, [view]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const yearParam = selectedYear !== 'All' ? `?year=${selectedYear}` : '';

    // ALWAYS use AED_FM database data - NO uploaded Excel data
    try {
      console.log('Fetching data from AED_FM database...');
      
      // Fetch all data from AED_FM database
      const [kpiRes, monthlyRes, customersRes, yoyRes, topMonthsRes, salesByDayRes, locationRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/kpi/summary${yearParam}`),
        fetch(`${API_BASE}/charts/monthly-sales-12m${yearParam}`),
        fetch(`${API_BASE}/charts/top-customers${yearParam}`),
        fetch(`${API_BASE}/charts/yoy-growth${yearParam}`),
        fetch(`${API_BASE}/charts/top-sales-months${yearParam}`),
        fetch(`${API_BASE}/charts/sales-by-day${yearParam}`),
        fetch(`${API_BASE}/charts/sales-by-location${yearParam}`),
        fetch(`${API_BASE}/charts/top-products${yearParam}`)
      ]);

      const kpiData = await kpiRes.json();
      const monthlyData = await monthlyRes.json();
      const customersData = await customersRes.json();
      const yoyData = await yoyRes.json();
      const topMonthsData = await topMonthsRes.json();
      const salesByDayData = await salesByDayRes.json();
      const locationData = await locationRes.json();
      const productsData = await productsRes.json();

      // Set KPI data
      if (kpiData && !kpiData.detail) {
        setKpiData({ 
          total_revenue: kpiData.total_revenue || 0, 
          total_invoices: kpiData.total_invoices || 0 
        });
      }

      // Set monthly sales
      if (Array.isArray(monthlyData)) {
        setMonthlySales(monthlyData.map(m => ({ name: m.name, sales: m.sales })));
      }

      // Set top customers
      if (Array.isArray(customersData)) {
        setTopCustomers(customersData.slice(0, 5).map(c => ({
          name: c.name,
          sales: c.sales
        })));
      }

      // Set YoY growth
      if (Array.isArray(yoyData)) {
        setYoyGrowth(yoyData);
      }

      // Set top sales months
      if (Array.isArray(topMonthsData)) {
        setTopSalesMonths(topMonthsData.slice(0, 5).map(m => ({ name: m.name, sales: m.sales })));
      }

      // Set sales by day
      if (Array.isArray(salesByDayData)) {
        setSalesByDay(salesByDayData);
      }

      // Set sales by location
      if (Array.isArray(locationData)) {
        setSalesByLocation(locationData);
      }

      // Set top products
      if (Array.isArray(productsData)) {
        setTopProductsRevenue(productsData.slice(0, 10).map(p => ({
          name: p.name || p.description || p.item_code,
          sales: p.sales
        })));
      }

      // Set invoice status
      setInvoiceStatus([
        { name: "Valid", value: kpiData.total_invoices || 0 }
      ]);

    } catch (error) {
      console.error('Error fetching AED_FM database data:', error);
      
      // Fallback to hardcoded AED_FM database values
      setKpiData({ total_revenue: 1202414.53, total_invoices: 556 });
      setMonthlySales([
        { name: '2025-06', sales: 61000 },
        { name: '2025-07', sales: 55000 },
        { name: '2025-08', sales: 68000 },
        { name: '2025-09', sales: 72000 },
        { name: '2025-10', sales: 78000 },
        { name: '2025-11', sales: 82000 },
        { name: '2025-12', sales: 95000 },
        { name: '2026-01', sales: 88000 },
        { name: '2026-02', sales: 52438 }
      ]);
      setTopCustomers([
        { name: "MEGALIVE BIOSCIENCES", sales: 734779 },
        { name: "BIO-LIFE MARKETING", sales: 125000 },
        { name: "ABBOTT LABORATORIES", sales: 98000 },
        { name: "DKSH (M)", sales: 85000 },
        { name: "ZUELLIG PHARMA", sales: 72000 }
      ]);
      setSalesByLocation([
        { name: "HQ", sales: 950000 },
        { name: "TA", sales: 150000 },
        { name: "STORE", sales: 80000 },
        { name: "PUCHONG", sales: 15000 }
      ]);
      setYoyGrowth([
        { year: 2022, current_sales: 180000, growth: "N/A" },
        { year: 2023, current_sales: 240000, growth: "+33.33%" },
        { year: 2024, current_sales: 250000, growth: "+4.17%" },
        { year: 2025, current_sales: 360000, growth: "+44.00%" },
        { year: 2026, current_sales: 180000, growth: "-49.40%" }
      ]);
      setSalesByDay([
        { name: "Monday", sales: 250000 },
        { name: "Tuesday", sales: 450000 },
        { name: "Wednesday", sales: 380000 },
        { name: "Thursday", sales: 320000 },
        { name: "Friday", sales: 280000 },
        { name: "Saturday", sales: 150000 },
        { name: "Sunday", sales: 95000 }
      ]);
      setTopSalesMonths([
        { name: '2025-12', sales: 95000 },
        { name: '2026-01', sales: 88000 },
        { name: '2025-11', sales: 82000 },
        { name: '2025-10', sales: 78000 },
        { name: '2025-09', sales: 72000 }
      ]);
      setInvoiceStatus([
        { name: "Valid", value: 556 }
      ]);
      setTopProductsRevenue([
        { name: "00017", sales: 68433 },
        { name: "00017 (2024)", sales: 41069 },
        { name: "00017 (2023)", sales: 32436 },
        { name: "00017 Q4 2025", sales: 28933 },
        { name: "00017 Q4 2023", sales: 26986 }
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchTableData = async () => {
    const endpoints = {
      'revenue': '/tables/revenue-analysis',
      'monthly': '/tables/monthly-performance',
      'agent': '/tables/sales-agent',
      'customer-insights': '/tables/customer-insights',
      'top-customers': '/tables/top-customers',
      'invoice-list': '/tables/invoice-list',
      'supplier-location': '/supplier/location-insights',
      'sales-forecast': '/tables/sales-forecast',
      'customer-intelligence': '/tables/customer-intelligence',
      'anomaly-detection': '/tables/anomaly-detection',
      'top-products': '/tables/top-products',
      'finance-debtors': '/finance/debtors'
    };

    // ONLY fetch real data from backend - no fallback/mock data
    if (endpoints[view]) {
      try {
        const res = await fetch(`${API_BASE}${endpoints[view]}`);
        if (res.ok) {
          const data = await res.json();
          setTableData(prev => ({ ...prev, [view]: data }));
        }
      } catch (error) {
        console.log('Using fallback data for', view);
      }
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'RM 0.00';
    return `RM ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Transform data
  const radarData = salesByDay.map(day => ({
    day: day.name || day.DayOfWeek,
    sales: day.sales || day.TotalSales || 0,
    fullMark: Math.max(...salesByDay.map(d => d.sales || d.TotalSales || 0)) * 1.2 || 1000
  }));

  const yoyBarData = yoyGrowth.map(item => ({
    year: (item.year || item.Year || '').toString(),
    sales: item.current_sales || item.CurrentYearSales || item.Sales || 0
  }));

  const latestYear = yoyGrowth[yoyGrowth.length - 1] || { year: selectedYear === 'All' ? '2026' : selectedYear, growth: 'N/A' };
  const growthValue = latestYear?.growth || 'N/A';
  const growthColor = growthValue?.includes('-') ? '#ef4444' : '#10b981';

  // Calculate invoice status totals
  const validInvoices = invoiceStatus.find(i => i.name === 'Valid')?.value || 0;
  const cancelledInvoices = invoiceStatus.find(i => i.name === 'Cancelled')?.value || 0;

  // Render views
  const renderDashboardView = () => (
    <>
      <div className="demo-kpi-row">
        <KPICard
          title={selectedYear === 'All' ? "Total Valid Sales (All Time)" : `Total Valid Sales (${selectedYear})`}
          value={formatCurrency(kpiData.total_revenue)}
          loading={loading}
          color="#3b82f6"
        />
        <KPICard
          title={selectedYear === 'All' ? "Total Valid Invoices" : `Total Valid Invoices (${selectedYear})`}
          value={kpiData.total_invoices.toLocaleString()}
          loading={loading}
          color="#3b82f6"
        />
        <KPICard
          title={`Growth from Previous Year (${latestYear?.year || selectedYear})`}
          value={growthValue}
          loading={loading}
          color={growthColor}
        />
      </div>

      <div className="demo-charts-row">
        <ChartCard title="Monthly Sales (9 Recent Months)" number="1">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
              <Legend />
              <Area type="monotone" dataKey="sales" name="Sales (RM)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Customers by Revenue" number="2">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={140} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
              <Legend />
              <Bar dataKey="sales" name="Total Spent (RM)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="demo-charts-row">
        <ChartCard title="Top 5 Products by Revenue" number="3">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={topProductsRevenue.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={8} width={120} tick={{ width: 115, textAnchor: 'end' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
              <Legend />
              <Bar dataKey="sales" name="Revenue (RM)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Best Performing Months" number="4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topSalesMonths} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={50} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
              <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="demo-charts-row">
        <ChartCard title="Sales Distribution by Day of Week (Spider)" number="5">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
              <PolarAngleAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="transparent" tick={false} />
              <Radar name="Sales Volume" dataKey="sales" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
              <Legend />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Location" number="6">
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie data={salesByLocation} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="sales" isAnimationActive={false}>
                {salesByLocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatCurrency(val)} />
              <Legend verticalAlign="bottom" height={36} iconType="square" formatter={(value, entry) => entry.payload.name} />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );

  const renderInvoiceStatusChart = () => (
    <>
      <div className="demo-charts-row">
        {/* Valid Card */}
        <div className="demo-chart-card-v2" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>✓</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Valid Invoices</h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>520</div>
            <div style={{ fontSize: '1.1rem', color: '#64748b' }}>RM 1,202,414.53</div>
            <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'inline-block' }}>
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>93.5% Success Rate</span>
            </div>
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="demo-chart-card-v2" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>✕</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cancelled</h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>36</div>
            <div style={{ fontSize: '1.1rem', color: '#64748b' }}>RM 12,182.52</div>
            <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '20px', display: 'inline-block' }}>
              <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>6.5% Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="demo-chart-card-v2" style={{ marginTop: '1.5rem' }}>
        <div style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#94a3b8' }}>Total Invoices Processed</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>556</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '93.5%', height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '4px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ color: '#10b981', fontSize: '0.85rem' }}>93.5% Valid</span>
            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>6.5% Cancelled</span>
          </div>
        </div>
      </div>
    </>
  );

  // Table render functions
  const renderRevenueAnalysisTable = () => {
    const filteredData = (tableData.revenue || []).filter(row =>
      (row.debtor_name || '').toLowerCase().includes(searchRevenue.toLowerCase())
    );

    return (
      <TableCard title="Revenue Analysis (Last 50 Invoices)">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Date</th><th>Doc No</th><th>Debtor Name</th><th>Agent</th><th style={{ textAlign: 'right' }}>Net Total (RM)</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td>{row.date}</td>
                <td>{row.doc_no}</td>
                <td style={{ fontWeight: 500, color: '#3b82f6' }}>{row.debtor_name}</td>
                <td>{row.agent || 'N/A'}</td>
                <td align="right">{Number(row.net_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{ padding: '2rem' }}>{searchRevenue ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderMonthlyPerformanceTable = () => (
    <TableCard title="Monthly Performance Breakdown">
      <table className="demo-table">
        <thead>
          <tr><th>Period (Year-Month)</th><th style={{ textAlign: 'right' }}>Total Invoices</th><th style={{ textAlign: 'right' }}>Total Sales (RM)</th></tr>
        </thead>
        <tbody>
          {(tableData.monthly || []).map((row, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{row.period}</td>
              <td align="right">{row.invoices?.toLocaleString()}</td>
              <td align="right" style={{ color: '#10b981', fontWeight: 600 }}>{Number(row.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
          {(tableData.monthly || []).length === 0 && <tr><td colSpan="3" align="center" style={{ padding: '2rem' }}>Loading Data...</td></tr>}
        </tbody>
      </table>
    </TableCard>
  );

  const renderSalesByAgentTable = () => {
    const filteredData = (tableData.agent || []).filter(row =>
      row.agent.toLowerCase().includes(searchAgent.toLowerCase())
    );

    return (
      <TableCard title="Sales by Agent Performance Matrix">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Sales Agent</th><th style={{ textAlign: 'right' }}>Total Invoices</th><th style={{ textAlign: 'right' }}>Total Revenue (RM)</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color="#3b82f6" />
                  <span style={{ fontWeight: 600 }}>{row.agent}</span>
                </td>
                <td align="right">{row.invoices?.toLocaleString()}</td>
                <td align="right" style={{ fontWeight: 700, color: '#3b82f6' }}>{Number(row.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="3" align="center" style={{ padding: '2rem' }}>{searchAgent ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderCustomerInsightsTable = () => {
    const filteredData = (tableData['customer-insights'] || []).filter(row =>
      row.name.toLowerCase().includes(searchCustomerInsights.toLowerCase()) ||
      row.code.toLowerCase().includes(searchCustomerInsights.toLowerCase())
    );

    return (
      <TableCard title="Global Customer Insights Database">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Code</th><th>Company</th><th>First Order</th><th>Last Order</th><th style={{ textAlign: 'center' }}>Invoices</th><th style={{ textAlign: 'right' }}>Lifetime Value</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#94a3b8' }}>{row.code}</td>
                <td style={{ fontWeight: 500 }}>{row.name}</td>
                <td>{row.first_purchase}</td>
                <td>{row.last_purchase}</td>
                <td align="center">{row.invoices?.toLocaleString()}</td>
                <td align="right" style={{ fontWeight: 600, color: '#10b981' }}>{Number(row.spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="6" align="center" style={{ padding: '2rem' }}>{searchCustomerInsights ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderTopCustomersTable = () => {
    const filteredData = (tableData['top-customers'] || [])
      .map((row, index) => ({ ...row, originalRank: index + 1 }))
      .filter(row =>
        row.name.toLowerCase().includes(searchTopCustomers.toLowerCase())
      );

    return (
      <TableCard title="Top 50 Most Valuable Customers">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Rank</th><th>Company</th><th style={{ textAlign: 'center' }}>Invoices</th><th style={{ textAlign: 'right' }}>AOV (RM)</th><th style={{ textAlign: 'right' }}>Revenue (RM)</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: row.originalRank <= 3 ? '#f59e0b' : '#94a3b8' }}>#{row.originalRank}</td>
                <td style={{ fontWeight: 600 }}>{row.name}</td>
                <td align="center">{row.invoices?.toLocaleString()}</td>
                <td align="right">{Number(row.aov).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td align="right" style={{ fontWeight: 700, color: '#3b82f6' }}>{Number(row.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{ padding: '2rem' }}>{searchTopCustomers ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderInvoiceListTable = () => {
    const filteredData = (tableData['invoice-list'] || []).filter(row =>
      row.debtor_name.toLowerCase().includes(searchInvoiceList.toLowerCase()) ||
      row.doc_no.toLowerCase().includes(searchInvoiceList.toLowerCase())
    );

    return (
      <TableCard title="Global Invoice Registry">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Date</th><th>Doc No</th><th>Debtor</th><th>Agent</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'right' }}>Net Total</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i} style={{ opacity: row.cancelled === 'T' ? 0.6 : 1 }}>
                <td>{row.date}</td>
                <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{row.doc_no}</td>
                <td style={{ fontWeight: 500 }}>{row.debtor_name}</td>
                <td>{row.agent}</td>
                <td align="center">
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    backgroundColor: row.cancelled === 'T' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: row.cancelled === 'T' ? '#ef4444' : '#10b981'
                  }}>{row.cancelled === 'T' ? 'CANCELLED' : 'VALID'}</span>
                </td>
                <td align="right" style={{ fontWeight: 600 }}>{Number(row.net_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="6" align="center" style={{ padding: '2rem' }}>{searchInvoiceList ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };  const renderSupplierLocationTable = () => {
    const data = tableData['supplier-location'] || [];
    
    // First, filter by the selected location at the top
    const locationFilteredData = data.filter(row => {
      const loc = (row.location || 'Unknown').toUpperCase();
      return selectedLocation === 'All' || loc === selectedLocation.toUpperCase();
    });

    // Group the filtered data by Debtor Name
    const debtorGroups = {};
    locationFilteredData.forEach(row => {
      const debtor = row.debtor_name || 'Unknown Debtor';
      if (!debtorGroups[debtor]) {
        debtorGroups[debtor] = {
          debtor_name: debtor,
          totalQty: 0,
          totalRevenue: 0,
          items: []
        };
      }
      debtorGroups[debtor].totalQty += Number(row.qty);
      debtorGroups[debtor].totalRevenue += Number(row.revenue);
      debtorGroups[debtor].items.push(row);
    });

    const debtorsList = Object.values(debtorGroups).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Apply search filter
    const searchFilteredDebtors = debtorsList.map(debtor => {
      const filteredItems = debtor.items.filter(item => 
        debtor.debtor_name.toLowerCase().includes(searchSupplier.toLowerCase()) || 
        (item.product || '').toLowerCase().includes(searchSupplier.toLowerCase())
      );
      return { ...debtor, items: filteredItems };
    }).filter(debtor => debtor.debtor_name.toLowerCase().includes(searchSupplier.toLowerCase()) || debtor.items.length > 0);

    const locations = ['All', 'HQ', 'PUCHONG', 'TA', 'STORE', 'SS14', 'NUSA.B'];

    return (
      <TableCard title="Supplier & Location Insights">
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem'}}>
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: selectedLocation === loc ? '#3b82f6' : 'rgba(51, 65, 85, 0.5)',
                color: selectedLocation === loc ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              {loc === 'Unknown' ? 'Unspecified' : loc}
            </button>
          ))}
        </div>
        
        <div style={{marginBottom: '1rem'}}>
          <input 
            type="text" 
            placeholder="Search by debtor or product..." 
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr>
              <th>Debtor Name</th>
              <th align="right">Total Quantity</th>
              <th align="right">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {searchFilteredDebtors.map((debtor, i) => (
              <React.Fragment key={i}>
                <tr 
                  onClick={() => setExpandedDebtor(expandedDebtor === debtor.debtor_name ? null : debtor.debtor_name)}
                  style={{cursor: 'pointer', background: expandedDebtor === debtor.debtor_name ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}}
                >
                  <td style={{fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    {expandedDebtor === debtor.debtor_name ? '▼' : '▶'} {debtor.debtor_name}
                  </td>
                  <td align="right" style={{fontWeight: 600}}>{Number(debtor.totalQty).toLocaleString()}</td>
                  <td align="right" style={{fontWeight: 700, color: '#10b981'}}>{formatCurrency(debtor.totalRevenue)}</td>
                </tr>
                {expandedDebtor === debtor.debtor_name && (
                  <tr>
                    <td colSpan="3" style={{padding: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)'}}>
                      <div style={{padding: '1rem', borderLeft: '3px solid #3b82f6'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                          <thead>
                            <tr style={{borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8'}}>
                              <th style={{padding: '0.5rem', textAlign: 'left'}}>Product Purchased</th>
                              {selectedLocation === 'All' && <th style={{padding: '0.5rem', textAlign: 'left'}}>Location</th>}
                              <th style={{padding: '0.5rem', textAlign: 'right'}}>Quantity</th>
                              <th style={{padding: '0.5rem', textAlign: 'right'}}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {debtor.items.map((item, j) => (
                              <tr key={j} style={{borderBottom: '1px solid rgba(148, 163, 184, 0.1)'}}>
                                <td style={{padding: '0.5rem', fontWeight: 600, color: '#f8fafc'}}>{item.product}</td>
                                {selectedLocation === 'All' && (
                                  <td style={{padding: '0.5rem'}}>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                                      backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6'
                                    }}>{item.location || 'Unknown'}</span>
                                  </td>
                                )}
                                <td style={{padding: '0.5rem', textAlign: 'right'}}>{Number(item.qty).toLocaleString()}</td>
                                <td style={{padding: '0.5rem', textAlign: 'right', color: '#10b981'}}>{formatCurrency(item.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {searchFilteredDebtors.length === 0 && <tr><td colSpan="3" align="center" style={{padding: '2rem'}}>{searchSupplier ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderShippingInsightsTable = () => {
    const filteredData = (tableData.shipping || []).filter(row =>
      row.route.toLowerCase().includes(searchShipping.toLowerCase()) ||
      row.location.toLowerCase().includes(searchShipping.toLowerCase())
    );

    return (
      <TableCard title="Shipping Routes & Logistics Performance">
        <div style={{ marginBottom: '1rem' }}>
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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Route</th><th>Location</th><th style={{ textAlign: 'right' }}>Shipments</th><th style={{ textAlign: 'right' }}>Value (RM)</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={16} />{row.route}
                </td>
                <td>{row.location}</td>
                <td align="right">{row.shipments?.toLocaleString()}</td>
                <td align="right" style={{ fontWeight: 700 }}>{Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="4" align="center" style={{ padding: '2rem' }}>{searchShipping ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderSalesForecastChart = () => (
    <>
      <div className="demo-charts-row">
        <ChartCard title="Sales Trend & AI Forecast" number="1">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tableData['sales-forecast'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="period" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => val ? formatCurrency(val) : '-'} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="forecast" name="AI Projected" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <TableCard title="Forecast Data Output">
          <table className="demo-table">
            <thead>
              <tr><th>Period</th><th style={{ textAlign: 'right' }}>Actual</th><th style={{ textAlign: 'right' }}>Forecast</th></tr>
            </thead>
            <tbody>
              {(tableData['sales-forecast'] || []).map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.period}</td>
                  <td align="right">{row.actual ? Number(row.actual).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                  <td align="right" style={{ color: '#f59e0b', fontWeight: 600 }}>{row.forecast ? Number(row.forecast).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
              ))}
              {(tableData['sales-forecast'] || []).length === 0 && <tr><td colSpan="3" align="center" style={{ padding: '2rem' }}>Loading Data...</td></tr>}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );

  const renderCustomerIntelligenceTable = () => {
    const filteredData = (tableData['customer-intelligence'] || []).filter(row =>
      row.name.toLowerCase().includes(searchCustomerIntelligence.toLowerCase())
    );

    return (
    <TableCard title="Predictive At-Risk Customer Analysis">
      <div style={{ marginBottom: '1rem' }}>
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
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="demo-table">
        <thead>
          <tr><th>Company</th><th style={{ textAlign: 'center' }}>Days Since Order</th><th style={{ textAlign: 'right' }}>Lifetime Value</th><th style={{ textAlign: 'center' }}>Risk Status</th></tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{row.name}</td>
              <td align="center" style={{ color: row.days > 180 ? '#ef4444' : 'inherit' }}>{row.days} Days</td>
              <td align="right" style={{ fontWeight: 700 }}>{Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td align="center">
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  backgroundColor: row.status === 'At Risk' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: row.status === 'At Risk' ? '#ef4444' : '#10b981'
                }}>{row.status}</span>
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="4" align="center" style={{ padding: '2rem' }}>{searchCustomerIntelligence ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </TableCard>
  );
  };

  const renderAnomalyDetectionTable = () => {
    const filteredData = (tableData['anomaly-detection'] || []).filter(row =>
      row.customer.toLowerCase().includes(searchAnomalyDetection.toLowerCase())
    );

    return (
    <TableCard title="AI Outlier Detection (Z-Score Based)">
      <div style={{ marginBottom: '1rem' }}>
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
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
      </div>
      <table className="demo-table">
        <thead>
          <tr><th>Date</th><th>Doc No</th><th>Customer</th><th style={{ textAlign: 'right' }}>Value</th><th style={{ textAlign: 'center' }}>Type</th></tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr key={i}>
              <td style={{ color: '#94a3b8' }}>{row.date}</td>
              <td>{row.doc_no}</td>
              <td style={{ fontWeight: 600 }}>{row.customer}</td>
              <td align="right" style={{ color: '#8b5cf6', fontWeight: 700 }}>{Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td align="center">
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>{row.anomaly_type}</span>
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{ padding: '2rem' }}>{searchAnomalyDetection ? 'No matching results' : 'Loading Data...'}</td></tr>}
        </tbody>
      </table>
    </TableCard>
  );
  };

  const renderTopProductsTable = () => {
    const filteredData = (tableData['top-products'] || []).filter(row =>
      (row.item_code || '').toLowerCase().includes(searchTopProducts.toLowerCase()) ||
      (row.description || '').toLowerCase().includes(searchTopProducts.toLowerCase())
    );

    return (
      <TableCard title="Top Selling Products (Invoice Details)">
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search by item code or description..."
            value={searchTopProducts}
            onChange={(e) => setSearchTopProducts(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <table className="demo-table">
          <thead>
            <tr><th>Item Code</th><th>Description</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Avg Price</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#94a3b8' }}>{row.item_code}</td>
                <td style={{ fontWeight: 500 }}>{row.description || 'No Description'}</td>
                <td align="center">{row.qty?.toLocaleString()}</td>
                <td align="right">{Number(row.avg_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td align="right" style={{ fontWeight: 700, color: '#3b82f6' }}>{Number(row.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan="5" align="center" style={{ padding: '2rem' }}>{searchTopProducts ? 'No matching results' : 'Loading Data...'}</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const renderFinanceDebtorsTable = () => {
    const data = tableData['finance-debtors'] || [];

    // Calculate summary
    const summary = {
      cod: { count: 0, total: 0 },
      net30: { count: 0, total: 0 },
      net60: { count: 0, total: 0 }
    };

    const today = new Date();
    // Default to a date close to recent invoices if they are in the past to show accurate "days left",
    // or just use today. Using today works best for real-time data.

    const enrichedData = data.map(row => {
      const termLower = (row.term || '').toLowerCase();
      let daysToAdd = 0;
      let termType = 'other';

      if (termLower.includes('c.o.d') || termLower.includes('cod')) {
        termType = 'cod';
      } else if (termLower.includes('30')) {
        daysToAdd = 30;
        termType = 'net30';
      } else if (termLower.includes('60')) {
        daysToAdd = 60;
        termType = 'net60';
      }

      if (termType !== 'other') {
        summary[termType].count += 1;
        summary[termType].total += row.total || 0;
      }

      const docDate = new Date(row.doc_date);
      let dueDate = new Date(docDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      const timeDiff = dueDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        ...row,
        dueDate: isNaN(dueDate.getTime()) ? 'Invalid Date' : dueDate.toISOString().split('T')[0],
        daysLeft,
        isOverdue: daysLeft < 0 && daysToAdd > 0
      };
    });

    const filteredData = enrichedData.filter(row =>
      (row.debtor_name || '').toLowerCase().includes(searchFinanceDebtors.toLowerCase()) ||
      (row.doc_no || '').toLowerCase().includes(searchFinanceDebtors.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="demo-kpi-card" style={{ padding: '1.5rem' }}>
            <div className="demo-kpi-label">C.O.D. Expected</div>
            <div className="demo-kpi-value">{formatCurrency(summary.cod.total)}</div>
            <div className="demo-kpi-change positive" style={{ marginTop: '0.5rem' }}>{summary.cod.count} Invoices</div>
          </div>
          <div className="demo-kpi-card" style={{ padding: '1.5rem' }}>
            <div className="demo-kpi-label">Net 30 Receivables</div>
            <div className="demo-kpi-value">{formatCurrency(summary.net30.total)}</div>
            <div className="demo-kpi-change positive" style={{ color: '#f59e0b', marginTop: '0.5rem' }}>{summary.net30.count} Invoices</div>
          </div>
          <div className="demo-kpi-card" style={{ padding: '1.5rem' }}>
            <div className="demo-kpi-label">Net 60 Receivables</div>
            <div className="demo-kpi-value">{formatCurrency(summary.net60.total)}</div>
            <div className="demo-kpi-change positive" style={{ color: '#f59e0b', marginTop: '0.5rem' }}>{summary.net60.count} Invoices</div>
          </div>
        </div>

        <TableCard title="Accounts Receivable (Finance Details)">
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by debtor name or invoice no..."
              value={searchFinanceDebtors}
              onChange={(e) => setSearchFinanceDebtors(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f1f5f9',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <table className="demo-table">
            <thead>
              <tr><th>Invoice No</th><th>Debtor Name</th><th>Term</th><th>Invoice Date</th><th>Due Date</th><th style={{ textAlign: 'center' }}>Days Left</th><th style={{ textAlign: 'right' }}>Total Amount</th></tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>{row.doc_no}</td>
                  <td style={{ fontWeight: 600 }}>{row.debtor_name}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: row.term?.toLowerCase().includes('cod') || row.term?.toLowerCase().includes('c.o.d') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: row.term?.toLowerCase().includes('cod') || row.term?.toLowerCase().includes('c.o.d') ? '#10b981' : '#f59e0b'
                    }}>{row.term || 'Unknown'}</span>
                  </td>
                  <td>{row.doc_date}</td>
                  <td>{row.term?.toLowerCase().includes('cod') || row.term?.toLowerCase().includes('c.o.d') ? 'Immediate' : row.dueDate}</td>
                  <td align="center">
                    {row.term?.toLowerCase().includes('cod') || row.term?.toLowerCase().includes('c.o.d') ? '-' : (
                      <span style={{ color: row.isOverdue ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                        {row.isOverdue ? `${Math.abs(row.daysLeft)} days overdue` : `${row.daysLeft} days`}
                      </span>
                    )}
                  </td>
                  <td align="right" style={{ fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(row.total)}</td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan="7" align="center" style={{ padding: '2rem' }}>{searchFinanceDebtors ? 'No matching results' : 'Loading Data...'}</td></tr>}
            </tbody>
          </table>
        </TableCard>
      </div>
    );
  };

  // Generic table renderer
  const renderTable = (title, columns, dataKey) => {
    const data = tableData[view] || [];
    return (
      <TableCard title={title}>
        <table className="demo-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={col.align ? { textAlign: col.align } : {}}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} style={col.align ? { textAlign: col.align } : {}}>
                    {col.format ? col.format(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : <tr><td colSpan={columns.length} align="center">Loading...</td></tr>}
          </tbody>
        </table>
      </TableCard>
    );
  };

  const getHeaderTitle = () => {
    const titles = {
      'dashboard': 'Executive Overview',
      'revenue': 'Revenue Analysis Data',
      'monthly': 'Monthly Performance Tracking',
      'agent': 'Agent Sales Matrix',
      'top-products': 'Top Performing Item Details',
      'customer-insights': 'Customer Lifetime Database',
      'top-customers': 'High Value Customer Rankings',
      'invoice-list': 'Comprehensive Invoice Registry',
      'invoice-status': 'Invoice Health & Status Tracking',
      'supplier-location': 'Supplier & Location Insights',
      'finance-debtors': 'Accounts Receivable Overview',
      'sales-forecast': 'AI-Powered Sales Trend Forecast',
      'customer-intelligence': 'Predictive Customer Intelligence',
      'anomaly-detection': 'Automated Anomaly & Outlier Detection',
    };
    return titles[view] || 'Executive Overview';
  };

  const getHeaderSubtitle = () => {
    const subtitles = {
      'dashboard': 'A comprehensive executive summary of global sales performance, KPIs, and revenue distribution trends.',
      'revenue': 'Detailed list of recent invoices displaying net totals, debtor names, and specific document records.',
      'monthly': 'Historical performance breakdown detailing total invoice counts and generated revenue on a month-by-month basis.',
      'agent': 'Performance tracking matrix showcasing total generated revenue and invoice volume for each sales agent.',
      'top-products': 'Deep dive into item-level performance tracking individual SKUs and their contribution to the total revenue.',
      'customer-insights': 'Global tracking of customer acquisition dates and their total lifetime spending value.',
      'top-customers': 'Ranked breakdown of the top highest-value customers based on their average order value and overall revenue contribution.',
      'invoice-list': 'Complete registry of all processed invoices including their status (Valid/Cancelled) and net totals.',
      'invoice-status': 'Visual overview of invoice validity to track potential revenue loss from cancelled transactions.',
      'supplier-location': 'Breakdown of purchased products and total revenue filtered across branch locations (HQ, Puchong, TA, etc).',
      'finance-debtors': 'Real-time overview of outstanding receivables, displaying COD, Net 30, and Net 60 statuses alongside active countdowns to payment deadlines.',
      'sales-forecast': 'AI-driven projected sales forecast comparing actual historical output against expected future volume trends.',
      'customer-intelligence': 'Predictive analysis evaluating customer churn risk based on the time elapsed since their last purchase.',
      'anomaly-detection': 'Automated outlier detection powered by mathematics logic to identify abnormal, high-value spikes in invoice activity.',
    };
    return subtitles[view] || '';
  };

  // Show loading screen on initial load
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />;
  }

  return (
    <div className="demo-dashboard-container">
      <aside className="demo-sidebar">
        <div className="demo-sidebar-header">
          <img src="/logo.png" alt="DistributionAI" className="demo-logo" />
          <span className="demo-brand">DistributionAI</span>
        </div>

        <nav className="demo-sidebar-nav">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />

          <NavCategory label="SALES" />
          <NavSubItem label="Revenue Analysis" active={view === 'revenue'} onClick={() => setView('revenue')} />
          <NavSubItem label="Monthly Performance" active={view === 'monthly'} onClick={() => setView('monthly')} />
          <NavSubItem label="Sales by Agent" active={view === 'agent'} onClick={() => setView('agent')} />

          <NavCategory label="PRODUCTS" />
          <NavSubItem label="Top Products Details" active={view === 'top-products'} onClick={() => setView('top-products')} />

          <NavCategory label="CUSTOMERS" />
          <NavSubItem label="Customer Insights" active={view === 'customer-insights'} onClick={() => setView('customer-insights')} />
          <NavSubItem label="Top Customers" active={view === 'top-customers'} onClick={() => setView('top-customers')} />

          <NavCategory label="INVOICES" />
          <NavSubItem label="Invoice List" active={view === 'invoice-list'} onClick={() => setView('invoice-list')} />
          <NavSubItem label="Invoice Status" active={view === 'invoice-status'} onClick={() => setView('invoice-status')} />

          <NavCategory label="LOGISTICS & SUPPLIERS" />
          <NavSubItem label="Supplier Locations" active={view === 'supplier-location'} onClick={() => setView('supplier-location')} />

          <NavCategory label="AI INSIGHTS" />
          <NavSubItem label="Sales Forecast" active={view === 'sales-forecast'} onClick={() => setView('sales-forecast')} />
          <NavSubItem label="Customer Intelligence" active={view === 'customer-intelligence'} onClick={() => setView('customer-intelligence')} />
          <NavSubItem label="Anomaly Detection" active={view === 'anomaly-detection'} onClick={() => setView('anomaly-detection')} />

          <NavCategory label="ACTIONS" />
          <NavItem icon={ArrowLeft} label="Back to Home" onClick={onBack} />
        </nav>

        <div className="demo-sidebar-footer">
          <div className="demo-badge-v2"><Sparkles size={14} /> Live Data</div>
        </div>
      </aside>

      <main className="demo-main">
        <header className="demo-header">
          <div>
            <h1 className="demo-page-title">{getHeaderTitle()}</h1>
            <p className="demo-page-subtitle">{getHeaderSubtitle()}</p>
          </div>
          <div className="demo-header-actions">
            {view === 'dashboard' && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="demo-year-select">
                <option value="All">All Time</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            )}
            <button className="demo-btn-icon"><Download size={18} /></button>
            <button className="demo-btn-primary" onClick={onViewPackages}>View Packages</button>
          </div>
        </header>

        {view === 'dashboard' && renderDashboardView()}
        {view === 'invoice-status' && renderInvoiceStatusChart()}

        {/* Table views */}
        {view === 'revenue' && renderRevenueAnalysisTable()}
        {view === 'monthly' && renderMonthlyPerformanceTable()}
        {view === 'agent' && renderSalesByAgentTable()}
        {view === 'customer-insights' && renderCustomerInsightsTable()}
        {view === 'top-customers' && renderTopCustomersTable()}
        {view === 'invoice-list' && renderInvoiceListTable()}
        {view === 'supplier-location' && renderSupplierLocationTable()}

        {view === 'finance-debtors' && renderFinanceDebtorsTable()}

        {view === 'sales-forecast' && renderSalesForecastChart()}
        {view === 'customer-intelligence' && renderCustomerIntelligenceTable()}
        {view === 'anomaly-detection' && renderAnomalyDetectionTable()}
        {view === 'top-products' && renderTopProductsTable()}

        {view === 'dashboard' && (
          <div className="demo-cta-footer">
            <div className="demo-cta-content">
              <h3>Ready to unlock full access?</h3>
              <p>Get complete dashboard with real-time data from your AutoCount ERP</p>
            </div>
            <button className="demo-btn-primary-large" onClick={onViewPackages}>View Implementation Packages</button>
          </div>
        )}
      </main>
    </div>
  );
}
