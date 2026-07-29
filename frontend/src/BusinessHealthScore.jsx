import React from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const BusinessHealthScore = ({ dashboardData, inventory, salesData }) => {
  // Calculate health score based on multiple factors
  const calculateHealthScore = () => {
    let score = 0;
    let maxScore = 100;
    let factors = [];

    // 1. Revenue Trend (25 points)
    const recentSales = salesData?.slice(-7) || [];
    if (recentSales.length > 0) {
      const avgRecent = recentSales.reduce((sum, d) => sum + (d.sales || 0), 0) / recentSales.length;
      const olderSales = salesData?.slice(-14, -7) || [];
      const avgOlder = olderSales.length > 0 ? olderSales.reduce((sum, d) => sum + (d.sales || 0), 0) / olderSales.length : avgRecent;
      
      if (avgRecent > avgOlder) {
        score += 25;
        factors.push({ name: 'Revenue Trend', status: 'positive', text: 'Growing' });
      } else if (avgRecent === avgOlder) {
        score += 15;
        factors.push({ name: 'Revenue Trend', status: 'neutral', text: 'Stable' });
      } else {
        score += 5;
        factors.push({ name: 'Revenue Trend', status: 'negative', text: 'Declining' });
      }
    }

    // 2. Inventory Health (25 points)
    const totalItems = inventory?.length || 0;
    const lowStockItems = inventory?.filter(i => i.low_stock).length || 0;
    const stockHealth = totalItems > 0 ? ((totalItems - lowStockItems) / totalItems) * 100 : 50;
    
    if (stockHealth >= 80) {
      score += 25;
      factors.push({ name: 'Inventory', status: 'positive', text: `${Math.round(stockHealth)}% healthy` });
    } else if (stockHealth >= 60) {
      score += 15;
      factors.push({ name: 'Inventory', status: 'neutral', text: `${Math.round(stockHealth)}% healthy` });
    } else {
      score += 5;
      factors.push({ name: 'Inventory', status: 'negative', text: `${Math.round(stockHealth)}% healthy` });
    }

    // 3. Order Volume (25 points)
    const totalOrders = dashboardData?.total_invoices || 0;
    if (totalOrders > 100) {
      score += 25;
      factors.push({ name: 'Order Volume', status: 'positive', text: 'High' });
    } else if (totalOrders > 50) {
      score += 18;
      factors.push({ name: 'Order Volume', status: 'neutral', text: 'Moderate' });
    } else if (totalOrders > 10) {
      score += 10;
      factors.push({ name: 'Order Volume', status: 'neutral', text: 'Low' });
    } else {
      score += 5;
      factors.push({ name: 'Order Volume', status: 'negative', text: 'Very Low' });
    }

    // 4. Product Diversity (25 points)
    const productCount = dashboardData?.top_products?.length || 0;
    if (productCount >= 5) {
      score += 25;
      factors.push({ name: 'Product Range', status: 'positive', text: 'Diverse' });
    } else if (productCount >= 3) {
      score += 15;
      factors.push({ name: 'Product Range', status: 'neutral', text: 'Moderate' });
    } else {
      score += 8;
      factors.push({ name: 'Product Range', status: 'negative', text: 'Limited' });
    }

    return { score: Math.min(score, maxScore), factors };
  };

  const { score, factors } = calculateHealthScore();

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Your business is performing well across all metrics!';
    if (score >= 60) return 'Good performance with room for improvement.';
    if (score >= 40) return 'Several areas need attention to optimize performance.';
    return 'Critical issues detected - immediate action recommended.';
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: `1px solid ${getScoreColor(score)}30`,
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Activity size={24} color={getScoreColor(score)} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Business Health Score</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
        {/* Score Circle */}
        <div style={{ position: 'relative', width: '140px', height: '140px' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke={getScoreColor(score)}
              strokeWidth="10"
              strokeDasharray={`${(score / 100) * 377} 377`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: getScoreColor(score) }}>
              {score}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>out of 100</div>
          </div>
        </div>

        {/* Score Details */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'inline-block',
              padding: '6px 16px',
              background: `${getScoreColor(score)}15`,
              border: `1px solid ${getScoreColor(score)}30`,
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: getScoreColor(score),
              marginBottom: '8px'
            }}>
              {getScoreLabel(score)}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>
              {getScoreMessage(score)}
            </p>
          </div>

          {/* Factor Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {factors.map((factor, idx) => (
              <div key={idx} style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {factor.status === 'positive' ? (
                    <CheckCircle size={14} color="#10b981" />
                  ) : factor.status === 'negative' ? (
                    <AlertTriangle size={14} color="#ef4444" />
                  ) : (
                    <Activity size={14} color="#f59e0b" />
                  )}
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{factor.name}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  {factor.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHealthScore;
