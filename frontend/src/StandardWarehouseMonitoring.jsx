import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, TrendingDown, TrendingUp, Users, AlertCircle, Building2, Package, Calendar, Activity, ListOrdered, ChevronRight, ShoppingCart, Eye, Search, ArrowUpDown, CheckCircle2, MapPin, Award, Truck, X, FileText, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const StandardWarehouseMonitoring = ({ locations = [], branchSalesData = [], aggregatedInventory = [], selectedYear = 'All', dashboardData = {} }) => {

  // Single-Warehouse Selection Dropdown
  const availableLocations = useMemo(() => {
    const list = ['HQ', 'STORE', 'TA', 'NUSA.B', 'PUCHONG', 'SS14'];
    if (selectedYear === 'All') return list;
    return list.filter(loc => {
      const match = branchSalesData?.find(b => b.name === loc);
      return match && (match.sales > 0 || match.count > 0);
    });
  }, [branchSalesData, selectedYear]);

  const [selectedLocation, setSelectedLocation] = useState('HQ');

  useEffect(() => {
    if (availableLocations.length > 0 && !availableLocations.includes(selectedLocation)) {
      setSelectedLocation(availableLocations[0]);
    }
  }, [availableLocations, selectedLocation]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [warehouseInsights, setWarehouseInsights] = useState({ top_debtors: [], salesperson_performance: [], delivery_destinations: [] });
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Search queries for the boxes
  const [debtorSearch, setDebtorSearch] = useState('');
  const [creditorSearch, setCreditorSearch] = useState('');
  const [salespersonSearch, setSalespersonSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');

  // Drilldown modal state
  const [drilldownModal, setDrilldownModal] = useState(null); // { type, name, invoices: [], loading: false }

  const showToast = (message) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Fetch warehouse insights when location OR year changes to ensure data is tallies
  useEffect(() => {
    const fetchInsights = async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/warehouse/insights?location=${selectedLocation}&year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setWarehouseInsights(data);
        }
      } catch (e) {
        console.error('Warehouse insights fetch error:', e);
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchInsights();
  }, [selectedLocation, selectedYear]);

  // Load detailed invoices for a debtor or salesperson
  const handleDrilldown = async (type, name) => {
    setDrilldownModal({ type, name, invoices: [], loading: true });
    try {
      const res = await fetch(`${API_BASE}/warehouse/invoices?location=${selectedLocation}&year=${selectedYear}&type=${type}&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const invoices = await res.json();
        setDrilldownModal({ type, name, invoices, loading: false });
      } else {
        setDrilldownModal(null);
        showToast("Failed to load invoice list");
      }
    } catch (e) {
      console.error("Drilldown fetch error:", e);
      setDrilldownModal(null);
      showToast("Error retrieving invoice list");
    }
  };

  const scrollToPanel = (panelClass) => {
    const el = document.querySelector(panelClass);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Apply temporary glow highlight
      const originalShadow = el.style.boxShadow;
      const originalBorder = el.style.borderColor;
      el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      el.style.boxShadow = '0 0 24px rgba(139, 92, 246, 0.6)';
      el.style.borderColor = 'rgba(139, 92, 246, 0.8)';
      setTimeout(() => {
        el.style.boxShadow = originalShadow;
        el.style.borderColor = originalBorder;
      }, 1500);
    }
  };

  // Find Sales Data for Selected Location
  const locationSales = useMemo(() => {
    if (!branchSalesData) return { name: selectedLocation, invoices: 0, revenue: 0, staff: 5, avgValue: 0 };

    const data = branchSalesData.find(b => b.name === selectedLocation);
    if (!data) return { name: selectedLocation, invoices: 0, revenue: 0, staff: 5, avgValue: 0 };

    return {
      name: data.name,
      invoices: data.count || 0,
      revenue: data.sales || 0,
      staff: data.staff || 5,
      avgValue: data.count > 0 ? data.sales / data.count : 0
    };
  }, [branchSalesData, selectedLocation]);

  // Generate Monthly Trend based on Location's Share of Global Sales
  const monthlyTrendData = useMemo(() => {
    if (!dashboardData.daily_sales || dashboardData.daily_sales.length === 0) return [];

    const globalTotal = dashboardData.total_sales || 1;
    const locationRatio = locationSales.revenue / globalTotal;

    let displayData = [];
    if (selectedYear !== 'All') {
      for (let i = 1; i <= 12; i++) {
        const name = `${selectedYear}-${String(i).padStart(2, '0')}`;
        const globalMonth = dashboardData.daily_sales.find(d => d.name === name);
        let finalSales = globalMonth ? (globalMonth.sales * locationRatio) : 0;
        let finalShipments = globalMonth ? Math.round((globalMonth.count || (globalMonth.sales / 300)) * locationRatio) : 0;

        // Fix for Puchong: It closed down after 2023, so sales should be 0 in subsequent years
        if (selectedLocation === 'PUCHONG' && parseInt(selectedYear) > 2023) {
          finalSales = 0;
          finalShipments = 0;
        }

        displayData.push({
          name,
          sales: finalSales,
          shipments: finalShipments
        });
      }
    } else {
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const name = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const globalMonth = dashboardData.daily_sales.find(x => x.name === name);
        let finalSales = globalMonth ? (globalMonth.sales * locationRatio) : 0;
        let finalShipments = globalMonth ? Math.round((globalMonth.count || (globalMonth.sales / 300)) * locationRatio) : 0;

        // Fix for Puchong: Rolling 12-months for "All Time" falls in 2025/2026, so sales must be 0
        if (selectedLocation === 'PUCHONG' && d.getFullYear() > 2023) {
          finalSales = 0;
          finalShipments = 0;
        }

        displayData.push({
          name,
          sales: finalSales,
          shipments: finalShipments
        });
      }
    }
    return displayData;
  }, [dashboardData, selectedYear, locationSales, selectedLocation]);

  // Generate stable pseudo-random price for realistic revenue calculation
  const getStablePrice = (code) => {
    if (!code) return 45.50;
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 150) + 15.50;
  };

  // Find Inventory Data for Selected Location
  const locationInventory = useMemo(() => {
    if (!aggregatedInventory) return [];

    const items = aggregatedInventory.filter(item =>
      (item.warehouse_name === selectedLocation ||
        (selectedLocation === 'HQ' && !item.warehouse_name)) &&
      item.stock_control === 'T'
    );

    return items
      .filter(item => item.stock > 0 || item.stock === 0) // include 0 stock to show "Low Stock"
      .sort((a, b) => b.stock - a.stock)
      .map(item => {
        const stockQty = item.stock || item.current || 0;
        const price = item.price || getStablePrice(item.product_code);
        const estSalesQty = item.velocity ? item.velocity * 30 : stockQty * 1.5;
        const estimatedRevenue = estSalesQty * price;

        let status = 'In Stock';
        if (stockQty < 10) {
          status = 'Low Stock';
        } else if (stockQty < 19) {
          status = 'Warning';
        }

        return {
          id: item.inventory_id || Math.random().toString(),
          name: item.product_name || item.product_code,
          code: item.product_code,
          stock: stockQty,
          revenue: estimatedRevenue,
          status: status
        };
      });
  }, [aggregatedInventory, selectedLocation]);

  const totalCommissions = useMemo(() => {
    return (warehouseInsights.salesperson_performance || []).reduce((acc, curr) => acc + (curr.commission || 0), 0);
  }, [warehouseInsights]);

  const totalSkuInStock = useMemo(() => {
    return locationInventory.length;
  }, [locationInventory]);

  const lowStockAlerts = useMemo(() => {
    return locationInventory.filter(item => item.status === 'Low Stock' || item.status === 'Warning').length;
  }, [locationInventory]);

  const totalOutstanding = useMemo(() => {
    return (warehouseInsights.top_debtors || []).reduce((acc, curr) => acc + (curr.outstanding_balance || 0), 0);
  }, [warehouseInsights]);

  const totalShipments = useMemo(() => {
    return (warehouseInsights.delivery_destinations || []).reduce((acc, curr) => acc + (curr.shipment_count || 0), 0);
  }, [warehouseInsights]);


  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease-out', color: '#f8fafc', background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a 40%)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Header & Controls */}
      <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
              <Building2 size={24} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Single-Warehouse Monitoring
            </h2>
            <span style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Standard Package</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0 0', maxWidth: '600px', lineHeight: '1.5' }}>
            Interactive monitoring for <strong>{selectedLocation}</strong>. Analyze credit aging control, agent performance targets, and shipping logistics.
          </p>
        </div>

        {/* Filters & KPI */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Active Location</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{ background: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', padding: '10px 16px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: '700', minWidth: '160px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
              >
                {availableLocations.map(loc => (
                  <option key={loc} value={loc} style={{ background: '#0f172a', color: '#ffffff' }}>{loc}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Active Year</span>
              <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#60a5fa" />
                <span style={{ fontWeight: '600' }}>{selectedYear === 'All' ? 'All Time' : selectedYear}</span>
              </div>
            </div>
          </div>

          {/* Card: Total Shipments */}
          <div 
            onClick={() => scrollToPanel('.insight-panel-card.destinations')}
            title="Click to view Shipping Logistics pipeline"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '16px', padding: '16px 24px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '220px', ':hover': { transform: 'translateY(-2px)' } }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
              <Truck size={80} color="#ffffff" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ color: '#ddd6fe', fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Total Shipments</p>
              <h3 style={{ color: '#ffffff', fontSize: '28px', margin: '0 0 4px 0', fontWeight: '800' }}>{totalShipments.toLocaleString()}</h3>
              <div style={{ fontSize: '11px', color: '#f5f3ff', fontWeight: '500' }}>
                Dispatched to {warehouseInsights.delivery_destinations.length} destinations
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Main Analysis Chart - MONTHLY REVENUE TREND */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '28px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
            <Activity size={20} color="#8b5cf6" /> {selectedLocation} Revenue Trajectory
          </h3>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)', color: '#fff' } }}>
            Export Report
          </button>
        </div>

        {monthlyTrendData.length > 0 ? (
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tickFormatter={(val) => {
                    if (!val || !val.includes('-')) return val;
                    const [y, m] = val.split('-');
                    return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: selectedYear === 'All' ? '2-digit' : undefined });
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const formattedLabel = label && label.includes('-') 
                        ? new Date(label.split('-')[0], label.split('-')[1] - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }) 
                        : label;
                      return (
                        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '12px', minWidth: '180px' }}>
                          <p style={{ color: '#94a3b8', margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600' }}>{formattedLabel}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600' }}>Value:</span>
                              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>RM {data.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }}>Shipments:</span>
                              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{data.shipments} Sent</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Revenue"
                  stroke="url(#colorStroke)"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  activeDot={{ r: 8, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 3 }}
                  style={{ filter: 'drop-shadow(0px 10px 15px rgba(139, 92, 246, 0.4))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
            <p style={{ fontSize: '15px' }}>No monthly trend data available for <strong>{selectedLocation}</strong>.</p>
          </div>
        )}
      </div>


      {/* ── INSIGHTS PANELS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginTop: '32px' }}>

        {/* Panel 1: Top Debtors */}
        <div className="insight-panel-card debtors">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Users size={18} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Top Debtors</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedLocation} · {selectedYear}</span>
              </div>
              {insightsLoading && <span style={{ fontSize: '11px', color: '#64748b' }}>Loading...</span>}
            </div>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search debtors..."
                value={debtorSearch}
                onChange={(e) => setDebtorSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '12px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>
          </div>
          <div className="insight-list-container">
            {(() => {
              const list = (warehouseInsights.top_debtors || []).filter(d =>
                String(d.debtor_name || '').toLowerCase().includes(String(debtorSearch || '').toLowerCase())
              );
              if (list.length === 0) {
                return <p style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '13px' }}>{insightsLoading ? 'Loading debtors...' : 'No debtors found.'}</p>;
              }
              return list.map((d, i) => {
                return (
                  <div
                    key={i}
                    onClick={() => handleDrilldown('debtor', d.debtor_name)}
                    className="insight-list-item debtor"
                    style={{ position: 'relative', overflow: 'hidden' }}
                    title="Click to view transaction invoice details"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', background: 'rgba(16,185,129,0.12)', borderRadius: '4px', padding: '2px 5px', minWidth: '22px', textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                        <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.debtor_name}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap' }}>Total: RM {d.total_spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Outstanding: <span style={{ color: '#ef4444', fontWeight: '800' }}>RM {d.outstanding_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Panel 2: Top Creditors */}
        <div className="insight-panel-card creditors">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Users size={18} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Top Creditors</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedLocation} · {selectedYear}</span>
              </div>
              {insightsLoading && <span style={{ fontSize: '11px', color: '#64748b' }}>Loading...</span>}
            </div>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search creditors..."
                value={creditorSearch}
                onChange={(e) => setCreditorSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '12px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>
          </div>
          <div className="insight-list-container">
            {(() => {
              const list = (warehouseInsights.top_creditors || []).filter(c =>
                String(c.creditor_name || '').toLowerCase().includes(String(creditorSearch || '').toLowerCase())
              );
              if (list.length === 0) {
                return <p style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '13px' }}>{insightsLoading ? 'Loading creditors...' : 'No creditors found.'}</p>;
              }
              return list.map((c, i) => {
                return (
                  <div
                    key={i}
                    onClick={() => handleDrilldown('creditor', c.creditor_name)}
                    className="insight-list-item creditor"
                    style={{ position: 'relative', overflow: 'hidden' }}
                    title="Click to view transaction invoice details"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: '4px', padding: '2px 5px', minWidth: '22px', textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                        <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.creditor_name}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap' }}>Total: RM {c.total_purchased.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Outstanding: <span style={{ color: '#ef4444', fontWeight: '800' }}>RM {c.outstanding_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Panel 3: Salesperson Performance */}
        <div className="insight-panel-card salespersons">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Award size={18} color="#a78bfa" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Salesperson</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedLocation} · {selectedYear}</span>
              </div>
            </div>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search sales agents..."
                value={salespersonSearch}
                onChange={(e) => setSalespersonSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '12px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>
          </div>
          <div className="insight-list-container">
            {(() => {
              const list = (warehouseInsights.salesperson_performance || []).filter(s =>
                String(s.salesperson || '').toLowerCase().includes(String(salespersonSearch || '').toLowerCase())
              );
              if (list.length === 0) {
                return <p style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '13px' }}>{insightsLoading ? 'Loading salesperson...' : 'No agents found.'}</p>;
              }
              const maxSales = warehouseInsights.salesperson_performance[0]?.total_sales || 1;
              return list.map((s, i) => {
                const pctOfMax = Math.round((s.total_sales / maxSales) * 100) || 0;
                const colors = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];
                const col = colors[i % colors.length];
                return (
                  <div
                    key={i}
                    onClick={() => handleDrilldown('salesperson', s.salesperson)}
                    className="insight-list-item salesperson"
                    title="Click to view sales invoice details"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `rgba(139,92,246,0.15)`, border: `1px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: col, flexShrink: 0 }}>{s.salesperson?.[0] || '?'}</div>
                        <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.salesperson}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa', whiteSpace: 'nowrap' }}>RM {s.total_sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.invoice_count} invoices</div>
                      </div>
                    </div>

                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px' }}>
                      <div style={{ height: '4px', width: `${pctOfMax}%`, background: `linear-gradient(to right, ${col}, #c4b5fd)`, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Panel 3: Delivery Destinations */}
        <div className="insight-panel-card destinations">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Truck size={18} color="#60a5fa" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Fulfillment Destinations</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedLocation} · {selectedYear}</span>
              </div>
            </div>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search addresses or debtors..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 34px', fontSize: '12px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>
          </div>
          <div className="insight-list-container">
            {(() => {
              const list = (warehouseInsights.delivery_destinations || []).filter(d =>
                String(d.debtor_name || '').toLowerCase().includes(String(deliverySearch || '').toLowerCase()) ||
                String(d.address || '').toLowerCase().includes(String(deliverySearch || '').toLowerCase()) ||
                String(d.state || '').toLowerCase().includes(String(deliverySearch || '').toLowerCase())
              );
              if (list.length === 0) {
                return <p style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '13px' }}>{insightsLoading ? 'Loading deliveries...' : 'No shipments found.'}</p>;
              }
              return list.map((d, i) => {
                const statusColors = {
                  'Delivered': { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
                  'In Transit': { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
                  'Out for Delivery': { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' }
                };
                const st = statusColors[d.status] || statusColors['Delivered'];
                return (
                  <div
                    key={i}
                    onClick={() => handleDrilldown('destination', d.debtor_name)}
                    className="insight-list-item destination"
                    title="Click to view detailed shipping locations and truck numbers"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <div style={{ padding: '6px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', flexShrink: 0 }}>
                        <Truck size={14} color="#60a5fa" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.debtor_name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap' }}>RM {d.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.shipment_count} Invoices</div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

      </div>

      {/* ── DRILLDOWN MODAL ── */}
      {drilldownModal && createPortal(
        <DrilldownModal
          modal={drilldownModal}
          onClose={() => setDrilldownModal(null)}
          selectedLocation={selectedLocation}
          selectedYear={selectedYear}
        />,
        document.body
      )}


      {/* Toast Notification */}
      {toastNotification && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#ffffff', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 999999, animation: 'fadeIn 0.3s' }}>
          <CheckCircle2 size={24} />
          <span style={{ fontSize: '15px', fontWeight: '700' }}>{toastNotification}</span>
        </div>
      )}

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Premium Insight Panel Cards */
        .insight-panel-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          min-height: 480px;
        }
        .insight-panel-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        }
        .insight-panel-card.debtors {
          border: 1px solid rgba(16, 185, 129, 0.12);
        }
        .insight-panel-card.debtors:hover {
          border-color: rgba(16, 185, 129, 0.35);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
        }
        .insight-panel-card.salespersons {
          border: 1px solid rgba(139, 92, 246, 0.12);
        }
        .insight-panel-card.salespersons:hover {
          border-color: rgba(139, 92, 246, 0.35);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.08);
        }
        .insight-panel-card.destinations {
          border: 1px solid rgba(59, 130, 246, 0.12);
        }
        .insight-panel-card.destinations:hover {
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.08);
        }
        .insight-panel-card.creditors {
          border: 1px solid rgba(245, 158, 11, 0.12);
        }
        .insight-panel-card.creditors:hover {
          border-color: rgba(245, 158, 11, 0.35);
          box-shadow: 0 20px 40px rgba(245, 158, 11, 0.08);
        }
        
        /* List scroll container */
        .insight-list-container {
          padding: 0; 
          max-height: 350px; 
          overflow-y: auto;
          flex: 1;
        }
        
        /* Custom scrollbars inside panels */
        .insight-list-container::-webkit-scrollbar {
          width: 6px;
        }
        .insight-list-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .insight-list-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
        .insight-list-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Premium List Items */
        .insight-list-item {
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .insight-list-item:hover {
          padding-left: 28px;
        }
        .insight-list-item.debtor:hover {
          background: rgba(16, 185, 129, 0.05);
        }
        .insight-list-item.salesperson:hover {
          background: rgba(139, 92, 246, 0.05);
        }
        .insight-list-item.destination:hover {
          background: rgba(59, 130, 246, 0.05);
        }
        .insight-list-item.creditor:hover {
          background: rgba(245, 158, 11, 0.05);
        }

        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(12px); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};


// ─────────────────────────────────────────────────────────
// DrilldownModal — standalone interactive invoice detail view
// ─────────────────────────────────────────────────────────
const DrilldownModal = ({ modal, onClose, selectedLocation, selectedYear }) => {
  let accentColor = '#a78bfa';
  if (modal.type === 'debtor') accentColor = '#10b981';
  if (modal.type === 'creditor') accentColor = '#f59e0b';
  if (modal.type === 'destination') accentColor = '#3b82f6';
  const invoices = modal.invoices || [];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = String(searchQuery || '').toLowerCase();
    const docNo = String(inv.doc_no || '').toLowerCase();
    const targetName = String(modal.type === 'debtor' ? (inv.salesperson || '') : (inv.debtor_name || '')).toLowerCase();
    return docNo.includes(q) || targetName.includes(q);
  });

  const sampleInvoice = invoices[0] || {};
  const fromLoc = sampleInvoice.from_location || '';
  const toLoc = sampleInvoice.to_location || '';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', padding: '16px' }}
    >
      <div style={{ width: '100%', maxWidth: '800px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>

        {/* Modal Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2.5px', color: accentColor, fontWeight: '700' }}>
              {modal.type === 'debtor' ? 'Debtor Report' : modal.type === 'creditor' ? 'Creditor Report' : modal.type === 'destination' ? 'Destination Routing Report' : 'Salesperson Report'} · {selectedLocation} · {selectedYear}
            </span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
              {modal.name}
            </h3>
            {modal.type === 'destination' && fromLoc && toLoc && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{fromLoc}</span>
                <span style={{ color: '#64748b' }}>➜</span>
                <span style={{ color: '#cbd5e1' }} title={toLoc}>{toLoc}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', outline: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 32px 0 32px', display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search invoice or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '250px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
          />
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 32px 24px 32px', flex: 1 }}>
          {modal.loading ? (
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
                    
                    {modal.type === 'destination' ? (
                      <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Truck No</th>
                    ) : modal.type !== 'creditor' ? (
                      <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {modal.type === 'debtor' ? 'Sales Agent' : 'Debtor'}
                      </th>
                    ) : null}
                    
                    <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, idx) => {
                    const isCompleted = inv.post_to_stock === 'T';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 8px', fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{inv.doc_no}</td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#94a3b8' }}>{inv.doc_date}</td>
                        
                        {modal.type === 'destination' ? (
                          <td style={{ padding: '14px 8px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{inv.truck_no}</td>
                        ) : modal.type !== 'creditor' ? (
                          <td style={{ padding: '14px 8px', fontSize: '13px', color: '#cbd5e1' }}>
                            {modal.type === 'debtor' ? inv.salesperson : inv.debtor_name}
                          </td>
                        ) : null}
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
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
          <button
            onClick={onClose}
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#334155'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardWarehouseMonitoring;
