import React, { useState, useMemo } from 'react';
import {
  Warehouse, MapPin, Search, AlertTriangle, RefreshCw, BarChart3,
  Building2, Building, Package, Zap, CheckCircle2, TrendingUp, Truck, Activity, Brain, Sparkles, X, Share2, Printer, Check, Box, Users, UserCheck, AlertCircle, Download, Bell
} from 'lucide-react';
import './WarehouseMonitoringMerged.css';

const WarehouseMonitoringMerged = ({ locations = [], aggregatedInventory = [], branchSalesData = [] }) => {
  const [whSearch, setWhSearch] = useState('');
  const [transferFilter, setTransferFilter] = useState('All');
  const [popupContent, setPopupContent] = useState(null);
  const [showRoutingPopup, setShowRoutingPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inventoryTab, setInventoryTab] = useState('inventory');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // all, healthy, low, out

  const baseInventory = useMemo(() => {
    if (!aggregatedInventory) return [];
    if (inventoryTab === 'inventory') return aggregatedInventory.filter(i => i.stock_control === 'T');
    if (inventoryTab === 'non-inventory') return aggregatedInventory.filter(i => i.stock_control === 'F');
    if (inventoryTab === 'creditor') {
      const creditors = aggregatedInventory.filter(i => i.creditor_name || i.is_creditor);
      return creditors.length > 0 ? creditors : aggregatedInventory.filter(i => i.stock > 0);
    }
    if (inventoryTab === 'debtor') {
      const debtors = aggregatedInventory.filter(i => i.debtor_name || i.is_debtor);
      return debtors.length > 0 ? debtors : aggregatedInventory.filter(i => i.qty_sold_90_days > 0);
    }
    return aggregatedInventory;
  }, [aggregatedInventory, inventoryTab]);

  const searchedAndFilteredInventory = useMemo(() => {
    let result = baseInventory;
    if (inventorySearch) {
      result = result.filter(item => 
        (item.product_name || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (item.product_code || '').toLowerCase().includes(inventorySearch.toLowerCase())
      );
    }
    if (inventoryFilter === 'healthy') {
      result = result.filter(item => item.stock >= (item.minRequired || 10));
    } else if (inventoryFilter === 'low') {
      result = result.filter(item => item.stock >= 0 && item.stock < (item.minRequired || 10));
    } else if (inventoryFilter === 'out') {
      result = result.filter(item => item.stock === 0);
    }
    return result;
  }, [baseInventory, inventorySearch, inventoryFilter]);

  const totalItemsCount = baseInventory.length;
  const needsRestockCount = baseInventory.filter(i => i.stock < (i.minRequired || 10)).length;
  const healthyCount = totalItemsCount - needsRestockCount;

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, 'gi'));
    return <span>{parts.map((part, i) => part.toLowerCase() === query.toLowerCase() ? <mark key={i} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> : part)}</span>;
  };

  const closePopup = () => {
    setPopupContent(null);
    setShowRoutingPopup(false);
    setCopied(false);
  };

  const branches = useMemo(() => {
    return branchSalesData && branchSalesData.length > 0 ? branchSalesData.map(b => b.name || 'Unknown').slice(0, 6) : ['HQ', 'PUCHONG', 'TA', 'NUSA.B', 'SS14', 'STORE'];
  }, [branchSalesData]);

  const branchStats = useMemo(() => {
    return branches.map(bName => {
      const bInv = aggregatedInventory.filter(i => i.norm_warehouse === bName && i.stock_control === 'T');
      const bSales = branchSalesData ? (branchSalesData.find(s => s.name === bName)?.sales || 0) : 0;
      const totalVal = bInv.reduce((sum, item) => sum + (item.stock * (item.cost || 45.0)), 0);
      const criticalCount = bInv.filter(i => i.stock <= 1).length;
      const roi = totalVal > 0 ? ((bSales / totalVal) * 100) : 0;
      return { name: bName, revenue: bSales, inventoryValue: totalVal, criticalItems: criticalCount, roi };
    });
  }, [branches, aggregatedInventory, branchSalesData]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc =>
      !whSearch ||
      (loc.name && loc.name.toLowerCase().includes(whSearch.toLowerCase())) ||
      (loc.location && loc.location.toLowerCase().includes(whSearch.toLowerCase()))
    );
  }, [locations, whSearch]);

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
  };

  const dummyTransfers = [
    { id: 'TRF-1029', from: 'STORE', to: 'HQ', items: 'PANADOL 500MG (500)', status: 'In Transit', date: '2025-05-14', priority: 'High' },
    { id: 'TRF-1030', from: 'TA', to: 'PUCHONG', items: 'SURGICAL MASKS (2000)', status: 'Pending', date: '2025-05-15', priority: 'Medium' },
    { id: 'TRF-1028', from: 'HQ', to: 'SS14', items: 'VITAMIN C 1000MG (300)', status: 'Completed', date: '2025-05-12', priority: 'Low' }
  ];

  const filteredBranches = [
    { branch: 'HQ', stockValue: 'RM45,230', ship: '2', throughput: '1,200', sla: '98%', slaStatus: 'good', statusText: 'Good', statusColor: '#10b981' },
    { branch: 'PUCHONG', stockValue: 'RM12,400', ship: '1', throughput: '450', sla: '95%', slaStatus: 'good', statusText: 'Good', statusColor: '#10b981' },
    { branch: 'SS14', stockValue: 'RM8,900', ship: '3', throughput: '890', sla: '99%', slaStatus: 'good', statusText: 'Good', statusColor: '#10b981' },
    { branch: 'NUSA.B', stockValue: 'RM560', ship: '0', throughput: '50', sla: '88%', slaStatus: 'warning', statusText: 'Warning', statusColor: '#f59e0b' },
    { branch: 'TA', stockValue: 'RM5,720', ship: '1', throughput: '320', sla: '91%', slaStatus: 'warning', statusText: 'Warning', statusColor: '#f59e0b' },
    { branch: '3PL-NORTH', stockValue: 'RM28,500', ship: '5', throughput: '2,100', sla: '97%', slaStatus: 'good', statusText: 'Good', statusColor: '#10b981' }
  ];

  const pnlData = [
    { branch: 'HQ', rev: 'RM1,161,487', cost: 'RM558,614', profit: 'RM602,873', roi: '+108%', roiValue: 108, positive: true },
    { branch: '3PL-NORTH', rev: 'RM128,500', cost: 'RM72,000', profit: 'RM56,500', roi: '+78%', roiValue: 78, positive: true },
    { branch: 'SS14', rev: 'RM32,500', cost: 'RM96,435', profit: '-RM63,935', roi: '-66%', roiValue: 66, positive: false },
    { branch: 'PUCHONG', rev: 'RM45,200', cost: 'RM399,870', profit: '-RM354,670', roi: '+11%', roiValue: 11, positive: true },
    { branch: 'TA', rev: 'RM34,470', cost: 'RM821,357', profit: '-RM786,887', roi: '+4%', roiValue: 4, positive: true },
    { branch: 'NUSA.B', rev: 'RM5,000', cost: 'RM4,900', profit: 'RM100', roi: '+2%', roiValue: 2, positive: true }
  ];

  const logs = [
    { time: '14:23:01', message: 'Reallocating 500 units from HQ to SS14 based on predicted demand spike.', color: '#10b981' },
    { time: '13:45:22', message: '3PL-EAST SLA dropped below 90%. Initiating automated vendor review protocol.', color: '#ef4444' },
    { time: '11:12:05', message: 'Order #INV-12345 routed to SS14 (Cost saving: RM15.20).', color: '#60a5fa' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Warehouse color="#3b82f6" /> Warehouse Monitoring (Merged: Std + Prof + Ent)
        </h2>
      </div>

      {/* --- ENTERPRISE HEADER --- */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,1) 100%)', padding: '30px 40px', marginBottom: '24px' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Mydin Group</div>
          <h2 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px', margin: 0, color: '#f59e0b', fontWeight: '800' }}>
            <Building2 size={32} /> ENTERPRISE CONTROL TOWER
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Total Network Value</div>
            <div style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '700' }}>RM 101,610</div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Avg SLA</div>
            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '700' }}>94.6%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#60a5fa' }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Total Branches</div>
            <div style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700' }}>6 + 1 (3PL)</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Total Stock</div>
            <div style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700' }}>RM 101,310</div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Avg SLA</div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: '700' }}>94.7%</div>
          </div>
        </div>
      </div>

      {/* --- SMART INVENTORY ALERTS & PRODUCT TRACKING --- */}
      <div style={{ animation: 'fadeIn 0.5s ease-out', marginBottom: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '14px', color: '#60a5fa' }}>
              <Bell size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Smart Inventory Alerts</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Never run out of your best-selling items. Intelligent stock tracking triggers alerts based on real-time data.</p>
            </div>
          </div>
        </div>

        {/* View Toggle / Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setInventoryTab('inventory')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
              background: inventoryTab === 'inventory' ? '#06b6d4' : 'rgba(15, 23, 42, 0.6)',
              color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
              boxShadow: inventoryTab === 'inventory' ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s', opacity: inventoryTab === 'inventory' ? 1 : 0.7
            }}
          >
            <Package size={18} /> Inventory Products
          </button>
          <button
            onClick={() => setInventoryTab('non-inventory')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
              background: inventoryTab === 'non-inventory' ? '#f43f5e' : 'rgba(15, 23, 42, 0.6)',
              color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
              boxShadow: inventoryTab === 'non-inventory' ? '0 0 20px rgba(244, 63, 94, 0.4)' : 'none',
              transition: 'all 0.2s', opacity: inventoryTab === 'non-inventory' ? 1 : 0.7
            }}
          >
            <Box size={18} /> Non-Inventory Items
          </button>
          <button
            onClick={() => setInventoryTab('creditor')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
              background: inventoryTab === 'creditor' ? '#f59e0b' : 'rgba(15, 23, 42, 0.6)',
              color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
              boxShadow: inventoryTab === 'creditor' ? '0 0 20px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s', opacity: inventoryTab === 'creditor' ? 1 : 0.7
            }}
          >
            <Users size={18} /> Creditor Products
          </button>
          <button
            onClick={() => setInventoryTab('debtor')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
              background: inventoryTab === 'debtor' ? '#10b981' : 'rgba(15, 23, 42, 0.6)',
              color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
              boxShadow: inventoryTab === 'debtor' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s', opacity: inventoryTab === 'debtor' ? 1 : 0.7
            }}
          >
            <UserCheck size={18} /> Debtor Products
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div 
            onClick={() => setInventoryFilter('healthy')}
            style={{ cursor: 'pointer', background: 'rgba(16, 185, 129, 0.08)', border: inventoryFilter === 'healthy' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><CheckCircle2 size={80} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <CheckCircle2 size={16} /> Healthy Stock
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#10b981' }}>{healthyCount}</div>
          </div>

          <div 
            onClick={() => setInventoryFilter('low')}
            style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.08)', border: inventoryFilter === 'low' ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><AlertCircle size={80} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <AlertTriangle size={16} /> Needs Restock
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#ef4444' }}>{needsRestockCount}</div>
          </div>

          <div 
            onClick={() => setInventoryFilter('all')}
            style={{ cursor: 'pointer', background: 'rgba(139, 92, 246, 0.08)', border: inventoryFilter === 'all' ? '2px solid #a78bfa' : '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
          >
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><Package size={80} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <Package size={16} /> Total Products
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#a78bfa' }}>{totalItemsCount}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search products by name or item code..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              style={{ width: '100%', padding: '14px 20px 14px 48px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f1f5f9', outline: 'none', fontSize: '15px' }}
            />
          </div>
          <select
            value={inventoryFilter}
            onChange={(e) => setInventoryFilter(e.target.value)}
            style={{ padding: '14px 20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f1f5f9', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Products</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Insufficient Only</option>
            <option value="out">Out of Stock</option>
          </select>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Download size={20} /> Export to CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Product</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Branch</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Current Stock</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Min. Required</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Last Tx Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Terjual 90 Hari</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Purata Harian</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchedAndFilteredInventory.map((item, index) => {
                  const minReq = item.minRequired || 10;
                  const stockQty = item.stock || 0;
                  const isInsufficient = stockQty < minReq;

                  return (
                    <tr key={item.inventory_id || item.product_code || index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' }}>{item.product_name}</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Item Code: {item.product_code}</div>
                        {inventoryTab === 'creditor' && item.creditor_name && <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px' }}>Creditor: {item.creditor_name}</div>}
                        {inventoryTab === 'debtor' && item.debtor_name && <div style={{ color: '#10b981', fontSize: '11px', marginTop: '4px' }}>Debtor: {item.debtor_name}</div>}
                      </td>
                      <td style={{ padding: '20px 24px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {item.warehouse_name || item.norm_warehouse || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', color: isInsufficient ? '#ef4444' : '#f1f5f9', fontWeight: '700', minWidth: '60px' }}>
                          {stockQty}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', color: '#94a3b8', fontWeight: '600', minWidth: '60px' }}>
                          {minReq}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center', color: '#e2e8f0', fontSize: '13px' }}>
                        {item.last_purchase_date || item.last_sale_date || 'N/A'}
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center', color: '#60a5fa', fontWeight: '700', fontSize: '14px' }}>
                        {item.qty_sold_90_days || 0}
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center', color: '#a78bfa', fontWeight: '700', fontSize: '14px' }}>
                        {item.avg_sold_per_day || 0}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isInsufficient ? '#ef4444' : '#10b981', fontSize: '13px', fontWeight: '600' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isInsufficient ? '#ef4444' : '#10b981' }}></div>
                          {isInsufficient ? 'Insufficient' : 'Healthy'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {searchedAndFilteredInventory.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Package size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                <p>No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- STANDARD/PROFESSIONAL WAREHOUSE CAPACITY --- */}
      <h3 style={{ color: '#f8fafc', marginBottom: '16px' }}>Warehouse Capacities</h3>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748b' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search warehouse by name or location..."
            value={whSearch}
            onChange={(e) => setWhSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {filteredLocations.length > 0 ? filteredLocations.map(wh => {
          const whItems = aggregatedInventory.filter(i => i.norm_warehouse === wh.name && i.stock_control === 'T');
          const totalProducts = whItems.length;
          const totalInventoryValue = whItems.reduce((sum, item) => sum + (item.stock * (item.cost || 45.0)), 0);

          return (
            <div key={wh.id} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }} className="hover-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {highlightText(wh.name, whSearch)}
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '13px' }}>
                    <MapPin size={14} /> {highlightText(wh.location || wh.address || 'Unknown', whSearch)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Used</span>
                  <span style={{ color: wh.efficiency > 85 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {wh.stock.toLocaleString()} / {wh.capacity.toLocaleString()} ({wh.efficiency}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, wh.efficiency)}%`, height: '100%', background: wh.efficiency > 85 ? '#ef4444' : wh.efficiency > 60 ? '#f59e0b' : '#10b981', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '5px', textTransform: 'uppercase' }}>Products Count</div>
                  <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600' }}>{totalProducts}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '5px', textTransform: 'uppercase' }}>Est. Value (RM)</div>
                  <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '600' }}>{totalInventoryValue > 0 ? (totalInventoryValue / 1000).toFixed(1) + 'k' : 'N/A'}</div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>
            No warehouses found matching your search.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* NETWORK THROUGHPUT (Enterprise) */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} className="hover-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                <Warehouse size={18} color="#f59e0b" /> NETWORK THROUGHPUT & SLA
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '15px 24px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Branch</th>
                    <th style={{ padding: '15px 24px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Stock Value</th>
                    <th style={{ padding: '15px 24px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Today Ship (Inv)</th>
                    <th style={{ padding: '15px 24px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}><span className="has-tooltip" data-tooltip="Items processed per hour">Throughput/hr</span></th>
                    <th style={{ padding: '15px 24px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}><span className="has-tooltip" data-tooltip="Orders fulfilled on time">SLA Hit</span></th>
                    <th style={{ padding: '15px 24px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map((b, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < filteredBranches.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px', color: '#f8fafc', fontWeight: '600' }}>{b.branch}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', color: '#cbd5e1' }}>{b.stockValue}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' }}>{b.ship}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', color: '#cbd5e1' }}>{b.throughput}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          background: b.slaStatus === 'good' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: b.slaStatus === 'good' ? '#10b981' : '#f59e0b',
                          padding: '4px 10px', borderRadius: '6px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          {b.slaStatus === 'good' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {b.sla}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{ color: b.statusColor, fontWeight: '700' }}>
                          {b.statusText === 'Good' ? '🟢' : '🟡'} {b.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Location Comparison (Professional) */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} className="hover-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                <BarChart3 size={18} /> LOCATION COMPARISON (REV VS CAP)
              </h3>
            </div>
            <div style={{ padding: '30px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
              <div>
                <h4 style={{ color: '#94a3b8', fontSize: '12px', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue vs Capital Locked (RM)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {branchStats.sort((a, b) => b.revenue - a.revenue).map(kpi => {
                    const maxAny = Math.max(Math.max(...branchStats.map(b => b.revenue), 1), Math.max(...branchStats.map(b => b.inventoryValue), 1));
                    const revPercent = (kpi.revenue / maxAny) * 100;
                    const capPercent = (kpi.inventoryValue / maxAny) * 100;
                    const isLowRoi = kpi.inventoryValue > 0 && kpi.roi < 20;

                    return (
                      <div key={kpi.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ width: '80px', color: '#f8fafc', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>{kpi.name}</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ height: '14px', width: `${revPercent}%`, background: '#3b82f6', borderRadius: '4px', minWidth: '2px' }}></div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{kpi.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} (Rev)</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ height: '14px', width: `${capPercent}%`, background: '#8b5cf6', borderRadius: '4px', minWidth: '2px' }}></div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {kpi.inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} (Cap)
                              {isLowRoi && <span style={{ marginLeft: '6px' }}>⚠️ Low ROI</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '40px' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '12px', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '1px' }}>ROI by Location</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {branchStats.sort((a, b) => b.roi - a.roi).filter(b => b.inventoryValue > 0 || b.revenue > 0).map(kpi => {
                    const maxRoi = Math.max(...branchStats.map(b => b.roi), 1);
                    const color = kpi.roi > 100 ? '#10b981' : kpi.roi > 20 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={kpi.name} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '60px', color: '#f8fafc', fontSize: '13px', fontWeight: '700' }}>{kpi.name}</div>
                        <div style={{ flex: 1, height: '18px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (kpi.roi / maxRoi) * 100)}%`, background: color, borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ width: '70px', color: color, fontSize: '13px', fontWeight: 'bold', textAlign: 'right' }}>
                          {kpi.roi.toFixed(1)}% {kpi.roi > 100 ? '✅' : kpi.roi > 20 ? '⚠️' : '🔴'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CROSS-LOCATION TRANSFERS (Professional) */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} className="hover-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                  <RefreshCw size={18} color="#3b82f6" /> CROSS-LOCATION TRANSFERS
                </h3>
                <select value={transferFilter} onChange={(e) => setTransferFilter(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '13px' }}>
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <button
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                onClick={() => setPopupContent({ title: 'New Transfer', message: 'Initialize a new cross-location transfer workflow...', icon: 'transfer' })}
              >
                + New Transfer
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Ref No.</th>
                    <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>From &rarr; To</th>
                    <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Items</th>
                    <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Est. Date</th>
                    <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyTransfers.filter(t => transferFilter === 'All' || t.status === transferFilter).map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 24px', color: '#f8fafc', fontWeight: '600' }}>{t.id}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>{t.from}</span>
                          <span style={{ color: '#94a3b8' }}>&rarr;</span>
                          <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>{t.to}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#cbd5e1', fontSize: '13px' }}>{t.items}</td>
                      <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px' }}>{t.date}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{ background: t.status === 'Completed' ? 'rgba(16,185,129,0.1)' : t.status === 'In Transit' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: t.status === 'Completed' ? '#10b981' : t.status === 'In Transit' ? '#60a5fa' : '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right side AI & 3PL (Enterprise) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* AI Distribution Logic */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.3)' }} className="hover-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                <Brain size={18} /> AI DISTRIBUTION LOGIC
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '5px' }}>Incoming Order</div>
                <strong style={{ color: '#f8fafc', fontSize: '15px', display: 'block' }}>#INV-12345 (FAMARSI SEJATI)</strong>
                <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '4px' }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Sitiawan, Perak</div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '20px', borderRadius: '12px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: '700', marginBottom: '15px', fontSize: '16px' }}>
                  <CheckCircle2 size={20} /> RECOMMENDED: WAREHOUSE SS14
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#e2e8f0', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Distance</span>
                    <span style={{ fontWeight: '600' }}>85km <span style={{ color: '#10b981', fontSize: '11px', marginLeft: '4px' }}>(vs HQ: 120km)</span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Available Stock</span>
                    <span style={{ fontWeight: '600' }}>890 units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Est. Delivery</span>
                    <span style={{ fontWeight: '600' }}>Today, 5:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Total Cost Savings</span>
                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '15px' }}>RM 15.20</span>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.4)', marginTop: '5px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ color: '#c084fc', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                      <Sparkles size={14} /> Why this recommendation?
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '12px', lineHeight: '1.4' }}>Closest to delivery location with sufficient stock and lowest shipping cost.</span>
                  </div>
                </div>
              </div>

              <button
                style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: '600', marginTop: '20px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                onClick={() => setShowRoutingPopup(true)}
              >
                Approve Routing
              </button>
            </div>
          </div>

          {/* 3PL Performance */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} className="hover-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                <Truck size={18} color="#3b82f6" /> 🏭 3PL PERFORMANCE
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#94a3b8' }}>Vendor</th>
                    <th style={{ padding: '12px 24px', textAlign: 'center', color: '#94a3b8' }}>On-time</th>
                    <th style={{ padding: '12px 24px', textAlign: 'center', color: '#94a3b8' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 24px', color: '#f8fafc', fontWeight: '600' }}>3PL - NORTH</td>
                    <td style={{ padding: '12px 24px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>97%</td>
                    <td style={{ padding: '12px 24px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>🟢 Good</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 24px', color: '#f8fafc', fontWeight: '600' }}>3PL - EAST</td>
                    <td style={{ padding: '12px 24px', textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>89%</td>
                    <td style={{ padding: '12px 24px', textAlign: 'center', color: '#ef4444', fontWeight: '700' }}>🔴 Review</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Logs */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} className="hover-card">
            <div style={{ padding: '15px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                <Activity size={16} color="#60a5fa" /> 🤖 AI LOGS
              </h3>
            </div>
            <div style={{ padding: '15px 24px', fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: idx < logs.length - 1 ? '8px' : '0' }}>
                  <span style={{ color: '#60a5fa' }}>[{log.time}]</span>
                  <span style={{ color: log.color }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* POPUPS MODALS */}
      {popupContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {popupContent.icon === 'transfer' ? <RefreshCw color="#3b82f6" /> : <Activity color="#f59e0b" />}
                {popupContent.title}
              </h3>
              <button onClick={closePopup} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#cbd5e1', lineHeight: '1.5', marginBottom: '25px' }}>{popupContent.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closePopup} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>Cancel</button>
              <button onClick={closePopup} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showRoutingPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '30px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ background: 'rgba(16,185,129,0.2)', padding: '20px', borderRadius: '50%', color: '#10b981', marginBottom: '15px' }}>
                <CheckCircle2 size={40} />
              </div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '22px' }}>Routing Approved</h3>
              <p style={{ color: '#94a3b8', marginTop: '10px' }}>Order <strong>#INV-12345</strong> will be fulfilled by <strong>SS14 warehouse</strong>.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setCopied(true)}>
                {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
                {copied ? 'Copied Link' : 'Share Order'}
              </button>
              <button style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Printer size={16} /> Print Waybill
              </button>
            </div>
            <button onClick={closePopup} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', marginTop: '15px', fontWeight: '600' }}>
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default WarehouseMonitoringMerged;
