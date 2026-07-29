import React, { useMemo, useState, useEffect } from 'react';
import { 
  Map, Truck, Activity, ArrowRightLeft, TrendingUp, AlertTriangle, 
  Building2, PackageCheck, Route, Crown, CheckCircle2, 
  DollarSign, Users, Clock, Mail, ShieldAlert, Award, FileText, Send, X, ArrowUpRight,
  Shield, Globe, Target, Compass, RefreshCw, Play, Check, Lock, Unlock, ArrowRight, Layers, Coins,
  Warehouse, Zap, ClipboardCheck, AlertOctagon, Search, Camera, User, Info, Package, RotateCcw, ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie
} from 'recharts';

const ENTERPRISE_BRANCHES = ['HQ', 'STORE', 'TA', 'NUSA.B', 'PUCHONG', 'SS14'];

const defaultBranchGraphics = {
  ALL: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
  HQ: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80',
  STORE: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=900&q=80',
  TA: 'https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&w=900&q=80',
  'NUSA.B': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=80',
  PUCHONG: 'https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&w=900&q=80',
  SS14: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=900&q=80'
};

const EnterpriseWarehouseMonitoring = ({ selectedYear = 'All' }) => {
  // Database insights states
  const [insights, setInsights] = useState(null);
  const [branchInsights, setBranchInsights] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Interactive UI States
  
  // Interactive UI States
  const [activeSubTab, setActiveSubTab] = useState('executive_command');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [actionExecuting, setActionExecuting] = useState(null);
  const [executedActions, setExecutedActions] = useState([]);
  const [agingSearch, setAgingSearch] = useState('');
  const [agingRange, setAgingRange] = useState('All');
  const [agingCurrentPage, setAgingCurrentPage] = useState(1);
  
  useEffect(() => {
    setAgingCurrentPage(1);
  }, [agingSearch, agingRange]);
  
  // Executive and Control States
  const [workflowsExecuted, setWorkflowsExecuted] = useState(false);
  const [workflowsExecuting, setWorkflowsExecuting] = useState(false);
  const [creditSafeguardActive, setCreditSafeguardActive] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState('90d');
  const [routeOptimizationActive, setRouteOptimizationActive] = useState(false);
  const [showCashFlowInfo, setShowCashFlowInfo] = useState(false);
  const [individualActions, setIndividualActions] = useState({});
  
  // Modal states for action details
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [reminderDraft, setReminderDraft] = useState('');
  const [expandedDebtor, setExpandedDebtor] = useState(null);
  const [expandedCreditor, setExpandedCreditor] = useState(null);
  const [selectedAgingDebtor, setSelectedAgingDebtor] = useState({});
  const [globalAgingFilter, setGlobalAgingFilter] = useState('All');
  const [salespersonAvatars, setSalespersonAvatars] = useState(() => {
    try {
      const saved = localStorage.getItem('gpis_salesperson_avatars');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  
  // Local toggles to simulate optimization impacts
  const [carriersSwitched, setCarriersSwitched] = useState(false);
  const [debtorHolds, setDebtorHolds] = useState([]);
  const [discountsApplied, setDiscountsApplied] = useState([]);
  const [shippingActionsExecuted, setShippingActionsExecuted] = useState([]);

  const openLogisticsDetails = (detailId) => {
    setActiveLogisticsModal(current => current === detailId ? null : detailId);
    setLogisticsPage(1);
    setLogisticsSearch('');
    if (activeLogisticsModal !== detailId) {
      setTimeout(() => document.getElementById('logistics-details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  };
  const [clearanceItem, setClearanceItem] = useState(null);
  const tableRef = React.useRef(null);
  
  // Logistics Modals
  const [activeLogisticsModal, setActiveLogisticsModal] = useState(null);
  const [drilldownBranch, setDrilldownBranch] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [hoverLogisticsCard, setHoverLogisticsCard] = useState(null);
  const [logisticsDetailsData, setLogisticsDetailsData] = useState(null);
  const [logisticsDetailsLoading, setLogisticsDetailsLoading] = useState(false);
  const [logisticsSearch, setLogisticsSearch] = useState('');
  const [logisticsPage, setLogisticsPage] = useState(1);
  const [expandedDebtors, setExpandedDebtors] = useState({});
  // Map Interactive States
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => {
    setMapZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setMapPan({ x: 0, y: 0 }); // reset pan on full zoom out
      return newZoom;
    });
  };

  const formatThousandRinggit = (amount) => `RM ${Math.round(Number(amount || 0)).toLocaleString()}`;

  const branchCards = useMemo(() => {
    if (!insights) return [];
    const revenueMap = insights?.location_breakdown?.revenue || {};
    const outstandingMap = insights?.location_breakdown?.outstanding || {};
    const shipmentMap = insights?.location_breakdown?.shipments || {};
    const shipmentRevenueMap = insights?.location_breakdown?.shipment_revenue || {};
    
    return ENTERPRISE_BRANCHES.map((loc) => {
      const data = branchInsights[loc] || {};
      const salespersonList = [...(data.salesperson_performance || [])].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));
      const topAgent = salespersonList[0] || null;
      const deliveries = data.delivery_destinations || [];
      const fulfilled = deliveries.filter(d => d.status === 'Delivered' || d.status === 'Out for Delivery').length;
      const fulfillment = deliveries.length > 0 ? Math.round((fulfilled / deliveries.length) * 100) : null;
      const rev = Number(revenueMap[loc] || salespersonList.reduce((sum, agent) => sum + Number(agent.total_sales || 0), 0));
      const out = Number(outstandingMap[loc] || data.top_debtors?.reduce((sum, debtor) => sum + Number(debtor.outstanding_balance || 0), 0) || 0);
      const payables = Number(data.top_creditors?.reduce((sum, creditor) => sum + Number(creditor.outstanding_balance || 0), 0) || 0);
      const ships = Number(shipmentMap[loc] || data.shipment_summary?.count || deliveries.length || 0);
      const shipmentRevenue = Number(shipmentRevenueMap[loc] || data.shipment_summary?.total_value || 0);
      const outstandingRatio = rev > 0 ? out / rev : 0;
      const status = ships === 0 && rev === 0 ? 'No Activity' : outstandingRatio > 0.6 ? 'Watch Collection' : 'Active';
      return {
        loc,
        name: loc,
        rev,
        out,
        ships,
        fulfillment,
        status,
        topDebtor: data.top_debtors?.[0]?.debtor_name || 'N/A',
        topCreditor: data.top_creditors?.[0]?.creditor_name || 'N/A',
        salesLead: topAgent?.salesperson || 'Unknown',
        salesTotal: Number(topAgent?.total_sales || 0),
        salesInvoiceCount: Number(topAgent?.invoice_count || 0),
        shipmentRevenue,
        payables,
        branchImage: defaultBranchGraphics[loc],
        salesPhoto: topAgent?.salesperson ? salespersonAvatars[topAgent.salesperson] : '',
        salespeople: salespersonList,
        debtors: data.top_debtors || [],
        creditors: data.top_creditors || [],
        deliveries,
        products: data.stock_aging?.items || []
      };
    });
  }, [insights, branchInsights, salespersonAvatars]);

  const activeBranches = useMemo(() => {
    if (selectedYear === 'All') return ENTERPRISE_BRANCHES;
    return ENTERPRISE_BRANCHES.filter(loc => {
      const card = branchCards.find(c => c.loc === loc);
      if (!card) return false;
      return card.rev > 0 || card.ships > 0 || card.salespeople.length > 0;
    });
  }, [branchCards, selectedYear]);

  useEffect(() => {
    if (selectedBranch !== 'ALL' && !activeBranches.includes(selectedBranch)) {
      setSelectedBranch('ALL');
    }
  }, [activeBranches, selectedBranch]);

  // Fetch warehouse insights (debtors, creditors, sales agents, shipping)
  useEffect(() => {
    setLoading(true);
    const apiBase = `http://${window.location.hostname}:8001/api`;
    const yearParam = selectedYear ? `&year=${selectedYear}` : '&year=All';

    Promise.all([
      fetch(`${apiBase}/warehouse/insights?location=ALL${yearParam}&lite=true`).then(res => res.json()),
      Promise.all(ENTERPRISE_BRANCHES.map((branch) =>
        fetch(`${apiBase}/warehouse/insights?location=${encodeURIComponent(branch)}${yearParam}&lite=true`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      ))
    ])
      .then(([allData, branchData]) => {
        setInsights(allData);
        setBranchInsights(ENTERPRISE_BRANCHES.reduce((acc, branch, index) => {
          acc[branch] = branchData[index];
          return acc;
        }, {}));
      })
      .catch(err => {
        console.error("Error fetching warehouse insights:", err);
        setInsights(null);
        setBranchInsights({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedYear]);

  const [fetchingStockAging, setFetchingStockAging] = useState(false);

  // Fetch full data (stock_aging) on demand when Inventory Intelligence is selected
  useEffect(() => {
    if (activeSubTab === 'stock_aging') {
      const currentInsights = selectedBranch === 'ALL' ? insights : branchInsights[selectedBranch];
      if (currentInsights && !currentInsights.stock_aging && !fetchingStockAging) {
        setFetchingStockAging(true);
        const apiBase = `http://${window.location.hostname}:8001/api`;
        const yearParam = selectedYear ? `&year=${selectedYear}` : '&year=All';
        
        fetch(`${apiBase}/warehouse/insights?location=${encodeURIComponent(selectedBranch)}${yearParam}&lite=false`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.stock_aging) {
              if (selectedBranch === 'ALL') {
                setInsights(prev => ({ ...prev, stock_aging: data.stock_aging, cancelled_products: data.cancelled_products }));
              } else {
                setBranchInsights(prev => ({
                  ...prev,
                  [selectedBranch]: { ...prev[selectedBranch], stock_aging: data.stock_aging, cancelled_products: data.cancelled_products }
                }));
              }
            }
          })
          .catch(err => console.error("Error fetching full stock aging:", err))
          .finally(() => setFetchingStockAging(false));
      }
    }
  }, [activeSubTab, selectedBranch, selectedYear, insights, branchInsights]);

  // Fetch Logistics Drilldown Details
  useEffect(() => {
    if (['pending', 'returns', 'total_shipment', 'state_products'].includes(activeLogisticsModal)) {
      setLogisticsDetailsLoading(true);
      const apiBase = `http://${window.location.hostname}:8001/api`;
      const typeMap = { pending: 'pending', returns: 'returns', total_shipment: 'total', state_products: 'total' };
      
      let locParam = selectedBranch ? `&location=${encodeURIComponent(selectedBranch)}` : '&location=ALL';
      if (activeLogisticsModal === 'state_products' && drilldownBranch) {
          locParam = `&location=${encodeURIComponent(drilldownBranch)}`;
      }
      
      const yearParam = selectedYear ? `&year=${selectedYear}` : '&year=All';
      const stateParam = activeLogisticsModal === 'state_products' && selectedState ? `&state=${encodeURIComponent(selectedState)}` : '';
      
      fetch(`${apiBase}/logistics-details?type=${typeMap[activeLogisticsModal]}${locParam}${yearParam}${stateParam}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          setLogisticsDetailsData(Array.isArray(data) ? data : (data.data || []));
        })
        .catch(err => {
          console.error("Error fetching logistics details:", err);
          setLogisticsDetailsData([]);
        })
        .finally(() => {
          setLogisticsDetailsLoading(false);
        });
    } else {
      setLogisticsDetailsData(null);
    }
  }, [activeLogisticsModal, selectedBranch, selectedYear]);

  const handleAvatarUpload = (agentName, file) => {
    if (!agentName || !file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatars = { ...salespersonAvatars, [agentName]: reader.result };
      setSalespersonAvatars(newAvatars);
      try {
        localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
      } catch (e) {
        console.error("Error saving salesperson photo:", e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = (agentName) => {
    if (!agentName) return;
    const newAvatars = { ...salespersonAvatars };
    delete newAvatars[agentName];
    setSalespersonAvatars(newAvatars);
    try {
      localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
    } catch (e) {
      console.error("Error removing salesperson photo:", e);
    }
  };

  // Execute workflow action simulator
  const triggerWorkflowAction = (actionId, delay = 1500) => {
    setActionExecuting(actionId);
    setTimeout(() => {
      setActionExecuting(null);
      setExecutedActions(prev => [...prev, actionId]);
    }, delay);
  };

  // Prepare data & computed metrics
  const stats = useMemo(() => {
    if (!insights) return { totalSales: 0, totalOutstanding: 0, totalPayables: 0, onTimeFulfillment: 0 };
    
    const totalSales = insights.salesperson_performance?.reduce((sum, s) => sum + s.total_sales, 0) || 0;
    const totalOutstanding = insights.top_debtors?.reduce((sum, d) => sum + d.outstanding_balance, 0) || 0;
    const totalPayables = insights.top_creditors?.reduce((sum, c) => sum + c.outstanding_balance, 0) || 0;

    const totalShipments = insights.delivery_destinations?.length || 0;
    const completedShipments = insights.delivery_destinations?.filter(d => d.status === 'Delivered' || d.status === 'Out for Delivery').length || 0;
    const onTimeRate = totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : 0;

    return { totalSales, totalOutstanding, totalPayables, onTimeFulfillment: onTimeRate };
  }, [insights]);

  // Find top salesperson
  const topSalesperson = useMemo(() => {
    if (!insights || !insights.salesperson_performance || insights.salesperson_performance.length === 0) {
      return null;
    }
    return [...insights.salesperson_performance].sort((a, b) => b.total_sales - a.total_sales)[0];
  }, [insights]);

  // Handle reminder drafting
  const handleOpenReminder = (debtor) => {
    setSelectedDebtor(debtor);
    const overdue = debtor.overdue_balance || debtor.outstanding_balance * 0.4;
    setReminderDraft(
      `Dear ${debtor.debtor_name},\n\nOur records show an outstanding overdue balance of RM ${overdue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} for invoices past 30 days. Please arrange for settlement to ensure uninterrupted logistics delivery and account standing.\n\nBest regards,\nOperations Management Office`
    );
    setShowReminderModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#cbd5e1' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <span style={{ fontSize: '15px', fontWeight: '500' }}>Loading Executive Insights...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Strategic recommendations removed as per user request

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', color: '#f8fafc', background: '#090d16', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ——— HEADER & CONTROLS ——— */}
      <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)' }}>
              <Crown size={24} color="#ffffff" /> 
            </div>
            <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Executive Command & Operations Overview
            </h2>
            <span style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Enterprise Suite</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0 0', maxWidth: '700px', lineHeight: '1.5' }}>
            High-level C-Suite operational hub. Monitor consolidated working capital cash flows, manage inter-branch logistics performance, and execute efficiency workflows.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 16px', borderRadius: '30px', fontSize: '12px', color: '#34d399', fontWeight: '700' }}>
          <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
          SQL Server Connected
        </div>
      </div>

      {/* ——— INTERACTIVE TAB SELECTOR ——— */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '16px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'nowrap', overflowX: 'auto' }}>
        {[
          { id: 'executive_command',  icon: <Compass size={15}/>,        label: 'Multi-Branch Dashboard' },
          { id: 'stock_aging',        icon: <Clock size={15}/>,          label: 'Inventory & Aging' },
          { id: 'finance_control',    icon: <DollarSign size={15}/>,     label: 'Credit & Capital' },
          { id: 'logistics_dispatch', icon: <Truck size={15}/>,          label: 'Logistics & Route' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            style={{
              flex: 1, justifyContent: 'center',
              display: 'flex', alignItems: 'center', gap: '8px', border: 'none',
              background: activeSubTab === t.id ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#94a3b8',
              padding: '11px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.25s', whiteSpace: 'nowrap',
              boxShadow: activeSubTab === t.id ? '0 4px 14px rgba(37,99,235,0.35)' : 'none'
            }}
          >{t.icon} {t.label}</button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 0. STOCK AGING & SLOW-MOVING STOCK */}
      {(() => {
        const filteredAgingItems = (insights?.stock_aging?.items || []).filter(item => {
          const matchesSearch = String(item.item_code || '').toLowerCase().includes(String(agingSearch || '').toLowerCase()) || String(item.description || '').toLowerCase().includes(String(agingSearch || '').toLowerCase());
          return matchesSearch && (agingRange === 'All' || item.bracket === agingRange);
        });

        const ITEMS_PER_PAGE = 10;
        const totalPages = Math.ceil(filteredAgingItems.length / ITEMS_PER_PAGE);
        const paginatedItems = filteredAgingItems.slice((agingCurrentPage - 1) * ITEMS_PER_PAGE, agingCurrentPage * ITEMS_PER_PAGE);

        return activeSubTab === 'stock_aging' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Top Info Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)' }}>
                  <Clock size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                    Stock Aging & Slow-Moving Stock Analysis
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                    Optimize warehouse storage efficiency by identifying dead and slow-moving items sitting over 90, 180, or 360 days.
                  </p>
                </div>
              </div>
              
              {/* KPI quick metrics */}
              <div style={{ display: 'flex', gap: '24px' }}>
                {fetchingStockAging ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '13px', fontWeight: 'bold' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #60a5fa', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Running Aging Analysis...
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Slow-Moving Qty</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
                      {(insights?.stock_aging?.items?.reduce((acc, item) => acc + (Number(item.stock) || 0), 0) || 0).toLocaleString()} <span style={{ fontSize: '12px', color: '#64748b' }}>Units</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {false && <>
            {/* Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="grid-responsive">
              <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Dead Stock (&gt;360d)</span>
                  <span style={{ padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>Critical</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
                  {insights?.stock_aging?.items?.filter(x => x.days_since_movement > 360).length || 0} Products
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Sitting without sales for over 1 year</div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Slow Stock (181-360d)</span>
                  <span style={{ padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>Warning</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
                  {insights?.stock_aging?.items?.filter(x => x.days_since_movement > 180 && x.days_since_movement <= 360).length || 0} Products
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>No sales movement in last 6-12 months</div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Days in Warehouse</span>
                  <Clock size={16} color="#3b82f6" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
                  {Math.round(insights?.stock_aging?.items?.reduce((sum, x) => sum + x.days_since_movement, 0) / (insights?.stock_aging?.items?.length || 1)) || 0} Days
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Average age of slow-moving inventory</div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Est. Carrying Cost</span>
                  <span style={{ padding: '2px 6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>Monthly</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>
                  RM {((insights?.stock_aging?.total_value || 0) * 0.02).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Calculated at 2% monthly storage cost</div>
              </div>
            </div>
            </>}

            {/* Chart & Table section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '24px' }} className="grid-responsive">
              
              {/* Value Distribution by Age Bracket */}
              <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}><h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>Stock Value by Age Bracket</h3><button onClick={() => setAgingRange('All')} style={{ background: agingRange === 'All' ? '#2563eb' : 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: '#cbd5e1', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}>All ranges</button></div>
                <p style={{ margin: '-8px 0 0', fontSize: '11px', color: '#94a3b8' }}>Click a bar or range below to filter the product list.</p>
                
                <div style={{ height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights?.stock_aging?.brackets || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis scale="sqrt" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#60a5fa' }}
                        formatter={(val) => [`RM ${val.toLocaleString()}`, 'Value']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(insights?.stock_aging?.brackets || []).map((entry, idx) => {
                          const colors = ['#3b82f6', '#fbbf24', '#f97316', '#ef4444'];
                          return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} cursor="pointer" stroke={agingRange === entry.name ? '#ffffff' : 'none'} strokeWidth={agingRange === entry.name ? 2 : 0} onClick={() => { setAgingRange(entry.name); tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend with Counts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {(insights?.stock_aging?.brackets || []).map((b, idx) => {
                    const colors = ['#3b82f6', '#fbbf24', '#f97316', '#ef4444'];
                    return (
                      <button key={idx} onClick={() => { setAgingRange(b.name); tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#cbd5e1', background: agingRange === b.name ? 'rgba(59,130,246,0.12)' : 'transparent', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', width: '100%', textAlign: 'left', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                          <span style={{ whiteSpace: 'nowrap' }}>{b.name}</span>
                        </div>
                        <span style={{ fontWeight: '700', whiteSpace: 'nowrap', textAlign: 'right' }}>{b.count} Items (RM {b.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List & Search */}
              <div ref={tableRef} style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>Slow-Moving Inventory Products {agingRange !== 'All' ? `(${agingRange})` : ''}</h3>
                  
                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '260px' }}>
                    <input
                      type="text"
                      placeholder="Search product code/name..."
                      value={agingSearch}
                      onChange={(e) => setAgingSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                    />
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                      <Search size={15} color="#fff" />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', maxWidth: '90px' }}>Item Code</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Description</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>Stock Qty</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Unit Cost</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Value</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>Days Sitting</th>
                        <th style={{ padding: '10px 4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>
                              No slow-moving products match this age range or search.
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item, idx) => {
                          const isCritical = item.days_since_movement > 360;
                          const isWarning = item.days_since_movement > 180 && item.days_since_movement <= 360;
                          
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                              <td style={{ padding: '10px 4px', fontWeight: '700', color: '#f8fafc', fontSize: '12px', maxWidth: '90px', wordBreak: 'break-all' }}>{item.item_code}</td>
                              <td style={{ padding: '10px 4px', color: '#cbd5e1', fontSize: '12px', minWidth: '150px' }}>
                                <div>{item.description}</div>
                                <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{item.category}</span>
                              </td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{item.stock}</td>
                               <td style={{ padding: '10px 4px', textAlign: 'right', color: '#cbd5e1', fontSize: '12px', whiteSpace: 'nowrap' }}>RM {Number(item.cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                               <td style={{ padding: '10px 4px', textAlign: 'right', color: '#10b981', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>RM {item.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span style={{ 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  fontSize: '11px', 
                                  fontWeight: '700',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  background: isCritical ? 'rgba(239, 68, 68, 0.12)' : isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                  color: isCritical ? '#fca5a5' : isWarning ? '#fcd34d' : '#93c5fd',
                                  border: `1px solid ${isCritical ? 'rgba(239,68,68,0.2)' : isWarning ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`
                                }}>
                                  {item.days_since_movement} Days
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                {individualActions[item.item_code] ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>Discount Pushed</span>
                                    <button 
                                      onClick={() => setIndividualActions(prev => { const next = {...prev}; delete next[item.item_code]; return next; })}
                                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    >Undo / Edit</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setClearanceItem(item);
                                    }}
                                    style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.15s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#1e293b'}
                                  >
                                    Clearance Disc
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {filteredAgingItems.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      Showing {(agingCurrentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(agingCurrentPage * ITEMS_PER_PAGE, filteredAgingItems.length)} of {filteredAgingItems.length} products
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        disabled={agingCurrentPage === 1} 
                        onClick={() => setAgingCurrentPage(p => Math.max(1, p - 1))}
                        style={{ background: '#1e293b', color: agingCurrentPage === 1 ? '#475569' : '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', cursor: agingCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', transition: 'all 0.2s' }}
                      >Previous</button>
                      <span style={{ color: '#f8fafc', fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontWeight: 'bold' }}>
                        Page {agingCurrentPage} of {totalPages || 1}
                      </span>
                      <button 
                        disabled={agingCurrentPage === totalPages || totalPages === 0} 
                        onClick={() => setAgingCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{ background: '#1e293b', color: agingCurrentPage === totalPages || totalPages === 0 ? '#475569' : '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', cursor: agingCurrentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', transition: 'all 0.2s' }}
                      >Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })()}

      {/* 1. EXECUTIVE COMMAND & MULTI-BRANCH OVERVIEW */}
      {(activeSubTab === 'executive_command' || activeSubTab === 'executive_overview') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
          




          {/* ——— MULTI-BRANCH SELECTOR PILL BAR ——— */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,23,42,0.6)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Warehouse size={16} color="#3b82f6" /> FILTER BRANCH SCOPE:
            </span>
             {['ALL', ...activeBranches].map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(current => branch === 'ALL' ? 'ALL' : (current === branch ? 'ALL' : branch))}
                style={{
                  padding: '7px 16px',
                  background: selectedBranch === branch ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.04)',
                  color: selectedBranch === branch ? '#ffffff' : '#cbd5e1',
                  border: selectedBranch === branch ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedBranch === branch ? '0 4px 12px rgba(59,130,246,0.35)' : 'none'
                }}
              >
                {branch === 'ALL' ? 'All Branches (Consolidated)' : branch}
              </button>
            ))}
          </div>

          {/* Consolidated branch detail panel */}
          {(() => {
            const visibleBranches = branchCards.filter(card => activeBranches.includes(card.loc));
            const activeBranch = selectedBranch === 'ALL' ? null : branchCards.find(card => card.loc === selectedBranch) || null;
            const getStatusStyle = (status) => {
              if (status === 'Active') return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: '#10b981' };
              if (status === 'No Activity') return { bg: 'rgba(100,116,139,0.15)', color: '#cbd5e1', border: '#64748b' };
              return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '#f59e0b' };
            };
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96))',
                border: '1px solid rgba(59, 130, 246, 0.28)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 14px 34px rgba(0,0,0,0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Branch Information</div>
                    <div style={{ fontSize: '20px', color: '#f8fafc', fontWeight: '900' }}>
                      {selectedBranch === 'ALL' ? 'All Branches Overview' : visibleBranches.find(v => v.loc === selectedBranch)?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBranch('ALL')}
                    style={{
                      display: selectedBranch === 'ALL' ? 'none' : 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(96,165,250,0.35)',
                      background: 'rgba(59,130,246,0.12)',
                      color: '#bfdbfe',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowRightLeft size={14} /> View All Branches
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {visibleBranches.filter(b => selectedBranch === 'ALL' || b.loc === selectedBranch).map((card) => {
                    const surplus = card.rev - card.out;
                    return (
                      <div
                        key={card.loc}
                        onClick={() => setSelectedBranch(current => current === card.loc ? 'ALL' : card.loc)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(190px, 260px) minmax(0, 1fr)',
                          gap: '18px',
                          background: selectedBranch === card.loc ? 'rgba(30,58,138,0.26)' : 'rgba(15,23,42,0.66)',
                          border: selectedBranch === card.loc ? '1px solid rgba(96,165,250,0.7)' : '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '16px',
                          padding: '14px',
                          cursor: 'pointer'
                        }}
                        className="grid-responsive"
                      >
                        <div style={{
                          minHeight: '178px',
                          height: '178px',
                          alignSelf: 'start',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          background: card.branchImage
                            ? `url(${card.branchImage}) center/cover no-repeat`
                            : 'linear-gradient(135deg, rgba(59,130,246,0.36), rgba(16,185,129,0.18)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 28%)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }} />

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: '900', color: '#f8fafc' }}>{card.name}</div>
                              <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700', marginTop: '3px' }}>
                                Fulfillment: {card.fulfillment === null ? 'N/A' : `${card.fulfillment}%`}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '8px 10px' }}>
                              <div style={{ position: 'relative', width: '46px', height: '46px', flex: '0 0 auto' }}>
                                <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', background: card.salesPhoto ? '#0f172a' : 'linear-gradient(135deg, #334155, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', border: '1px solid rgba(255,255,255,0.22)' }}>
                                  {card.salesPhoto ? <img src={card.salesPhoto} alt={card.salesLead} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={22} color="#cbd5e1" />}
                                </div>
                                {card.salesLead !== 'Unknown' && (
                                  <label
                                    title="Add/Change Photo"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ position: 'absolute', right: '-5px', bottom: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: '#2563eb', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  >
                                    <Camera size={11} color="#fff" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => handleAvatarUpload(card.salesLead, e.target.files[0])}
                                    />
                                  </label>
                                )}
                                {card.salesPhoto && (
                                  <button
                                    title="Remove Photo"
                                    onClick={(e) => { e.stopPropagation(); handleAvatarRemove(card.salesLead); }}
                                    style={{ position: 'absolute', right: '-5px', top: '-5px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: '2px solid #0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Top Salesperson</div>
                                <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '800' }}>{card.salesLead || 'Unknown'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {card.salesInvoiceCount} Invoices to fulfill
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                            {[
                              { label: 'Total Shipments', value: `${card.ships}`, exact: `${card.ships} total shipments processed`, color: '#34d399' },
                              { label: 'Sales Invoices', value: `${card.salesInvoiceCount}`, exact: `${card.salesInvoiceCount} invoices to fulfill`, color: '#60a5fa' },
                              { label: 'Fulfillment Rate', value: `${card.fulfillment === null ? 'N/A' : card.fulfillment + '%'}`, exact: `Order fulfillment rate`, color: '#c4b5fd' },
                              { label: 'Slow-Moving Items', value: `${card.products.length}`, exact: `Slow-moving products identified`, color: '#fca5a5' },
                            ].map(item => (
                              <div key={item.label} style={{ background: 'rgba(0,0,0,0.24)', borderRadius: '12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>{item.label}</div>
                                <div title={item.exact} style={{ fontSize: '16px', color: item.color, fontWeight: '900', marginTop: '3px' }}>{item.value}</div>
                                {item.sub && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{item.sub}</div>}
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>Top Debtor</div>
                              <div style={{ fontSize: '13px', color: '#f0abfc', fontWeight: '800', marginTop: '3px' }}>{card.topDebtor || 'N/A'}</div>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>Top Creditor</div>
                              <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '800', marginTop: '3px' }}>{card.topCreditor || 'N/A'}</div>
                            </div>
                          </div>

                          {selectedBranch === card.loc && (
                            <div className="branch-details-full" style={{ marginTop: '12px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.09)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '900' }}>Complete Branch Details</div>
                                <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '700' }}>All operational and financial information</div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(96,165,250,0.16)', borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ color: '#93c5fd', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Sales Team</div>
                                  {card.salespeople.length ? card.salespeople.slice(0, 5).map((person, index) => (
                                    <div key={`${person.salesperson}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderTop: index ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '12px' }}>
                                      <span style={{ color: '#e2e8f0', fontWeight: '700' }}>{person.salesperson || 'Unknown'}</span>
                                      <span style={{ color: '#34d399', fontWeight: '800', textAlign: 'right' }}>{Number(person.invoice_count || 0)} Invoices<small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>Assigned to warehouse</small></span>
                                    </div>
                                  )) : <div style={{ color: '#64748b', fontSize: '12px' }}>No sales person data.</div>}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(251,113,133,0.16)', borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ color: '#fca5a5', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Top Debtors</div>
                                  {card.debtors.length ? card.debtors.slice(0, 5).map((debtor, index) => (
                                    <div key={`${debtor.debtor_name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderTop: index ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '12px' }}>
                                      <span style={{ color: '#e2e8f0', fontWeight: '700', minWidth: 0 }}>{debtor.debtor_name || 'N/A'}</span>
                                      <span style={{ color: '#fca5a5', fontWeight: '800', whiteSpace: 'nowrap' }}>RM {Number(debtor.outstanding_balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                  )) : <div style={{ color: '#64748b', fontSize: '12px' }}>No debtor data.</div>}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(250,204,21,0.16)', borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ color: '#fcd34d', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Top Creditors</div>
                                  {card.creditors.length ? card.creditors.slice(0, 5).map((creditor, index) => (
                                    <div key={`${creditor.creditor_name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderTop: index ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '12px' }}>
                                      <span style={{ color: '#e2e8f0', fontWeight: '700', minWidth: 0 }}>{creditor.creditor_name || 'N/A'}</span>
                                      <span style={{ color: '#fcd34d', fontWeight: '800', whiteSpace: 'nowrap' }}>RM {Number(creditor.outstanding_balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                  )) : <div style={{ color: '#64748b', fontSize: '12px' }}>No creditor data.</div>}
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(52,211,153,0.16)', borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ color: '#6ee7b7', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Shipments</div>
                                  {card.deliveries.length ? card.deliveries.slice(0, 5).map((delivery, index) => (
                                    <div key={`${delivery.debtor_name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderTop: index ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '12px' }}>
                                      <span style={{ color: '#e2e8f0', fontWeight: '700', minWidth: 0 }}>{delivery.debtor_name || delivery.address || 'N/A'}</span>
                                      <span style={{ color: '#6ee7b7', fontWeight: '800', whiteSpace: 'nowrap', textAlign: 'right' }}>{Number(delivery.shipment_count || 0)} shipments<small style={{ display: 'block', color: '#94a3b8', marginTop: '2px' }}>RM {Number(delivery.total_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</small></span>
                                    </div>
                                  )) : <div style={{ color: '#64748b', fontSize: '12px' }}>No shipment data.</div>}
                                </div>
                              <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(196,181,253,0.16)', borderRadius: '10px', padding: '12px' }}>
                                <div style={{ color: '#c4b5fd', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>Slow-Moving Products</div>
                                {card.products.length ? (
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead><tr style={{ color: '#94a3b8', textAlign: 'left' }}><th style={{ padding: '0 8px 7px 0' }}>Product</th><th style={{ padding: '0 8px 7px 0' }}>Category</th><th style={{ padding: '0 8px 7px 0', textAlign: 'right' }}>Stock</th><th style={{ padding: '0', textAlign: 'right' }}>Days</th></tr></thead>
                                      <tbody>{card.products.slice(0, 5).map((product, index) => <tr key={`${product.item_code}-${index}`} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><td style={{ padding: '8px 8px 8px 0', color: '#e2e8f0', fontWeight: '700' }}>{product.description || product.item_code || 'N/A'}</td><td style={{ padding: '8px 8px 8px 0', color: '#94a3b8' }}>{product.category || 'N/A'}</td><td style={{ padding: '8px 8px 8px 0', color: '#cbd5e1', textAlign: 'right' }}>{Number(product.stock || 0).toLocaleString()}</td><td style={{ padding: '8px 0', color: '#c4b5fd', textAlign: 'right', fontWeight: '800' }}>{Number(product.days_since_movement || 0)}d</td></tr>)}</tbody>
                                    </table>
                                  </div>
                                ) : <div style={{ color: '#64748b', fontSize: '12px' }}>No product data.</div>}
                              </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {false && <>
          {/* Two Column Layout: Cash Flow & Strategic Workflows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="grid-responsive">
            
            {/* Left Column: 90-Day Cash Flow Forecast */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '26px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', padding: '8px', borderRadius: '10px' }}>
                      <TrendingUp size={16} color="#fff" />
                    </div>
                    90-Day Cash Flow Forecast
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Projected cash inflows and outflows based on customer outstanding settlement cycles.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'rgba(30, 41, 59, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {['30d', '60d', '90d', '180d'].map((hor) => (
                    <button
                      key={hor}
                      onClick={() => setSelectedHorizon(hor)}
                      style={{ padding: '4px 10px', background: selectedHorizon === hor ? '#2563eb' : 'transparent', border: 'none', color: selectedHorizon === hor ? '#ffffff' : '#94a3b8', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: 'all 0.2s' }}
                    >
                      {hor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Financial Summary */}
              {(() => {
                const inflowTot = selectedHorizon === '30d' ? 4400000 : selectedHorizon === '60d' ? 9500000 : selectedHorizon === '90d' ? 15750000 : 34650000;
                const outflowTot = selectedHorizon === '30d' ? 2970000 : selectedHorizon === '60d' ? 6370000 : selectedHorizon === '90d' ? 10320000 : 22120000;
                const surplusTot = inflowTot - outflowTot;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Projected Inflow</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>RM {inflowTot.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Projected Outflow</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa', marginTop: '2px' }}>RM {outflowTot.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'rgba(147, 51, 234, 0.06)', border: '1px solid rgba(147, 51, 234, 0.15)', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#d8b4fe', textTransform: 'uppercase', fontWeight: '700' }}>Net Surplus</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#c084fc', marginTop: '2px' }}>+RM {surplusTot.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Composed Chart */}
              {(() => {
                const chartData = selectedHorizon === '30d' ? [
                  { label: 'Week 1', inflow: 950000, outflow: 680000, surplus: 270000 },
                  { label: 'Week 2', inflow: 1080000, outflow: 720000, surplus: 360000 },
                  { label: 'Week 3', inflow: 1150000, outflow: 750000, surplus: 400000 },
                  { label: 'Week 4', inflow: 1220000, outflow: 820000, surplus: 400000 }
                ] : selectedHorizon === '60d' ? [
                  { label: 'Month 1', inflow: 4400000, outflow: 2970000, surplus: 1430000 },
                  { label: 'Month 2', inflow: 5100000, outflow: 3400000, surplus: 1700000 }
                ] : selectedHorizon === '90d' ? [
                  { label: 'Month 1', inflow: 4400000, outflow: 2970000, surplus: 1430000 },
                  { label: 'Month 2', inflow: 5100000, outflow: 3400000, surplus: 1700000 },
                  { label: 'Month 3', inflow: 6250000, outflow: 3950000, surplus: 2300000 }
                ] : [
                  { label: 'Q1 (Est)', inflow: 15750000, outflow: 10320000, surplus: 5430000 },
                  { label: 'Q2 (Est)', inflow: 18900000, outflow: 11800000, surplus: 7100000 }
                ];

                return (
                  <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `RM ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Tooltip
                          contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                          formatter={(val, name) => [`RM ${Number(val).toLocaleString()}`, name === 'inflow' ? 'Projected Inflow' : name === 'outflow' ? 'Operational Outflow' : 'Net Surplus']}
                        />
                        <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                        <Area type="monotone" dataKey="inflow" fill="url(#inflowGrad)" stroke="#10b981" strokeWidth={2} name="Projected Inflow" />
                        <Line type="monotone" dataKey="outflow" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Operational Outflow" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Strategic Action Workflows */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '26px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', padding: '8px', borderRadius: '10px' }}>
                      <Activity size={16} color="#fff" />
                    </div>
                    Strategic Action Workflows
                  </h3>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    3 Pending Actions
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { id: 'rebalance', title: 'Inter-Branch Stock Balancing', desc: 'Transfer 450 units of Herbalife from HQ (surplus) to Penang Distribution Hub to cover a projected 4-day stockout.', impact: 'RM 14,500 Saved', icon: <Building2 size={16} color="#60a5fa" />, bg: 'rgba(59, 130, 246, 0.08)' },
                    { id: 'settlement', title: 'Supplier Early Settlement Offer', desc: 'Settle AED_FM supplier invoices 7 days early to capture a pre-negotiated 2.5% prompt payment discount.', impact: 'RM 2,450 Saved', icon: <DollarSign size={16} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.08)' },
                    { id: 'territory', title: 'Puchong Territory Consolidation', desc: 'Combine overlapping agent routes in Puchong into a single fleet route to reduce transport expenses.', impact: 'RM 14,500 Saved', icon: <Route size={16} color="#c084fc" />, bg: 'rgba(168, 85, 247, 0.08)' }
                  ].map((act) => {
                    const isDone = workflowsExecuted || individualActions[act.id];
                    return (
                      <div key={act.id} style={{ background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(30, 41, 59, 0.4)', border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ padding: '4px', background: act.bg, borderRadius: '6px', display: 'flex' }}>{act.icon}</div>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>{act.title}</span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>{act.desc}</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '95px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: isDone ? '#34d399' : '#94a3b8', marginBottom: '6px' }}>
                            {isDone ? 'Completed' : act.impact}
                          </div>
                          {!isDone && (
                            <button
                              onClick={() => setIndividualActions(prev => ({ ...prev, [act.id]: true }))}
                              style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '700' }}
                            >
                              Execute
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                {workflowsExecuted ? (
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> All Workflows Executed Successfully (+RM 31,450 Benefit)
                  </div>
                ) : workflowsExecuting ? (
                  <button disabled style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: '10px', cursor: 'wait', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="spin-animation" /> Syncing adjustments in AutoCount ERP...
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setWorkflowsExecuting(true);
                      setTimeout(() => {
                        setWorkflowsExecuting(false);
                        setWorkflowsExecuted(true);
                        setIndividualActions({ rebalance: true, settlement: true, territory: true });
                        setRouteOptimizationActive(true);
                      }, 2000);
                    }}
                    style={{ width: '100%', padding: '12px', background: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    Execute All Pending Workflows (ERP Sync)
                  </button>
                )}
              </div>
            </div>
          </div>

          </>}
          {false && <>
          {/* Strategic Recommendations Action Feed */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '26px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '17px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <FileText size={16} color="#60a5fa" />
              </div>
              Strategic Operational Recommendations
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {strategicRecommendations.map((item) => (
                <div key={item.id} style={{ background: 'rgba(30, 41, 59, 0.3)', border: item.isExecuted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '11px', color: item.isExecuted ? '#10b981' : '#60a5fa', fontWeight: 'bold' }}>
                        {item.impact}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', margin: '4px 0 8px 0', lineHeight: '1.4' }}>{item.title}</h4>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px 0' }}>{item.desc}</p>
                  </div>

                  <div>
                    {item.isExecuted ? (
                      <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>
                        ✓ {item.executedLabel}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.id === 'shipping_carrier') setCarriersSwitched(true);
                          if (item.id === 'cash_discount') setDiscountsApplied([insights?.top_debtors?.[0]?.debtor_name]);
                          triggerWorkflowAction(item.id);
                        }}
                        style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: 'all 0.15s' }}
                      >
                        {actionExecuting === item.id ? 'Applying...' : item.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>}
        </div>
      )}

      {/* 2. FINANCE (CREDIT & CAPITAL CONTROL) TAB */}
      {activeSubTab === 'finance_control' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
          

          {/* Global Aging Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(30, 41, 59, 0.4)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Filter by Aging Duration:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', '0-30d', '31-60d', '90d+'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setGlobalAgingFilter(filter)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: globalAgingFilter === filter ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    color: globalAgingFilter === filter ? '#fff' : '#cbd5e1',
                    border: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-responsive">
            
            {/* Debtors List */}
            <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Accounts Receivable (Debtors Ledger)</span>
                <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>Risk Assessment</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const filteredDebtors = (insights?.top_debtors || []).filter(debtor => {
                    if (globalAgingFilter === 'All') return true;
                    if (globalAgingFilter === '0-30d') return (debtor.aging_0_30 || 0) > 0;
                    if (globalAgingFilter === '31-60d') return (debtor.aging_31_60 || 0) > 0;
                    if (globalAgingFilter === '90d+') return (debtor.aging_90_plus || 0) > 0;
                    return true;
                  });

                  if (filteredDebtors.length === 0) {
                    return (
                      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                          There is no debtor information in this {selectedYear !== 'All' ? 'year' : 'duration'}.
                        </div>
                      </div>
                    );
                  }

                  return filteredDebtors.slice(0, 5).map((debtor, i) => {
                  const balance = debtor.outstanding_balance || 0;
                  const isHighRisk = debtor.overdue_balance > 5000;
                  const isHold = debtorHolds.includes(debtor.debtor_name);

                  let displayBalance = balance;
                  let displayLabel = 'Total Outstanding';
                  if (globalAgingFilter === '0-30d') { displayBalance = debtor.aging_0_30 || 0; displayLabel = 'Outstanding (0-30d)'; }
                  if (globalAgingFilter === '31-60d') { displayBalance = debtor.aging_31_60 || 0; displayLabel = 'Outstanding (31-60d)'; }
                  if (globalAgingFilter === '90d+') { displayBalance = debtor.aging_90_plus || 0; displayLabel = 'Outstanding (90d+)'; }

                  return (
                    <div 
                      key={i} 
                      onClick={() => setExpandedDebtor(expandedDebtor === debtor.debtor_name ? null : debtor.debtor_name)}
                      style={{ 
                        padding: '20px', cursor: 'pointer', borderRadius: '16px', 
                        background: isHold ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: `1px solid ${isHold ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                        borderLeft: `4px solid ${isHold ? '#ef4444' : isHighRisk ? '#fbbf24' : '#3b82f6'}`,
                        transition: 'all 0.2s',
                        boxShadow: expandedDebtor === debtor.debtor_name ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                            <Building2 size={18} color={isHold ? '#fca5a5' : '#93c5fd'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '0.3px' }}>{debtor.debtor_name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={12} /> {debtor.invoice_count} pending invoices
                            </div>
                          </div>
                        </div>
                        {isHold ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.3)' }}><ShieldAlert size={12} /> CREDIT HOLD</div>
                        ) : isHighRisk ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(245,158,11,0.3)' }}><AlertTriangle size={12} /> HIGH RISK</div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(16,185,129,0.3)' }}><CheckCircle2 size={12} /> STABLE</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <div style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>{displayLabel}</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: globalAgingFilter !== 'All' ? '#60a5fa' : '#f8fafc', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            RM {displayBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                      </div>

                      {expandedDebtor === debtor.debtor_name && (
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', animation: 'fadeIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                          <div style={{ fontSize: '11px', color: '#93c5fd', marginBottom: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span>{globalAgingFilter !== 'All' ? `Invoices (${globalAgingFilter})` : 'All Outstanding Invoices'}</span>
                            <span style={{ color: '#64748b', fontWeight: 'normal' }}>*Simulated Data</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[1, 2].map(n => (
                              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '2px' }}>
                                  <div style={{ color: '#93c5fd', fontWeight: 'bold' }}>IV-24{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
                                  <div style={{ color: '#94a3b8' }}>{new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</div>
                                  <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>RM {(balance / 2 + (Math.random() * 100)).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                                </div>
                                <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{['Vitamin C 1000mg', 'Paracetamol 500mg', 'Face Mask 3-Ply', 'Hand Sanitizer 500ml'][Math.floor(Math.random() * 4)]}</span>
                                  <span style={{ color: '#94a3b8' }}>Qty: {Math.floor(Math.random() * 50) + 5}</span>
                                </div>
                                <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{['Cough Syrup 100ml', 'Omega 3 Fish Oil', 'Band-Aid Pack', 'Antiseptic Cream'][Math.floor(Math.random() * 4)]}</span>
                                  <span style={{ color: '#94a3b8' }}>Qty: {Math.floor(Math.random() * 30) + 2}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
                })()}
              </div>
            </div>

            {/* Creditors List */}
            <div style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Accounts Payable (Creditors Ledger)</span>
                <span style={{ fontSize: '11px', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>Terms & Status</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const filteredCreditors = (insights?.top_creditors || []).filter(creditor => {
                    if (globalAgingFilter === 'All') return true;
                    if (globalAgingFilter === '0-30d') return (creditor.aging_0_30 || 0) > 0;
                    if (globalAgingFilter === '31-60d') return (creditor.aging_31_60 || 0) > 0;
                    if (globalAgingFilter === '90d+') return (creditor.aging_90_plus || 0) > 0;
                    return true;
                  });

                  if (filteredCreditors.length === 0) {
                    return (
                      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                          There is no supplier information in this {selectedYear !== 'All' ? 'year' : 'duration'}.
                        </div>
                      </div>
                    );
                  }

                  return filteredCreditors.slice(0, 5).map((creditor, i) => {
                  const balance = creditor.outstanding_balance || 0;
                  const aging90 = creditor.aging_90_plus || 0;

                  let displayBalance = balance;
                  let displayLabel = 'Total Owed';
                  if (globalAgingFilter === '0-30d') { displayBalance = creditor.aging_0_30 || 0; displayLabel = 'Owed (0-30d)'; }
                  if (globalAgingFilter === '31-60d') { displayBalance = creditor.aging_31_60 || 0; displayLabel = 'Owed (31-60d)'; }
                  if (globalAgingFilter === '90d+') { displayBalance = creditor.aging_90_plus || 0; displayLabel = 'Owed (90d+)'; }

                  return (
                    <div 
                      key={i} 
                      onClick={() => setExpandedCreditor(expandedCreditor === creditor.creditor_name ? null : creditor.creditor_name)}
                      style={{ 
                        padding: '20px', cursor: 'pointer', borderRadius: '16px', 
                        background: aging90 > 0 ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: `1px solid ${aging90 > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                        borderLeft: `4px solid ${aging90 > 0 ? '#ef4444' : '#10b981'}`,
                        transition: 'all 0.2s',
                        boxShadow: expandedCreditor === creditor.creditor_name ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                            <Building2 size={18} color={aging90 > 0 ? '#fca5a5' : '#a7f3d0'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '0.3px' }}>{creditor.creditor_name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={12} /> Supplier Account
                            </div>
                          </div>
                        </div>
                        {aging90 > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.3)' }}><AlertTriangle size={12} /> OVERDUE</div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(16,185,129,0.3)' }}><CheckCircle2 size={12} /> CURRENT</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <div style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>{displayLabel}</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: globalAgingFilter !== 'All' ? '#60a5fa' : '#f8fafc', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            RM {displayBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                      </div>

                      {expandedCreditor === creditor.creditor_name && (
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', animation: 'fadeIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                          <div style={{ fontSize: '11px', color: '#93c5fd', marginBottom: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span>{globalAgingFilter !== 'All' ? `Purchase Bills (${globalAgingFilter})` : 'All Outstanding Purchase Bills'}</span>
                            <span style={{ color: '#64748b', fontWeight: 'normal' }}>*Simulated Data</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[1, 2].map(n => (
                              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '2px' }}>
                                  <div style={{ color: '#93c5fd', fontWeight: 'bold' }}>PI-24{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
                                  <div style={{ color: '#94a3b8' }}>{new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</div>
                                  <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>RM {(balance / 2 + (Math.random() * 100)).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                                </div>
                                <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{['Raw Materials A', 'Packaging Boxes', 'Bubble Wrap Rolls', 'Pallet Wraps'][Math.floor(Math.random() * 4)]}</span>
                                  <span style={{ color: '#94a3b8' }}>Qty: {Math.floor(Math.random() * 500) + 50}</span>
                                </div>
                                <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{['Logistics Service (Outsourced)', 'Warehouse Racking', 'Forklift Maintenance', 'Safety Gear'][Math.floor(Math.random() * 4)]}</span>
                                  <span style={{ color: '#94a3b8' }}>Qty: {Math.floor(Math.random() * 10) + 1}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIPPING & LOGISTICS TAB */}
      {activeSubTab === 'logistics_dispatch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>

          {/* Shipping KPI Summary Cards */}
          {(() => {
            const health = insights?.logistics_health || { total_invoices: 0, total_dos: 0, total_cns: 0, cn_value: 0, total_pending: 0 };
            const pendingShipment = health.total_pending || Math.max(0, health.total_invoices - health.total_dos);
            const totalShipments = insights?.delivery_destinations?.reduce((s, d) => s + (d.shipment_count || 0), 0) || 0;
            const logisticsReturn = health.total_cns || 0;
            const uniqueStates = [...new Set(insights?.delivery_destinations?.map(d => d.state).filter(Boolean) || [])].length;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="grid-responsive">
                {[
                  { id: 'total_shipment', label: 'Total Shipment', value: totalShipments.toLocaleString(), icon: <Truck size={18} color="#60a5fa" />, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
                  { id: 'pending', label: 'Pending Shipment', value: pendingShipment.toLocaleString(), icon: <Package size={18} color="#fbbf24" />, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                  { id: 'returns', label: 'Logistics Return', value: logisticsReturn.toLocaleString(), icon: <RotateCcw size={18} color="#ef4444" />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
                  { id: 'branches', label: 'Branch Covered', value: activeBranches.length.toLocaleString(), icon: <Globe size={18} color="#c084fc" />, color: '#c084fc', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' },
                ].map((kpi, i) => {
                  const isActive = activeLogisticsModal === kpi.id;
                  return (
                    <div 
                      key={i} 
                      onClick={() => openLogisticsDetails(kpi.id)}
                      style={{ 
                        background: isActive ? kpi.color + '22' : kpi.bg, 
                        border: `1px solid ${isActive ? kpi.color : kpi.border}`, 
                        borderRadius: '14px', 
                        padding: '18px 20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        boxShadow: isActive ? `0 4px 12px ${kpi.color}33` : 'none'
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', display: 'flex' }}>{kpi.icon}</div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* INLINE DETAILS PANEL */}
          {activeLogisticsModal && (
            <div id="logistics-details-panel" style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30,41,59,0.4)' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeLogisticsModal === 'pending' && <><Package size={16} color="#fbbf24" /> Pending Shipments (Products Missing DO)</>}
                  {activeLogisticsModal === 'total_shipment' && <><Truck size={16} color="#60a5fa" /> Total Shipments Dispatched</>}
                  {activeLogisticsModal === 'returns' && <><RotateCcw size={16} color="#ef4444" /> Logistics Returns (Credit Notes)</>}
                  {activeLogisticsModal === 'regions' && <><button onClick={() => setActiveLogisticsModal('branches')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}><ArrowLeft size={14} /> Back</button><Globe size={16} color="#c084fc" /> Regional Coverage for {drilldownBranch}</>}
                  {activeLogisticsModal === 'state_products' && <><button onClick={() => setActiveLogisticsModal('regions')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}><ArrowLeft size={14} /> Back</button><Globe size={16} color="#c084fc" /> Products Shipped from {drilldownBranch} to {selectedState}</>}
                  {activeLogisticsModal === 'backlog' && <><Package size={16} color="#60a5fa" /> Fulfillment Overview</>}
                  {activeLogisticsModal === 'rate' && <><Truck size={16} color="#60a5fa" /> Delivery Order Health</>}
                </h3>
                <button onClick={() => openLogisticsDetails(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                {logisticsDetailsLoading ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading product details...</div>
                ) : activeLogisticsModal === 'branches' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Globe size={16} color="#c084fc" />
                          Regional Supply Chain Matrix
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                          Transit latencies, active fleet dispatch volume, and local stock health metrics.
                        </p>
                      </div>
                      <button
                        onClick={() => setRouteOptimizationActive(!routeOptimizationActive)}
                        style={{ padding: '8px 16px', background: routeOptimizationActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: `1px solid ${routeOptimizationActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, color: routeOptimizationActive ? '#34d399' : '#60a5fa', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                      >
                        {routeOptimizationActive ? <CheckCircle2 size={14} /> : <Activity size={14} />}
                        {routeOptimizationActive ? 'Route Optimization Active' : 'Activate Regional Optimization'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {branchCards.map((branch) => {
                        const health = branch.status === 'Active' ? 96 : branch.status === 'Watch Collection' ? 72 : 55;
                        const color = health >= 90 ? '#10b981' : health >= 70 ? '#fbbf24' : '#94a3b8';
                        return (
                          <div key={branch.loc} onClick={() => { setDrilldownBranch(branch.loc); setActiveLogisticsModal('regions'); }} style={{ background: 'rgba(30, 41, 59, 0.45)', border: `1px solid ${color}33`, borderRadius: '14px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>{branch.name}</div>
                                <div style={{ color, fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>{branch.status}</div>
                              </div>
                              <div style={{ color, fontSize: '16px', fontWeight: '800' }}>{health}%</div>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', margin: '14px 0' }}>
                              <div style={{ width: `${health}%`, height: '100%', background: color, borderRadius: 'inherit' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                              <div><span style={{ color: '#94a3b8' }}>Shipments</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{branch.ships.toLocaleString()}</div></div>
                              <div><span style={{ color: '#94a3b8' }}>Sales</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{formatThousandRinggit(branch.rev)}</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeLogisticsModal === 'regions' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {(() => {
                      const destinations = branchInsights[drilldownBranch]?.delivery_destinations || [];
                      if (destinations.length === 0) {
                        return <div style={{ padding: '24px', color: '#94a3b8', textAlign: 'center', gridColumn: '1 / -1' }}>No shipment records found for this branch.</div>;
                      }
                      const grouped = destinations.reduce((groups, delivery) => {
                        const state = delivery.state || 'Unspecified';
                        groups[state] = groups[state] || { shipments: 0, value: 0 };
                        groups[state].shipments += Number(delivery.shipment_count || 0);
                        groups[state].value += Number(delivery.total_value || 0);
                        return groups;
                      }, {});
                      return Object.entries(grouped).map(([state, summary]) => (
                        <div key={state} onClick={() => { setSelectedState(state); setActiveLogisticsModal('state_products'); setLogisticsPage(1); setLogisticsSearch(''); }} style={{ background: 'rgba(30,41,59,0.45)', border: '1px solid rgba(196,181,253,0.18)', borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                          <div style={{ color: '#c4b5fd', fontWeight: '800' }}>{state}</div>
                          <div style={{ color: '#e2e8f0', marginTop: '6px', fontSize: '12px' }}>{summary.shipments.toLocaleString()} shipments</div>
                          <div style={{ color: '#94a3b8', marginTop: '3px', fontSize: '11px' }}>RM {summary.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (['pending', 'total_shipment', 'returns', 'state_products'].includes(activeLogisticsModal) && logisticsDetailsData) ? (
                  logisticsDetailsData.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                        <Package size={36} color="#64748b" />
                      </div>
                      <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>No Physical Products Found</div>
                      <div style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '450px', margin: '0 auto', lineHeight: '1.5' }}>
                        The <b>{activeLogisticsModal === 'returns' ? 'Return' : 'Shipment'}</b> records for this selection consist entirely of <b>Service Items</b> (e.g., Installation, Delivery Charges, Workmanship) or non-inventory components. 
                        <br/><br/>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>*Only products marked as "Stock Control" in the inventory master file are displayed here.</span>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const filteredData = logisticsDetailsData.filter(item => 
                        (item.item_code || '').toLowerCase().includes(logisticsSearch.toLowerCase()) || 
                        (item.description || '').toLowerCase().includes(logisticsSearch.toLowerCase()) ||
                        (item.doc_no || '').toLowerCase().includes(logisticsSearch.toLowerCase()) ||
                        (item.debtor_name || '').toLowerCase().includes(logisticsSearch.toLowerCase()) ||
                        (item.location || '').toLowerCase().includes(logisticsSearch.toLowerCase())
                      );
                      
                      const groupedData = filteredData.reduce((acc, item) => {
                        const key = item.debtor_name || 'Unknown';
                        if (!acc[key]) acc[key] = { debtor_name: key, location: item.location, items: [], total_value: 0, total_qty: 0 };
                        acc[key].items.push(item);
                        acc[key].total_value += Number(item.total);
                        acc[key].total_qty += Number(item.qty);
                        return acc;
                      }, {});
                      
                      const groupedArray = Object.values(groupedData).sort((a,b) => b.total_value - a.total_value);
                      
                      const totalPages = Math.ceil(groupedArray.length / 20) || 1;
                      const currentPage = Math.min(logisticsPage, totalPages);
                      const startIndex = (currentPage - 1) * 20;
                      const paginatedData = groupedArray.slice(startIndex, startIndex + 20);

                      const toggleDebtor = (debtor) => {
                        setExpandedDebtors(prev => ({ ...prev, [debtor]: !prev[debtor] }));
                      };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              placeholder="Search doc no, item code or name..." 
                              value={logisticsSearch}
                              onChange={e => { setLogisticsSearch(e.target.value); setLogisticsPage(1); }}
                              style={{ padding: '8px 12px', borderRadius: '6px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '250px', fontSize: '13px', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                               <span>Page {currentPage} of {totalPages}</span>
                               <button onClick={() => setLogisticsPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>Prev</button>
                               <button onClick={() => setLogisticsPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
                            </div>
                          </div>
                          <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead style={{ position: 'sticky', top: 0, background: '#1e293b', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 1 }}>
                                <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Debtor Name</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Location</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Total Items</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'right' }}>Total (RM)</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedData.length > 0 ? paginatedData.map((group, i) => (
                                  <React.Fragment key={i}>
                                    <tr onClick={() => toggleDebtor(group.debtor_name)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                                      <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 'bold' }}>{group.debtor_name}</td>
                                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{group.location}</td>
                                      <td style={{ padding: '12px 16px', color: '#e2e8f0', textAlign: 'center' }}>{group.items.length} products (Qty: {group.total_qty})</td>
                                      <td style={{ padding: '12px 16px', color: activeLogisticsModal === 'returns' ? '#ef4444' : '#10b981', fontWeight: 'bold', textAlign: 'right' }}>
                                        {Number(group.total_value).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                      </td>
                                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#60a5fa' }}>
                                        {expandedDebtors[group.debtor_name] ? '▼ Hide' : '▶ View'}
                                      </td>
                                    </tr>
                                    {expandedDebtors[group.debtor_name] && (
                                      <tr>
                                        <td colSpan="5" style={{ padding: 0, background: 'rgba(0,0,0,0.2)' }}>
                                          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                              <thead>
                                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                                  <th style={{ padding: '8px' }}>Doc No</th>
                                                  <th style={{ padding: '8px' }}>Date</th>
                                                  <th style={{ padding: '8px' }}>Item Code</th>
                                                  <th style={{ padding: '8px' }}>Description</th>
                                                  <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                                                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {group.items.map((item, j) => (
                                                  <tr key={j} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '8px', color: '#cbd5e1' }}>{item.doc_no}</td>
                                                    <td style={{ padding: '8px', color: '#94a3b8' }}>{item.date}</td>
                                                    <td style={{ padding: '8px', color: '#f8fafc' }}>{item.item_code}</td>
                                                    <td style={{ padding: '8px', color: '#94a3b8' }}>{item.description}</td>
                                                    <td style={{ padding: '8px', color: '#e2e8f0', textAlign: 'center' }}>{item.qty}</td>
                                                    <td style={{ padding: '8px', color: '#e2e8f0', textAlign: 'right' }}>{Number(item.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )) : (
                                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No matches found.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )
                ) : null}
              </div>
            </div>
          )}

          {/* Matrix removed from bottom to inline modal */}
        </div>
      )}

      {/* 5. AUDIT & SHRINKAGE CONTROL TAB */}
      {activeSubTab === 'shrinkage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
          {/* Cancelled products by branch */}
          <div style={{ background: 'rgba(127, 29, 29, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', borderRadius: '20px', padding: '22px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px' }}>Cancelled Products by Branch</h3>
                <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '12px' }}>Track cancelled product quantity, unit price, cancellation value, branch/kilang, and recorded reason.</p>
              </div>
              <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: '700' }}>{(insights?.stock_aging?.cancelled_products || []).length} product records</span>
            </div>
            {(insights?.stock_aging?.cancelled_products || []).length ? (
              <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ padding: '10px 8px' }}>Branch / Kilang</th><th style={{ padding: '10px 8px' }}>Product</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Quantity</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Cancelled Value</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Documents</th><th style={{ padding: '10px 8px' }}>Reason</th></tr></thead>
                <tbody>{insights.stock_aging.cancelled_products.map((item, index) => <tr key={`${item.branch}-${item.item_code}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}><td style={{ padding: '11px 8px', color: '#fbbf24', fontWeight: '700' }}>{item.branch}</td><td style={{ padding: '11px 8px' }}><b>{item.description}</b><small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>{item.item_code}</small></td><td style={{ padding: '11px 8px', textAlign: 'right' }}>{Number(item.quantity || 0).toLocaleString()}</td><td style={{ padding: '11px 8px', textAlign: 'right' }}>RM {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style={{ padding: '11px 8px', textAlign: 'right', color: '#fca5a5', fontWeight: '800' }}>RM {Number(item.cancelled_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style={{ padding: '11px 8px', textAlign: 'right' }}>{Number(item.documents || 0).toLocaleString()}</td><td style={{ padding: '11px 8px', color: item.reason === 'Not recorded in AED_FM' ? '#fbbf24' : '#cbd5e1' }}>{item.reason}</td></tr>)}</tbody>
              </table>
            ) : <div style={{ padding: '22px 0', color: '#94a3b8', fontSize: '13px' }}>No cancelled product records for the selected year and branch filter.</div>}
          </div>
        </div>
      )}

      {/* AI Markdown / Clearance Recommendation Modal */}
      {clearanceItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '560px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', padding: '8px', borderRadius: '10px' }}>
                    <Globe size={16} color="#fff" />
                  </div>
                  Regional Supply Chain Matrix
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Transit latencies, active fleet dispatch volume, and local stock health metrics.
                </p>
              </div>
              <button
                onClick={() => setRouteOptimizationActive(!routeOptimizationActive)}
                style={{ padding: '10px 18px', background: routeOptimizationActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: `1px solid ${routeOptimizationActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, color: routeOptimizationActive ? '#34d399' : '#60a5fa', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                {routeOptimizationActive ? <CheckCircle2 size={16} /> : <Activity size={16} />}
                {routeOptimizationActive ? 'Route Optimization Active (-18% Overhead)' : 'Activate Regional Route Optimization'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {branchCards.map((branch) => {
                const health = branch.status === 'Active' ? 96 : branch.status === 'Watch Collection' ? 72 : 55;
                const color = health >= 90 ? '#10b981' : health >= 70 ? '#fbbf24' : '#94a3b8';
                return (
                  <div key={branch.loc} style={{ background: 'rgba(30, 41, 59, 0.45)', border: `1px solid ${color}33`, borderRadius: '14px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>{branch.name}</div>
                        <div style={{ color, fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>{branch.status}</div>
                      </div>
                      <div style={{ color, fontSize: '18px', fontWeight: '800' }}>{health}%</div>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', margin: '16px 0' }}>
                      <div style={{ width: `${health}%`, height: '100%', background: color, borderRadius: 'inherit' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                      <div><span style={{ color: '#94a3b8' }}>Shipments</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{branch.ships.toLocaleString()}</div></div>
                      <div><span style={{ color: '#94a3b8' }}>Sales</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{formatThousandRinggit(branch.rev)}</div></div>
                      <div><span style={{ color: '#94a3b8' }}>Lead</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{branch.salesLead}</div></div>
                      <div><span style={{ color: '#94a3b8' }}>Fulfillment</span><div style={{ color: '#e2e8f0', fontWeight: '700', marginTop: '3px' }}>{branch.fulfillment ?? 0}%</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT & SHRINKAGE CONTROL TAB */}
      {activeSubTab === 'shrinkage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease-out' }}>
          {/* Cancelled products by branch */}
          <div style={{ background: 'rgba(127, 29, 29, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', borderRadius: '20px', padding: '22px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px' }}>Cancelled Products by Branch</h3>
                <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '12px' }}>Track cancelled product quantity, unit price, cancellation value, branch/kilang, and recorded reason.</p>
              </div>
              <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: '700' }}>{(insights?.stock_aging?.cancelled_products || []).length} product records</span>
            </div>
            {(insights?.stock_aging?.cancelled_products || []).length ? (
              <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ padding: '10px 8px' }}>Branch / Kilang</th><th style={{ padding: '10px 8px' }}>Product</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Quantity</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Cancelled Value</th><th style={{ padding: '10px 8px', textAlign: 'right' }}>Documents</th><th style={{ padding: '10px 8px' }}>Reason</th></tr></thead>
                <tbody>{insights.stock_aging.cancelled_products.map((item, index) => <tr key={`${item.branch}-${item.item_code}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}><td style={{ padding: '11px 8px', color: '#fbbf24', fontWeight: '700' }}>{item.branch}</td><td style={{ padding: '11px 8px' }}><b>{item.description}</b><small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>{item.item_code}</small></td><td style={{ padding: '11px 8px', textAlign: 'right' }}>{Number(item.quantity || 0).toLocaleString()}</td><td style={{ padding: '11px 8px', textAlign: 'right' }}>RM {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style={{ padding: '11px 8px', textAlign: 'right', color: '#fca5a5', fontWeight: '800' }}>RM {Number(item.cancelled_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style={{ padding: '11px 8px', textAlign: 'right' }}>{Number(item.documents || 0).toLocaleString()}</td><td style={{ padding: '11px 8px', color: item.reason === 'Not recorded in AED_FM' ? '#fbbf24' : '#cbd5e1' }}>{item.reason}</td></tr>)}</tbody>
              </table>
            ) : <div style={{ padding: '22px 0', color: '#94a3b8', fontSize: '13px' }}>No cancelled product records for the selected year and branch filter.</div>}
          </div>
        </div>
      )}

      {/* AI Markdown / Clearance Recommendation Modal */}
      {clearanceItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '560px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <Zap size={20} color="#34d399" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '800' }}>AI Markdown Analysis</h3>
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>Target: <span style={{ color: '#fff', fontWeight: 'bold' }}>{clearanceItem.item_code}</span></div>
                </div>
              </div>
              <button onClick={() => setClearanceItem(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Context Box */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <div style={{ color: '#cbd5e1', marginBottom: '8px' }}><b>Product:</b> {clearanceItem.description}</div>
              <div style={{ display: 'flex', gap: '20px', color: '#94a3b8' }}>
                <span><b>Cost:</b> RM {Number(clearanceItem.cost).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span><b>Stock:</b> {clearanceItem.stock} units</span>
                <span style={{ color: clearanceItem.days_since_movement > 360 ? '#fca5a5' : '#fcd34d' }}><b>Idle:</b> {clearanceItem.days_since_movement} days</span>
              </div>
            </div>

            <h4 style={{ color: '#f8fafc', fontSize: '14px', margin: '0 0 16px 0' }}>Select Strategic Discount Rate:</h4>

            {/* Discount Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: 30% */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', gap: '16px' }}>
                <div>
                  <div style={{ color: '#60a5fa', fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>30% OFF (Conservative)</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Recovers initial cost with slight profit margin. Clears in ~45 days.</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Est. Recovery</div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>RM {(Number(clearanceItem.cost) * Number(clearanceItem.stock) * 1.2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              </div>

              {/* Option 2: 50% */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: clearanceItem.days_since_movement > 360 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', border: clearanceItem.days_since_movement > 360 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', position: 'relative', gap: '16px' }}>
                {clearanceItem.days_since_movement > 360 && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>AI RECOMMENDED</div>}
                <div>
                  <div style={{ color: clearanceItem.days_since_movement > 360 ? '#34d399' : '#cbd5e1', fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>50% OFF (Balanced)</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Sells near breakeven point. High probability of clearing in 14-20 days.</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: clearanceItem.days_since_movement > 360 ? '#34d399' : '#cbd5e1', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Est. Recovery</div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>RM {(Number(clearanceItem.cost) * Number(clearanceItem.stock) * 1.0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              </div>

              {/* Option 3: 70% */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', gap: '16px' }}>
                <div>
                  <div style={{ color: '#f87171', fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>70% OFF (Aggressive)</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Loss leader strategy. Frees up warehouse capacity immediately.</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: '#f87171', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Est. Recovery</div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>RM {(Number(clearanceItem.cost) * Number(clearanceItem.stock) * 0.7).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseWarehouseMonitoring;
