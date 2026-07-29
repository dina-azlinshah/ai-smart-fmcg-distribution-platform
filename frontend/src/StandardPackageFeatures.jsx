import React, { useState, useEffect } from 'react';
import BusinessAnalysisUI from './BusinessAnalysisUI';
import StandardWarehouseMonitoring from './StandardWarehouseMonitoring';
import {
  BarChart as RechartsBarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Check, Workflow, ShoppingCart, LayoutDashboard,
  TrendingUp, TrendingDown, Bell, Warehouse, RefreshCw,
  BarChart3, Package, AlertTriangle, MapPin,
  CheckCircle2, Circle, Calendar, DollarSign, Sparkles, Send, X,
  Mail, Phone, Building, MessageSquare, Users, UserCheck, Search, BarChart, Database,
  CheckCircle, FileText, Target, GitBranch, Brain, Trophy, Lightbulb,
  Shield, AlertCircle, Download, Edit2, BellOff, Box, ChevronUp, ChevronDown
} from 'lucide-react';
import FeatureTooltip from './FeatureTooltip';

const API_BASE = `http://${window.location.hostname}:8001/api`;

// Standard Package Features List
const standardFeatures = [
  { icon: Search, title: 'Basic Workflow Review', description: 'Analyze and optimize your current operational processes' },
  { icon: ShoppingCart, title: 'Sales & Inventory Integration', description: 'Connect your sales data with inventory management' },
  { icon: LayoutDashboard, title: 'Basic Operational Dashboard', description: 'Simple dashboard showing key business metrics' },
  { icon: BarChart, title: 'Sales Analytics', description: 'Track and analyze your sales performance over time' },
  { icon: Bell, title: 'Stock Alerts', description: 'Get notified when inventory levels run low' },
  { icon: Warehouse, title: 'Single Warehouse', description: 'Manage one warehouse location efficiently' },
  { icon: Users, title: 'User Training', description: 'Training sessions for your team members' }
];

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'business_analysis', label: 'Business Analysis', icon: Workflow },
  { id: 'inventory', label: 'Inventory Monitoring', icon: Bell },
  { id: 'warehouse_monitoring', label: 'Warehouse Monitoring', icon: Warehouse }
];

const StandardPackageFeatures = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const uploadSuccess = true;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  // Dashboard states - ONLY connected to database
  const [dashboardData, setDashboardData] = useState({
    total_sales: 0,
    total_invoices: 0,
    top_products: [],
    daily_sales: []
  });

  // Sales Analytics states - CONNECTED TO DATABASE
  const [dateRange, setDateRange] = useState('week');
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

  // --- Inventory State Variables ---
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [snoozedItems, setSnoozedItems] = useState({});
  const [editingMinRequired, setEditingMinRequired] = useState(null);
  const [tempMinRequired, setTempMinRequired] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all', 'low', 'out'
  const [productType, setProductType] = useState('product'); // 'product' | 'non-inventory'
  const [entityType, setEntityType] = useState('creditor'); // default 'creditor' to display by default
  const [selectedBranch, setSelectedBranch] = useState('all'); // branch filtering state
  const [expandedGroups, setExpandedGroups] = useState({});

  // Warehouse info - CONNECTED TO DATABASE
  const [warehouses, setWarehouses] = useState([]);
  const [locationSales, setLocationSales] = useState([]);

  // Workflow checklist - localStorage only (force English by using new key)
  const [workflowItems, setWorkflowItems] = useState(() => {
    const saved = localStorage.getItem('standardWorkflowEN');
    if (saved) return JSON.parse(saved);
    // Default English workflow steps
    return [
      { id: 1, title: 'Analyze existing workflow', description: 'Study current operational processes', completed: false },
      { id: 2, title: 'Identify bottlenecks', description: 'Find weak points in the workflow', completed: false },
      { id: 3, title: 'Recommend improvements', description: 'Prepare suggestions for enhancement', completed: false },
      { id: 4, title: 'Process documentation', description: 'Record all important steps', completed: false },
      { id: 5, title: 'Review with team', description: 'Discuss with stakeholders', completed: false }
    ];
  });

  // Save workflow to localStorage
  useEffect(() => {
    localStorage.setItem('standardWorkflowEN', JSON.stringify(workflowItems));
  }, [workflowItems]);

  // Fetch sales summary from database when date range changes
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

  // Load data from AED_FM
  useEffect(() => {
    let isMounted = true;

    const fetchAEDData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const yearParam = getYearParam();
        const [kpiRes, monthlyRes, productsRes, hourlyRes, invoiceRes, warehouseRes, locationRes] = await Promise.all([
          fetch(`${API_BASE}/kpi/summary${yearParam}`),
          fetch(`${API_BASE}/charts/monthly-sales-12m${yearParam}`),
          fetch(`${API_BASE}/tables/top-products${yearParam}`),
          fetch(`${API_BASE}/charts/hourly-sales`),
          fetch(`${API_BASE}/tables/invoice-list${yearParam}`),
          fetch(`${API_BASE}/warehouses`),
          fetch(`${API_BASE}/charts/sales-by-location${yearParam}`)
        ]);

        const kpiData = await kpiRes.json().catch(() => ({}));
        const monthlyData = await monthlyRes.json().catch(() => []);
        const productsData = await productsRes.json().catch(() => []);
        const hourlyData = await hourlyRes.json().catch(() => []);
        const invoiceData = await invoiceRes.json().catch(() => []);
        const warehouseData = await warehouseRes.json().catch(() => []);
        const locationData = await locationRes.json().catch(() => []);

        if (isMounted) {
          setWarehouses(warehouseData);
          setLocationSales(locationData);
          setDashboardData({
            total_sales: kpiData.total_revenue || 0,
            total_invoices: kpiData.total_invoices || 0,
            top_products: Array.isArray(productsData) ? productsData.slice(0, 10) : [],
            daily_sales: Array.isArray(monthlyData) ? monthlyData : [],
            hourly_sales: Array.isArray(hourlyData) ? hourlyData : [],
            recent_transactions: Array.isArray(invoiceData) ? invoiceData.slice(0, 10) : []
          });
        }
      } catch (error) {
        console.error('Error fetching AED_FM data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const runAll = (isBackground = false) => {
      fetchAEDData(isBackground);
      fetchSalesSummary();
      fetchInventory();
      fetchLowStock();
      fetchLastSyncStatus();
    };

    runAll();

    const interval = setInterval(() => {
      runAll(true);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedYear]);

  // --- Inventory Core Functions ---
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      if (Array.isArray(data)) setInventory(data);
      else setInventory([]);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory/low-stock`);
      const data = await response.json();
      if (Array.isArray(data)) setLowStock(data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const fetchLastSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/sync/last`);
      const data = await response.json();
      if (data.last_sync) setLastSync(new Date(data.last_sync).toLocaleString());
    } catch (error) {
      console.error('Error fetching last sync:', error);
    }
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
      }
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSnooze = (itemId) => {
    setSnoozedItems(prev => ({
      ...prev,
      [itemId]: true
    }));
    setTimeout(() => {
      setSnoozedItems(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
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
    const headers = ['Product Code', 'Product Name', 'Warehouse', 'Current Stock', 'Min Required', 'Status', 'Last Tx Date', 'Qty Sold 90 Days', 'Daily Sales Avg'];
    const rows = filteredInventory.map(item => [
      item.product_code,
      item.product_name,
      item.warehouse_name,
      item.stock,
      item.minRequired || 15,
      item.stock === 0 ? 'Out of Stock' : (item.stock < (item.minRequired || 15) ? 'Low Stock' : 'In Stock'),
      item.last_purchase_date || 'N/A',
      item.qty_sold_90_days || 0,
      item.avg_sold_per_day || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Data Filtering ---
  const activeInventory = inventory.filter(item => {
    const isProductMatch = productType === 'product' ? item.stock_control === 'T' : item.stock_control === 'F';
    if (!isProductMatch) return false;

    if (selectedBranch !== 'all' && item.warehouse_name !== selectedBranch) return false;

    if (entityType === 'creditor') {
      return (item.creditor_names && item.creditor_names.length > 0) || !!item.creditor_name;
    } else if (entityType === 'debtor') {
      return (item.debtor_names && item.debtor_names.length > 0) || !!item.debtor_name;
    }
    
    return true;
  });

  const searchedInventory = activeInventory.filter(item =>
    item.product_name?.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
    item.product_code?.toLowerCase().includes(inventorySearchQuery.toLowerCase())
  );

  const filteredInventory = searchedInventory.filter(item => {
    if (inventoryFilter === 'all') return true;
    const minReq = item.minRequired || 10;
    if (inventoryFilter === 'low') return item.stock >= 0 && item.stock < minReq;
    if (inventoryFilter === 'healthy') return item.stock >= minReq;
    if (inventoryFilter === 'out') return item.stock === 0;
    return true;
  });

  const highRiskItems = activeInventory.filter(item => {
    const minReq = item.minRequired || 10;
    return item.stock < minReq && !snoozedItems[item.inventory_id];
  });



  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowSubscribeModal(false);
      setFormData({ fullName: '', email: '', company: '', phone: '', message: '' });
    }, 3000);
  };

  const toggleWorkflowItem = (id) => {
    setWorkflowItems(items =>
      items.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  };

  const updateStock = async (inventoryId, newStock) => {
    try {
      const response = await fetch(`${API_BASE}/inventory/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id: inventoryId, new_quantity: parseInt(newStock) || 0 })
      });
      const data = await response.json();
      if (data.success) {
        // Refresh inventory after update
        fetchInventory();
        fetchLowStock();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };


  const completedCount = workflowItems.filter(i => i.completed).length;
  const progress = (completedCount / workflowItems.length) * 100;

  const renderFeatures = () => (
    <div className="sp-features-overview">
      <div className="sp-hero-section">
        <div className="sp-hero-badge">
          <LayoutDashboard size={18} />
          Standard Package
        </div>
        <h2>Standard Package</h2>
        <p className="sp-price">RM 30,000</p>
        <p className="sp-description">
          Essential tools for small businesses to streamline operations and boost efficiency
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#10b981', marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', maxWidth: '500px', margin: '1.5rem auto 0 auto', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle2 size={24} />
          <span style={{ fontWeight: '500' }}>Connected to AED_FM Database. Data is ready to analyze.</span>
        </div>

      </div>

      <div className="sp-features-grid">
        {standardFeatures.map((feature, index) => (
          <div key={index} className="sp-feature-card">
            <div className="sp-feature-icon">
              <feature.icon size={28} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      {/* ERP Integration Section - Minimized */}
      {uploadSuccess && (
        <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid rgba(59, 130, 246, 0.2)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={22} color="#3b82f6" />
            ERP Integration
          </h3>
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>✓ Connected</span>
                <span style={{ color: '#f8fafc', fontSize: '14px' }}>Sales Order</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>✓ Connected</span>
                <span style={{ color: '#f8fafc', fontSize: '14px' }}>Stock Level (Inventory)</span>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
              <strong style={{ color: '#f8fafc' }}>Basic Integration (Sales & Inventory):</strong>
              Connects your sales orders with stock levels for real-time inventory tracking.
              When a sale is made, stock automatically decreases. Includes low stock alerts to notify you when items need restocking.
              Perfect for small businesses needing essential sales-to-inventory synchronization.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => {
    const todaySales = dashboardData.total_sales || 0;
    const todayInvoices = dashboardData.total_invoices || 0;
    const avgOrder = todayInvoices > 0 ? todaySales / todayInvoices : 0;

    const recentTransactions = dashboardData.recent_transactions || [];
    const criticalStockItems = inventory.filter(i => i.stock_control === 'T' && i.stock < (i.minStock || i.min_stock || 100));

    return (
      <div className="sp-dashboard" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {loading && <div className="sp-loading">Loading data from database...</div>}

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutDashboard size={28} color="#3b82f6" /> Live Operations Command Center
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, maxWidth: '650px', lineHeight: '1.5' }}>
            Your real-time view of what is happening today. This dashboard focuses exclusively on immediate actions, live transactions, and system health—keeping your historical analysis safely in the Business Analysis tab.
          </p>
        </div>

        {/* TODAY'S PULSE */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} color="#10b981" /> Today's Pulse
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Today's Sales Volume</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>RM {todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Live Syncing...</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Invoices Processed Today</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>{todayInvoices}</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Avg RM {avgOrder.toFixed(2)} / order</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Active System Users</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>3</div>
              <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>Cashiers / Admins online</div>
            </div>

          </div>
        </div>

        {/* MAIN SPLIT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>

          {/* LEFT: Live Activity Feed */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={20} color="#3b82f6" /> Latest Transactions {selectedYear !== 'All' ? `(${selectedYear})` : '(All Time)'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Real-time stream of the latest completed invoices based on selected period</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {recentTransactions.map((tx, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: tx.cancelled === 'F' ? '3px solid #10b981' : '3px solid #ef4444' }}>
                  <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
                    <ShoppingCart size={16} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '14px' }}>Invoice {tx.doc_no}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{tx.date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{tx.debtor_name || 'Unknown Debtor'}</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>RM {tx.net_total ? tx.net_total.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>No transactions recorded for this period yet.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Action Required (Enhanced Critical Stock) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={24} color="#ef4444" fill="rgba(239,68,68,0.2)" /> Critical Stock Watchlist
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Live inventory requiring immediate replenishment from database</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
              {criticalStockItems.length > 0 ? criticalStockItems.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '4px', position: 'absolute', left: 0, top: 0, bottom: 0, background: '#ef4444' }}></div>
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
                    <Package size={20} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Code: {item.product_code}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {item.stock} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#94a3b8' }}>qty</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Min: {item.min_stock || 100}</div>
                  </div>
                </div>
              )) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                  <CheckCircle2 size={48} style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>All clear!</div>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>No critical stock items found.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          className={`sp-sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '500', background: '#3b82f6', color: '#fff', border: 'none', cursor: isSyncing ? 'not-allowed' : 'pointer', opacity: isSyncing ? 0.7 : 1 }}
        >
          <RefreshCw size={20} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Synchronizing Data...' : 'Run Manual Sync'}
        </button>
      </div>
    );
  };

    const renderStockAlerts = () => {
    // Unique branches for the dropdown
    const branchSet = new Set(inventory.map(item => item.warehouse_name).filter(Boolean));
    const availableBranches = ['all', ...Array.from(branchSet)];

    const totalItems = activeInventory.length;
    const needsRestock = activeInventory.filter(item => item.stock < (item.minRequired || 10)).length;
    const healthyStock = totalItems - needsRestock;

    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out', color: '#f8fafc', padding: '10px 0' }}>
        
        {/* View Toggle (Main Pills) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => setProductType('product')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 24px',
              background: productType === 'product' ? '#10b981' : 'rgba(15, 23, 42, 0.4)',
              color: '#fff',
              border: productType === 'product' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: productType === 'product' ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            📦 Inventory Products
          </button>
          <button
            onClick={() => setProductType('non-inventory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 24px',
              background: productType === 'non-inventory' ? '#10b981' : 'rgba(15, 23, 42, 0.4)',
              color: '#fff',
              border: productType === 'non-inventory' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: productType === 'non-inventory' ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🏷️ Non-Inventory Items
          </button>
        </div>

        {/* Creditor / Debtor Toggles (Secondary Pills) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '28px' }}>
          <button
            onClick={() => setEntityType('creditor')}
            style={{
              padding: '8px 24px',
              background: entityType === 'creditor' ? '#3b82f6' : 'transparent',
              color: '#fff',
              border: entityType === 'creditor' ? 'none' : '1px solid transparent',
              borderRadius: '24px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: entityType === 'creditor' ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Creditor Products
          </button>
          <button
            onClick={() => setEntityType('debtor')}
            style={{
              padding: '8px 24px',
              background: entityType === 'debtor' ? '#3b82f6' : 'transparent',
              color: '#fff',
              border: entityType === 'debtor' ? 'none' : '1px solid transparent',
              borderRadius: '24px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: entityType === 'debtor' ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Debtor Products
          </button>
        </div>

        {/* Summary Stat Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          
          {/* Healthy Stock Card */}
          <div 
            onClick={() => setInventoryFilter('healthy')}
            style={{ 
              cursor: 'pointer', 
              background: 'rgba(15, 23, 42, 0.5)', 
              border: inventoryFilter === 'healthy' ? '2.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius: '16px', 
              padding: '24px', 
              position: 'relative', 
              overflow: 'hidden', 
              transition: 'all 0.2s ease' 
            }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: '#10b981' }}>
              <CheckCircle2 size={100} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <CheckCircle2 size={16} /> HEALTHY STOCK
            </div>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#10b981' }}>{healthyStock}</div>
          </div>

          {/* Needs Restock Card */}
          <div 
            onClick={() => setInventoryFilter('low')}
            style={{ 
              cursor: 'pointer', 
              background: 'rgba(15, 23, 42, 0.5)', 
              border: inventoryFilter === 'low' ? '2.5px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '16px', 
              padding: '24px', 
              position: 'relative', 
              overflow: 'hidden', 
              transition: 'all 0.2s ease' 
            }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: '#ef4444' }}>
              <AlertTriangle size={100} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <AlertTriangle size={16} /> NEEDS RESTOCK
            </div>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#ef4444' }}>{needsRestock}</div>
          </div>

          {/* Total Products Card */}
          <div 
            onClick={() => setInventoryFilter('all')}
            style={{ 
              cursor: 'pointer', 
              background: 'rgba(15, 23, 42, 0.5)', 
              border: inventoryFilter === 'all' ? '2.5px solid #a78bfa' : '1px solid rgba(139, 92, 246, 0.3)', 
              borderRadius: '16px', 
              padding: '24px', 
              position: 'relative', 
              overflow: 'hidden', 
              transition: 'all 0.2s ease' 
            }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: '#a78bfa' }}>
              <Package size={100} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <Package size={16} /> TOTAL PRODUCTS
            </div>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#a78bfa' }}>{totalItems}</div>
          </div>
        </div>

        {/* Search and Filters side-by-side row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search Input */}
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search products by name or item code..."
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 20px 12px 48px', 
                background: '#0b0f19', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '8px', 
                color: '#f1f5f9', 
                outline: 'none', 
                fontSize: '14px' 
              }}
            />
          </div>

          {/* Branch Filter Select */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ 
              padding: '12px 36px 12px 16px', 
              background: '#0b0f19', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '8px', 
              color: '#f1f5f9', 
              outline: 'none', 
              cursor: 'pointer', 
              fontSize: '13px',
              minWidth: '150px'
            }}
          >
            {availableBranches.map(branch => (
              <option key={branch} value={branch}>
                {branch === 'all' ? 'All Branches' : branch}
              </option>
            ))}
          </select>

          {/* Status Filter Select */}
          <select
            value={inventoryFilter}
            onChange={(e) => setInventoryFilter(e.target.value)}
            style={{ 
              padding: '12px 36px 12px 16px', 
              background: '#0b0f19', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '8px', 
              color: '#f1f5f9', 
              outline: 'none', 
              cursor: 'pointer', 
              fontSize: '13px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Products</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Insufficient Only</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Accordion List Container */}
        {entityType === 'creditor' || entityType === 'debtor' ? (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px' }}>
              {entityType === 'creditor' ? 'Creditor Products' : 'Debtor Products'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(
                filteredInventory.reduce((acc, item) => {
                  const keys = entityType === 'creditor'
                    ? (item.creditor_names || (item.creditor_name ? [item.creditor_name] : []))
                    : (item.debtor_names || (item.debtor_name ? [item.debtor_name] : []));
                  keys.forEach(key => {
                    if (key) {
                      if (!acc[key]) acc[key] = [];
                      if (!acc[key].find(i => i.inventory_id === item.inventory_id)) {
                        acc[key].push(item);
                      }
                    }
                  });
                  return acc;
                }, {})
              ).map(([companyName, items], index) => {
                const isExpanded = expandedGroups[companyName];
                return (
                  <div key={index} style={{ background: '#0b0f19', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '12px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [companyName]: !prev[companyName] }))}
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.01)', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'}
                    >
                      <div style={{ fontWeight: '600', color: '#60a5fa', fontSize: '14px' }}>
                        {companyName}
                      </div>
                      <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px 20px', background: 'rgba(0, 0, 0, 0.15)', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <th style={{ padding: '12px 10px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Item Code</th>
                              <th style={{ padding: '12px 10px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Description</th>
                              <th style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Total Qty</th>
                              <th style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Min. Req</th>
                              <th style={{ padding: '12px 10px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((prod, i) => {
                              const minReq = prod.minRequired || 10;
                              const isInsufficient = prod.stock < minReq;
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                  <td style={{ padding: '14px 10px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                                    {prod.product_code}
                                  </td>
                                  <td style={{ padding: '14px 10px', color: '#cbd5e1', fontSize: '13px' }}>
                                    {prod.product_name}
                                  </td>
                                  <td style={{ padding: '14px 10px', textAlign: 'center', color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>
                                    {prod.stock}
                                  </td>
                                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                    <input 
                                      type="text" 
                                      value={minReq} 
                                      readOnly
                                      style={{ 
                                        background: 'rgba(30, 41, 59, 0.4)', 
                                        border: '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: '6px', 
                                        padding: '4px 8px', 
                                        color: '#cbd5e1', 
                                        display: 'inline-block', 
                                        width: '50px', 
                                        textAlign: 'center', 
                                        outline: 'none', 
                                        fontSize: '13px' 
                                      }} 
                                    />
                                  </td>
                                  <td style={{ padding: '14px 10px' }}>
                                    <div style={{ color: isInsufficient ? '#ef4444' : '#10b981', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '16px' }}>•</span> {isInsufficient ? 'Insufficient' : 'Healthy'}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f1f5f9', fontSize: '13px', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Item Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Quantity</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Min Req</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#3b82f6' }}>{item.product_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.product_name}</td>
                      <td style={{ padding: '12px 16px' }}>{item.stock}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{item.minRequired}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.low_stock ? (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
                            <CheckCircle size={12} /> Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No products found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="standard-package-page">
      {/* Background */}
      <div className="sp-bg"></div>
      {/* Navigation */}
      <nav className="sp-navbar">
        <div className="sp-nav-container">
          <div className="sp-logo">
            <img src="/logo.png" alt="Logo" />
            <span>DistributionAI</span>
          </div>
          <div className="sp-badge">Standard Package</div>

          <button className="sp-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            Back
          </button>
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
          {activeTab !== 'data' && activeTab !== 'features' && (
            <>
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
                      style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #3b82f6', padding: '6px 16px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
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
                    {selectedYear === 'custom' && showCustomDateBox && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', minWidth: '320px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#3b82f6"/> Custom Range</h4>
                          <button onClick={() => { setSelectedYear('All'); setShowCustomDateBox(false); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Start Date</label>
                            <input type="date" value={customDate.start} onChange={(e) => setCustomDate({...customDate, start: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', colorScheme: 'dark' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>End Date</label>
                            <input type="date" value={customDate.end} onChange={(e) => setCustomDate({...customDate, end: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', colorScheme: 'dark' }} />
                          </div>
                        </div>
                        <button onClick={() => { setShowCustomDateBox(false); fetchAEDData(false); }} style={{ width: '100%', padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>Apply Range</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="sp-tab-content">
            {activeTab === 'dashboard' && renderDashboard()}
            {(activeTab === 'inventory' || activeTab === 'inventory_monitoring') && renderStockAlerts()}
            {activeTab === 'warehouse_monitoring' && (
              <StandardWarehouseMonitoring 
                locations={warehouses} 
                aggregatedInventory={inventory} 
                branchSalesData={locationSales}
                selectedYear={selectedYear}
                dashboardData={dashboardData}
              />
            )}
            {activeTab === 'business_analysis' && (
              <div style={{ padding: 0, width: '100%', boxSizing: 'border-box' }}>
                {uploadSuccess ? (
                  <BusinessAnalysisUI initialLevel="Standard" dashboardData={dashboardData} salesSummary={salesSummary} inventory={inventory} selectedYear={selectedYear} onYearChange={setSelectedYear} />
                ) : (
                  <div className="sp-workflow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
                    <Database size={64} color="#3b82f6" style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <h2>Awaiting Data</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                      Basic Workflow Review features will activate once you upload your data in the Data tab.
                    </p>
                  </div>
                )}
              </div>
            )}
            {(activeTab === 'data' || activeTab === 'features') && renderFeatures()}
            {activeTab === 'training' && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <Sparkles size={64} color="#3b82f6" style={{ marginBottom: '20px', opacity: 0.5 }} />
                <h2>Training & Onboarding</h2>
                <p>Explore our basic training modules for standard package users.</p>
                <button className="sp-submit-btn" style={{ maxWidth: '300px', margin: '20px auto' }}>Access Learning Portal</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StandardPackageFeatures;
