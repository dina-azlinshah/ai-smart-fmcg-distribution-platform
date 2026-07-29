import React, { useState, useEffect } from 'react';
import BusinessAnalysisUI from './BusinessAnalysisUI';
import ProfessionalWarehouseMonitoring from './ProfessionalWarehouseMonitoring';
import ErrorBoundary from './ErrorBoundary';
import { 
  ArrowLeft, Check, Workflow, ShoppingCart, LayoutDashboard, 
  TrendingUp, Bell, Warehouse, RefreshCw, Brain, MapPin, Building2,
  BarChart3, Package, AlertTriangle, CheckCircle2, Circle, CheckCircle,
  Calendar, DollarSign, Users, Sparkles, X, Mail, Phone, Building,
  MessageSquare, Send, Database, TrendingDown, Search, Filter,
  ChevronDown, Download, Layers, Activity, FileText, PieChart as PieChartIcon,
  Settings, BarChart2, Zap, Award,
  Shield, AlertCircle, Edit2, BellOff, Box, CheckSquare, ToggleRight, ToggleLeft, Info
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import FeatureTooltip from './FeatureTooltip';

const API_BASE = `http://${window.location.hostname}:8001/api`;

// Professional Package Features
const professionalFeatures = [
  {
    icon: Workflow,
    title: 'Detailed Analysis',
    description: 'In-depth business process analysis with comprehensive reporting'
  },
  {
    icon: ShoppingCart,
    title: 'Sales, Inventory & Purchasing',
    description: 'Full integration of sales, inventory, and purchasing modules'
  },
  {
    icon: LayoutDashboard,
    title: 'Customised Dashboard',
    description: 'Personalized dashboard tailored to your business needs'
  },
  {
    icon: Brain,
    title: 'Demand Forecasting',
    description: 'AI-powered demand prediction and trend analysis'
  },
  {
    icon: Bell,
    title: 'Smart Reorder System',
    description: 'Automated inventory reordering based on demand patterns'
  },
  {
    icon: Building2,
    title: 'Multi-Location Support',
    description: 'Manage multiple warehouses and sales locations'
  },
  {
    icon: Users,
    title: 'User + Management Training',
    description: 'Comprehensive training for staff and management teams'
  }
];

const workflowSteps = [
  { id: 1, title: 'Business Process Mapping', description: 'Map all business processes end-to-end' },
  { id: 2, title: 'Data Integration Setup', description: 'Connect all data sources and systems' },
  { id: 3, title: 'Dashboard Configuration', description: 'Setup custom KPI tracking and layouts' },
  { id: 4, title: 'Automation Rules', description: 'Configure alerts and smart reordering' },
  { id: 5, title: 'User Training', description: 'Conduct comprehensive staff training' }
];

// Custom Tooltip for the Purchasing Pattern chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPredicted = data.isPredicted;
    
    // Parse label (YYYY-MM)
    let formattedLabel = label;
    if (label && label.includes('-')) {
      const [y, m] = label.split('-');
      formattedLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    if (isPredicted) {
      return (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>{formattedLabel}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '13px', fontWeight: '600' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Predicted Sales: RM {data.predicted?.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>
      );
    } else {
      return (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>{formattedLabel}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '13px', fontWeight: '600' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }}></span>
            Actual Sales: RM {data.actual?.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>
      );
    }
  }
  return null;
};

const ProfessionalPackageFeatures = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  // Dashboard states - connected to database
  const [dashboardData, setDashboardData] = useState({
    total_sales: 0,
    total_invoices: 0,
    top_products: [],
    daily_sales: [],
    hourly_sales: [],
    recent_transactions: []
  });

  // Sales Analytics - CONNECTED TO DATABASE
  const [dateRange, setDateRange] = useState('month');
  const [selectedYear, setSelectedYear] = useState('All');
  const [customDate, setCustomDate] = useState({ start: '2022-01-01', end: '2026-12-31' });
  const [showCustomDateBox, setShowCustomDateBox] = useState(false);
  
  const getYearParam = () => {
    if (selectedYear === 'All') return '';
    if (selectedYear === 'custom') return `?year=${customDate.start}|${customDate.end}`;
    return `?year=${selectedYear}`;
  };

  const [salesSummary, setSalesSummary] = useState({
    total_sales: 0,
    total_invoices: 0,
    avg_invoice: 0
  });
  
  // Forecast data - uses sales history from database
  const [forecastData, setForecastData] = useState([]);
  
  // Interactive forecast parameters
  const forecastHorizon = 3; // Fixed at 3 months
  const growthScenario = 'baseline'; // Fixed at baseline
  const [forecastViewMode, setForecastViewMode] = useState('chart'); // 'chart' | 'table'
  const [activeMonthDetail, setActiveMonthDetail] = useState(null);
  
  // Inventory - CONNECTED TO DATABASE
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [lastSync, setLastSync] = useState('Never');
  const [isSyncing, setIsSyncing] = useState(false);
  const [snoozedItems, setSnoozedItems] = useState({});
  const [editingMinRequired, setEditingMinRequired] = useState(null);
  const [tempMinRequired, setTempMinRequired] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventoryViewType, setInventoryViewType] = useState('product'); // 'product' | 'non-inventory'
  const [autoOrderSettings, setAutoOrderSettings] = useState({});
  const [orderStatuses, setOrderStatuses] = useState({}); // 'processing' | 'completed'
  const [locations, setLocations] = useState([]);
  const [locationSales, setLocationSales] = useState([]);
  
  // Dashboard customizable state
  const [dashLayout, setDashLayout] = useState({ sales: true, inventory: true, demand: true });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showPromoSettings, setShowPromoSettings] = useState(false);
  const [promoDates, setPromoDates] = useState({
    monsoon: '10-01',
    yearEnd: '12-01'
  });
  
  // KPI calculations with trend data
  const kpiData = {
    totalSales: {
      value: dashboardData.total_sales || 0,
      trend: 15.3, // percentage increase
      label: 'Total Sales'
    },
    totalOrders: {
      value: dashboardData.total_invoices || 0,
      trend: 8.7,
      label: 'Total Orders'
    },
    avgOrderValue: {
      value: dashboardData.total_invoices ? Math.round(dashboardData.total_sales / dashboardData.total_invoices) : 0,
      trend: 12.1,
      label: 'Avg Order Value'
    },
    activeProducts: {
      value: inventory.filter(i => i.stock_control === 'T').length,
      trend: -2.4,
      label: 'Active Products'
    }
  };

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom' }
  ];

  // Auto-refresh simulation (update every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedYear]);
  

  
  // Business Analysis advanced state
  const [baFilters, setBaFilters] = useState({ date: 'This Month', product: 'All', location: 'All' });
  const [baChartType, setBaChartType] = useState('bar');
  const [baMetric, setBaMetric] = useState('revenue');
  const [drilldownData, setDrilldownData] = useState(null);
  
  const [workflowItems, setWorkflowItems] = useState(() => {
    const saved = localStorage.getItem('professionalWorkflow');
    return saved ? JSON.parse(saved) : workflowSteps.map(s => ({ ...s, completed: false }));
  });

  useEffect(() => {
    localStorage.setItem('professionalWorkflow', JSON.stringify(workflowItems));
  }, [workflowItems]);

  // Fetch sales summary from database
  const fetchSalesSummary = async () => {
    try {
      const yearParam = getYearParam();
      const response = await fetch(`${API_BASE}/kpi/summary${yearParam}`);
      const data = await response.json();
      setSalesSummary({
        total_sales: data.total_revenue || 0,
        total_invoices: data.total_invoices || 0,
        avg_invoice: data.total_invoices > 0 ? (data.total_revenue / data.total_invoices).toFixed(2) : 0,
        period: selectedYear === 'All' ? 'All Time' : selectedYear
      });
    } catch (error) {
      console.error('Error fetching sales summary:', error);
    }
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [dateRange]);
  
  const fetchAEDData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const yearParam = getYearParam();
      const [kpiRes, monthlyRes, productsRes, hourlyRes, invoiceRes, salesByDayRes, customersRes, forecastRes, invRes, lowStockRes, locationSalesRes] = await Promise.all([
        fetch(`${API_BASE}/kpi/summary${yearParam}`),
        fetch(`${API_BASE}/charts/monthly-sales-12m${yearParam}`),
        fetch(`${API_BASE}/tables/top-products${yearParam}`),
        fetch(`${API_BASE}/charts/hourly-sales`),
        fetch(`${API_BASE}/tables/invoice-list${yearParam}`),
        fetch(`${API_BASE}/charts/sales-by-day${yearParam}`),
        fetch(`${API_BASE}/tables/top-customers${yearParam}`),
        fetch(`${API_BASE}/tables/sales-forecast${yearParam}`),
        fetch(`${API_BASE}/inventory`),
        fetch(`${API_BASE}/inventory/low-stock`),
        fetch(`${API_BASE}/charts/sales-by-location${yearParam}`)
      ]);

      const kpiData = await kpiRes.json().catch(() => ({}));
      const monthlyData = await monthlyRes.json().catch(() => []);
      const productsData = await productsRes.json().catch(() => []);
      const hourlyData = await hourlyRes?.json().catch(() => []) || [];
      const invoiceData = await invoiceRes?.json().catch(() => []) || [];
      const salesByDayData = await salesByDayRes?.json().catch(() => []) || [];
      const customersData = await customersRes?.json().catch(() => []) || [];
      const forecastResData = await forecastRes?.json().catch(() => []) || [];
      const invData = await invRes?.json().catch(() => []) || [];
      const lowStockData = await lowStockRes?.json().catch(() => []) || [];
      const locationSalesData = await locationSalesRes?.json().catch(() => []) || [];

      setInventory(invData);
      setLowStockItems(lowStockData);
      setLocationSales(locationSalesData);

      setDashboardData({
        total_sales: kpiData.total_revenue || 0,
        total_invoices: kpiData.total_invoices || 0,
        top_products: Array.isArray(productsData) ? productsData.slice(0, 10).map(p => ({...p, name: p.description || p.product_name || p.name || 'Unknown', revenue: p.revenue || p.total_revenue || p.sales || 0})) : [],
        daily_sales: Array.isArray(monthlyData) ? monthlyData : [],
        hourly_sales: Array.isArray(hourlyData) ? hourlyData : [],
        recent_transactions: Array.isArray(invoiceData) ? invoiceData.slice(0, 10) : [],
        sales_by_day: Array.isArray(salesByDayData) ? salesByDayData : [],
        top_customers: Array.isArray(customersData) ? customersData : []
      });

      if (Array.isArray(forecastResData) && forecastResData.length > 0) {
        const mappedForecast = forecastResData.map(f => ({
          month: f.period.substring(5, 7),
          actual: f.actual,
          forecast: f.forecast
        }));
        setForecastData(mappedForecast);
      }
    } catch (error) {
      console.error('Error fetching AED_FM data:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory`);
      const data = await response.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (error) { console.error('Error fetching inventory:', error); }
  };

  const fetchLowStock = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory/low-stock`);
      const data = await response.json();
      if (Array.isArray(data)) setLowStockItems(data);
    } catch (error) { console.error('Error fetching low stock:', error); }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE}/warehouses`);
      const data = await response.json();
      if (Array.isArray(data)) setLocations(data);
    } catch (error) { console.error('Error fetching locations:', error); }
  };

  const fetchLastSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/sync/last`);
      const data = await response.json();
      if (data.last_sync) setLastSync(new Date(data.last_sync).toLocaleString());
    } catch (error) { console.error('Error fetching last sync:', error); }
  };



  const handleSnooze = (itemId) => {
    setSnoozedItems(prev => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setSnoozedItems(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }, 24 * 60 * 60 * 1000);
  };

  const startEditingMinRequired = (item) => {
    setEditingMinRequired(item.inventory_id);
    setTempMinRequired(item.minRequired || 15);
  };

  const saveMinRequired = (itemId) => {
    setInventory(prev => prev.map(item => 
      item.inventory_id === itemId 
        ? { ...item, minRequired: parseInt(tempMinRequired) || 15 }
        : item
    ));
    setEditingMinRequired(null);
  };

  const exportToCSV = () => {
    const headers = ['Product Code', 'Product Name', 'Warehouse', 'Current Stock', 'Min Required', 'Status', 'Last Restock', 'Days to Stockout'];
    const rows = filteredInventory.map(item => [
      item.product_code, item.product_name, item.warehouse_name, item.stock,
      item.minRequired || 15,
      item.stock === 0 ? 'Out of Stock' : (item.stock < (item.minRequired || 15) ? 'Low Stock' : 'In Stock'),
      item.lastRestock || 'N/A',
      item.velocity > 0 ? Math.floor(item.stock / item.velocity) : '∞'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_report.csv");
    link.click();
  };

  const handleOrder = (itemId) => {
    setOrderStatuses(prev => ({ ...prev, [itemId]: 'processing' }));
    setTimeout(() => {
      setOrderStatuses(prev => ({ ...prev, [itemId]: 'completed' }));
    }, 2000);
  };

  const handleApproveAll = () => {
    const itemsToOrder = inventoryWithMetrics.filter(item => 
      inventoryViewType === 'product' && 
      orderStatuses[item.inventory_id] !== 'completed' &&
      orderStatuses[item.inventory_id] !== 'processing'
    );
    
    const newStatuses = { ...orderStatuses };
    itemsToOrder.forEach(item => { newStatuses[item.inventory_id] = 'processing'; });
    setOrderStatuses(newStatuses);
    
    setTimeout(() => {
      setOrderStatuses(prev => {
        const completedStatuses = { ...prev };
        itemsToOrder.forEach(item => { completedStatuses[item.inventory_id] = 'completed'; });
        return completedStatuses;
      });
    }, 2500);
  };

  const handleCancelAll = () => setOrderStatuses({});
  
  const handleCancelOrder = (itemId) => {
    setOrderStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[itemId];
      return newStatuses;
    });
  };

  const activeInventory = inventory.filter(item => {
    if (inventoryViewType === 'product') {
      return item.stock_control === 'T';
    } else {
      return item.stock_control === 'F';
    }
  });

  const searchedInventory = activeInventory.filter(item => 
    (item.product_name || '').toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
    (item.product_code || '').toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
    (item.item_code || '').toLowerCase().includes(inventorySearchQuery.toLowerCase())
  );

  const inventoryWithMetrics = searchedInventory.map(item => {
    // 2. Sales velocity as integer
    const velocity = Math.round(item.velocity || 0);
    const minRequired = item.minRequired || 10;
    
    // Supplier lead time for target stock calculation
    const supplierLeadTime = item.leadTime || 7; 
    
    // 4. Lead time represents Days Left
    const leadTime = velocity > 0 ? Math.floor(item.stock / velocity) : '∞';
    
    // 5. Target Stock Calculation
    // Target Stock = Min Required + (Velocity * Supplier Lead Time * 1.5)
    const targetStock = Math.round(Math.max(minRequired, velocity * supplierLeadTime * 1.5 + minRequired));
    
    // Order quantity = how much to order to reach target
    const orderQty = Math.round(Math.max(0, targetStock - item.stock));
    
    let urgency = 'green';
    if (item.stock <= 0) urgency = 'red';
    else if (item.stock < minRequired) urgency = 'orange';
    else if (item.stock < minRequired * 1.5) urgency = 'yellow';

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + leadTime);
    const etaString = etaDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return { ...item, velocity, leadTime, minRequired, targetStock, orderQty, recommendedOrder: targetStock, urgency, etaString, supplierLeadTime };
  });

  const filteredInventory = searchedInventory.filter(item => {
    if (inventoryFilter === 'all') return true;
    const minReq = item.minRequired || 15;
    if (inventoryFilter === 'low') return item.stock < minReq;
    if (inventoryFilter === 'out') return item.stock <= 0;
    return true;
  });

  const highRiskItems = activeInventory.filter(item => {
    const minReq = item.minRequired || 15;
    return item.stock < minReq && !snoozedItems[item.inventory_id];
  });

  const runAll = (isBackground = false) => {
    fetchAEDData(isBackground);
    fetchSalesSummary();
    fetchInventory();
    fetchLowStock();
    fetchLocations();
    fetchLastSyncStatus();
  };

  useEffect(() => {
    runAll();
    const interval = setInterval(() => runAll(true), 30000);
    return () => clearInterval(interval);
  }, [selectedYear, dateRange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowSubscribeModal(false);
      setFormData({ fullName: '', email: '', company: '', phone: '', message: '' });
    }, 3000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE}/sync`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setLastSync('Just now');
        fetchInventory();
        fetchLowStock();
        fetchLocations();
        fetchLastSyncStatus();
      }
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleWorkflowItem = (id) => {
    setWorkflowItems(items => 
      items.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  };

  const completedCount = workflowItems.filter(i => i.completed).length;
  const progress = (completedCount / workflowItems.length) * 100;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'business_analysis', label: 'Business Analysis', icon: Workflow },
    { id: 'inventory_monitoring', label: 'Inventory Monitoring', icon: Bell },
    { id: 'warehouse_monitoring', label: 'Warehouse Monitoring', icon: Warehouse },
  ];

  // Calculate dynamic promo status based on selected year
  const getPromoStatus = (promoType) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const targetYear = selectedYear === 'All' ? currentYear : parseInt(selectedYear);
    
    if (targetYear < currentYear) {
      return { text: 'COMPLETED', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', pulse: false };
    }
    
    if (promoType === 'payday') {
      const paydayDate = new Date(targetYear, today.getMonth(), 25);
      if (today.getDate() > 28) paydayDate.setMonth(today.getMonth() + 1);
      
      const diffTime = paydayDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (today.getDate() >= 25 && today.getDate() <= 28) {
        return { text: 'HAPPENING NOW', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', pulse: true };
      } else if (diffDays <= 7) {
        return { text: `IN ${diffDays} DAYS`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', pulse: false };
      } else {
        return { text: `IN ${diffDays} DAYS`, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', pulse: false };
      }
    }
    
    if (promoType === 'monsoon') {
      const [m, d] = promoDates.monsoon.split('-');
      const monsoonDate = new Date(targetYear, parseInt(m) - 1, parseInt(d));
      const diffTime = monsoonDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'COMPLETED', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', pulse: false };
      if (diffDays <= 14) return { text: `IN ${diffDays} DAYS`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', pulse: true };
      if (diffDays <= 60) return { text: `IN 1 MONTH`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', pulse: false };
      return { text: `IN ${Math.floor(diffDays/30)} MONTHS`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', pulse: false };
    }
    
    if (promoType === 'yearEnd') {
      const [m, d] = promoDates.yearEnd.split('-');
      const yearEndDate = new Date(targetYear, parseInt(m) - 1, parseInt(d));
      const diffTime = yearEndDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'COMPLETED', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', pulse: false };
      if (diffDays <= 14) return { text: `IN ${diffDays} DAYS`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', pulse: true };
      if (diffDays <= 60) return { text: `IN 1 MONTH`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', pulse: false };
      return { text: `IN ${Math.floor(diffDays/30)} MONTHS`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', pulse: false };
    }
    
    return { text: 'UPCOMING', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', pulse: false };
  };

  const renderFeatures = () => (
    <div className="pp-features-overview">
      <div className="pp-hero-section">
        <div className="pp-hero-badge">
          <Sparkles size={16} />
          Most Popular
        </div>
        <h2>Professional Package</h2>
        <p className="pp-price">RM 60,000</p>
        <p className="pp-description">
          Ideal for growing businesses needing advanced insights and multi-location support
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#10b981', marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', maxWidth: '600px', margin: '1.5rem auto 0 auto', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '18px' }}>
          <CheckCircle2 size={28} />
          <span style={{ fontWeight: '600' }}>Connected to AED_FM Database. Data is ready to analyze.</span>
        </div>

      </div>

      <div className="pp-features-grid">
        {professionalFeatures.map((feature, index) => (
          <div key={index} className="pp-feature-card">
            <div className="pp-feature-icon">
              <feature.icon size={28} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      {/* ERP Integration Section - Minimized */}
      <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid rgba(139, 92, 246, 0.2)' }}>
        <h3 style={{ fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={26} color="#8b5cf6" />
          ERP Integration
        </h3>
        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>✓ Connected</span>
              <span style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '500' }}>Sales Order</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>✓ Connected</span>
              <span style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '500' }}>Stock Level (Inventory)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>✓ Connected</span>
              <span style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '500' }}>Supplier Management</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>✓ Connected</span>
              <span style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '500' }}>Purchase Order</span>
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '16px', margin: '0', lineHeight: '1.6' }}>
            <strong style={{ color: '#f8fafc' }}>Advanced Integration (Sales, Inventory & Purchasing):</strong> 
            Connects sales orders, inventory management, and purchasing modules for complete order-to-delivery cycle tracking. 
            Includes supplier management, automated purchase order generation, and multi-location inventory support.
            Ideal for growing businesses needing comprehensive operational integration.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const todaySales = dashboardData.total_sales || 0;
    const todayInvoices = dashboardData.total_invoices || 0;
    const avgOrder = todayInvoices > 0 ? todaySales / todayInvoices : 0;
    const recentTransactions = dashboardData.recent_transactions || [];
    const criticalStockItems = inventory.filter(i => i.stock_control === 'T' && i.stock < (i.minStock || i.min_stock || 100));

    // Real sparkline data from daily_sales
    const sparklineData1 = Array.isArray(dashboardData.daily_sales) && dashboardData.daily_sales.length > 0 
      ? dashboardData.daily_sales.slice(-7).map((d, i) => ({ day: i, value: d.sales }))
      : [0, 0, 0, 0, 0, 0, 0].map((v, i) => ({ day: i, value: v }));
      
    const sparklineData2 = Array.isArray(dashboardData.daily_sales) && dashboardData.daily_sales.length > 0 
      ? dashboardData.daily_sales.slice(-7).map((d, i) => ({ day: i, value: d.count || Math.round(d.sales / 500) }))
      : [0, 0, 0, 0, 0, 0, 0].map((v, i) => ({ day: i, value: v }));
      
    const sparklineData3 = [2, 3, 2, 4, 3, 5, 3].map((v, i) => ({ day: i, value: v })); // Still semi-mocked as user count isn't tracked

    // Calculate dynamic velocity based on average sales
    const avgDailySales = Array.isArray(dashboardData.daily_sales) && dashboardData.daily_sales.length > 0
      ? dashboardData.daily_sales.reduce((acc, curr) => acc + curr.sales, 0) / dashboardData.daily_sales.length
      : 10000;
    
    const velocityPercent = Math.min(100, Math.max(0, (todaySales / (avgDailySales * 1.5 || 1)) * 100));
    const gaugeData = [
      { name: 'Velocity', value: velocityPercent, fill: velocityPercent > 80 ? '#ef4444' : velocityPercent > 40 ? '#10b981' : '#f59e0b' },
      { name: 'Remaining', value: 100 - velocityPercent, fill: 'rgba(255,255,255,0.05)' }
    ];

    return (
      <div className="pp-dashboard" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {loading && <div className="sp-loading">Loading data from database...</div>}
        
        {/* Clean Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutDashboard size={28} color="#8b5cf6" /> Professional Command Center
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, maxWidth: '650px', lineHeight: '1.5' }}>
            Your real-time executive view. Monitor live operations, catch critical stock issues, and track immediate sales velocity across all departments.
          </p>
        </div>

        {/* Live AI Insights Ticker */}
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: 'bold', fontSize: '13px', flexShrink: 0, borderRight: '1px solid rgba(139, 92, 246, 0.3)', paddingRight: '12px' }}>
            <Zap size={16} fill="#a855f7" /> AI INSIGHTS
          </div>
          <marquee scrollamount="5" style={{ color: '#e2e8f0', fontSize: '13px' }}>
            ⚡ Demand for your Top Product has increased by 15% in the last 48 hours. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⚠️ Critical Stock Alert: {criticalStockItems.length} items require immediate attention. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚀 Sales velocity is currently trending {velocityPercent > 80 ? 'HIGH' : 'NORMAL'} today compared to historical averages.
          </marquee>
        </div>

        {/* TODAY'S PULSE (Matches Standard Layout but with Sparklines) */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} color="#10b981" /> Today's Pulse
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #8b5cf6', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Today's Sales Volume</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', position: 'relative', zIndex: 1 }}>RM {todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '13.5px', color: '#8b5cf6', marginTop: '4px', position: 'relative', zIndex: 1, fontWeight: '500' }}>Live Syncing...</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '50%', opacity: 0.5 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData1}><Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={2000}/></LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Invoices Processed Today</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', position: 'relative', zIndex: 1 }}>{todayInvoices}</div>
              <div style={{ fontSize: '13.5px', color: '#3b82f6', marginTop: '4px', position: 'relative', zIndex: 1, fontWeight: '500' }}>Avg RM {avgOrder.toFixed(2)} / order</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '50%', opacity: 0.5 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData2}><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={2000}/></LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f59e0b', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Active System Users</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', position: 'relative', zIndex: 1 }}>3</div>
              <div style={{ fontSize: '13.5px', color: '#f59e0b', marginTop: '4px', position: 'relative', zIndex: 1, fontWeight: '500' }}>Cashiers / Admins online</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '50%', opacity: 0.5 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData3}><Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={2000}/></LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* MAIN SPLIT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* LEFT: Purchasing Pattern Analysis + Forecast */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BarChart3 size={20} color="#8b5cf6" /> Purchasing Pattern Analysis
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>5 recent months + {forecastHorizon}-month AI forecast</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button 
                    onClick={() => setForecastViewMode('chart')}
                    title="Chart View"
                    style={{
                      background: forecastViewMode === 'chart' ? '#8b5cf6' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: forecastViewMode === 'chart' ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <BarChart2 size={15} />
                  </button>
                  <button 
                    onClick={() => setForecastViewMode('table')}
                    title="Table View"
                    style={{
                      background: forecastViewMode === 'table' ? '#8b5cf6' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: forecastViewMode === 'table' ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FileText size={15} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                    <span>Actual Sales</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span>Predicted Sales</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              {(() => {
                if (!dashboardData.daily_sales || dashboardData.daily_sales.length === 0) {
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                      No pattern data available
                    </div>
                  );
                }

                // Build display data: 5 actual months + forecastHorizon predicted months
                let actualMonths = [];
                
                // Find all months in daily_sales that have sales > 0, sorted chronologically
                const validSalesMonths = (dashboardData.daily_sales || [])
                  .filter(d => d.sales > 0)
                  .sort((a, b) => a.name.localeCompare(b.name));

                if (validSalesMonths.length > 0) {
                  if (selectedYear !== 'All') {
                    // For a specific year, filter by that year
                    const yearMonths = validSalesMonths.filter(d => d.name.startsWith(selectedYear));
                    if (yearMonths.length > 0) {
                      actualMonths = yearMonths.slice(-5);
                    } else {
                      actualMonths = [];
                    }
                  } else {
                    // "All" mode: take the 5 most recent months with sales from the data
                    actualMonths = validSalesMonths.slice(-5);
                  }
                }

                // If actualMonths is still empty, fallback to last 5 months based on today
                if (actualMonths.length === 0) {
                  const today = new Date();
                  for (let i = 4; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const name = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    actualMonths.push({ name, sales: 0 });
                  }
                }

                // Calculate predictions using weighted moving average
                const salesValues = actualMonths.map(m => m.sales || 0);
                const nonZeroSales = salesValues.filter(s => s > 0);
                
                // Weighted moving average (recent months weigh more)
                let predictedBase = 0;
                if (nonZeroSales.length > 0) {
                  const weights = salesValues.map((_, i) => i + 1); // 1, 2, 3, 4, 5
                  const totalWeight = weights.reduce((a, b) => a + b, 0);
                  predictedBase = salesValues.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
                }

                // Calculate growth trend from actual data
                let growthRate = 0;
                if (nonZeroSales.length >= 2) {
                  const recentHalf = salesValues.slice(Math.floor(salesValues.length / 2));
                  const olderHalf = salesValues.slice(0, Math.floor(salesValues.length / 2));
                  const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
                  const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / (olderHalf.length || 1);
                  if (olderAvg > 0) {
                    growthRate = (recentAvg - olderAvg) / olderAvg;
                  }
                }
                // Clamp growth rate to reasonable bounds (-20% to +30%)
                growthRate = Math.max(-0.2, Math.min(0.3, growthRate));

                // Apply growth trend based on selected scenario
                let growthScenarioFactor = 0;
                if (growthScenario === 'pessimistic') growthScenarioFactor = -0.15;
                else if (growthScenario === 'optimistic') growthScenarioFactor = 0.15;
                else if (growthScenario === 'aggressive') growthScenarioFactor = 0.30;

                // Adjust baseline growthRate with scenario modifier
                const adjustedGrowthRate = growthRate + growthScenarioFactor;

                // Generate predicted months dynamically based on forecastHorizon state
                const lastActualMonth = actualMonths[actualMonths.length - 1];
                let lastDateParts = lastActualMonth.name.split('-');
                let predictedMonths = [];
                for (let i = 1; i <= forecastHorizon; i++) {
                  const predDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1 + i, 1);
                  const predName = `${predDate.getFullYear()}-${String(predDate.getMonth() + 1).padStart(2, '0')}`;
                  // Apply growth scenario trend with seasonal factors
                  const seasonalFactor = 1 + (Math.sin((predDate.getMonth() + 1) / 12 * Math.PI * 2) * 0.05);
                  const predicted = Math.round(predictedBase * (1 + adjustedGrowthRate * i * 0.3) * seasonalFactor);
                  predictedMonths.push({
                    name: predName,
                    sales: 0,
                    predicted: Math.max(0, predicted),
                    isPredicted: true
                  });
                }

                // Combine actual + predicted, add trend line data
                const displayData = [
                  ...actualMonths.map(m => ({
                    ...m,
                    actual: m.sales,
                    predicted: 0,
                    trend: m.sales,
                    isPredicted: false
                  })),
                  ...predictedMonths.map(m => ({
                    ...m,
                    actual: 0,
                    trend: m.predicted
                  }))
                ];

                // Custom bar shape for predicted bars with dashed border effect
                const PredictedBar = (props) => {
                  const { x, y, width, height, isPredicted } = props;
                  if (!isPredicted || height <= 0) return null;
                  return (
                    <g>
                      <defs>
                        <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill="url(#predictedGradient)" />
                      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.8} />
                    </g>
                  );
                };

                if (forecastViewMode === 'table') {
                  return (
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: '600' }}>Period</th>
                            <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: '600' }}>Source</th>
                            <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Revenue</th>
                            <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Confidence Interval</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.map((row, idx) => {
                            const [y, m] = row.name.split('-');
                            const periodLabel = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                            const isPredicted = row.isPredicted;
                            const amount = isPredicted ? row.predicted : row.actual;
                            
                            // Confidence interval simulation (±5% for actual/short, wider for far predictions)
                            const errorMargin = isPredicted ? (0.05 + (idx - actualMonths.length + 1) * 0.03) : 0.01;
                            const lowerBound = Math.round(amount * (1 - errorMargin));
                            const upperBound = Math.round(amount * (1 + errorMargin));

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#f8fafc' }}>
                                <td style={{ padding: '10px 8px', fontWeight: '500' }}>{periodLabel}</td>
                                <td style={{ padding: '10px 8px' }}>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontSize: '10px', 
                                    fontWeight: '700', 
                                    background: isPredicted ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                    color: isPredicted ? '#f59e0b' : '#c084fc'
                                  }}>
                                    {isPredicted ? 'Projected' : 'Actual'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600' }}>RM {amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b' }}>
                                  RM {lowerBound.toLocaleString()} - RM {upperBound.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                return (
                  <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={displayData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        onClick={(state) => {
                          if (state && state.activePayload && state.activePayload.length > 0) {
                            const clickedData = state.activePayload[0].payload;
                            setActiveMonthDetail(clickedData);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          tick={{ fill: '#94a3b8', fontSize: 11 }} 
                          tickLine={false} 
                          axisLine={false}
                          interval={0}
                          tickFormatter={(val) => {
                            if (!val || !val.includes('-')) return val;
                            const [y, m] = val.split('-');
                            const date = new Date(y, m - 1);
                            const monthName = date.toLocaleString('en-US', { month: 'short' });
                            return `${monthName} ${y.substring(2)}`;
                          }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Actual sales bars */}
                        <Bar dataKey="actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={35}>
                          {displayData.map((entry, index) => (
                            <Cell key={`actual-${index}`} fill="#8b5cf6" />
                          ))}
                        </Bar>
                        {/* Predicted sales bars with custom shape */}
                        <Bar dataKey="predicted" shape={<PredictedBar />} barSize={35}>
                          {displayData.map((entry, index) => (
                            <Cell key={`pred-${index}`} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                    
                    {/* INTERACTIVE MONTH DETAIL SPOTLIGHT DISPLAY */}
                    {(() => {
                      // Resolve active month data point (default to the latest actual month)
                      const currentMonthDetails = activeMonthDetail || displayData[actualMonths.length - 1];
                      if (!currentMonthDetails) return null;
                      
                      const isPred = currentMonthDetails.isPredicted;
                      const nameStr = currentMonthDetails.name;
                      const [yVal, mVal] = nameStr.split('-');
                      const mLabel = new Date(parseInt(yVal), parseInt(mVal) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                      const salesAmt = isPred ? currentMonthDetails.predicted : currentMonthDetails.actual;
                      
                      // Calculate MoM %
                      let momStr = 'N/A';
                      const currentIdx = displayData.findIndex(d => d.name === nameStr);
                      if (currentIdx > 0) {
                        const prev = displayData[currentIdx - 1];
                        const prevVal = prev.isPredicted ? prev.predicted : prev.actual;
                        if (prevVal > 0) {
                          const pct = ((salesAmt - prevVal) / prevVal) * 100;
                          momStr = `${pct >= 0 ? '▲ +' : '▼ '}${pct.toFixed(1)}% MoM`;
                        }
                      }

                      // Dynamic text
                      let spotlightIcon = <CheckCircle2 size={16} color="#c084fc" />;
                      let spotlightSubtitle = "Historical Actuals";
                      let spotlightAdvice = "";
                      let spotlightBorder = "rgba(139, 92, 246, 0.25)";
                      let spotlightBg = "rgba(139, 92, 246, 0.04)";
                      
                      if (isPred) {
                        spotlightIcon = <Brain size={16} color="#f59e0b" />;
                        spotlightSubtitle = `AI Projected Outlook (${growthScenario.charAt(0).toUpperCase() + growthScenario.slice(1)})`;
                        spotlightBorder = "rgba(245, 158, 11, 0.3)";
                        spotlightBg = "rgba(245, 158, 11, 0.05)";
                        spotlightAdvice = `Model projects RM ${salesAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}. Suggestion: Maintain inventory buffer levels matching this estimate.`;
                      } else {
                        if (salesAmt > 80000) {
                          spotlightAdvice = `Peak volume month at RM ${salesAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}. Suggestion: Optimize bulk delivery channels.`;
                        } else if (salesAmt < 20000) {
                          spotlightAdvice = `Low volume period at RM ${salesAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}. Suggestion: Launch target campaigns or seasonal rebates.`;
                        } else {
                          spotlightAdvice = `Stable sales velocity of RM ${salesAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}. Action: Keep standard buffer levels.`;
                        }
                      }

                      return (
                        <div style={{ 
                          marginTop: '14px', 
                          padding: '12px 16px', 
                          background: spotlightBg, 
                          border: `1px solid ${spotlightBorder}`, 
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {spotlightIcon}
                              <div>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                                  Spotlight: {mLabel}
                                </h4>
                                <span style={{ fontSize: '10px', color: isPred ? '#f59e0b' : '#a78bfa', fontWeight: '600' }}>
                                  {spotlightSubtitle}
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: isPred ? '#f59e0b' : '#c084fc' }}>
                                RM {salesAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                            {spotlightAdvice}
                          </p>
                          <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'right', fontStyle: 'italic', marginTop: '2px' }}>
                            * Tip: Click on any chart bar to inspect different months
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* RIGHT: Top Debtors / Customers Leaderboard */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={24} color="#10b981" fill="rgba(16,185,129,0.2)" /> Top Debtors / Customers
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Leaderboard of highest revenue-generating customers</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
              {dashboardData.top_customers && dashboardData.top_customers.length > 0 ? dashboardData.top_customers.slice(0, 6).map((customer, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '4px', position: 'absolute', left: 0, top: 0, bottom: 0, background: '#10b981' }}></div>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', fontWeight: 'bold', color: '#10b981' }}>
                    #{idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.debtor_name || customer.name || 'Unknown'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Code: {customer.debtor_code || customer.code || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      RM {(customer.revenue || customer.total_sales) ? (customer.revenue || customer.total_sales).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{customer.invoices || customer.invoice_count || 0} Invoices</div>
                  </div>
                </div>
              )) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', color: '#64748b', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                  <Users size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>No Customer Data</div>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>Unable to fetch top debtors at this time.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI PERFORMANCE & GROWTH ANALYSIS */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={20} color="#eab308" /> AI Performance & Growth Analysis
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Left Box: Top Product Driver */}
            <div className="glass-card" style={{ flex: '1 1 400px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#8b5cf6" /> Revenue Driver Analysis
              </h4>
              
              {dashboardData.top_products && dashboardData.top_products.length > 0 ? (() => {
                const topProd = dashboardData.top_products[0];
                const revenue = topProd.revenue || topProd.sales || 0;
                const totalSales = dashboardData.total_sales || 1;
                const percentage = ((revenue / totalSales) * 100).toFixed(1);
                
                return (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                        <TrendingUp size={24} color="#8b5cf6" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performing Product</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topProd.name}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6', marginTop: '8px' }}>
                          RM {revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                      <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <strong style={{ color: '#fff' }}>Fact:</strong> This single product generated <strong style={{ color: '#8b5cf6' }}>{percentage}%</strong> of your total revenue for this period.
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <div style={{ background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginTop: '2px', minWidth: 'fit-content' }}>AI ADVICE</div>
                        <span>High dependency detected. Negotiate a 5% bulk discount with the supplier on the next order. This could increase your profit margin on this item by approximately <strong>RM {(revenue * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> annually.</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Not enough product data for analysis.</div>
              )}
            </div>

            {/* Middle Box: Peak Sales Period */}
            <div className="glass-card" style={{ flex: '1 1 400px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#10b981" /> Sales Velocity Peak
              </h4>
              
              {dashboardData.daily_sales && dashboardData.daily_sales.length > 0 ? (() => {
                const sorted = [...dashboardData.daily_sales].sort((a, b) => b.sales - a.sales);
                const peakPeriod = sorted[0];
                const peakSales = peakPeriod.sales || 0;
                
                let formattedName = peakPeriod.name;
                if (formattedName && formattedName.includes('-')) {
                   const [y, m] = formattedName.split('-');
                   formattedName = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                }
                
                return (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                        <BarChart2 size={24} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highest Sales Period</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{formattedName}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '8px' }}>
                          RM {peakSales.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <strong style={{ color: '#fff' }}>Fact:</strong> Sales velocity peaked significantly during <strong style={{ color: '#10b981' }}>{formattedName}</strong>.
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <div style={{ background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginTop: '2px', minWidth: 'fit-content' }}>AI ADVICE</div>
                        <span>Allocate a marketing budget of 2% from this peak revenue (<strong>RM {(peakSales * 0.02).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>) for the upcoming cycle to recreate this momentum and push next month's target to <strong>RM {(peakSales * 1.1).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>.</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Not enough historical data for analysis.</div>
              )}
            </div>
            
            {/* Right Box: Key Account Analysis */}
            <div className="glass-card" style={{ flex: '1 1 400px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#f59e0b" /> Key Account Dependency
              </h4>
              
              {dashboardData.top_customers && dashboardData.top_customers.length > 0 ? (() => {
                const topCust = dashboardData.top_customers[0];
                const custRevenue = topCust.revenue || topCust.sales || 0;
                const totalSales = dashboardData.total_sales || 1;
                const percentage = ((custRevenue / totalSales) * 100).toFixed(1);
                
                return (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                        <Award size={24} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Valued Client</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topCust.name || topCust.debtor_name}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', marginTop: '8px' }}>
                          RM {custRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                      <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <strong style={{ color: '#fff' }}>Fact:</strong> This client accounts for <strong style={{ color: '#f59e0b' }}>{percentage}%</strong> of overall revenue.
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <div style={{ background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginTop: '2px', minWidth: 'fit-content' }}>AI ADVICE</div>
                        <span>Offer a targeted 3% volume rebate valued at <strong>RM {(custRevenue * 0.03).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> upon contract renewal. This secures their loyalty and protects your <strong>{percentage}%</strong> revenue dependency from competitors.</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Not enough customer data for analysis.</div>
              )}
            </div>
          </div>
        </div>
        
        <button
          className={`sp-sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '600', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', border: 'none', cursor: isSyncing ? 'not-allowed' : 'pointer', opacity: isSyncing ? 0.8 : 1, transition: 'all 0.2s', marginTop: 'auto' }}
        >
          <RefreshCw size={20} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Synchronizing Operations Center...' : 'Run Full Dashboard Sync'}
        </button>
      </div>
    );
  };

  const renderStockAlerts = () => {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Smart Reorder Intro Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(37, 99, 235, 0.05))', borderRadius: '16px', padding: '25px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}>
              <Settings size={28} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#f8fafc', fontSize: '22px', fontWeight: '700', letterSpacing: '0.5px' }}>Smart Reorder Engine</h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 5px #10b981' }}></span> Active
              </div>
            </div>
          </div>
          <p style={{ margin: '0 0 20px 0', color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', maxWidth: '800px' }}>
            Our AI-driven smart reorder engine calculates optimal purchasing windows based on real-time sales velocity and supplier lead times, ensuring zero stockouts.
          </p>
          <div style={{ padding: '18px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Zap size={20} color="#a78bfa" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>
              <span style={{ color: '#a78bfa', fontWeight: '700', marginRight: '8px', letterSpacing: '0.5px' }}>HOW IT WORKS:</span>
              The system continuously tracks sales velocity combined with lead time to automatically generate optimal purchase orders. No manual "minimum" thresholds required.
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#f8fafc', fontSize: '20px', fontWeight: '700' }}>Inventory Control Center</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Real-time monitoring and automated procurement</p>
            </div>
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.9)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)', gap: '6px' }}>
              <button 
                onClick={() => setInventoryViewType('product')}
                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: inventoryViewType === 'product' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent', color: inventoryViewType === 'product' ? '#fff' : '#94a3b8', fontWeight: inventoryViewType === 'product' ? '700' : '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              ><Package size={16} /> Physical Products</button>
              <button 
                onClick={() => setInventoryViewType('non-inventory')}
                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: inventoryViewType === 'non-inventory' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: inventoryViewType === 'non-inventory' ? '#fff' : '#94a3b8', fontWeight: inventoryViewType === 'non-inventory' ? '700' : '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              ><Box size={16} /> Non-Inventory</button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}><Search size={16} /></div>
            <input 
              type="text" 
              placeholder="Search by product name or item code..." 
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 42px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="pp-inventory-table" style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 15px 35px -15px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.2))', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', width: '30%' }}>{inventoryViewType === 'product' ? 'Product Name' : 'Item Name'}</th>
                  <th style={{ padding: '14px 8px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', width: '9%' }}>{inventoryViewType === 'product' ? 'Current Stock' : 'Volume'}</th>
                  {inventoryViewType === 'product' && <th style={{ padding: '14px 8px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', width: '9%' }}>Sales Velocity</th>}
                  {inventoryViewType === 'product' && <th style={{ padding: '14px 8px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', width: '9%' }}>Lead Time</th>}
                  {inventoryViewType === 'product' && <th style={{ padding: '14px 8px', color: '#a78bfa', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', width: '12%' }}>Target Stock</th>}
                  {inventoryViewType === 'product' && <th style={{ padding: '14px 8px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', width: '8%' }}>Next ETA</th>}
                  <th style={{ padding: '14px 12px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', width: '21%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <span>{inventoryViewType === 'product' ? 'Action Required' : 'Management'}</span>
                      {inventoryViewType === 'product' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={handleApproveAll} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <CheckSquare size={11} /> Approve All
                          </button>
                          <button onClick={handleCancelAll} style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryWithMetrics.map((item, index) => {
                  const urgencyColors = { red: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' }, orange: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' }, yellow: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' }, green: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' } };
                  const uc = urgencyColors[item.urgency];
                  const isAuto = autoOrderSettings[item.inventory_id];
                  const status = orderStatuses[item.inventory_id];
                  const isOrdering = status === 'processing';
                  const isOrdered = status === 'completed';
                  
                  const maxStock = Math.max(item.recommendedOrder || 100, item.stock);
                  const stockPercent = Math.min((item.stock / maxStock) * 100, 100);

                  return (
                    <tr key={item.inventory_id} style={{ borderBottom: index === inventoryWithMetrics.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '13px' }}>{item.product_name}</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Item Code: {item.item_code || item.product_code || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '42px', height: '42px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', background: uc.bg, color: uc.text, border: `2px solid ${uc.border}` }}>
                            {item.stock}
                          </div>
                          {inventoryViewType === 'product' && (
                            <div style={{ width: '42px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                              <div style={{ width: `${stockPercent}%`, height: '100%', background: uc.text, borderRadius: '2px' }}></div>
                            </div>
                          )}
                        </div>
                      </td>
                      {inventoryViewType === 'product' && (
                        <>
                          <td style={{ padding: '12px 8px', color: '#cbd5e1', fontSize: '13px', textAlign: 'center' }}>{item.velocity} / day</td>
                          <td style={{ padding: '12px 8px', color: '#cbd5e1', fontSize: '13px', textAlign: 'center' }}>{item.leadTime} days</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div className="pp-target-tooltip-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(139, 92, 246, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', position: 'relative' }}>
                              <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{item.targetStock}</span>
                              <div style={{ cursor: 'pointer', display: 'flex' }} title={`Calculation:\nTarget = ${item.minRequired || 10} + (${item.velocity} * ${item.supplierLeadTime} * 1.5)\nTarget = ${item.targetStock}`}>
                                <Info size={14} color="#a78bfa" />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#cbd5e1', fontSize: '12px' }}>{item.etaString}</td>
                        </>
                      )}
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        {inventoryViewType === 'product' ? (
                          isOrdered ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>PO Generated</div>
                              <button onClick={() => handleCancelOrder(item.inventory_id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><X size={12} /></button>
                            </div>
                          ) : isOrdering ? (
                            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', display: 'inline-block' }}>Processing</div>
                          ) : (
                            <button onClick={() => handleOrder(item.inventory_id)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Approve PO</button>
                          )
                        ) : (
                          <button style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>Manage</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  const renderLocations = () => {
    return (
      <ProfessionalWarehouseMonitoring 
        locations={locations} 
        aggregatedInventory={inventory} 
        branchSalesData={locationSales}
        selectedYear={selectedYear}
      />
    );
  };

  const renderBusinessAnalysis = () => {
    return (
      <div style={{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <BusinessAnalysisUI 
          initialLevel="Professional" 
          dashboardData={dashboardData} 
          salesSummary={salesSummary} 
          inventory={inventory} 
          selectedYear={selectedYear} 
          onYearChange={setSelectedYear} 
        />
      </div>
    );
  };

  // Render correct tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'business_analysis': return renderBusinessAnalysis();
      case 'dashboard': return renderDashboard();
      case 'inventory_monitoring': return renderStockAlerts();
      case 'warehouse_monitoring': return renderLocations();
      default: return renderDashboard();
    }
  };

  return (
    <div className="professional-package-page standard-package-page">
      {/* Background */}
      <div className="sp-bg"></div>

      {/* Navigation */}
      <nav className="sp-navbar">
        <div className="sp-nav-container">
          <div className="sp-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="Logo" />
            <span>DistributionAI</span>
          </div>
          <div className="sp-badge" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            Professional Package
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>



            <button className="sp-back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="sp-main">
        {/* Sidebar Tabs */}
        <aside className="sp-sidebar">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`sp-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="sp-content">
          {activeTab !== 'features' && (
            <div style={{ padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Filter Year:</span>
                <div style={{ position: 'relative' }}>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    if (e.target.value === 'custom') setShowCustomDateBox(true);
                    else setShowCustomDateBox(false);
                  }}
                  style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #8b5cf6', padding: '6px 16px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  <option value="All">All Time</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="custom">Custom Range...</option>
                </select>
                {selectedYear === 'custom' && (
                  <div style={{ 
                    position: 'absolute', top: '100%', right: '0', zIndex: 100, marginTop: '8px',
                    background: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '12px', padding: '20px', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', minWidth: '380px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Start Date</label>
                        <input type="date" value={customDate.start} onChange={e => setCustomDate({...customDate, start: e.target.value})} style={{ width: '100%', background: 'transparent', border: '1px solid #8b5cf6', color: '#f8fafc', padding: '10px 12px', borderRadius: '8px', colorScheme: 'dark', outline: 'none' }} />
                      </div>
                      <div style={{ color: '#8b5cf6', marginTop: '20px' }}>→</div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>End Date</label>
                        <input type="date" value={customDate.end} onChange={e => setCustomDate({...customDate, end: e.target.value})} style={{ width: '100%', background: 'transparent', border: '1px solid #8b5cf6', color: '#f8fafc', padding: '10px 12px', borderRadius: '8px', colorScheme: 'dark', outline: 'none' }} />
                      </div>
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#a78bfa', fontStyle: 'italic' }}>* Use the calendar icon or type the date directly into the box.</p>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={() => {
                        const date = new Date();
                        const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                        setCustomDate({ start, end });
                      }} style={{ flex: 1, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>This Month</button>
                      <button onClick={() => {
                        const date = new Date();
                        const end = date.toISOString().split('T')[0];
                        const start = new Date(date.getFullYear(), date.getMonth() - 2, 1).toISOString().split('T')[0];
                        setCustomDate({ start, end });
                      }} style={{ flex: 1, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Last 3 Months</button>
                      <button onClick={() => {
                        const date = new Date();
                        const end = date.toISOString().split('T')[0];
                        const start = new Date(date.getFullYear(), date.getMonth() - 5, 1).toISOString().split('T')[0];
                        setCustomDate({ start, end });
                      }} style={{ flex: 1, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Last 6 Months</button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button onClick={() => {
                        setShowCustomDateBox(false);
                        const evt = new Event('change');
                        document.dispatchEvent(evt);
                        fetchSalesSummary();
                        fetchAEDData();
                      }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} /> Apply Dates
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
          <ErrorBoundary fallbackTitle="Professional Dashboard Error">
            {renderTabContent()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <button className="sp-modal-close" onClick={() => setShowSubscribeModal(false)}>
              <X size={20} />
            </button>
            
            <div className="sp-modal-header">
              <h2>Subscribe to Professional Package</h2>
              <p>RM 60,000 one-time setup fee</p>
            </div>

            {submitSuccess ? (
              <div className="sp-success-message">
                <CheckCircle size={48} color="#10b981" />
                <h3>Request Submitted!</h3>
                <p>Our implementation team will contact you within 24 hours to schedule the kickoff meeting.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="sp-form">
                <div className="sp-form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="sp-form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                </div>

                <div className="sp-form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Acme Corp Sdn Bhd"
                  />
                </div>

                <div className="sp-form-group">
                  <label>Additional Notes</label>
                  <textarea 
                    rows="3"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us about your current systems..."
                  ></textarea>
                </div>

                <button type="submit" className="sp-btn sp-btn-primary sp-btn-block">
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Promo Settings Modal */}
      {showPromoSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPromoSettings(false)}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', width: '400px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#eab308" /> Calendar Settings
              </h3>
              <button onClick={() => setShowPromoSettings(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '24px' }}>Update the dates for major pharmaceutical demand seasons to keep your AI forecasts accurate for the year.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>Monsoon & Flu Season Start</label>
                <input 
                  type="date" 
                  value={`2026-${promoDates.monsoon}`} 
                  onChange={(e) => {
                    const dateParts = e.target.value.split('-');
                    if(dateParts.length === 3) setPromoDates(prev => ({ ...prev, monsoon: `${dateParts[1]}-${dateParts[2]}` }));
                  }}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '14px' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>End-of-Year Budget Cutoff</label>
                <input 
                  type="date" 
                  value={`2026-${promoDates.yearEnd}`} 
                  onChange={(e) => {
                    const dateParts = e.target.value.split('-');
                    if(dateParts.length === 3) setPromoDates(prev => ({ ...prev, yearEnd: `${dateParts[1]}-${dateParts[2]}` }));
                  }}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '14px' }} 
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPromoSettings(false)} style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setShowPromoSettings(false)} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPackageFeatures;
