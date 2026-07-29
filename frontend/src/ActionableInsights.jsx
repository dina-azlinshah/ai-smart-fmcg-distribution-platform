import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const ActionableInsights = ({ dashboardData, inventory, salesData }) => {
  // Generate smart insights based on data
  const generateInsights = () => {
    const insights = [];

    // 1. Low Stock Alerts
    const lowStockItems = inventory?.filter(i => i.low_stock) || [];
    if (lowStockItems.length > 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Low Stock Detected',
        message: `${lowStockItems.length} product${lowStockItems.length > 1 ? 's' : ''} running low. Consider reordering to avoid stockouts.`,
        action: 'Review Inventory',
        priority: 'high'
      });
    }

    // 2. Sales Trend Analysis
    const recentSales = salesData?.slice(-3) || [];
    if (recentSales.length >= 2) {
      const latest = recentSales[recentSales.length - 1]?.sales || 0;
      const previous = recentSales[recentSales.length - 2]?.sales || 0;
      const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

      if (change > 10) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Sales Growth Detected',
          message: `Sales increased by ${change.toFixed(1)}% compared to previous period. Great momentum!`,
          action: 'View Details',
          priority: 'medium'
        });
      } else if (change < -10) {
        insights.push({
          type: 'danger',
          icon: TrendingDown,
          title: 'Sales Decline Alert',
          message: `Sales dropped by ${Math.abs(change).toFixed(1)}%. Investigate potential causes.`,
          action: 'Analyze Trends',
          priority: 'high'
        });
      }
    }

    // 3. Top Product Performance
    const topProducts = dashboardData?.top_products || [];
    if (topProducts.length > 0) {
      const bestProduct = topProducts[0];
      insights.push({
        type: 'info',
        icon: Zap,
        title: 'Top Performer',
        message: `"${bestProduct.name}" is your best seller with ${(bestProduct.total_sales || 0).toLocaleString()} in revenue.`,
        action: 'View Product',
        priority: 'low'
      });
    }

    // 4. Order Volume Check
    const totalOrders = dashboardData?.total_invoices || 0;
    if (totalOrders > 0 && totalOrders < 20) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Growth Opportunity',
        message: 'Order volume is still growing. Consider marketing campaigns to boost sales.',
        action: 'Marketing Tips',
        priority: 'low'
      });
    }

    // 5. Revenue Milestone
    const totalRevenue = dashboardData?.total_sales || 0;
    if (totalRevenue > 100000) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Revenue Milestone Achieved',
        message: `Congratulations! You've surpassed RM ${Math.floor(totalRevenue / 100000) * 100000} in total revenue.`,
        action: 'View Report',
        priority: 'low'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <Lightbulb size={48} color="#6366f1" style={{ marginBottom: '12px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Insights Yet</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Upload more data to receive actionable business insights.
        </p>
      </div>
    );
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' };
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Lightbulb size={24} color="#f59e0b" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Actionable Insights</h3>
        <span style={{
          marginLeft: 'auto',
          padding: '4px 12px',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#a5b4fc',
          fontWeight: '600'
        }}>
          {insights.length} insight{insights.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, idx) => {
          const styles = getTypeStyles(insight.type);
          const Icon = insight.icon;
          
          return (
            <div
              key={idx}
              style={{
                padding: '16px',
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                padding: '8px',
                background: `${styles.color}15`,
                borderRadius: '8px',
                flexShrink: 0
              }}>
                <Icon size={20} color={styles.color} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                    {insight.title}
                  </h4>
                  {insight.priority === 'high' && (
                    <span style={{
                      padding: '2px 8px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#ef4444',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      Urgent
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {insight.message}
                </p>
                <button style={{
                  padding: '6px 12px',
                  background: `${styles.color}20`,
                  border: `1px solid ${styles.color}40`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: styles.color,
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `${styles.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = `${styles.color}20`;
                }}
                >
                  {insight.action} →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionableInsights;
