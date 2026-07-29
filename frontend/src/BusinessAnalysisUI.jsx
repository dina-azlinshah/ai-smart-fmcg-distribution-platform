import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, FileText, Download, Zap, Sliders, Target, BarChart3, Package,
  Users, DollarSign, RefreshCw, CreditCard, Star, UserCheck, X
} from 'lucide-react';
import FeatureTooltip from './FeatureTooltip';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8001`;

const BusinessAnalysisUI = ({ initialLevel = 'Standard', dashboardData, salesSummary, inventory, selectedYear = 'All', onYearChange }) => {
  const level = initialLevel;
  
  // ---- Customer Flashcard State ----
  const [flashcards, setFlashcards] = useState(null);
  const [flashcardsLoading, setFlashcardsLoading] = useState(true);
  const [apiTopProducts, setApiTopProducts] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    setFlashcardsLoading(true);
    const yearParam = selectedYear && selectedYear !== 'All' ? `?year=${selectedYear}` : '';
    
    // Fetch flashcards
    fetch(`${API_BASE}/api/customer-flashcards${yearParam}`)
      .then(r => r.json())
      .then(d => { setFlashcards(d); setFlashcardsLoading(false); })
      .catch(() => setFlashcardsLoading(false));

    // Fetch top products (using our fixed IVDTL endpoint)
    fetch(`${API_BASE}/api/tables/top-products${yearParam}`)
      .then(r => r.json())
      .then(d => { setApiTopProducts(d); })
      .catch(console.error);
  }, [selectedYear]);

  // STANDARD DATA - Using real database data if available
  const hasDbData = dashboardData && (dashboardData.total_sales !== undefined || dashboardData.daily_sales !== undefined);
  
  const standardSalesData = useMemo(() => {
    return hasDbData
      ? (dashboardData.daily_sales || []).map(item => ({
          month: item.month || item.name || 'Unknown',
          revenue: item.revenue || item.sales || 0
        }))
      : [
          { month: 'Jan', revenue: 12000 }, { month: 'Feb', revenue: 19000 }, { month: 'Mar', revenue: 15000 },
          { month: 'Apr', revenue: 22000 }, { month: 'May', revenue: 28000 }, { month: 'Jun', revenue: 24000 }
        ];
  }, [hasDbData, dashboardData?.daily_sales]);

  const topProductsSource = apiTopProducts || (hasDbData ? dashboardData.top_products : null);
  
  const topPerformers = useMemo(() => {
    return topProductsSource
      ? (topProductsSource || []).slice(0, 5).map((p, index) => ({
          id: index + 1,
          name: p.description || p.product_name || p.name || `Product ${index + 1}`,
          sold: p.qty || p.total_qty || p.total_quantity || p.sales || 0,
          price: p.avg_price || p.avg_unit_price || p.price || 0,
          revenue: p.revenue || p.total_revenue || p.total_sales || p.sales || 0
        }))
      : [
          { id: 1, name: 'Premium Arabica Coffee', sold: 1205, price: 37.34, revenue: 45000 },
          { id: 2, name: 'Instant Noodles 5-Pack', sold: 3400, price: 5.00, revenue: 17000 },
          { id: 3, name: 'Organic Green Tea', sold: 850, price: 15.00, revenue: 12750 },
          { id: 4, name: 'Energy Drink 500ml', sold: 2100, price: 5.00, revenue: 10500 },
          { id: 5, name: 'Dark Chocolate Bars', sold: 900, price: 10.00, revenue: 9000 },
        ];
  }, [topProductsSource]);

  const totalRevenue = flashcards?.total_revenue ?? (hasDbData ? (dashboardData.total_sales || 0) : (salesSummary?.total_sales || 120000));
  const totalInvoices = hasDbData ? (dashboardData.total_invoices || 0) : (salesSummary?.total_invoices || 1245);
  const avgOrderValue = totalInvoices > 0 ? (totalRevenue / totalInvoices) : (hasDbData ? 0 : 96.38);

  // PROFESSIONAL DATA
  const [revenueTargetMultiplier, setRevenueTargetMultiplier] = useState(1.15);
  const [costMultiplier, setCostMultiplier] = useState(0.65);
  
  const professionalSalesData = useMemo(() => {
    const targetMul = revenueTargetMultiplier === '' ? 1.0 : Number(revenueTargetMultiplier);
    const costMul = costMultiplier === '' ? 0.65 : Number(costMultiplier);
    return standardSalesData.map(item => {
      const rev = Number(item.revenue) || 0;
      return {
        ...item,
        target: rev * targetMul,
        cost: rev * costMul,
        profit: rev - (rev * costMul)
      };
    });
  }, [standardSalesData, revenueTargetMultiplier, costMultiplier]);

  const totalCurrentProfit = professionalSalesData.reduce((sum, item) => sum + item.profit, 0);
  const avgProfitMargin = ((totalCurrentProfit / totalRevenue) * 100) || 35;
  const targetGrowthPct = revenueTargetMultiplier === '' ? 0 : Math.round((revenueTargetMultiplier - 1) * 100);
  const targetGrowthMultiplierVal = revenueTargetMultiplier === '' ? 0 : (revenueTargetMultiplier - 1);

  // ENTERPRISE DATA
  const [demandSurge, setDemandSurge] = useState(15);
  const [supplyDelay, setSupplyDelay] = useState(5);

  const handleDemandSurgeChange = (valStr) => {
    if (valStr === '') {
      setDemandSurge('');
    } else {
      const parsed = parseInt(valStr, 10);
      if (!isNaN(parsed)) {
        setDemandSurge(Math.max(0, Math.min(100, parsed)));
      }
    }
  };

  const handleSupplyDelayChange = (valStr) => {
    if (valStr === '') {
      setSupplyDelay('');
    } else {
      const parsed = parseInt(valStr, 10);
      if (!isNaN(parsed)) {
        setSupplyDelay(Math.max(0, Math.min(100, parsed)));
      }
    }
  };
  
  const demandSurgeNum = demandSurge === '' ? 0 : Number(demandSurge);
  const supplyDelayNum = supplyDelay === '' ? 0 : Number(supplyDelay);
  
  const enterpriseRiskScore = Math.min(100, Math.max(0, (demandSurgeNum * 1.5) + (supplyDelayNum * 2)));
  const corporateHealth = Math.max(0, 100 - enterpriseRiskScore);
  
  const enterpriseForecastData = useMemo(() => {
    return standardSalesData.map((item) => {
      const baseRev = Number(item.revenue) || 0;
      const surgeMultiplier = 1 + (demandSurgeNum / 100);
      const delayImpact = Math.max(0.5, 1 - (supplyDelayNum * 0.015)); 
      const projectedRev = baseRev * surgeMultiplier * delayImpact;
      const fulfillmentCost = baseRev * 0.5 * (1 + (supplyDelayNum * 0.02)); 
      return {
        month: item.month,
        baseline: baseRev,
        projected: Math.round(projectedRev),
        fulfillmentCost: Math.round(fulfillmentCost),
        riskBuffer: Math.round(Math.max(0, projectedRev - fulfillmentCost))
      };
    });
  }, [standardSalesData, demandSurgeNum, supplyDelayNum]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px', borderRadius: '8px', color: '#f8fafc' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '3px 0', fontSize: '13px' }}>
              {entry.name}: RM {Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const flashcardDefs = useMemo(() => {
    const fc = flashcards;
    return [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: fc ? `RM ${(fc.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
        sub: `Avg RM ${totalInvoices > 0 ? (totalRevenue / totalInvoices).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} / invoice`,
        icon: DollarSign,
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.15)',
      },
      {
        id: 'customers',
        label: 'Total Customers',
        value: fc ? (fc.total_customers || 0).toLocaleString() : '—',
        sub: `${totalInvoices.toLocaleString()} total invoices`,
        icon: Users,
        color: '#8b5cf6',
        glow: 'rgba(139,92,246,0.15)',
      },
      {
        id: 'likely',
        label: 'Likely to Buy Again',
        value: fc ? (fc.likely_to_buy_again || 0).toLocaleString() : '—',
        sub: fc ? `Active since ${fc.recent_threshold || '—'}` : 'Loading...',
        icon: UserCheck,
        color: '#10b981',
        glow: 'rgba(16,185,129,0.15)',
        list: fc?.likely_list || [],
        modalTitle: 'Customers Likely to Buy Again',
        columns: ['Name', 'Last Purchase', 'Total Spent']
      },
      {
        id: 'winback',
        label: 'Win Back Customers',
        value: fc ? (fc.win_back_customers || 0).toLocaleString() : '—',
        sub: 'Inactive — need re-engagement',
        icon: RefreshCw,
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.15)',
        list: fc?.winback_list || [],
        modalTitle: 'Win Back Customers',
        columns: ['Name', 'Last Purchase', 'Total Spent']
      },
      {
        id: 'payment',
        label: 'Payment Follow Up',
        value: fc ? (fc.payment_followup || 0).toLocaleString() : '—',
        sub: 'Customers with credit terms',
        icon: CreditCard,
        color: '#ef4444',
        glow: 'rgba(239,68,68,0.15)',
        list: fc?.payment_list || [],
        modalTitle: 'Payment Follow Up',
        columns: ['Name', 'Credit Term', 'Total Outstanding']
      },
      {
        id: 'important',
        label: 'Important Customers',
        value: fc ? (fc.important_customers || 0).toLocaleString() : '—',
        sub: fc?.top_customer_name ? `Top: ${fc.top_customer_name.slice(0, 22)}…` : 'Top 20% by revenue',
        icon: Star,
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.15)',
        list: fc?.important_list || [],
        modalTitle: 'Important Customers',
        columns: ['Name', 'Total Spent']
      },
    ];
  }, [flashcards, totalInvoices, totalRevenue]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* ========================================== */}
      {/* STANDARD TIER (Basic Visibility) */}
      {/* ========================================== */}
      {(level === 'Standard' || level === 'Professional' || level === 'Enterprise') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>Sales Overview</h3>
            </div>
            <FeatureTooltip text="Overview of your historical revenue and top-selling products." />
          </div>

          {/* ---- 6 KPI Flashcards ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {flashcardDefs.map(card => (
              <div
                key={card.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${card.color}`,
                  background: card.glow,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: card.list ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={card.list ? () => setActiveModal(card.id) : undefined}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Subtle glow orb */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`, borderRadius: '50%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12.5px', color: '#e2e8f0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {card.label}
                  </div>
                  <div style={{ background: `${card.color}20`, padding: '6px', borderRadius: '8px', color: card.color }}>
                    <card.icon size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px', lineHeight: 1 }}>
                  {flashcardsLoading ? (
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400' }}>Loading…</span>
                  ) : card.value}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Basic Charts & Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#f8fafc', flexShrink: 0 }}>Monthly Sales Revenue</h4>
              <div style={{ flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={standardSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#f8fafc', flexShrink: 0 }}>Best Selling Products</h4>
              <div style={{ flex: 1, minHeight: '220px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '12px', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Rank</th>
                      <th style={{ padding: '8px' }}>Product</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Qty Sold</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#f8fafc' }}>
                        <td style={{ padding: '10px 8px', color: '#3b82f6', fontWeight: 'bold' }}>#{p.id}</td>
                        <td style={{ padding: '10px 8px' }}>{p.name}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{p.sold.toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>RM {Number(p.price).toFixed(2)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '500' }}>RM {Number(p.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PROFESSIONAL TIER (Diagnostic Analysis) */}
      {/* ========================================== */}
      {(level === 'Professional' || level === 'Enterprise') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <BarChart3 size={20} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>Profit & Cost Analysis</h3>
          </div>
          <div style={{ marginTop: '-10px', marginBottom: '5px' }}>
            <FeatureTooltip text="Adjust the sliders to see how changing your sales target and costs affect your profit." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
                <div style={{ fontSize: '15px', color: '#f8fafc', fontWeight: '600' }}>Sales vs Target & Costs</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#cbd5e1' }}>
                    <span>Set Target: </span>
                    <input 
                      type="number"
                      min="0"
                      max="50"
                      step="5"
                      value={revenueTargetMultiplier === '' ? '' : Math.round((revenueTargetMultiplier - 1) * 100)}
                      onChange={e => {
                        const valStr = e.target.value;
                        if (valStr === '') {
                          setRevenueTargetMultiplier('');
                        } else {
                          const parsed = parseInt(valStr, 10);
                          if (!isNaN(parsed)) {
                            setRevenueTargetMultiplier(1 + Math.max(0, Math.min(100, parsed)) / 100);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (revenueTargetMultiplier !== '') {
                          const val = Math.max(0, Math.min(50, Math.round((Number(revenueTargetMultiplier) - 1) * 100)));
                          setRevenueTargetMultiplier(1 + val / 100);
                        }
                      }}
                      className="minimal-number-input"
                      style={{ color: '#10b981' }}
                    />
                    <span>%</span>
                  </div>
                  <input 
                    type="range" min="1" max="1.5" step="0.05" 
                    value={revenueTargetMultiplier === '' ? 1.0 : revenueTargetMultiplier} 
                    onChange={e => setRevenueTargetMultiplier(parseFloat(e.target.value))}
                    style={{ width: '90px', accentColor: '#8b5cf6', cursor: 'pointer' }} 
                  />
                </div>
              </div>
              <div style={{ flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={professionalSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="left" type="monotone" dataKey="target" name="Target Goal" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                    <Area yAxisId="left" type="monotone" dataKey="cost" name="Running Cost" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <div style={{ fontSize: '15.5px', color: '#f8fafc', fontWeight: '600', marginBottom: '5px' }}>Profit Forecast</div>
                <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: '0 0 15px 0', lineHeight: '1.4' }}>How much profit you can expect based on current costs.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '14.5px', color: '#f8fafc' }}>Estimated Profit</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>RM {totalCurrentProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '14.5px', color: '#f8fafc' }}>Avg Profit Margin</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{avgProfitMargin.toFixed(1)}%</div>
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '8px' }}>Adjust Running Cost (%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#cbd5e1' }}>
                        <span>Cost: </span>
                        <input 
                          type="number"
                          min="40"
                          max="90"
                          step="5"
                          value={costMultiplier === '' ? '' : Math.round(costMultiplier * 100)}
                          onChange={e => {
                            const valStr = e.target.value;
                            if (valStr === '') {
                              setCostMultiplier('');
                            } else {
                              const parsed = parseInt(valStr, 10);
                              if (!isNaN(parsed)) {
                                setCostMultiplier(Math.max(0, Math.min(100, parsed)) / 100);
                              }
                            }
                          }}
                          onBlur={() => {
                            if (costMultiplier !== '') {
                              const val = Math.max(0.40, Math.min(0.90, Number(costMultiplier)));
                              setCostMultiplier(val);
                            }
                          }}
                          className="minimal-number-input"
                          style={{ color: '#ef4444' }}
                        />
                        <span>%</span>
                      </div>
                      <input 
                        type="range" min="0.4" max="0.9" step="0.05" 
                        value={costMultiplier === '' ? 0.65 : costMultiplier} 
                        onChange={e => setCostMultiplier(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: '#ef4444', cursor: 'pointer' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>Growth Projection</span>
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  Based on your {targetGrowthPct}% target growth, maintaining current margins will yield an additional <strong>RM {(totalCurrentProfit * targetGrowthMultiplierVal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in net profit by EOY.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ENTERPRISE TIER (Strategic Operational Study) */}
      {/* ========================================== */}
      {level === 'Enterprise' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <Zap size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>"What If" Business Simulator</h3>
          </div>
          <div style={{ marginTop: '-10px', marginBottom: '5px' }}>
            <FeatureTooltip text="Test what happens to your revenue if demand goes up or supply gets delayed. Drag the sliders to see the impact." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            {/* Control Panel (Left Column) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <Sliders size={18} color="#f59e0b" />
                  <div style={{ fontSize: '15.5px', color: '#f8fafc', fontWeight: '600' }}>Adjust Scenarios</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px' }}>
                      <span>If Demand Goes Up By</span>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 'bold', width: '105px', justifyContent: 'flex-end' }}>
                        <input 
                          type="number"
                          min="0"
                          max="50"
                          value={demandSurge}
                          onChange={(e) => handleDemandSurgeChange(e.target.value)}
                          onBlur={() => {
                            if (demandSurge !== '') {
                              setDemandSurge(Math.max(0, Math.min(50, Number(demandSurge))));
                            }
                          }}
                          className="minimal-number-input"
                          style={{ color: '#10b981' }}
                        />
                        <span style={{ width: '40px', paddingLeft: '4px', textAlign: 'left' }}>%</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="50" value={demandSurge === '' ? 0 : demandSurge} onChange={(e) => setDemandSurge(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }} />
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px' }}>
                      <span>If Supply Is Delayed By</span>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold', width: '105px', justifyContent: 'flex-end' }}>
                        <input 
                          type="number"
                          min="0"
                          max="30"
                          value={supplyDelay}
                          onChange={(e) => handleSupplyDelayChange(e.target.value)}
                          onBlur={() => {
                            if (supplyDelay !== '') {
                              setSupplyDelay(Math.max(0, Math.min(30, Number(supplyDelay))));
                            }
                          }}
                          className="minimal-number-input"
                          style={{ color: '#ef4444' }}
                        />
                        <span style={{ width: '40px', paddingLeft: '4px', textAlign: 'left' }}>Days</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="30" value={supplyDelay === '' ? 0 : supplyDelay} onChange={(e) => setSupplyDelay(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14.5px', color: '#cbd5e1' }}>Business Health Score</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: corporateHealth > 70 ? '#10b981' : corporateHealth > 40 ? '#f59e0b' : '#ef4444' }}>
                      {corporateHealth.toFixed(0)}/100
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${corporateHealth}%`, background: corporateHealth > 70 ? '#10b981' : corporateHealth > 40 ? '#f59e0b' : '#ef4444', transition: 'all 0.3s ease' }}></div>
                  </div>
                </div>
              </div>

              {/* Actionable Directive based on scenarios */}
              <div style={{ background: corporateHealth > 70 ? 'rgba(16, 185, 129, 0.1)' : corporateHealth > 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '12px', border: `1px solid ${corporateHealth > 70 ? 'rgba(16, 185, 129, 0.3)' : corporateHealth > 40 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Target size={16} color={corporateHealth > 70 ? '#10b981' : corporateHealth > 40 ? '#f59e0b' : '#ef4444'} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: corporateHealth > 70 ? '#10b981' : corporateHealth > 40 ? '#f59e0b' : '#ef4444' }}>AI Recommendation</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#f1f5f9', lineHeight: '1.6' }}>
                  {corporateHealth > 70 
                    ? "Your business is in a strong position. Supply can handle the demand increase. Good time to invest in marketing to grow further."
                    : corporateHealth > 40
                    ? `Warning: A ${supplyDelay}-day supply delay is cutting into your profits. Consider faster shipping options for your top products to handle the ${demandSurge}% demand increase.`
                    : "CRITICAL: Major supply problem detected. Pause any expansion and focus on clearing slow-moving stock to protect cash flow."}
                </div>
              </div>
            </div>

            {/* Main Visuals (Right Column) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', marginBottom: '15px', flexShrink: 0 }}>Revenue & Cost Forecast — What Could Happen?</div>
                <div style={{ flex: 1, minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={enterpriseForecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `RM ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="baseline" name="Current Revenue" fill="rgba(59, 130, 246, 0.4)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Line yAxisId="left" type="monotone" dataKey="projected" name="Expected Revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                      <Line yAxisId="left" type="monotone" dataKey="fulfillmentCost" name="Supply Cost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                      <Area yAxisId="left" type="monotone" dataKey="riskBuffer" name="Profit Margin" fill="rgba(34, 211, 238, 0.25)" stroke="#22d3ee" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FLASHCARD MODAL */}
      {/* ========================================== */}
      {activeModal && typeof document !== 'undefined' && (() => {
        const activeCard = flashcardDefs.find(c => c.id === activeModal);
        if (!activeCard || !activeCard.list) return null;
        return createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#0f172a', border: `1px solid ${activeCard.color}40`, boxShadow: `0 10px 40px ${activeCard.color}30`, borderRadius: '16px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: `${activeCard.color}20`, padding: '10px', borderRadius: '10px', color: activeCard.color }}>
                    <activeCard.icon size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>{activeCard.modalTitle}</h3>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{activeCard.list.length} customers found</div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                    <tr style={{ color: '#94a3b8', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '16px 24px' }}>Customer Name</th>
                      {activeCard.columns.slice(1).map(col => <th key={col} style={{ padding: '16px 24px', textAlign: col.includes('Spent') || col.includes('Outstanding') ? 'right' : 'left' }}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCard.list.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '14px', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: '500' }}>{item.name || item.code}</td>
                        {activeCard.id === 'likely' || activeCard.id === 'winback' ? (
                          <>
                            <td style={{ padding: '16px 24px', color: '#cbd5e1' }}>{item.last_purchase}</td>
                            <td style={{ padding: '16px 24px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>RM {item.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </>
                        ) : activeCard.id === 'payment' ? (
                          <>
                            <td style={{ padding: '16px 24px', color: '#cbd5e1' }}>{item.term}</td>
                            <td style={{ padding: '16px 24px', color: '#ef4444', textAlign: 'right', fontWeight: '600' }}>RM {item.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </>
                        ) : activeCard.id === 'important' ? (
                          <td style={{ padding: '16px 24px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>RM {item.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        ) : null}
                      </tr>
                    ))}
                    {activeCard.list.length === 0 && (
                      <tr><td colSpan={activeCard.columns.length} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No customers found for this criteria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Hide spinner controls on numeric inputs */
        .minimal-number-input::-webkit-outer-spin-button,
        .minimal-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .minimal-number-input {
          -moz-appearance: textfield;
          width: 55px;
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 6px !important;
          font-weight: bold;
          font-size: 13.5px;
          text-align: center;
          outline: none;
          padding: 4px 6px;
          margin: 0 4px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .minimal-number-input:focus {
          border-color: currentColor !important;
          box-shadow: 0 0 0 1px currentColor;
        }
      `}} />
    </div>
  );
};

export default BusinessAnalysisUI;
