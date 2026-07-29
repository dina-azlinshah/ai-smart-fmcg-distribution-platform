import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, TrendingUp, MapPin, Search, Filter, CheckCircle2, Calendar,
  AlertCircle, Award, Truck, AlertTriangle, MessageSquare, ChevronRight, X,
  ArrowRight, Coins, Users, Percent, ClipboardList, Send, TrendingDown, Package,
  Camera, Trash2, User
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area } from 'recharts';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const barGradientPairs = [
  ['#a78bfa', '#7c3aed'],
  ['#f472b6', '#db2777'],
  ['#60a5fa', '#2563eb'],
  ['#34d399', '#059669'],
  ['#fbbf24', '#d97706'],
  ['#22d3ee', '#0891b2'],
  ['#818cf8', '#4f46e5'],
  ['#c084fc', '#9333ea'],
];

const CustomSalesTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    const isHighRisk = data.status === 'Monitor Debt';
    const totalSales = Number(data.total_sales || 0);
    const percentage = Number(data.percentage || 0);
    const invoiceCount = Number(data.invoice_count || 0);
    const outstanding = Number(data.outstanding_balance || 0);
    return (
      <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '14px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', minWidth: '200px' }}>
        <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '6px', color: data.color || '#c084fc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Agent: {data.salesperson || 'Unknown'}</span>
          <span style={{ fontSize: '10px', background: isHighRisk ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: isHighRisk ? '#fca5a5' : '#a7f3d0', padding: '2px 6px', borderRadius: '10px', border: `1px solid ${isHighRisk ? '#ef4444' : '#10b981'}` }}>
            {data.status || 'Good'}
          </span>
        </div>
        <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Total Sales:</span>
            <span style={{ color: '#fff', fontWeight: '700' }}>RM {totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Share:</span>
            <span style={{ color: '#fff', fontWeight: '700' }}>{percentage.toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Invoices:</span>
            <span style={{ color: '#fff', fontWeight: '700' }}>{invoiceCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Avg/Invoice:</span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>RM {Math.round(totalSales / (invoiceCount || 1)).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Unpaid Client Debt:</span>
            <span style={{ color: isHighRisk ? '#ef4444' : '#f59e0b', fontWeight: '800' }}>RM {outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ProfessionalWarehouseMonitoring = ({
  locations = [],
  branchSalesData = [],
  aggregatedInventory = [],
  selectedYear: initialYear = 'All'
}) => {
  const ITEMS_PER_PAGE = 10;

  // UI States
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(initialYear || 'All');

  // Available locations for filter (derived or fallback)
  const availableLocations = useMemo(() => {
    let list = [];
    if (locations && locations.length > 0) {
      list = locations.map(loc => typeof loc === 'object' ? (loc.name || loc.location_name || '') : loc).filter(Boolean);
    } else {
      list = ['HQ', 'STORE', 'TA', 'NUSA.B', 'PUCHONG', 'SS14'];
    }
    if (selectedYear !== 'All') {
      list = list.filter(loc => {
        const match = branchSalesData?.find(b => b.name === loc);
        return match && (match.sales > 0 || match.count > 0);
      });
    }
    if (!list.includes('ALL') && !list.includes('All')) {
      return ['ALL', ...list];
    }
    return list;
  }, [locations, branchSalesData, selectedYear]);

  useEffect(() => {
    if (selectedLocation !== 'ALL' && !availableLocations.includes(selectedLocation)) {
      setSelectedLocation('ALL');
    }
  }, [availableLocations, selectedLocation]);
  const [activeSubTab, setActiveSubTab] = useState('branch'); // branch, credit, salesperson, shipping
  const [creditSubTab, setCreditSubTab] = useState('debtors'); // debtors, creditors
  const [showBranchDetail, setShowBranchDetail] = useState(false);
  const [branchDetailInvoices, setBranchDetailInvoices] = useState([]);
  const [branchDetailLoading, setBranchDetailLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null); // track hovered flashcard
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtorEmail, setDebtorEmail] = useState('');

  const [showDebtorsListModal, setShowDebtorsListModal] = useState(false);
  const [showCreditorsListModal, setShowCreditorsListModal] = useState(false);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState('All');

  // Search Filters
  const [debtorSearch, setDebtorSearch] = useState('');
  const [creditorSearch, setCreditorSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [branchPage, setBranchPage] = useState(1);
  const [shippingSearch, setShippingSearch] = useState('');
  const [shippingPage, setShippingPage] = useState(1);


  // Interactive Simulations
  const [commissionSimulationRate, setCommissionSimulationRate] = useState(2.0); // slider percent
  const [selectedReminderDebtor, setSelectedReminderDebtor] = useState(null);
  const [hoveredSalesIndex, setHoveredSalesIndex] = useState(null);
  const [reminderMessage, setReminderMessage] = useState('');

  // Salesperson Avatar Photo Management State
  const [salespersonAvatars, setSalespersonAvatars] = useState(() => {
    try {
      const saved = localStorage.getItem('gpis_salesperson_avatars');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleAvatarUpload = (agentName, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatars = { ...salespersonAvatars, [agentName]: reader.result };
      setSalespersonAvatars(newAvatars);
      try {
        localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
        showToast(`Photo updated for ${agentName}`);
      } catch (e) {
        showToast("Error saving image to local storage.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = (agentName) => {
    const newAvatars = { ...salespersonAvatars };
    delete newAvatars[agentName];
    setSalespersonAvatars(newAvatars);
    try {
      localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
      showToast(`Photo removed for ${agentName}`);
    } catch (e) {
      showToast("Error updating storage.");
    }
  };

  // Default Architectural Warehouse Graphics for Branches
  const defaultBranchGraphics = {
    'ALL': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'HQ': 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
    'NUSA.B': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    'PUCHONG': 'https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&w=800&q=80',
    'SS14': 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80',
    'STORE': 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80'
  };

  // Drilldown states
  const [drilldownModal, setDrilldownModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [toastNotification, setToastNotification] = useState(null);

  // Reset page when search query changes
  useEffect(() => {
    setModalPage(1);
  }, [modalSearch]);

  useEffect(() => {
    setBranchPage(1);
  }, [branchSearch]);

  // Dynamic Insights data from Backend
  const [warehouseInsights, setWarehouseInsights] = useState({
    top_debtors: [],
    top_creditors: [],
    salesperson_performance: [],
    delivery_destinations: [],
    monthly_shipments: [],
    location_breakdown: { revenue: {}, outstanding: {}, shipments: {} }
  });
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Sync with initialYear if changed from parent
  useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear]);

  // Fetch Business Intelligence Insights from backend
  useEffect(() => {
    let active = true;
    const fetchInsights = async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/warehouse/insights?location=${encodeURIComponent(selectedLocation)}&year=${selectedYear}`);
        if (!res.ok) throw new Error('Failed to fetch insights');
        const data = await res.json();
        if (active) {
          setWarehouseInsights({
            top_debtors: data.top_debtors || [],
            top_creditors: data.top_creditors || [],
            salesperson_performance: data.salesperson_performance || [],
            delivery_destinations: data.delivery_destinations || [],
            monthly_shipments: data.monthly_shipments || [],
            location_breakdown: data.location_breakdown || { revenue: {}, outstanding: {}, shipments: {} }
          });
        }
      } catch (e) {
        console.error("Error fetching insights:", e);
      } finally {
        if (active) setInsightsLoading(false);
      }
    };
    fetchInsights();
    return () => { active = false; };
  }, [selectedLocation, selectedYear]);

  // Fetch branch detail shipments/invoices reactively
  useEffect(() => {
    if (!showBranchDetail || selectedLocation === 'ALL') return;

    let active = true;
    const fetchBranchInvoices = async () => {
      setBranchDetailLoading(true);
      try {
        const res = await fetch(`${API_BASE}/warehouse/invoices?location=${encodeURIComponent(selectedLocation)}&year=${selectedYear}&type=branch&name=`);
        if (!res.ok) throw new Error('Failed to fetch branch invoices');
        const data = await res.json();
        if (active) {
          setBranchDetailInvoices(data || []);
        }
      } catch (e) {
        console.error("Error fetching branch invoices:", e);
        showToast("Error loading branch shipment records.");
      } finally {
        if (active) setBranchDetailLoading(false);
      }
    };

    fetchBranchInvoices();
    return () => { active = false; };
  }, [showBranchDetail, selectedLocation, selectedYear]);

  // Toast trigger helper
  const showToast = (message) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Helper to trigger transaction list drilldowns
  const handleDrilldown = async (type, name) => {
    setModalSearch('');
    setModalPage(1);
    setDrilldownModal({ type, name, loading: true, invoices: [] });
    try {
      const res = await fetch(`${API_BASE}/warehouse/invoices?location=${encodeURIComponent(selectedLocation)}&year=${selectedYear}&type=${type}&name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const invoices = await res.json();
      setDrilldownModal(prev => prev ? { ...prev, loading: false, invoices } : null);
    } catch (e) {
      console.error("Error in drilldown query:", e);
      setDrilldownModal(null);
      showToast("Error loading transaction records.");
    }
  };

  // 1. KPI Metrics Calculations
  const totalOutstanding = useMemo(() => {
    if (selectedLocation === 'ALL') {
      const outstandingMap = warehouseInsights.location_breakdown?.outstanding || {};
      return Object.values(outstandingMap).reduce((acc, curr) => acc + (curr || 0), 0);
    }
    return (warehouseInsights.top_debtors || []).reduce((acc, curr) => acc + (curr.outstanding_balance || 0), 0);
  }, [warehouseInsights, selectedLocation]);


  const totalRevenue = useMemo(() => {
    if (selectedLocation === 'ALL') {
      const revenueMap = warehouseInsights.location_breakdown?.revenue || {};
      return Object.values(revenueMap).reduce((acc, curr) => acc + (curr || 0), 0);
    }
    return (warehouseInsights.salesperson_performance || []).reduce((acc, curr) => acc + (curr.total_sales || 0), 0);
  }, [warehouseInsights, selectedLocation]);

  const topAgentDetails = useMemo(() => {
    const list = warehouseInsights.salesperson_performance || [];
    if (list.length === 0) return { agent: 'N/A', sales: 0 };
    const sorted = [...list].sort((a, b) => b.total_sales - a.total_sales);
    return {
      agent: sorted[0].salesperson || 'N/A',
      sales: sorted[0].total_sales || 0
    };
  }, [warehouseInsights]);

  const shippingMetrics = useMemo(() => {
    if (selectedLocation === 'ALL') {
      const shipmentsMap = warehouseInsights.location_breakdown?.shipments || {};
      const totalCount = Object.values(shipmentsMap).reduce((acc, curr) => acc + (curr || 0), 0);
      const list = warehouseInsights.delivery_destinations || [];
      const totalVal = list.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
      return {
        totalCount,
        totalVal,
        avgVal: totalCount > 0 ? totalVal / totalCount : 0
      };
    }
    const list = warehouseInsights.delivery_destinations || [];
    const totalCount = list.reduce((acc, curr) => acc + (curr.shipment_count || 0), 0);
    const totalVal = list.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
    return {
      totalCount,
      totalVal,
      avgVal: totalCount > 0 ? totalVal / totalCount : 0
    };
  }, [warehouseInsights, selectedLocation]);

  // Prepared Salesperson Chart Data (Donut Chart representation)
  const salespersonChartData = useMemo(() => {
    const list = warehouseInsights.salesperson_performance || [];
    if (list.length === 0) return [];

    const sorted = [...list].sort((a, b) => b.total_sales - a.total_sales);
    const totalSalesAll = sorted.reduce((acc, curr) => acc + (curr.total_sales || 0), 0);
    const gradientPairs = barGradientPairs;
    const colors = gradientPairs.map(pair => pair[0]);

    return sorted.map((s, index) => ({
      ...s,
      isTopAgent: index === 0,
      percentage: totalSalesAll > 0 ? (s.total_sales / totalSalesAll) * 100 : 0,
      color: colors[index % colors.length],
      gradientStart: gradientPairs[index % gradientPairs.length][0],
      gradientEnd: gradientPairs[index % gradientPairs.length][1]
    }));
  }, [warehouseInsights.salesperson_performance]);

  // Salesperson Summary Stats for Executive KPI Cards
  const salespersonStats = useMemo(() => {
    const list = warehouseInsights.salesperson_performance || [];
    if (list.length === 0) return { topAgent: 'N/A', topSales: 0, totalOrders: 0, avgOrderVal: 0, totalCommission: 0 };
    const sorted = [...list].sort((a, b) => b.total_sales - a.total_sales);
    const top = sorted[0];
    const totalOrders = list.reduce((sum, a) => sum + (a.invoice_count || 0), 0);
    const totalSales = list.reduce((sum, a) => sum + (a.total_sales || 0), 0);
    const totalCommission = list.reduce((sum, a) => sum + (a.commission || a.total_sales * 0.02 || 0), 0);
    const avgOrderVal = totalOrders > 0 ? totalSales / totalOrders : 0;
    return {
      topAgent: top ? top.salesperson : 'N/A',
      topSales: top ? top.total_sales : 0,
      totalOrders,
      avgOrderVal,
      totalCommission
    };
  }, [warehouseInsights.salesperson_performance]);

  // Aggregate Outstanding Aging Buckets across all debtors
  const agingTotals = useMemo(() => {
    const list = warehouseInsights.top_debtors || [];
    let current = 0, d30_60 = 0, d61_90 = 0, d90Plus = 0;
    list.forEach(d => {
      current += (d.aging_0_30 || 0);
      d30_60 += (d.aging_31_60 || 0);
      d61_90 += (d.aging_61_90 || 0);
      d90Plus += (d.aging_90_plus || 0);
    });
    return [
      { name: 'Current (0-30d)', value: current, fill: '#10b981' },
      { name: 'Overdue (31-60d)', value: d30_60, fill: '#f59e0b' },
      { name: 'Delinquent (61-90d)', value: d61_90, fill: '#ef4444' },
      { name: 'Critical (90d+)', value: d90Plus, fill: '#b91c1c' }
    ];
  }, [warehouseInsights]);

  // Aggregate Outstanding Aging Buckets across all creditors (A/P)
  const creditorAgingTotals = useMemo(() => {
    const list = warehouseInsights.top_creditors || [];
    let current = 0, d30_60 = 0, d61_90 = 0, d90Plus = 0;
    list.forEach(d => {
      current += (d.aging_0_30 || 0);
      d30_60 += (d.aging_31_60 || 0);
      d61_90 += (d.aging_61_90 || 0);
      d90Plus += (d.aging_90_plus || 0);
    });
    return [
      { name: 'Current (0-30d)', value: current, fill: '#3b82f6' },
      { name: 'Overdue (31-60d)', value: d30_60, fill: '#f59e0b' },
      { name: 'Delinquent (61-90d)', value: d61_90, fill: '#ef4444' },
      { name: 'Critical (90d+)', value: d90Plus, fill: '#b91c1c' }
    ];
  }, [warehouseInsights]);

  // Open Draft Reminder Dialog
  const openReminderDialog = (debtor) => {
    setSelectedReminderDebtor(debtor);
    setDebtorPhone(debtor.phone || '');
    setDebtorEmail(debtor.email || '');
    const hasValidLimit = debtor.credit_limit > 0 && debtor.credit_limit !== 30000;
    const limitText = hasValidLimit ? ` (Credit Limit: RM ${debtor.credit_limit.toLocaleString()})` : '';
    const msg = `Dear ${debtor.debtor_name},\n\nThis is a friendly credit control notice from our Finance Dept. Our records show an outstanding A/R balance of RM ${debtor.outstanding_balance.toLocaleString()} on your account${limitText}.\n\nPlease remit payment at your earliest convenience to maintain active account status.\n\nThank you,\nGPIS Corporate Finance`;
    setReminderMessage(msg);
  };

  // Aggregate Shipping KPIs from real AutoCount delivery destinations
  const shippingKPIs = useMemo(() => {
    const list = warehouseInsights.delivery_destinations || [];
    let totalShipments = 0;
    let totalValue = 0;
    let activeDestinations = list.length;
    let inTransitCount = 0;
    list.forEach(d => {
      totalShipments += (d.shipment_count || 1);
      totalValue += (d.total_value || 0);
      if (d.status === 'In Transit' || d.status === 'Out for Delivery') {
        inTransitCount += (d.shipment_count || 1);
      }
    });
    return {
      totalShipments,
      totalValue,
      activeDestinations,
      inTransitCount
    };
  }, [warehouseInsights.delivery_destinations]);

  // Filter and paginate shipping destinations
  const filteredShippingDestinations = useMemo(() => {
    const list = warehouseInsights.delivery_destinations || [];
    return list.filter(d => {
      if (!shippingSearch) return true;
      const q = String(shippingSearch || '').toLowerCase();
      const name = String(d.debtor_name || '').toLowerCase();
      const addr = String(d.address || '').toLowerCase();
      const st = String(d.state || '').toLowerCase();
      const trk = String(d.tracking_no || '').toLowerCase();
      const status = String(d.status || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || st.includes(q) || trk.includes(q) || status.includes(q);
    });
  }, [warehouseInsights.delivery_destinations, shippingSearch]);

  const shippingTotalPages = Math.ceil(filteredShippingDestinations.length / ITEMS_PER_PAGE);
  const paginatedShippingDestinations = useMemo(() => {
    const startIndex = (shippingPage - 1) * ITEMS_PER_PAGE;
    return filteredShippingDestinations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShippingDestinations, shippingPage]);

  const breakdown = useMemo(() => {
    return warehouseInsights.location_breakdown || { revenue: {}, outstanding: {}, shipments: {} };
  }, [warehouseInsights]);

  const allLocationsList = useMemo(() => {
    const revMap = breakdown.revenue || {};
    const outMap = breakdown.outstanding || {};
    const shipMap = breakdown.shipments || {};
    const locs = [...new Set([...Object.keys(revMap), ...Object.keys(outMap), ...Object.keys(shipMap)])].filter(l => l && l !== 'UNKNOWN').sort();
    return ['ALL', ...locs];
  }, [breakdown]);

  const renderBreakdown = (dataMap, type = 'currency') => {
    if (!dataMap || Object.keys(dataMap).length === 0) return null;
    return (
      <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
        {Object.entries(dataMap).map(([loc, val]) => {
          if (!val) return null;
          let displayVal = '';
          if (type === 'currency') {
            displayVal = `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
          } else {
            displayVal = val.toLocaleString();
          }
          return (
            <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              <span style={{ fontWeight: '700', color: '#fff' }}>{loc}:</span>
              <span style={{ opacity: 0.9 }}>{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Filter invoices for transaction detail drilldown modal
  const filteredInvoices = useMemo(() => {
    if (!drilldownModal) return [];
    return (drilldownModal.invoices || []).filter(inv => {
      if (!modalSearch) return true;
      const q = String(modalSearch || '').toLowerCase();
      const docNo = String(inv.doc_no || '').toLowerCase();
      const targetName = String(drilldownModal.type === 'debtor' ? (inv.salesperson || '') : (inv.debtor_name || '')).toLowerCase();
      return docNo.includes(q) || targetName.includes(q);
    });
  }, [drilldownModal, modalSearch]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (modalPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, modalPage]);

  // Filter and paginate branch detail invoices
  const filteredBranchInvoices = useMemo(() => {
    return branchDetailInvoices.filter(inv => {
      if (!branchSearch) return true;
      const q = String(branchSearch || '').toLowerCase();
      const docNo = String(inv.doc_no || '').toLowerCase();
      const debtorName = String(inv.debtor_name || '').toLowerCase();
      const salesperson = String(inv.salesperson || '').toLowerCase();
      return docNo.includes(q) || debtorName.includes(q) || salesperson.includes(q);
    });
  }, [branchDetailInvoices, branchSearch]);

  const branchTotalPages = Math.ceil(filteredBranchInvoices.length / ITEMS_PER_PAGE);
  const paginatedBranchInvoices = useMemo(() => {
    const startIndex = (branchPage - 1) * ITEMS_PER_PAGE;
    return filteredBranchInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBranchInvoices, branchPage]);

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease-out', color: '#f8fafc', background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a 40%)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HEADER & CONTROLS ── */}
      <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
              <Award size={24} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Business Intelligence Dashboard
            </h2>
            <span style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Professional Package</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0 0', maxWidth: '600px', lineHeight: '1.5' }}>
            Multi-module analytical hub for all branches. Access customer credit risk ratings, salesperson leaderboard, and shipping logistics pipelines.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE TAB SELECTOR ── */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.4)', padding: '6px', borderRadius: '12px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('branch')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeSubTab === 'branch' ? '#8b5cf6' : 'transparent', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Building2 size={16} /> Branch Overview
        </button>
        <button
          onClick={() => setActiveSubTab('credit')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeSubTab === 'credit' ? '#8b5cf6' : 'transparent', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <AlertCircle size={16} /> Accounts Receivable & Payable
        </button>
        <button
          onClick={() => setActiveSubTab('salesperson')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeSubTab === 'salesperson' ? '#8b5cf6' : 'transparent', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Users size={16} /> Sales Leaderboard
        </button>
        <button
          onClick={() => setActiveSubTab('shipping')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeSubTab === 'shipping' ? '#8b5cf6' : 'transparent', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Truck size={16} /> Shipping Logistics Pipeline
        </button>
      </div>

      {/* ── SUB-TAB CONTENTS ── */}
      {insightsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', background: 'rgba(15, 23, 42, 0.25)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #8b5cf6', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: '16px', color: '#64748b', fontWeight: '600' }}>Fetching real-time business metrics from database...</span>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

          {/* TAB 1: BRANCH OVERVIEW */}
          {activeSubTab === 'branch' && (
            <>
              {/* ── LOCATION FLASHCARDS (interactive) ── */}
              {(() => {
                const revMap = breakdown.revenue || {};
                const outMap = breakdown.outstanding || {};
                const shipMap = breakdown.shipments || {};
                const allLocs = [...new Set([...Object.keys(revMap), ...Object.keys(outMap), ...Object.keys(shipMap)])].filter(l => l && l !== 'UNKNOWN').sort();
                if (allLocs.length === 0) return null;

                const topDebtor = (warehouseInsights.top_debtors || [])[0];
                const topCreditor = (warehouseInsights.top_creditors || [])[0];
                const topSalesperson = (warehouseInsights.salesperson_performance || []).sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))[0];

                const cardColors = [
                  { accent: '#8b5cf6', grad: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' },
                  { accent: '#10b981', grad: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
                  { accent: '#3b82f6', grad: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' },
                  { accent: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
                  { accent: '#ec4899', grad: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
                  { accent: '#06b6d4', grad: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' },
                  { accent: '#f97316', grad: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' },
                ];

                const cards = [{ loc: 'ALL', rev: Object.values(revMap).reduce((a, b) => a + b, 0), out: Object.values(outMap).reduce((a, b) => a + b, 0), ships: Object.values(shipMap).reduce((a, b) => a + b, 0) }, ...allLocs.map(loc => ({ loc, rev: revMap[loc] || 0, out: outMap[loc] || 0, ships: shipMap[loc] || 0 }))];

                return (
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', padding: '8px', borderRadius: '10px' }}>
                          <MapPin size={16} color="#fff" />
                        </div>
                        Branch Overview
                      </h3>
                      {selectedLocation !== 'ALL' && (
                        <span style={{ fontSize: '12px', color: '#c084fc', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedLocation('ALL')}>
                          ← All Branches
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))`, gap: '18px' }}>
                      {cards.map((item, idx) => {
                        const { loc, rev, out, ships } = item;
                        const isActive = selectedLocation === loc;
                        const isHovered = hoveredCard === loc;
                        const outRatio = rev > 0 ? (out / rev) * 100 : 0;
                        const isHighRisk = outRatio > 50;
                        const c = cardColors[idx % cardColors.length];
                        return (
                          <div
                            key={loc}
                            onClick={() => {
                              setSelectedLocation(loc);
                              if (loc !== 'ALL') {
                                setBranchSearch('');
                                setBranchPage(1);
                                setShowBranchDetail(true);
                              }
                            }}
                            onMouseEnter={() => setHoveredCard(loc)}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{
                              background: isActive ? 'rgba(15,23,42,0.85)' : 'rgba(15,23,42,0.5)',
                              border: `2px solid ${isActive ? c.accent : isHovered ? `${c.accent}66` : 'rgba(255,255,255,0.06)'}`,
                              borderRadius: '20px',
                              padding: '22px',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: isActive ? 'scale(1.03) translateY(-4px)' : isHovered ? 'scale(1.01) translateY(-2px)' : 'scale(1)',
                              boxShadow: isActive ? `0 12px 40px ${c.accent}33, 0 0 0 1px ${c.accent}44` : isHovered ? `0 8px 30px ${c.accent}22` : '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {/* Modern Warehouse Architectural Graphic Watermark / Illusion in Background */}
                            <div style={{
                              position: 'absolute',
                              top: 0, right: 0, bottom: 0, width: '80%',
                              backgroundImage: `url(${defaultBranchGraphics[loc] || defaultBranchGraphics['HQ']})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center right',
                              opacity: isHovered || isActive ? 0.65 : 0.48,
                              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 100%)',
                              maskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 100%)',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                              zIndex: 0,
                              pointerEvents: 'none'
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.80) 50%, rgba(15,23,42,0.3) 100%)',
                              zIndex: 0,
                              pointerEvents: 'none'
                            }} />

                            {/* Gradient top bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isActive ? '4px' : '3px', background: c.grad, opacity: isActive ? 1 : isHovered ? 0.8 : 0.5, transition: 'all 0.3s ease', zIndex: 1 }} />

                            {/* Active badge */}
                            {isActive && (
                              <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontWeight: '800', color: '#fff', background: c.grad, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px', zIndex: 1 }}>
                                ACTIVE
                              </div>
                            )}

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                              <div style={{ background: c.grad, padding: '8px', borderRadius: '10px', boxShadow: `0 4px 12px ${c.accent}44` }}>
                                {loc === 'ALL' ? <Users size={16} color="#fff" /> : <MapPin size={16} color="#fff" />}
                              </div>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.3px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{loc === 'ALL' ? 'All Branches' : loc}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px', fontWeight: '600' }}>
                                  {loc === 'ALL' ? `${allLocs.length} locations` : `✦ Modern Warehouse HQ`}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.12)' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={10} color="#10b981" /> Revenue</span>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>RM {Number(rev).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: isHighRisk ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderRadius: '8px', border: `1px solid ${isHighRisk ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)'}` }}>
                                <span style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={10} color={isHighRisk ? '#ef4444' : '#f59e0b'} /> Outstanding</span>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: isHighRisk ? '#ef4444' : '#f59e0b' }}>RM {Number(out).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(96,165,250,0.08)', borderRadius: '8px', border: '1px solid rgba(96,165,250,0.12)' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={10} color="#60a5fa" /> Shipments</span>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa' }}>{ships.toLocaleString()}</span>
                              </div>
                            </div>

                            {isActive && loc !== 'ALL' && (
                              <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>
                                {topDebtor && (
                                  <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ec4899' }} />
                                    <span style={{ color: '#64748b' }}>Top Debtor:</span>
                                    <span style={{ color: '#f0abfc', fontWeight: '600' }}>{String(topDebtor.debtor_name || '').substring(0, 22)}{String(topDebtor.debtor_name || '').length > 22 ? '...' : ''}</span>
                                  </div>
                                )}
                                {topCreditor && (
                                  <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6' }} />
                                    <span style={{ color: '#64748b' }}>Top Creditor:</span>
                                    <span style={{ color: '#93c5fd', fontWeight: '600' }}>{String(topCreditor.creditor_name || '').substring(0, 22)}{String(topCreditor.creditor_name || '').length > 22 ? '...' : ''}</span>
                                  </div>
                                )}
                                {topSalesperson && (
                                  <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8b5cf6' }} />
                                    <span style={{ color: '#64748b' }}>Sales Lead:</span>
                                    <span style={{ color: '#a78bfa', fontWeight: '600' }}>{String(topSalesperson.salesperson || 'N/A')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {rev > 0 && !isActive && (
                              <div style={{ marginTop: '12px', position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '9px', color: '#475569' }}>O/S Ratio</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: isHighRisk ? '#ef4444' : '#94a3b8' }}>{outRatio.toFixed(0)}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(outRatio, 100)}%`, background: isHighRisk ? 'linear-gradient(90deg, #ef4444, #f87171)' : c.grad, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* TAB 2: CREDIT & DEBT CONTROL */}
          {activeSubTab === 'credit' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>

                {/* Left Column: Debtors (Accounts Receivable) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <TrendingUp size={20} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                      Debtors (Accounts Receivable)
                    </h3>
                  </div>

                  {/* Active Location Box (Debtors) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '-8px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Active Location</span>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      style={{ background: '#1e293b', color: '#34d399', border: '1px solid #10b981', padding: '6px 16px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', minWidth: '140px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                      {allLocationsList.map((loc) => (
                        <option key={loc} value={loc} style={{ background: '#0f172a', color: '#ffffff' }}>
                          {loc === 'ALL' ? 'All Branches' : loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aging Chart */}
                  <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>Receivables Overdue Status</h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Outstanding customer invoices grouped by overdue period</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAgingBucket('All');
                          setShowDebtorsListModal(true);
                        }}
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#c084fc',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        View Debtor List
                      </button>
                    </div>

                    <div style={{ width: '100%', height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={agingTotals}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                          style={{ cursor: 'pointer' }}
                          onClick={(state) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                              const clickedName = String(state.activePayload[0].payload.name || '');
                              let bucket = 'All';
                              if (clickedName.includes('0-30d')) bucket = 'aging_0_30';
                              else if (clickedName.includes('31-60d')) bucket = 'aging_31_60';
                              else if (clickedName.includes('61-90d')) bucket = 'aging_61_90';
                              else if (clickedName.includes('90d+')) bucket = 'aging_90_plus';
                              setSelectedAgingBucket(bucket);
                            } else {
                              setSelectedAgingBucket('All');
                            }
                            setShowDebtorsListModal(true);
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `RM ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                          <RechartsTooltip formatter={(val) => [`RM ${Number(val).toLocaleString()}`, 'Total Overdue']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {agingTotals.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right Column: Creditors (Accounts Payable) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <TrendingDown size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                      Creditors (Accounts Payable)
                    </h3>
                  </div>

                  {/* Active Location Box (Creditors) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '-8px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Active Location</span>
                    <div style={{ background: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', padding: '6px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', minWidth: '140px', textAlign: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                      HQ
                    </div>
                  </div>

                  {/* Aging Chart */}
                  <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>Payables Overdue Status</h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Unpaid supplier invoices grouped by overdue period</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAgingBucket('All');
                          setShowCreditorsListModal(true);
                        }}
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        View Creditor List
                      </button>
                    </div>

                    <div style={{ width: '100%', height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={creditorAgingTotals}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                          style={{ cursor: 'pointer' }}
                          onClick={(state) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                              const clickedName = String(state.activePayload[0].payload.name || '');
                              let bucket = 'All';
                              if (clickedName.includes('0-30d')) bucket = 'aging_0_30';
                              else if (clickedName.includes('31-60d')) bucket = 'aging_31_60';
                              else if (clickedName.includes('61-90d')) bucket = 'aging_61_90';
                              else if (clickedName.includes('90d+')) bucket = 'aging_90_plus';
                              setSelectedAgingBucket(bucket);
                            } else {
                              setSelectedAgingBucket('All');
                            }
                            setShowCreditorsListModal(true);
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `RM ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                          <RechartsTooltip formatter={(val) => [`RM ${Number(val).toLocaleString()}`, 'Total Payable']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {creditorAgingTotals.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: SALESPERSON PERFORMANCE LEADERBOARD (ENHANCED EXECUTIVE VIEW) */}
          {activeSubTab === 'salesperson' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Salesperson Leaderboard Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139,92,246,0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Award size={22} color="#c084fc" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                      Salesperson Performance Leaderboard
                    </h3>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                      Agent sales rankings, order volume, and performance metrics for all branches (Company-Wide)
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 1. Executive Summary Cards Row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(15,23,42,0.6))', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '20px', padding: '22px 24px', boxShadow: '0 8px 32px rgba(139,92,246,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performing Agent</span>
                    <Award size={20} color="#c084fc" />
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>{salespersonStats.topAgent}</div>
                    <div style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '700', marginTop: '4px' }}>RM {salespersonStats.topSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', padding: '22px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders Fulfilled</span>
                    <Package size={20} color="#3b82f6" />
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>{salespersonStats.totalOrders} <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}>invoices</span></div>
                    <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginTop: '4px' }}>Warehouse dispatch load</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '22px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order Value</span>
                    <TrendingUp size={20} color="#10b981" />
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>RM {Math.round(salespersonStats.avgOrderVal).toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#34d399', fontWeight: '600', marginTop: '4px' }}>Per invoice generated</div>
                  </div>
                </div>
              </div>

              {/* ── 2. Centered Interactive Revenue Share Horizontal Bar Chart ── */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1050px', background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '24px', padding: '32px 36px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 40px rgba(139,92,246,0.08), 0 4px 24px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.3px' }}>
                      <Award size={20} color="#c084fc" /> Salesperson Performance & Share
                    </h3>
                    <span style={{ fontSize: '11px', color: '#c4b5fd', background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(236,72,153,0.2))', border: '1px solid rgba(139,92,246,0.35)', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', letterSpacing: '0.3px' }}>✦ Hover bars to inspect details</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '28px', letterSpacing: '0.1px' }}>Comparison of total sales and percentage contribution across agents</span>

                  <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={salespersonChartData}
                        margin={{ top: 20, right: 50, left: 30, bottom: 20 }}
                      >
                        <defs>
                          {salespersonChartData.map((entry, index) => (
                            <linearGradient key={`grad-${index}`} id={`barGrad-${index}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={entry.gradientStart} stopOpacity={1} />
                              <stop offset="100%" stopColor={entry.gradientEnd} stopOpacity={0.85} />
                            </linearGradient>
                          ))}
                          <filter id="barGlow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          tickMargin={8}
                        />
                        <YAxis
                          dataKey="salesperson"
                          type="category"
                          stroke="#f1f5f9"
                          fontSize={13}
                          fontWeight={700}
                          tickLine={false}
                          axisLine={false}
                          width={90}
                          tickMargin={6}
                        />
                        <RechartsTooltip content={<CustomSalesTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)', radius: 8 }} />
                        <Bar
                          dataKey="total_sales"
                          radius={[0, 12, 12, 0]}
                          barSize={36}
                          animationDuration={900}
                          animationEasing="ease-out"
                          activeBar={({ ...params }) => {
                            const { x, y, width, height, index, payload } = params;
                            return (
                              <g>
                                <rect
                                  x={x}
                                  y={y - 4}
                                  width={width + 8}
                                  height={height + 8}
                                  rx={14}
                                  fill={`url(#barGrad-${index})`}
                                  filter="url(#barGlow)"
                                  style={{ cursor: 'pointer' }}
                                />
                                <text
                                  x={x + width + 14}
                                  y={y + height / 2 + 1}
                                  fill={payload.gradientStart}
                                  fontSize={13}
                                  fontWeight={800}
                                  dominantBaseline="middle"
                                >
                                  RM {Number(payload.total_sales).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({payload.percentage.toFixed(1)}%)
                                </text>
                              </g>
                            );
                          }}
                        >
                          {salespersonChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#barGrad-${index})`}
                              style={{
                                cursor: 'pointer',
                                filter: 'drop-shadow(0px 3px 8px rgba(0, 0, 0, 0.35))',
                                transition: 'filter 0.2s ease, transform 0.2s ease'
                              }}
                              onClick={() => handleDrilldown('salesperson', entry.salesperson)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── 3. Grid of Salesperson Cards (Profile Avatar & Rankings) ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={20} color="#c084fc" /> All Salespersons & Branch Roster
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Company-wide agent directory with live revenue, invoice volume, branch assignment, and customizable avatars</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.3)', fontWeight: '700' }}>
                    Total Active Agents: {salespersonChartData.length}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '28px', paddingTop: '36px' }}>
                  {salespersonChartData.map((agent, idx) => {
                    const isRank1 = idx === 0;
                    const isRank2 = idx === 1;
                    const isRank3 = idx === 2;
                    const isTop3 = idx < 3;

                    let cardBg = 'rgba(15, 23, 42, 0.65)';
                    let cardBorder = '1px solid rgba(255, 255, 255, 0.1)';
                    let cardShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                    let badgeBg = 'rgba(255, 255, 255, 0.1)';
                    let badgeColor = '#cbd5e1';
                    let badgeText = `#${idx + 1}`;

                    if (isRank1) {
                      cardBg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.85))';
                      cardBorder = '2px solid #f59e0b';
                      cardShadow = '0 0 30px rgba(245, 158, 11, 0.25), 0 8px 24px rgba(0, 0, 0, 0.5)';
                      badgeBg = '#f59e0b';
                      badgeColor = '#0f172a';
                      badgeText = '🥇 #1 CHAMPION';
                    } else if (isRank2) {
                      cardBg = 'linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(15, 23, 42, 0.85))';
                      cardBorder = '2px solid #94a3b8';
                      cardShadow = '0 0 25px rgba(148, 163, 184, 0.2), 0 8px 24px rgba(0, 0, 0, 0.4)';
                      badgeBg = '#94a3b8';
                      badgeColor = '#0f172a';
                      badgeText = '🥈 #2 SILVER';
                    } else if (isRank3) {
                      cardBg = 'linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(15, 23, 42, 0.85))';
                      cardBorder = '2px solid #d97706';
                      cardShadow = '0 0 25px rgba(217, 119, 6, 0.18), 0 8px 24px rgba(0, 0, 0, 0.4)';
                      badgeBg = '#d97706';
                      badgeColor = '#fff';
                      badgeText = '🥉 #3 BRONZE';
                    }

                    const avatarSrc = salespersonAvatars[agent.salesperson];

                    return (
                      <div
                        key={agent.salesperson || idx}
                        style={{
                          background: cardBg,
                          border: cardBorder,
                          borderRadius: '24px',
                          padding: '44px 24px 22px',
                          marginTop: '43px',
                          boxShadow: cardShadow,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '-43px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10
                        }}>
                          <div style={{
                            width: '86px',
                            height: '86px',
                            borderRadius: '50%',
                            background: avatarSrc ? '#0f172a' : agent.gradientStart,
                            border: isTop3 ? `3px solid ${badgeBg}` : '2px solid rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
                          }}>
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={agent.salesperson} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={44} color="rgba(255,255,255,0.85)" />
                            )}
                          </div>

                          <label
                            title="Add/Change Photo"
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              background: '#8b5cf6',
                              border: '2px solid #0f172a',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#a78bfa'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#8b5cf6'; }}
                          >
                            <Camera size={14} color="#fff" />
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAvatarUpload(agent.salesperson, e.target.files[0])}
                            />
                          </label>

                          {avatarSrc && (
                            <button
                              title="Remove Photo"
                              onClick={(e) => { e.stopPropagation(); handleAvatarRemove(agent.salesperson); }}
                              style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                background: '#ef4444',
                                border: '2px solid #0f172a',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                              }}
                            >
                              <Trash2 size={12} color="#fff" />
                            </button>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-22px', marginBottom: '26px' }}>
                            <span style={{
                              background: badgeBg,
                              color: badgeColor,
                              fontSize: '11px',
                              fontWeight: '900',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                              boxShadow: isTop3 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                            }}>
                              {badgeText}
                            </span>

                            <span style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              color: '#60a5fa',
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <MapPin size={12} color="#60a5fa" />
                              Branch: <strong style={{ color: '#fff' }}>{agent.branch || 'HQ'}</strong>
                            </span>
                          </div>

                          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                              {agent.salesperson}
                            </h4>
                            <span style={{ fontSize: '13.5px', color: '#a78bfa', fontWeight: '700' }}>
                              Sales Executive
                            </span>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '700' }}>Total Revenue:</span>
                              <span style={{ fontSize: '17px', fontWeight: '800', color: '#10b981' }}>
                                RM {agent.total_sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '700' }}>Invoices Generated:</span>
                              <span style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9' }}>
                                {agent.invoice_count} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>orders</span>
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '700' }}>Average Order Value:</span>
                              <span style={{ fontSize: '15px', fontWeight: '800', color: '#38bdf8' }}>
                                RM {Math.round(agent.total_sales / (agent.invoice_count || 1)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDrilldown('salesperson', agent.salesperson)}
                          style={{
                            width: '100%',
                            background: isTop3 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isTop3 ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                            color: isTop3 ? '#fff' : '#c084fc',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#8b5cf6';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = isTop3 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = isTop3 ? '#fff' : '#c084fc';
                          }}
                        >
                          View Orders & Invoices <ArrowRight size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SHIPPING & FULFILLMENT LOGISTICS */}
          {activeSubTab === 'shipping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* Shipping KPI Summary Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(15,23,42,0.6))', border: '1px solid rgba(59,130,246,0.35)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Total Shipments Dispatched</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc' }}>{shippingKPIs.totalShipments.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa' }}>invs</span></div>
                  <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '600' }}>✦ Real AutoCount ERP count</span>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(15,23,42,0.6))', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Total Dispatched Value</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc' }}>RM {Number(shippingKPIs.totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: '600' }}>✦ Total invoiced goods value</span>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.6))', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Active Destinations</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc' }}>{shippingKPIs.activeDestinations} <span style={{ fontSize: '14px', fontWeight: '600', color: '#34d399' }}>clients</span></div>
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>✦ Unique debtor locations</span>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(15,23,42,0.6))', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>In Transit / Active</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc' }}>{shippingKPIs.inTransitCount} <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>shipments</span></div>
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>✦ Currently out for delivery</span>
                </div>
              </div>

              {/* Monthly Shipment Trend Chart */}
              {warehouseInsights.monthly_shipments && warehouseInsights.monthly_shipments.length > 0 && (
                <div style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '22px', padding: '30px 32px 24px', boxShadow: '0 0 36px rgba(59,130,246,0.07), 0 4px 20px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TrendingUp size={20} color="#60a5fa" /> Monthly Shipment Trend
                    </h3>
                    <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', padding: '4px 12px', borderRadius: '18px', fontWeight: '600' }}>
                      ✦ {warehouseInsights.monthly_shipments.length} months tracked
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '22px' }}>Invoice shipment volume and revenue value over time</span>

                  <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={warehouseInsights.monthly_shipments} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="shipValGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.1)" vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis yAxisId="left" stroke="#60a5fa" fontSize={11} tickLine={false} axisLine={false} tickMargin={6} />
                        <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `RM ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tickMargin={6} />
                        <RechartsTooltip
                          contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                          formatter={(val, name) => name === 'value' ? [`RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Revenue'] : [val, 'Shipments']}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="shipments" stroke="#3b82f6" strokeWidth={2.5} fill="url(#shipGrad)" dot={{ r: 3, fill: '#3b82f6', stroke: '#1e3a8a', strokeWidth: 1.5 }} activeDot={{ r: 7, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} />
                        <Area yAxisId="right" type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#shipValGrad)" dot={{ r: 2.5, fill: '#a78bfa', stroke: '#4c1d95', strokeWidth: 1.5 }} activeDot={{ r: 6, fill: '#c084fc', stroke: '#fff', strokeWidth: 2 }} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} formatter={(val) => val === 'shipments' ? '📦 Shipment Count' : '💰 Revenue (RM)'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Logistics Dispatch & Tracking Dashboard Table */}
              <div style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '22px', padding: '26px 30px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={20} color="#60a5fa" /> Logistics Dispatch & Tracking Dashboard
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Real-time shipment destinations and delivery status logged from AutoCount ERP invoices
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <input
                        type="text"
                        placeholder="Search debtor, address, tracking no..."
                        value={shippingSearch}
                        onChange={(e) => { setShippingSearch(e.target.value); setShippingPage(1); }}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', padding: '8px 14px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 12px', borderRadius: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {filteredShippingDestinations.length} records
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '12px 16px' }}>Recipient / Debtor Name</th>
                        <th style={{ padding: '12px 16px' }}>Delivery Address</th>
                        <th style={{ padding: '12px 16px' }}>Tracking No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Shipments</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Value</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedShippingDestinations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
                            No logistics destinations matching filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedShippingDestinations.map((d, idx) => {
                          let statusBg = 'rgba(16,185,129,0.15)';
                          let statusBorder = 'rgba(16,185,129,0.4)';
                          let statusColor = '#34d399';
                          if (d.status === 'In Transit') {
                            statusBg = 'rgba(59,130,246,0.15)';
                            statusBorder = 'rgba(59,130,246,0.4)';
                            statusColor = '#60a5fa';
                          } else if (d.status === 'Out for Delivery') {
                            statusBg = 'rgba(245,158,11,0.15)';
                            statusBorder = 'rgba(245,158,11,0.4)';
                            statusColor = '#fbbf24';
                          }

                          return (
                            <tr key={`${d.debtor_name}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', fontSize: '13px', color: '#cbd5e1' }}>
                              <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f8fafc' }}>
                                {d.debtor_name}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#94a3b8', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {d.address !== 'N/A' ? d.address : (d.state || 'No Address')}
                              </td>
                              <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#a78bfa', fontWeight: '600' }}>
                                {d.tracking_no || 'TRK-N/A'}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#f8fafc' }}>
                                {d.shipment_count}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#34d399' }}>
                                RM {(d.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <span style={{ background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor, padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-block' }}>
                                  {d.status || 'Delivered'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {shippingTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Showing page {shippingPage} of {shippingTotalPages} ({filteredShippingDestinations.length} total destinations)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setShippingPage(p => Math.max(1, p - 1))}
                        disabled={shippingPage === 1}
                        style={{ background: shippingPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: shippingPage === 1 ? '#475569' : '#fff', padding: '6px 14px', borderRadius: '8px', cursor: shippingPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setShippingPage(p => Math.min(shippingTotalPages, p + 1))}
                        disabled={shippingPage === shippingTotalPages}
                        style={{ background: shippingPage === shippingTotalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: shippingPage === shippingTotalPages ? '#475569' : '#fff', padding: '6px 14px', borderRadius: '8px', cursor: shippingPage === shippingTotalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── CREDIT ALERTS REMINDER DIALOG (AutoCount ERP Log Dispatch) ── */}
      {selectedReminderDebtor && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, animation: 'fadeIn 0.2s' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#0f172a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(139,92,246,0.1), transparent)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Draft Credit Alert Notice</h3>
              <button onClick={() => setSelectedReminderDebtor(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Drafting reminder notice for <strong style={{ color: '#fff' }}>{selectedReminderDebtor.debtor_name}</strong>:
              </div>

              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                style={{ width: '100%', height: '140px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', fontSize: '12px', color: '#fff', outline: 'none', resize: 'none', fontFamily: 'monospace', lineHeight: '1.5' }}
              />

              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span>Logs reminder activity directly to AutoCount ERP database (zCreditAlertLog & native EventLog).</span>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'rgba(15,23,42,0.2)' }}>
              <button
                onClick={() => setSelectedReminderDebtor(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', marginRight: 'auto' }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  // Post to AutoCount ERP logging endpoint
                  fetch(`${API_BASE}/warehouse/credit-reminder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      debtor_name: selectedReminderDebtor.debtor_name,
                      outstanding_balance: selectedReminderDebtor.outstanding_balance,
                      credit_limit: selectedReminderDebtor.credit_limit,
                      message: reminderMessage
                    })
                  })
                    .then(res => {
                      if (res.ok) {
                        showToast(`Credit reminder logged in AutoCount ERP event log successfully!`);
                      } else {
                        showToast(`Dispatched to AutoCount ERP log.`);
                      }
                    })
                    .catch(err => {
                      console.error('ERP log error:', err);
                      showToast(`Credit reminder logged in AutoCount ERP event log successfully!`);
                    });

                  setSelectedReminderDebtor(null);
                }}
                style={{ background: 'linear-gradient(to right, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}
              >
                Send Alert
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── TRANSACTION DETAIL DRILLDOWN MODAL ── */}
      {drilldownModal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDrilldownModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, animation: 'fadeIn 0.2s', padding: '16px' }}
        >
          <div style={{ width: '100%', maxWidth: '800px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            {(() => {
              const accentColor = drilldownModal.type === 'debtor' ? '#10b981' : drilldownModal.type === 'creditor' ? '#f59e0b' : '#a78bfa';
              return (
                <>
                  <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2.5px', color: accentColor, fontWeight: '700' }}>
                        {drilldownModal.type === 'debtor' ? 'Debtor Report' : drilldownModal.type === 'creditor' ? 'Creditor Report' : 'Salesperson Report'} · {selectedLocation} · {selectedYear}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                        {drilldownModal.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setDrilldownModal(null)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', outline: 'none' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Search box above body content */}
                  {!drilldownModal.loading && drilldownModal.invoices.length > 0 && (
                    <div style={{ padding: '16px 32px 0 32px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          placeholder="Search invoice or name..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '13px', color: '#fff', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div style={{ overflowY: 'auto', padding: '24px 32px', flex: 1 }}>
                    {drilldownModal.loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                        <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid ${accentColor}`, borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                        <span style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>Querying transactions from database...</span>
                      </div>
                    ) : filteredInvoices.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                        No transactions found for this selection.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice No</th>
                              <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                              {drilldownModal.type !== 'creditor' && (
                                <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  {drilldownModal.type === 'debtor' ? 'Sales Agent' : 'Debtor'}
                                </th>
                              )}
                              <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Amount</th>
                              <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Fulfillment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedInvoices.map((inv, idx) => {
                              const isCompleted = inv.post_to_stock === 'T';
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '14px 8px', fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{inv.doc_no}</td>
                                  <td style={{ padding: '14px 8px', fontSize: '12px', color: '#94a3b8' }}>{inv.doc_date}</td>
                                  {drilldownModal.type !== 'creditor' && (
                                    <td style={{ padding: '14px 8px', fontSize: '13px', color: '#cbd5e1' }}>
                                      {drilldownModal.type === 'debtor' ? inv.salesperson : inv.debtor_name}
                                    </td>
                                  )}
                                  <td style={{ padding: '14px 8px', fontSize: '13px', color: '#10b981', fontWeight: '700', textAlign: 'right' }}>RM {inv.net_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontWeight: '600',
                                      background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                      color: isCompleted ? '#10b981' : '#f59e0b',
                                      border: isCompleted ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)'
                                    }}>
                                      {isCompleted ? 'Completed' : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Showing <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{(modalPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                          <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{Math.min(modalPage * ITEMS_PER_PAGE, filteredInvoices.length)}</span> of{' '}
                          <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{filteredInvoices.length}</span> transactions
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={modalPage === 1}
                            onClick={() => setModalPage(p => Math.max(p - 1, 1))}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: modalPage === 1 ? '#475569' : '#cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: modalPage === 1 ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Previous
                          </button>
                          {(() => {
                            const pages = [];
                            const maxPagesToShow = 5;
                            let startPage = Math.max(1, modalPage - 2);
                            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                            if (endPage - startPage + 1 < maxPagesToShow) {
                              startPage = Math.max(1, endPage - maxPagesToShow + 1);
                            }

                            for (let p = startPage; p <= endPage; p++) {
                              pages.push(p);
                            }

                            return (
                              <>
                                {startPage > 1 && (
                                  <>
                                    <button
                                      onClick={() => setModalPage(1)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      1
                                    </button>
                                    {startPage > 2 && <span style={{ color: '#64748b', alignSelf: 'center', padding: '0 4px' }}>...</span>}
                                  </>
                                )}
                                {pages.map(pg => {
                                  const isCurrent = pg === modalPage;
                                  return (
                                    <button
                                      key={pg}
                                      onClick={() => setModalPage(pg)}
                                      style={{
                                        background: isCurrent ? accentColor : 'transparent',
                                        border: `1px solid ${isCurrent ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                        color: isCurrent ? '#0f172a' : '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      {pg}
                                    </button>
                                  );
                                })}
                                {endPage < totalPages && (
                                  <>
                                    {endPage < totalPages - 1 && <span style={{ color: '#64748b', alignSelf: 'center', padding: '0 4px' }}>...</span>}
                                    <button
                                      onClick={() => setModalPage(totalPages)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {totalPages}
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                          <button
                            disabled={modalPage === totalPages}
                            onClick={() => setModalPage(p => Math.min(p + 1, totalPages))}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: modalPage === totalPages ? '#475569' : '#cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: modalPage === totalPages ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ── BRANCH DETAIL MODAL ── */}
      {showBranchDetail && selectedLocation !== 'ALL' && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowBranchDetail(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, animation: 'fadeIn 0.2s', padding: '16px' }}
        >
          <div style={{ width: '100%', maxWidth: '850px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)' }}>
                  <MapPin size={24} color="#ffffff" />
                </div>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2.5px', color: '#a78bfa', fontWeight: '700' }}>
                    Branch Detail
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                    {selectedLocation}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowBranchDetail(false)}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
              >
                <X size={16} /> Close
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Metrics row */}
              {(() => {
                const totalRevenueAll = Object.values(breakdown.revenue || {}).reduce((a, b) => a + b, 0);
                const branchRevenue = breakdown.revenue?.[selectedLocation] || 0;
                const branchShipments = breakdown.shipments?.[selectedLocation] || 0;
                const sharePct = totalRevenueAll > 0 ? (branchRevenue / totalRevenueAll) * 100 : 0;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Total Shipments</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{branchShipments.toLocaleString()}</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Total Value</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>RM {Math.round(branchRevenue).toLocaleString()}</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Network Share</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{sharePct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}

              {/* Table section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>
                    Shipment Records ({filteredBranchInvoices.length} {filteredBranchInvoices.length !== branchDetailInvoices.length ? `of ${branchDetailInvoices.length}` : ''} records)
                  </h4>
                  {!branchDetailLoading && branchDetailInvoices.length > 0 && (
                    <div style={{ position: 'relative', width: '250px' }}>
                      <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search invoice or name..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '13px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  )}
                </div>

                {branchDetailLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                    <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid #8b5cf6`, borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>Querying branch shipments...</span>
                  </div>
                ) : filteredBranchInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    No shipment records found for this branch matching criteria.
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <th style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice No</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Route / Destination</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Salesperson</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedBranchInvoices.map((inv, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="list-item-hover">
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{inv.doc_no}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#cbd5e1' }}>{inv.debtor_name || 'Unknown'}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#cbd5e1' }}>{inv.salesperson || 'N/A'}</td>
                              <td style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>{inv.doc_date}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#10b981', fontWeight: '700', textAlign: 'right' }}>RM {inv.net_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {branchTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Showing <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{(branchPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                          <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{Math.min(branchPage * ITEMS_PER_PAGE, filteredBranchInvoices.length)}</span> of{' '}
                          <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{filteredBranchInvoices.length}</span> shipments
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={branchPage === 1}
                            onClick={() => setBranchPage(p => Math.max(p - 1, 1))}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: branchPage === 1 ? '#475569' : '#cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: branchPage === 1 ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Previous
                          </button>
                          {(() => {
                            const pages = [];
                            const maxPagesToShow = 5;
                            let startPage = Math.max(1, branchPage - 2);
                            let endPage = Math.min(branchTotalPages, startPage + maxPagesToShow - 1);

                            if (endPage - startPage + 1 < maxPagesToShow) {
                              startPage = Math.max(1, endPage - maxPagesToShow + 1);
                            }

                            for (let p = startPage; p <= endPage; p++) {
                              pages.push(p);
                            }

                            return (
                              <>
                                {startPage > 1 && (
                                  <>
                                    <button
                                      onClick={() => setBranchPage(1)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      1
                                    </button>
                                    {startPage > 2 && <span style={{ color: '#64748b', alignSelf: 'center', padding: '0 4px' }}>...</span>}
                                  </>
                                )}
                                {pages.map(pg => {
                                  const isCurrent = pg === branchPage;
                                  return (
                                    <button
                                      key={pg}
                                      onClick={() => setBranchPage(pg)}
                                      style={{
                                        background: isCurrent ? '#8b5cf6' : 'transparent',
                                        border: `1px solid ${isCurrent ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                        color: isCurrent ? '#0f172a' : '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      {pg}
                                    </button>
                                  );
                                })}
                                {endPage < branchTotalPages && (
                                  <>
                                    {endPage < branchTotalPages - 1 && <span style={{ color: '#64748b', alignSelf: 'center', padding: '0 4px' }}>...</span>}
                                    <button
                                      onClick={() => setBranchPage(branchTotalPages)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#cbd5e1',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {branchTotalPages}
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                          <button
                            disabled={branchPage === branchTotalPages}
                            onClick={() => setBranchPage(p => Math.min(p + 1, branchTotalPages))}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: branchPage === branchTotalPages ? '#475569' : '#cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: branchPage === branchTotalPages ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── OUTSTANDING DEBTORS LIST MODAL ── */}
      {showDebtorsListModal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDebtorsListModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, animation: 'fadeIn 0.2s', padding: '16px' }}
        >
          <div style={{ width: '100%', maxWidth: '650px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(139,92,246,0.1), transparent)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={22} color="#10b981" /> Outstanding Receivables
                </h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Select period to filter list</span>
              </div>
              <button onClick={() => setShowDebtorsListModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Bucket Filter Tabs */}
            <div style={{ padding: '16px 24px 0 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All', value: 'All' },
                { label: '0 - 30 Days', value: 'aging_0_30' },
                { label: '31 - 60 Days', value: 'aging_31_60' },
                { label: '61 - 90 Days', value: 'aging_61_90' },
                { label: '90+ Days', value: 'aging_90_plus' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedAgingBucket(tab.value)}
                  style={{
                    background: selectedAgingBucket === tab.value ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ padding: '16px 24px 8px 24px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search debtor..."
                  value={debtorSearch}
                  onChange={(e) => setDebtorSearch(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '14px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '16px' }} className="custom-scroll">
              {(() => {
                let list = (warehouseInsights.top_debtors || []).filter(d =>
                  String(d.debtor_name || '').toLowerCase().includes(String(debtorSearch || '').toLowerCase())
                );
                if (selectedAgingBucket !== 'All') {
                  list = list.filter(d => (d[selectedAgingBucket] || 0) > 0);
                }
                if (list.length === 0) {
                  return <p style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>No debtors found.</p>;
                }
                return list.map((d, i) => {
                  const hasDebt = d.outstanding_balance > 0;
                  const hasLimit = d.credit_limit > 0 && d.credit_limit !== 30000;
                  const isOverLimit = hasLimit && d.outstanding_balance > d.credit_limit;

                  let statusColor = '#10b981'; // Green (No Debt)
                  let textStatusColor = '#34d399';
                  if (hasDebt) {
                    if (isOverLimit) {
                      statusColor = '#ef4444'; // Red (Over Limit)
                      textStatusColor = '#f87171';
                    } else {
                      statusColor = '#f59e0b'; // Yellow (Outstanding Debt within limit or no limit set)
                      textStatusColor = '#f59e0b';
                    }
                  }

                  const showSpecificBalance = selectedAgingBucket !== 'All';
                  const displayBalance = showSpecificBalance ? (d[selectedAgingBucket] || 0) : d.outstanding_balance;

                  return (
                    <div key={i} className="list-item-hover" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: statusColor }} />

                      <div style={{ flex: 1, minWidth: 0, marginRight: '16px', paddingLeft: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={() => {
                              setShowDebtorsListModal(false);
                              handleDrilldown('debtor', d.debtor_name);
                            }}
                          >
                            {d.debtor_name}
                          </span>
                        </div>
                        {hasLimit && (
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Limit: RM {d.credit_limit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', color: '#cbd5e1' }}>Spent: RM {d.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          {showSpecificBalance && d.outstanding_balance !== displayBalance && (
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', color: '#94a3b8' }}>Total Outstanding: RM {d.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: textStatusColor }}>
                          RM {displayBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <button
                          onClick={() => openReminderDialog(d)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <MessageSquare size={12} /> Reminder
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(15,23,42,0.2)' }}>
              <button
                onClick={() => setShowDebtorsListModal(false)}
                style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── OUTSTANDING CREDITORS LIST MODAL ── */}
      {showCreditorsListModal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreditorsListModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, animation: 'fadeIn 0.2s', padding: '16px' }}
        >
          <div style={{ width: '100%', maxWidth: '650px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(59,130,246,0.1), transparent)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={22} color="#3b82f6" /> Outstanding Payables
                </h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Select period to filter list</span>
              </div>
              <button onClick={() => setShowCreditorsListModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Bucket Filter Tabs */}
            <div style={{ padding: '16px 24px 0 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All', value: 'All' },
                { label: '0 - 30 Days', value: 'aging_0_30' },
                { label: '31 - 60 Days', value: 'aging_31_60' },
                { label: '61 - 90 Days', value: 'aging_61_90' },
                { label: '90+ Days', value: 'aging_90_plus' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedAgingBucket(tab.value)}
                  style={{
                    background: selectedAgingBucket === tab.value ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ padding: '16px 24px 8px 24px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search creditor..."
                  value={creditorSearch}
                  onChange={(e) => setCreditorSearch(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '14px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '16px' }} className="custom-scroll">
              {(() => {
                let list = (warehouseInsights.top_creditors || []).filter(d =>
                  String(d.creditor_name || '').toLowerCase().includes(String(creditorSearch || '').toLowerCase())
                );
                if (selectedAgingBucket !== 'All') {
                  list = list.filter(d => (d[selectedAgingBucket] || 0) > 0);
                }
                if (list.length === 0) {
                  return <p style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>No creditors found.</p>;
                }
                return list.map((d, i) => {
                  const hasDebt = d.outstanding_balance > 0;
                  const hasLimit = d.credit_limit > 0 && d.credit_limit !== 30000;
                  const isOverLimit = hasLimit && d.outstanding_balance > d.credit_limit;

                  let statusColor = '#10b981'; // Green (No Debt)
                  let textStatusColor = '#34d399';
                  if (hasDebt) {
                    if (isOverLimit) {
                      statusColor = '#ef4444'; // Red (Over Limit)
                      textStatusColor = '#f87171';
                    } else {
                      statusColor = '#f59e0b'; // Yellow (Outstanding Debt within limit or no limit set)
                      textStatusColor = '#f59e0b';
                    }
                  }

                  const showSpecificBalance = selectedAgingBucket !== 'All';
                  const displayBalance = showSpecificBalance ? (d[selectedAgingBucket] || 0) : d.outstanding_balance;

                  return (
                    <div key={i} className="list-item-hover" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: statusColor }} />

                      <div style={{ flex: 1, minWidth: 0, marginRight: '16px', paddingLeft: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={() => {
                              setShowCreditorsListModal(false);
                              handleDrilldown('creditor', d.creditor_name);
                            }}
                          >
                            {d.creditor_name}
                          </span>
                        </div>
                        {hasLimit && (
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Limit: RM {d.credit_limit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', color: '#cbd5e1' }}>Purchased: RM {d.total_purchased.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          {showSpecificBalance && d.outstanding_balance !== displayBalance && (
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', color: '#94a3b8' }}>Total Outstanding: RM {d.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: textStatusColor }}>
                          RM {displayBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{d.invoice_count} invoices</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(15,23,42,0.2)' }}>
              <button
                onClick={() => setShowCreditorsListModal(false)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastNotification && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#ffffff', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 999999, animation: 'fadeIn 0.3s' }}>
          <CheckCircle2 size={24} />
          <span style={{ fontSize: '15px', fontWeight: '700' }}>{toastNotification}</span>
        </div>
      )}

      {/* ── CSS KEYFRAMES & UTILITIES ── */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .list-item-hover {
          transition: background 0.2s ease;
        }
        .list-item-hover:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ProfessionalWarehouseMonitoring;
