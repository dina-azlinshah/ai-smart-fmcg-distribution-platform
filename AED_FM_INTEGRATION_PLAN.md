# AED_FM Integration Plan

## Changes Needed for All Packages:

### 1. **Remove Upload Features:**
- Remove `uploadSuccess`, `isUploading`, `uploadError` states
- Remove `handleFileUpload()` and `handleLinkAED()` functions
- Remove 'Data' tab from tabs array
- Change default `activeTab` from 'data' to 'dashboard'
- Remove upload UI from features page

### 2. **Add AED_FM Auto-Fetch:**
```javascript
useEffect(() => {
  const fetchAEDData = async () => {
    setLoading(true);
    try {
      const [kpiRes, monthlyRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/kpi/summary`),
        fetch(`${API_BASE}/charts/monthly-sales-12m`),
        fetch(`${API_BASE}/charts/top-products`)
      ]);

      const kpiData = await kpiRes.json();
      const monthlyData = await monthlyRes.json();
      const productsData = await productsRes.json();

      setDashboardData({
        total_sales: kpiData.total_revenue || 0,
        total_invoices: kpiData.total_invoices || 0,
        top_products: Array.isArray(productsData) ? productsData.slice(0, 10) : [],
        daily_sales: Array.isArray(monthlyData) ? monthlyData : []
      });
    } catch (error) {
      console.error('Error fetching AED_FM data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchAEDData();
}, []);
```

### 3. **API Endpoints (from DemoFeatures.jsx):**
- `/api/kpi/summary` - Total revenue & invoices
- `/api/charts/monthly-sales-12m` - Monthly sales trend
- `/api/charts/top-products` - Top products by revenue
- `/api/charts/top-customers` - Top customers
- `/api/charts/yoy-growth` - Year-over-year growth
- `/api/charts/sales-by-day` - Sales by day of week
- `/api/charts/sales-by-location` - Revenue by location

### 4. **Files to Update:**
- StandardPackageFeatures.jsx
- ProfessionalPackageFeatures.jsx
- EnterprisePackageFeatures.jsx

### 5. **Remove Conditional Rendering:**
Remove all `{uploadSuccess && (...)}` checks - data always loads from AED_FM
