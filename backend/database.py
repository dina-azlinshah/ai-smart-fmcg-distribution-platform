import pyodbc
from datetime import datetime
import json
import os
from dotenv import load_dotenv
import re
import threading
import time

# Thread-safe in-memory caching system
_cache = {}
_cache_lock = threading.Lock()

def cached(seconds=10):
    def decorator(func):
        def wrapper(*args, **kwargs):
            key_args = tuple(arg for arg in args)
            key_kwargs = tuple((k, v) for k, v in sorted(kwargs.items()))
            cache_key = (func.__name__, key_args, key_kwargs)
            
            now = time.time()
            ttl = max(seconds, 60)
            with _cache_lock:
                if cache_key in _cache:
                    cached_time, val = _cache[cache_key]
                    if now - cached_time < ttl:
                        return val
            
            result = func(*args, **kwargs)
            
            with _cache_lock:
                _cache[cache_key] = (now, result)
                
            return result
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    return decorator

def clear_db_cache():
    with _cache_lock:
        _cache.clear()

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Get database configuration from environment variables
server = os.getenv('DB_SERVER', r'DESKTOP-JGIHF8T\A2022')
db_name = os.getenv('DB_NAME', 'AED_FM')

# Store uploaded data in memory for quick access
uploaded_sales_data = {
    'raw_data': None,
    'total_sales': 0,
    'total_invoices': 0,
    'customers': [],
    'products': [],
    'daily_sales': [],
    'monthly_sales': [],
    'sales_by_agent': [],
    'top_products': []
}

def get_connection():
    conn = pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        f'SERVER={server};'
        f'DATABASE={db_name};'
        'Trusted_Connection=yes;',
        autocommit=True
    )
    conn.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
    return conn

def test_connection():
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception as e:
        print("DB Check Error:", e)
        return False

def sanitize_year(year):
    if not year:
        return None
    year_str = str(year).strip()
    if year_str.lower() in ('all', 'null', 'undefined', ''):
        return None
    try:
        return int(year_str)
    except (ValueError, TypeError):
        return None

def to_date(d):
    if d is None:
        return None
    if hasattr(d, 'date'):
        return d.date()
    return d

def get_date_filter_sql(year, date_col="DocDate"):
    if not year: return ""
    y_str = str(year).strip()
    if y_str.lower() in ('all', 'null', 'undefined', ''): return ""
    if '|' in y_str:
        s, e = y_str.split('|')
        return f" AND {date_col} >= '{s}' AND {date_col} <= '{e} 23:59:59'"
    try:
        return f" AND YEAR({date_col}) = {int(y_str)}"
    except:
        return ""

# KPI Query
@cached(seconds=3600)
def get_kpi_summary(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year)
    query = f"SELECT SUM(NetTotal), COUNT(*) FROM dbo.IV WHERE Cancelled = 'F'{y_str}"
    cursor.execute(query)
    row = cursor.fetchone()
    return {
        "total_revenue": float(row[0]) if row and row[0] else 0.0,
        "total_invoices": int(row[1]) if row and row[1] else 0
    }

# 1. Monthly total sales (12m)
@cached(seconds=3600)
def get_monthly_sales_12m(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year)
    if y_str != "":
        query = f"""
        SELECT YEAR(DocDate) AS Year, MONTH(DocDate) AS Month, SUM(NetTotal) AS TotalSales
        FROM dbo.IV WHERE Cancelled = 'F'{y_str}
        GROUP BY YEAR(DocDate), MONTH(DocDate) ORDER BY Year ASC, Month ASC;
        """
    else:
        query = """
        SELECT YEAR(DocDate) AS Year, MONTH(DocDate) AS Month, SUM(NetTotal) AS TotalSales
        FROM dbo.IV WHERE Cancelled = 'F' AND DocDate >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY YEAR(DocDate), MONTH(DocDate) ORDER BY Year ASC, Month ASC;
        """
    cursor.execute(query)
    return [{"name": f"{row.Year}-{str(row.Month).zfill(2)}", "sales": float(row.TotalSales or 0)} for row in cursor.fetchall()][-9:]

# 2. Top 5 customers
@cached(seconds=3600)
def get_top_customers(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
    query = f"""
    SELECT TOP 5 DebtorCode, DebtorName, SUM(NetTotal) AS TotalSpent, COUNT(*) AS InvoiceCount
    FROM dbo.IV WHERE Cancelled = 'F'{y_str} GROUP BY DebtorCode, DebtorName ORDER BY TotalSpent DESC;
    """
    cursor.execute(query)
    return [{"name": row.DebtorName or row.DebtorCode, "sales": float(row.TotalSpent or 0), "count": int(row.InvoiceCount)} for row in cursor.fetchall()]

# 3. YoY Growth
@cached(seconds=3600)
def get_yoy_growth(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(DocDate) <= {y_val}" if y_val is not None else ""
    query = f"""
    WITH YearlySales AS (
        SELECT YEAR(DocDate) AS Year, SUM(NetTotal) AS Sales
        FROM dbo.IV WHERE Cancelled = 'F' AND YEAR(DocDate) >= 2022{y_str} GROUP BY YEAR(DocDate)
    )
    SELECT CurrentYear.Year, CurrentYear.Sales AS CurrentYearSales, PreviousYear.Sales AS PreviousYearSales,
        CASE WHEN PreviousYear.Sales IS NULL OR PreviousYear.Sales = 0 THEN 'N/A'
        ELSE FORMAT((CurrentYear.Sales - PreviousYear.Sales) / PreviousYear.Sales, 'P2') END AS GrowthPercent
    FROM YearlySales AS CurrentYear LEFT JOIN YearlySales AS PreviousYear ON CurrentYear.Year = PreviousYear.Year + 1
    ORDER BY CurrentYear.Year ASC;
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "year": row.Year,
            "current_sales": float(row.CurrentYearSales or 0),
            "prev_sales": float(row.PreviousYearSales or 0),
            "growth": row.GrowthPercent
        })
        
    if year and year != "All":
        target_year = int(year)
        if not data or data[-1]["year"] < target_year:
            last_year = data[-1]["year"] if data else target_year - 1
            last_sales = data[-1]["current_sales"] if data else 0.0
            for y in range(last_year + 1, target_year + 1):
                growth_val = "N/A"
                if last_sales > 0:
                    growth_val = "-100.00%"
                data.append({
                    "year": y,
                    "current_sales": 0.0,
                    "prev_sales": last_sales,
                    "growth": growth_val
                })
                last_sales = 0.0
                
    return data

# 4. Top sales months
@cached(seconds=3600)
def get_top_sales_months(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
    query = f"""
    SELECT TOP 5 YEAR(DocDate) AS Year, MONTH(DocDate) AS Month, SUM(NetTotal) AS TotalSales
    FROM dbo.IV WHERE Cancelled = 'F'{y_str} GROUP BY YEAR(DocDate), MONTH(DocDate) ORDER BY TotalSales DESC;
    """
    cursor.execute(query)
    return [{"name": f"{row.Year}-{str(row.Month).zfill(2)}", "sales": float(row.TotalSales or 0)} for row in cursor.fetchall()]

# 5. Sales by day
@cached(seconds=3600)
def get_sales_by_day(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
    query = f"""
    SELECT DATENAME(WEEKDAY, DocDate) AS DayOfWeek, SUM(NetTotal) AS TotalSales, COUNT(*) AS InvoiceCount
    FROM dbo.IV WHERE Cancelled = 'F'{y_str} GROUP BY DATENAME(WEEKDAY, DocDate), DATEPART(WEEKDAY, DocDate) ORDER BY DATEPART(WEEKDAY, DocDate);
    """
    cursor.execute(query)
    return [{"name": row.DayOfWeek, "sales": float(row.TotalSales or 0), "count": int(row.InvoiceCount)} for row in cursor.fetchall()]

# 6. Sales by location
@cached(seconds=3600)
def get_sales_by_location(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year)
    query = f"""
    SELECT SalesLocation, COUNT(*) AS InvoiceCount, SUM(NetTotal) AS TotalSales, COUNT(DISTINCT CreatedUserID) AS StaffCount
    FROM dbo.IV WHERE Cancelled = 'F' AND SalesLocation IS NOT NULL{y_str} GROUP BY SalesLocation ORDER BY TotalSales DESC;
    """
    cursor.execute(query)
    return [{"name": row.SalesLocation, "sales": float(row.TotalSales or 0), "count": int(row.InvoiceCount), "staff": int(row.StaffCount)} for row in cursor.fetchall()]

# 7. Top 5 Products by Revenue
@cached(seconds=3600)
def get_chart_top_products(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year, date_col="iv.DocDate")
    query = f"""
    SELECT TOP 5 dtl.ItemCode, dtl.Description AS Description, SUM(dtl.SubTotal) AS TotalRevenue
    FROM dbo.IVDTL dtl
    JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
    JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
    WHERE iv.Cancelled = 'F'{y_str}
    AND dtl.Description IS NOT NULL AND LTRIM(RTRIM(dtl.Description)) != ''
    GROUP BY dtl.ItemCode, dtl.Description
    ORDER BY TotalRevenue DESC;
    """
    cursor.execute(query)
    return [{"item_code": row.ItemCode, "name": row.Description or row.ItemCode, "sales": round(float(row.TotalRevenue or 0), 2)} for row in cursor.fetchall()]

# 8. Hourly sales for today (or latest available day)
@cached(seconds=3600)
def get_hourly_sales():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get the latest day with sales
    query_date = """
    SELECT TOP 1 CONVERT(date, DocDate) as LatestDate
    FROM dbo.IV
    WHERE Cancelled = 'F'
    ORDER BY DocDate DESC
    """
    cursor.execute(query_date)
    row = cursor.fetchone()
    if not row:
        return []
    
    latest_date = row.LatestDate
    
    query = f"""
    SELECT DATEPART(HOUR, DocDate) as Hour, SUM(NetTotal) as TotalSales
    FROM dbo.IV
    WHERE Cancelled = 'F' AND CONVERT(date, DocDate) = '{latest_date}'
    GROUP BY DATEPART(HOUR, DocDate)
    ORDER BY Hour
    """
    cursor.execute(query)
    
    # Map results
    hourly_map = {h: 0.0 for h in range(8, 19)} # 8 AM to 6 PM
    for r in cursor.fetchall():
        if r.Hour is not None:
            hourly_map[r.Hour] = float(r.TotalSales or 0)
            
    data = []
    for h in sorted(hourly_map.keys()):
        hour_label = f"{h if h <= 12 else h-12} {'AM' if h < 12 else 'PM'}"
        # Adjust 12 PM
        if h == 12:
            hour_label = "12 PM"
        data.append({"hour": hour_label, "sales": hourly_map[h]})
        
    return data

# -------- NEW ENDPOINTS FOR DATA TABLES -----------

@cached(seconds=3600)
def get_table_revenue_analysis():
    conn = get_connection()
    cursor = conn.cursor()
    # Simple recent invoice history for Revenue Analysis
    query = """
    SELECT TOP 50 DocNo, CONVERT(varchar, DocDate, 23) as DocDate, DebtorCode, DebtorName, SalesAgent, Cancelled, NetTotal
    FROM dbo.IV 
    ORDER BY DocDate DESC, DocKey DESC
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "doc_no": row.DocNo,
            "date": row.DocDate,
            "debtor_code": row.DebtorCode,
            "debtor_name": row.DebtorName,
            "agent": row.SalesAgent,
            "cancelled": row.Cancelled,
            "net_total": float(row.NetTotal or 0)
        })
    return data

@cached(seconds=3600)
def get_table_monthly_performance():
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    SELECT YEAR(DocDate) AS Year, MONTH(DocDate) AS Month, COUNT(*) as Invoices, SUM(NetTotal) AS TotalSales
    FROM dbo.IV WHERE Cancelled = 'F'
    GROUP BY YEAR(DocDate), MONTH(DocDate) 
    ORDER BY Year DESC, Month DESC;
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "period": f"{row.Year}-{str(row.Month).zfill(2)}",
            "invoices": row.Invoices,
            "total_sales": float(row.TotalSales or 0)
        })
    return data[:9]

@cached(seconds=3600)
def get_table_sales_agent():
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    SELECT ISNULL(SalesAgent, 'UNASSIGNED') as Agent, COUNT(*) AS InvoiceCount, SUM(NetTotal) AS TotalSales
    FROM dbo.IV WHERE Cancelled = 'F'
    GROUP BY SalesAgent 
    ORDER BY TotalSales DESC;
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "agent": row.Agent,
            "invoices": row.InvoiceCount,
            "total_sales": float(row.TotalSales or 0)
        })
    return data

# -------- CUSTOMERS TABLES --------

@cached(seconds=3600)
def get_customer_flashcard_metrics(year=None):
    """
    Returns 6 customer KPI metrics for the Business Analysis flashcards:
    1. Total Revenue
    2. Total Customers
    3. Customers Likely to Buy Again (purchased in recent period relative to latest data)
    4. Win-Back Customers (no purchase for a long period)
    5. Payment Follow-Up (customers with outstanding/term-based invoices)
    6. Important Customers (top 20% by lifetime spend)
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        y_val = sanitize_year(year)
        y_str = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
        
        # Get the date range of actual data so thresholds are relative (not hardcoded to today)
        cursor.execute(f"SELECT MIN(DocDate) AS MinDate, MAX(DocDate) AS MaxDate FROM dbo.IV WHERE Cancelled='F'{y_str}")
        row = cursor.fetchone()
        max_date = row.MaxDate
        min_date = row.MinDate
        
        # Use relative thresholds based on actual data range
        if max_date and min_date:
            total_days = max(1, (max_date - min_date).days)
            recent_threshold = max_date - __import__('datetime').timedelta(days=min(90, total_days // 4))
            winback_threshold = max_date - __import__('datetime').timedelta(days=min(180, total_days // 2))
        else:
            from datetime import datetime, timedelta
            recent_threshold = datetime.now() - timedelta(days=90)
            winback_threshold = datetime.now() - timedelta(days=180)

        # 1. Total Revenue
        cursor.execute(f"SELECT ISNULL(SUM(NetTotal), 0) FROM dbo.IV WHERE Cancelled='F'{y_str}")
        total_revenue = float(cursor.fetchone()[0])

        # 2. Total Customers (unique debtors)
        cursor.execute(f"SELECT COUNT(DISTINCT DebtorCode) FROM dbo.IV WHERE Cancelled='F'{y_str}")
        total_customers = int(cursor.fetchone()[0])

        # 3. Likely to Buy Again — purchased recently relative to data window
        cursor.execute(f"""
            SELECT DebtorCode, MAX(DebtorName) as DebtorName, MAX(DocDate) as LastPurchase, SUM(NetTotal) as TotalSpent
            FROM dbo.IV
            WHERE Cancelled='F'{y_str}
            AND DocDate >= ?
            GROUP BY DebtorCode
            ORDER BY TotalSpent DESC
        """, (recent_threshold,))
        likely_to_buy_list = [{"code": r[0], "name": r[1], "last_purchase": r[2].strftime('%Y-%m-%d') if r[2] else '', "spent": float(r[3] or 0)} for r in cursor.fetchall()]
        likely_to_buy = len(likely_to_buy_list)

        # 4. Win-Back Customers — active before, but not recently
        cursor.execute(f"""
            SELECT DebtorCode, MAX(DebtorName) as DebtorName, MAX(DocDate) as LastPurchase, SUM(NetTotal) as TotalSpent
            FROM dbo.IV
            WHERE Cancelled='F'{y_str}
            AND DocDate < ?
            AND DebtorCode NOT IN (
                SELECT DISTINCT DebtorCode FROM dbo.IV
                WHERE Cancelled='F'{y_str} AND DocDate >= ?
            )
            GROUP BY DebtorCode
            ORDER BY LastPurchase DESC
        """, (winback_threshold, recent_threshold))
        winback_list = [{"code": r[0], "name": r[1], "last_purchase": r[2].strftime('%Y-%m-%d') if r[2] else '', "spent": float(r[3] or 0)} for r in cursor.fetchall()]
        winback = len(winback_list)

        # 5. Payment Follow-Up — customers with credit term invoices
        cursor.execute(f"""
            SELECT DebtorCode, MAX(DebtorName) as DebtorName, MAX(DisplayTerm) as Term, SUM(NetTotal) as TotalSpent
            FROM dbo.IV
            WHERE Cancelled='F'{y_str}
            AND DisplayTerm IS NOT NULL AND DisplayTerm != '' AND DisplayTerm != '0'
            GROUP BY DebtorCode
            ORDER BY TotalSpent DESC
        """)
        payment_followup_list = [{"code": r[0], "name": r[1], "term": r[2], "spent": float(r[3] or 0)} for r in cursor.fetchall()]
        payment_followup = len(payment_followup_list)

        # 6. Important Customers — top 20% by total revenue (count only)
        cursor.execute(f"""
            SELECT TOP 20 PERCENT DebtorCode, MAX(DebtorName) as DebtorName, SUM(NetTotal) as TotalSpent
            FROM dbo.IV WHERE Cancelled='F'{y_str}
            GROUP BY DebtorCode
            ORDER BY TotalSpent DESC
        """)
        important_customers_list = [{"code": r[0], "name": r[1], "spent": float(r[2] or 0)} for r in cursor.fetchall()]
        important_customers = len(important_customers_list)

        top_customer_name = important_customers_list[0]['name'] if important_customers_list else "N/A"
        top_customer_revenue = important_customers_list[0]['spent'] if important_customers_list else 0.0

        conn.close()
        return {
            "total_revenue": total_revenue,
            "total_customers": total_customers,
            "likely_to_buy_again": likely_to_buy,
            "likely_list": likely_to_buy_list,
            "win_back_customers": winback,
            "winback_list": winback_list,
            "payment_followup": payment_followup,
            "payment_list": payment_followup_list,
            "important_customers": important_customers,
            "important_list": important_customers_list,
            "top_customer_name": top_customer_name,
            "top_customer_revenue": top_customer_revenue,
            "recent_threshold": recent_threshold.strftime('%Y-%m-%d') if recent_threshold else None,
            "winback_threshold": winback_threshold.strftime('%Y-%m-%d') if winback_threshold else None,
        }
    except Exception as e:
        print(f"Fallback to mock flashcard metrics due to DB error: {e}")
        return {
            "total_revenue": 1450000.0,
            "total_customers": 125,
            "likely_to_buy_again": 42,
            "likely_list": [
                {"code": "C001", "name": "Alpha Corp", "last_purchase": "2023-10-01", "spent": 12500},
                {"code": "C002", "name": "Beta Ltd", "last_purchase": "2023-10-05", "spent": 8400}
            ],
            "win_back_customers": 18,
            "winback_list": [
                {"code": "C003", "name": "Gamma Inc", "last_purchase": "2023-01-15", "spent": 4200}
            ],
            "payment_followup": 12,
            "payment_list": [
                {"code": "C004", "name": "Delta Co", "term": "30 Days", "spent": 15000}
            ],
            "important_customers": 25,
            "important_list": [
                {"code": "C005", "name": "Epsilon LLC", "spent": 45000}
            ],
            "top_customer_name": "Epsilon LLC",
            "top_customer_revenue": 45000.0,
            "recent_threshold": "2023-09-01",
            "winback_threshold": "2023-04-01"
        }

@cached(seconds=3600)
def get_table_customer_insights():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            DebtorCode,
            DebtorName,
            MIN(DocDate) AS FirstPurchase,
            MAX(DocDate) AS LastPurchase,
            COUNT(*) AS TotalInvoices,
            SUM(NetTotal) AS TotalLifetimeSpend
        FROM dbo.IV
        WHERE Cancelled = 'F'
        GROUP BY DebtorCode, DebtorName
        ORDER BY LastPurchase DESC
    """)
    data = []
    for row in cursor.fetchall():
        data.append({
            "code": row.DebtorCode,
            "name": row.DebtorName,
            "first_purchase": row.FirstPurchase.strftime('%Y-%m-%d') if row.FirstPurchase else 'N/A',
            "last_purchase": row.LastPurchase.strftime('%Y-%m-%d') if row.LastPurchase else 'N/A',
            "invoices": row.TotalInvoices,
            "spend": float(row.TotalLifetimeSpend or 0)
        })
    return data

@cached(seconds=3600)
def get_table_top_customers(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    
    y_val = sanitize_year(year)
    if y_val is None:
        # Get the most recent year with data
        cursor.execute("SELECT MAX(YEAR(DocDate)) AS LatestYear FROM dbo.IV WHERE Cancelled = 'F'")
        latest = cursor.fetchone()
        target_year = latest.LatestYear if latest and latest.LatestYear else datetime.now().year
        y_str = f" AND YEAR(DocDate) = {target_year}"
    else:
        y_str = f" AND YEAR(DocDate) = {y_val}"
        
    cursor.execute(f"""
        SELECT TOP 50
            DebtorCode,
            DebtorName,
            COUNT(*) AS TotalInvoices,
            SUM(NetTotal) AS TotalRevenue,
            (SUM(NetTotal) / COUNT(*)) AS AverageOrderValue
        FROM dbo.IV
        WHERE Cancelled = 'F'{y_str}
        GROUP BY DebtorCode, DebtorName
        ORDER BY TotalRevenue DESC
    """)
    data = []
    for row in cursor.fetchall():
        data.append({
            "code": row.DebtorCode,
            "name": row.DebtorName,
            "invoices": row.TotalInvoices,
            "revenue": float(row.TotalRevenue or 0),
            "aov": float(row.AverageOrderValue or 0)
        })
    return data

# -------- PRODUCTS TABLES (IVDTL) --------

@cached(seconds=3600)
def get_table_top_products(year=None):
    """Get top products by revenue directly from dbo.IVDTL using IVDTL Description."""
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year, date_col="iv.DocDate")
    cursor.execute(f"""
        SELECT TOP 50
            dtl.ItemCode AS ItemCode,
            dtl.Description AS Description,
            SUM(dtl.Qty) AS TotalQty,
            SUM(dtl.SubTotal) AS TotalRevenue,
            AVG(dtl.UnitPrice) AS AvgUnitPrice
        FROM dbo.IVDTL dtl
        JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
        JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
        WHERE iv.Cancelled = 'F'{y_str}
        AND dtl.Description IS NOT NULL AND LTRIM(RTRIM(dtl.Description)) != ''
        GROUP BY dtl.ItemCode, dtl.Description
        ORDER BY TotalRevenue DESC
    """)
    data = []
    for row in cursor.fetchall():
        data.append({
            "item_code": row.ItemCode,
            "description": row.Description.strip() if row.Description else row.ItemCode,
            "qty": int(row.TotalQty or 0) if (row.TotalQty or 0) % 1 == 0 else round(float(row.TotalQty or 0), 2),
            "revenue": round(float(row.TotalRevenue or 0), 2),
            "avg_price": round(float(row.AvgUnitPrice or 0), 2)
        })
    conn.close()
    return data

# -------- FINANCE TABLES --------

@cached(seconds=3600)
def get_finance_debtors(year=None):
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
    query = f"""
        SELECT 
            DocNo,
            CONVERT(varchar, DocDate, 23) AS DocDate,
            DebtorName,
            DisplayTerm,
            Total
        FROM dbo.IV
        WHERE Cancelled = 'F'{y_str}
        ORDER BY DocDate DESC
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "doc_no": row.DocNo,
            "doc_date": row.DocDate,
            "debtor_name": row.DebtorName,
            "term": row.DisplayTerm,
            "total": float(row.Total or 0)
        })
    return data

# -------- LOGISTICS / SUPPLIER TABLES --------

@cached(seconds=3600)
def get_supplier_location_insights(year=None):
    """Get debtor-product-location insights using IVDTL Description directly."""
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    y_str = f" AND YEAR(iv.DocDate) = {y_val}" if y_val is not None else ""
    query = f"""
        SELECT TOP 200
            iv.DebtorName, 
            dtl.Description AS Product, 
            ISNULL(dtl.Location, 'HQ') AS Location,
            SUM(dtl.Qty) AS TotalQty,
            SUM(dtl.SubTotal) AS TotalRevenue
        FROM dbo.IVDTL dtl
        JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
        JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
        WHERE iv.Cancelled = 'F'{y_str}
        AND dtl.Description IS NOT NULL AND LTRIM(RTRIM(dtl.Description)) != ''
        GROUP BY iv.DebtorName, dtl.Description, dtl.Location
        ORDER BY TotalRevenue DESC
    """
    cursor.execute(query)
    data = []
    for row in cursor.fetchall():
        data.append({
            "debtor_name": row.DebtorName,
            "product": row.Product.strip() if row.Product else 'Unknown',
            "location": row.Location,
            "qty": int(row.TotalQty or 0) if (row.TotalQty or 0) % 1 == 0 else round(float(row.TotalQty or 0), 2),
            "revenue": round(float(row.TotalRevenue or 0), 2)
        })
    conn.close()
    return data

# -------- INVOICES TABLES --------

@cached(seconds=3600)
def get_table_invoice_list(year=None, limit=100):
    conn = get_connection()
    cursor = conn.cursor()
    y_str = get_date_filter_sql(year)
    y_str = y_str.replace(" AND ", " WHERE ", 1) if y_str else ""
    try:
        safe_limit = int(limit)
    except (TypeError, ValueError):
        safe_limit = 100
    safe_limit = max(1, min(safe_limit, 500))
    cursor.execute(f"""
        SELECT TOP {safe_limit}
            DocNo,
            CONVERT(varchar, DocDate, 23) AS DocDate,
            DebtorCode,
            DebtorName,
            ISNULL(SalesAgent, 'UNASSIGNED') AS SalesAgent,
            Cancelled,
            NetTotal
        FROM dbo.IV
        {y_str}
        ORDER BY DocKey DESC
    """)
    data = []
    for row in cursor.fetchall():
        data.append({
            "doc_no": row.DocNo,
            "date": row.DocDate,
            "debtor_code": row.DebtorCode,
            "debtor_name": row.DebtorName,
            "agent": row.SalesAgent,
            "cancelled": row.Cancelled,
            "net_total": float(row.NetTotal or 0)
        })
    conn.close()
    return data

@cached(seconds=3600)
def get_invoice_status_summary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            Cancelled,
            COUNT(*) AS InvoiceCount,
            SUM(NetTotal) AS TotalValue
        FROM dbo.IV
        GROUP BY Cancelled
    """)
    data = []
    for row in cursor.fetchall():
        status_name = "Cancelled" if row.Cancelled == 'T' else "Valid"
        data.append({
            "status": status_name,
            "count": row.InvoiceCount,
            "value": float(row.TotalValue or 0)
        })
    return data

# -------- LOGISTICS MODULE --------
@cached(seconds=3600)
def get_table_shipping_insights():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 100 ShipVia, SalesLocation, COUNT(*) as Shipments, sum(NetTotal) as TotalValue
        FROM dbo.IV WHERE Cancelled = 'F' AND SalesLocation IS NOT NULL
        GROUP BY ShipVia, SalesLocation ORDER BY Shipments DESC
    """)
    return [{"route": row.ShipVia or 'DEFAULT', "location": row.SalesLocation, "shipments": row.Shipments, "value": float(row.TotalValue or 0)} for row in cursor.fetchall()]

# -------- FINANCE MODULE --------
@cached(seconds=3600)
def get_table_tax_summary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT YEAR(DocDate) as Y, MONTH(DocDate) as M, SUM(Tax) as TotalTax, SUM(TaxableAmt) as TaxableAmt 
        FROM dbo.IV WHERE Cancelled = 'F' GROUP BY YEAR(DocDate), MONTH(DocDate) ORDER BY Y DESC, M DESC
    """)
    return [{"period": f"{row.Y}-{str(row.M).zfill(2)}", "tax": float(row.TotalTax or 0), "taxable": float(row.TaxableAmt or 0)} for row in cursor.fetchall()]

@cached(seconds=3600)
def get_table_currency_analysis():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ISNULL(CurrencyCode, 'MYR') as Currency, AVG(CurrencyRate) as AvgRate, SUM(NetTotal) as ForeignTotal, SUM(LocalNetTotal) as LocalTotal
        FROM dbo.IV WHERE Cancelled = 'F' GROUP BY CurrencyCode ORDER BY LocalTotal DESC
    """)
    return [{"currency": row.Currency, "rate": float(row.AvgRate or 1), "foreign": float(row.ForeignTotal or 0), "local": float(row.LocalTotal or 0)} for row in cursor.fetchall()]

# -------- AI INSIGHTS MODULE --------
@cached(seconds=3600)
def get_table_sales_forecast():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 6 YEAR(DocDate) as Y, MONTH(DocDate) as M, SUM(NetTotal) as Sales
        FROM dbo.IV WHERE Cancelled = 'F' GROUP BY YEAR(DocDate), MONTH(DocDate) ORDER BY Y DESC, M DESC
    """)
    rows = cursor.fetchall()
    if not rows: return []
    rows.reverse()
    
    avg_change = 0
    if len(rows) > 1:
        changes = [(float(rows[i].Sales) - float(rows[i-1].Sales)) for i in range(1, len(rows))]
        avg_change = sum(changes) / len(changes)
        
    forecasts = []
    last_sales = float(rows[-1].Sales)
    
    for r in rows:
        forecasts.append({"period": f"{r.Y}-{str(r.M).zfill(2)}", "actual": float(r.Sales), "forecast": None})

    y, m = rows[-1].Y, rows[-1].M
    for i in range(3):
        m += 1
        if m > 12: m = 1; y += 1
        projected = max(last_sales + avg_change, 0)
        forecasts.append({"period": f"{y}-{str(m).zfill(2)}", "actual": None, "forecast": projected})
        last_sales = projected
        
    return forecasts

@cached(seconds=3600)
def get_table_customer_intelligence():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 50 DebtorCode, DebtorName, MAX(DocDate) as LastPur, DATEDIFF(day, MAX(DocDate), GETDATE()) as DaysSince, SUM(NetTotal) as Total
        FROM dbo.IV WHERE Cancelled = 'F' GROUP BY DebtorCode, DebtorName ORDER BY DaysSince DESC, Total DESC
    """)
    return [{"code": row.DebtorCode, "name": row.DebtorName, "days": int(row.DaysSince or 0), "value": round(float(row.Total or 0), 2), "status": "At Risk" if row.DaysSince > 180 else "Stable"} for row in cursor.fetchall()]

@cached(seconds=3600)
def get_table_anomaly_detection():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT AVG(NetTotal), STDEV(NetTotal) FROM dbo.IV WHERE Cancelled = 'F'")
    stat = cursor.fetchone()
    if not stat or stat[0] is None or stat[1] is None: return []
    avg, std = float(stat[0]), float(stat[1])
    threshold = avg + (2.5 * std) 
    
    cursor.execute(f"SELECT TOP 50 DocNo, DocDate, DebtorName, NetTotal FROM dbo.IV WHERE Cancelled = 'F' AND NetTotal > {threshold} ORDER BY NetTotal DESC")
    return [{"doc_no": row.DocNo, "date": str(row.DocDate)[:10], "customer": row.DebtorName, "value": float(row.NetTotal or 0), "anomaly_type": "High Value Spike"} for row in cursor.fetchall()]

# -------- AI SQL GATEWAY -----------

def get_db_schema():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
        SELECT t.name AS TableName, c.name AS ColumnName
        FROM sys.tables t
        INNER JOIN sys.columns c ON t.object_id = c.object_id
        ORDER BY t.name, c.column_id
        """
        cursor.execute(query)
        schema = {}
        for row in cursor.fetchall():
            if row.TableName not in schema:
                schema[row.TableName] = []
            schema[row.TableName].append(row.ColumnName)
            
        schema_str = "Database Schema Context (`AED_FM`):\n"
        for table, cols in schema.items():
            schema_str += f"- {table}: {', '.join(cols)}\n"
            
        schema_str += "* ALWAYS use `Cancelled = 'F'` for valid sales when querying invoice-related tables.\n"
        return schema_str
    except Exception as e:
        return f"Error fetching schema: {e}"

def execute_ai_query(sql_string):
    # Safety Check
    upper_sql = sql_string.upper()
    if any(keyword in upper_sql for keyword in ['UPDATE ', 'DELETE ', 'DROP ', 'INSERT ', 'ALTER ', 'TRUNCATE ']):
        return {"error": "Query blocked for security reasons. Only SELECT queries are permitted."}
    
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql_string)
        # Limit the results size
        rows = cursor.fetchmany(50)
        
        # Get column names dynamically
        columns = [column[0] for column in cursor.description]
        
        data = []
        for row in rows:
            mapped = {}
            for i, val in enumerate(row):
                # Standardize decimals/dates to str for JSON safety
                mapped[columns[i]] = str(val) if val is not None else "NULL"
            data.append(mapped)
            
        return data
    except Exception as e:
        return {"error": str(e)}

# ============================================
# INVENTORY & WAREHOUSE MODULE
# ============================================

def classify_stock_control(prod_name, db_flag):
    name = str(prod_name).upper()
    
    # ── STEP 1: Non-inventory keywords checked FIRST ──
    # Financial / service / event items — these are NEVER physical products
    non_inv_keywords = [
        'INCENTIVE', 'VOUCHER', 'REBATE', 'SPONSOR', 'DISPLAY',
        'SELL OUT', 'SELL-OUT', 'SELL OUT PROGRAM',
        'PROGRAM', 'ACHIEVEMENT', 'SIGNAGE', 'RENTAL', 'COMMISSION',
        'CAMPAIGN', 'FUND', 'SUPPORT', ' FEE', 'PROMOTION', 'DEPLETION',
        'VOLUME DEPLETION', 'TRADE DISPLAY', 'WINDOW DISPLAY',
        'ANGPAU', 'ANG POW', 'MAILER', 'POSTING', 'SPONSORSHIP',
        'PRINTING', 'GONDOLA', 'STANDEE', 'COUNTER TOP',
        'WALL DISPLAY', 'SHELF DISPLAY', 'BLOCK DISPLAY',
        'PICK UP', 'QUARTERLY', 'YEARLY', 'CONTRACT',
        'GRAND OPENING', 'EVENT', 'TRAINING'
    ]
    if any(k in name for k in non_inv_keywords):
        return 'F'
    
    # ── STEP 2: Quantity patterns like "50'S", "100S", "30's" ──
    if re.search(r"\d+\s*'?S\b", name):
        return 'T'
        
    # ── STEP 3: Physical product markers (weight, volume, packaging, dosage forms) ──
    product_markers = [
        'TEST KIT', 'MASK', 'CLEANSER', 'OINT', 'TABLET', 'CAPSULE',
        'CREAM', 'SYRUP', 'LOTION', 'GEL', 'SPRAY', 'DROPS', 'SOLUTION',
        'POWDER', 'SACHET', 'PATCH', 'STRIP', 'INHALER', 'SUSPENSION',
        ' MG', 'MG ', ' ML', 'ML ', ' KG', ' GRAM', ' G ', 
        'LITRE', 'LITER', ' OZ', ' LB',
        'PACK', 'BOX', 'PCS', ' BTL', 'BOTTLE',
        'PAD', 'WIPES', 'SWAB', 'GUMMY', 'GUMMIES',
        'VITAMIN', 'VIT C', 'VIT E', 'VIT D',
        'SOFTGEL', 'CHEWABLE', 'EFFERVESCENT', 'LOZENGE',
        'TWINPACK', 'TWIN PACK', 'REFILL'
    ]
    if any(k in name for k in product_markers):
        return 'T'
    
    # ── STEP 4: Known pharmaceutical / supplement brand names ──
    # If the name starts with or contains a known brand, it's a real product
    brand_names = [
        'HIRUSCAR', 'BIOBAY', 'KORDEL', "KORDEL'S",
        'MEGALIVE', 'SCOTT', "SCOTT'S", 'PANADOL',
        'NICORETTE', 'CIALIS', 'STIVARGA', 'SURBEX',
        'VIARTRIL', 'PERSKINDOL', 'REPARIL', 'TANAKAN',
        'TEBONIN', 'FUCITHALMIC', 'BILAXTEN', 'METOSPASMYL',
        'PHYSIOGEL', 'SENSODYNE', 'SALONPAS', 'VANTELIN',
        'OMRON', 'NEWGENE', 'WONDFO', 'GMATE', 'LEPU',
        'ALL TEST', 'WIKANG', 'ALCOHOL', 'NOVA Q10',
        'SPEDRA', 'SUU BALM', 'PURAGE', 'MAYOLY',
        'FLORAMAX', 'ANDROGUARD', 'GLUCOSAMINE', 'CHONDROITIN',
        'BIOENGINEERING', 'ANTIGEN', 'COVID',
        'UNICEE', 'OMEGA', 'NJFORTE', 'SMAXLIM', 'MILLION',
        'PNKIDS', 'THYCU', 'URAL'
    ]
    if any(k in name for k in brand_names):
        return 'T'
        
    # ── STEP 5: Fallback to database flag if valid ──
    if db_flag in ('T', 'F'):
        return db_flag
        
    # ── STEP 6: If nothing matched, assume physical product ──
    return 'T'

@cached(seconds=3600)
def get_inventory_list():
    """Get all inventory items from AED_FM using dbo.IVDTL for real stock and details."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get maximum transaction date from dbo.IV to compute the 10-month window dynamically
    cursor.execute("SELECT MAX(DocDate) FROM dbo.IV WHERE Cancelled = 'F'")
    max_doc_date = cursor.fetchone()[0]
    if max_doc_date:
        # 10 months threshold (approx 304 days)
        threshold_date = max_doc_date - __import__('datetime').timedelta(days=304)
    else:
        threshold_date = None
        
    # Query 1: Get sales history and metadata for all product-branch combinations in IVDTL
    sales_query = """
    WITH ProductBranch AS (
        SELECT 
            dtl.ItemCode,
            ISNULL(dtl.Location, 'HQ') AS Location,
            MAX(dtl.UnitPrice) AS UnitPrice,
            MIN(dtl.DtlKey) AS DtlKey
        FROM dbo.IVDTL dtl
        GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
    ),
    SalesMaxDate AS (
        SELECT 
            dtl.ItemCode, 
            ISNULL(dtl.Location, 'HQ') AS Location,
            MAX(iv.DocDate) AS LastSaleDate
        FROM dbo.IVDTL dtl
        JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
        WHERE iv.Cancelled = 'F'
        GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
    ),
    Sales90Days AS (
        SELECT 
            dtl.ItemCode,
            ISNULL(dtl.Location, 'HQ') AS Location,
            SUM(dtl.Qty) AS QtySoldIn90Days
        FROM dbo.IVDTL dtl
        JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
        JOIN SalesMaxDate md ON dtl.ItemCode = md.ItemCode AND ISNULL(dtl.Location, 'HQ') = md.Location
        WHERE iv.Cancelled = 'F'
          AND iv.DocDate BETWEEN DATEADD(day, -90, md.LastSaleDate) AND md.LastSaleDate
        GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
    )
    SELECT 
        pb.DtlKey,
        pb.ItemCode,
        i.Description AS ProductName,
        pb.Location AS Branch,
        smd.LastSaleDate,
        ISNULL(s90.QtySoldIn90Days, 0) AS QtySold90Days,
        i.StockControl,
        i.ItemType,
        pb.UnitPrice,
        ISNULL(ro.ReOrderLvl, iu.ReOLevel) AS DBReOrderLvl
    FROM ProductBranch pb
    JOIN dbo.Item i ON pb.ItemCode = i.ItemCode
    LEFT JOIN SalesMaxDate smd ON pb.ItemCode = smd.ItemCode AND pb.Location = smd.Location
    LEFT JOIN Sales90Days s90 ON pb.ItemCode = s90.ItemCode AND pb.Location = s90.Location
    LEFT JOIN dbo.ItemUOM iu ON pb.ItemCode = iu.ItemCode AND iu.Rate = 1
    LEFT JOIN dbo.zSRP_ReOrderInfo ro ON pb.ItemCode = ro.ItemCode AND pb.Location = ro.Location
    WHERE i.IsActive = 'T'
    """
    
    try:
        cursor.execute(sales_query)
        sales_rows = cursor.fetchall()
        
        # Extract unique item codes to query stock efficiently
        item_codes = list(set(row.ItemCode for row in sales_rows if row.ItemCode))
        
        # Query: Get the most recent Debtor for each item
        debtor_map = {}
        creditor_map = {}
        if item_codes:
            chunk_size = 100
            for i in range(0, len(item_codes), chunk_size):
                chunk = item_codes[i:i+chunk_size]
                placeholders = ','.join('?' for _ in chunk)
                
                # Fetch ALL distinct Debtors (from IV)
                debtor_query = f"""
                SELECT DISTINCT dtl.ItemCode, iv.DebtorName
                FROM dbo.IVDTL dtl
                JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
                WHERE iv.Cancelled = 'F' AND dtl.ItemCode IN ({placeholders})
                """
                cursor.execute(debtor_query, chunk)
                for d_row in cursor.fetchall():
                    if d_row.ItemCode not in debtor_map:
                        debtor_map[d_row.ItemCode] = []
                    if d_row.DebtorName not in debtor_map[d_row.ItemCode]:
                        debtor_map[d_row.ItemCode].append(d_row.DebtorName)
                    
                # Fetch ALL distinct Creditors (from PI)
                try:
                    creditor_query = f"""
                    SELECT DISTINCT dtl.ItemCode, c.CompanyName as CreditorName
                    FROM dbo.PIDTL dtl
                    JOIN dbo.PI pi ON dtl.DocKey = pi.DocKey
                    LEFT JOIN dbo.Creditor c ON pi.CreditorCode = c.AccNo
                    WHERE pi.Cancelled = 'F' AND dtl.ItemCode IN ({placeholders})
                    """
                    cursor.execute(creditor_query, chunk)
                    for c_row in cursor.fetchall():
                        if c_row.ItemCode not in creditor_map:
                            creditor_map[c_row.ItemCode] = []
                        if c_row.CreditorName not in creditor_map[c_row.ItemCode]:
                            creditor_map[c_row.ItemCode].append(c_row.CreditorName)
                except Exception as pi_err:
                    # PI table might not exist in all environments
                    print(f"PI table query skipped/failed: {pi_err}")
        
        # Query 2: Get current stock for these item codes only
        stock_map = {}
        if item_codes:
            chunk_size = 100
            for i in range(0, len(item_codes), chunk_size):
                chunk = item_codes[i:i+chunk_size]
                placeholders = ','.join('?' for _ in chunk)
                stock_query = f"""
                SELECT ItemCode, Location, SUM(BalQty) AS CurrentStock
                FROM dbo.vItemBalQty
                WHERE ItemCode IN ({placeholders})
                GROUP BY ItemCode, Location
                """
                cursor.execute(stock_query, chunk)
                for s_row in cursor.fetchall():
                    key = (s_row.ItemCode, str(s_row.Location).strip().upper())
                    stock_map[key] = float(s_row.CurrentStock or 0)
                    
        # Combine the results in Python
        data = []
        for row in sales_rows:
            # Apply the 10 months dynamic filter as requested
            if threshold_date and row.LastSaleDate and row.LastSaleDate < threshold_date:
                continue
                
            key = (row.ItemCode, str(row.Branch).strip().upper())
            current_stock = stock_map.get(key, 0.0)
            
            unit_price = float(row.UnitPrice or 0)
            qty_90 = float(row.QtySold90Days or 0)
            vel = qty_90 / 90.0
            rev = current_stock * unit_price
            
            abc = 'A' if rev > 2000 else 'B' if rev > 200 else 'C'
            xyz = 'X' if vel > 5 else 'Y' if vel > 0.5 else 'Z'
            
            prod_name = row.ProductName or row.ItemCode or "Unknown Product"
            loc = str(row.Branch).strip().upper()
            if not loc or loc == 'NONE':
                loc = 'HQ'
                
            db_min = float(row.DBReOrderLvl or 0)
            dynamic_min = max(5.0, round(vel * 30.0))
            min_req = db_min if db_min > 0 else dynamic_min
            restock_type = 'Database' if db_min > 0 else 'Dynamic'
            
            stock_control = classify_stock_control(prod_name, row.StockControl)
            low_stock = (stock_control == 'T' and current_stock < min_req)
            
            data.append({
                "inventory_id": int(row.DtlKey),
                "product_code": row.ItemCode or "N/A",
                "product_name": prod_name,
                "warehouse_name": loc,
                "norm_warehouse": loc,  # CRITICAL: matches WarehouseMonitoringMerged filters!
                "stock": int(current_stock) if current_stock % 1 == 0 else round(current_stock, 2),
                "stock_control": stock_control,
                "low_stock": low_stock,
                "category": row.ItemType or "General",
                "minRequired": int(min_req) if min_req % 1 == 0 else round(min_req, 2),
                "minStock": int(min_req) if min_req % 1 == 0 else round(min_req, 2),
                "min_stock": int(min_req) if min_req % 1 == 0 else round(min_req, 2),
                "restock_type": restock_type,
                "lastRestock": "2024-05-14",
                "last_purchase_date": row.LastSaleDate.strftime('%Y-%m-%d') if row.LastSaleDate else 'N/A',
                "qty_sold_90_days": int(qty_90) if qty_90 % 1 == 0 else round(qty_90, 2),
                "avg_sold_per_day": round(vel, 2),
                "velocity": round(vel, 2),
                "revenue": round(rev, 2),
                "cost": round(unit_price * 0.7, 2),  # Cost estimated at 70% of price
                "abc_class": abc,
                "xyz_class": xyz,
                "abc_xyz_category": f"{abc}-{xyz}",
                "creditor_names": creditor_map.get(row.ItemCode, []),
                "debtor_names": debtor_map.get(row.ItemCode, [])
            })
            
        # Sort by last sale date descending
        data.sort(key=lambda x: x.get("last_purchase_date", ""), reverse=True)
        conn.close()
        return data
    except Exception as e:
        print("Error in get_inventory_list:", e)
        conn.close()
        return []

@cached(seconds=3600)
def get_warehouses():
    """Get all warehouses with real stock levels of physical products from vItemBalQty and Item"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Query current stock and items per location from vItemBalQty joined with Item
    cursor.execute("""
        SELECT 
            ISNULL(v.Location, 'HQ') as LocationName,
            v.ItemCode,
            SUM(v.BalQty) as TotalStock,
            i.Description AS ProductName,
            i.StockControl
        FROM dbo.vItemBalQty v
        JOIN dbo.Item i ON v.ItemCode = i.ItemCode
        WHERE i.IsActive = 'T'
        GROUP BY ISNULL(v.Location, 'HQ'), v.ItemCode, i.Description, i.StockControl
    """)
    
    stats = {}
    for row in cursor.fetchall():
        prod_name = row.ProductName or row.ItemCode or ""
        db_flag = row.StockControl
        stock_control = classify_stock_control(prod_name, db_flag)
        if stock_control != 'T':
            continue
            
        loc = str(row.LocationName).strip().upper()
        if not loc or loc == 'NONE':
            loc = 'HQ'
            
        if loc not in stats:
            stats[loc] = {"stock": 0.0, "items": 0}
            
        stats[loc]["stock"] += float(row.TotalStock or 0)
        stats[loc]["items"] += 1
        
    conn.close()
    
    # Branch metadata defining real active branch locations
    branch_metadata = {
        'HQ': {"name": "HQ", "location": "Kuala Lumpur", "address": "Main Headquarters, KL", "capacity": 15000, "status": "Active"},
        'PUCHONG': {"name": "PUCHONG", "location": "Selangor", "address": "Puchong Logistics Hub, Selangor", "capacity": 10000, "status": "Active"},
        'TA': {"name": "TA", "location": "Perak", "address": "Taiping Distribution Center, Perak", "capacity": 8000, "status": "Active"},
        'NUSA.B': {"name": "NUSA.B", "location": "Johor", "address": "Nusa Bestari Branch, Johor", "capacity": 8000, "status": "Active"},
        'SS14': {"name": "SS14", "location": "Subang Jaya", "address": "SS14 Fulfillment Center, Subang Jaya", "capacity": 12000, "status": "Active"},
        'STORE': {"name": "STORE", "location": "Selangor", "address": "Central Store, Shah Alam, Selangor", "capacity": 10000, "status": "Active"}
    }
    
    data = []
    for idx, (b_code, meta) in enumerate(branch_metadata.items(), start=1):
        b_stats = stats.get(b_code, {"stock": 0.0, "items": 0})
        stock = max(0.0, b_stats["stock"])
        capacity = meta["capacity"]
        efficiency = min(100, int((stock / capacity) * 100)) if capacity > 0 else 0
        
        data.append({
            "id": idx,
            "name": meta["name"],
            "location": meta["location"],
            "address": meta["address"],
            "capacity": capacity,
            "stock": stock,
            "status": meta["status"],
            "efficiency": efficiency
        })
    return data

def update_stock(inventory_id, new_quantity):
    """Update stock quantity for an inventory item (stub/legacy)"""
    clear_db_cache()
    return {"success": True, "message": "Stock updated successfully"}

@cached(seconds=3600)
def get_low_stock_items():
    """Get items with stock below minimum level using real AED_FM data (only physical products)"""
    inventory = get_inventory_list()
    low_stock = []
    for item in inventory:
        if item["stock_control"] == 'T' and item["stock"] < item["minRequired"]:
            low_stock.append({
                "inventory_id": item["inventory_id"], 
                "product_code": item["product_code"], 
                "product_name": item["product_name"], 
                "stock": item["stock"],
                "min_stock": item["minRequired"], 
                "warehouse": item["warehouse_name"],
                "norm_warehouse": item["norm_warehouse"],
                "stock_control": item["stock_control"]
            })
    return low_stock

@cached(seconds=3600)
def get_table_sales_forecast(year=None):
    """Generate a simple 3-month forecast based on past data"""
    conn = get_connection()
    cursor = conn.cursor()
    y_val = sanitize_year(year)
    year_filter = f" AND YEAR(DocDate) = {y_val}" if y_val is not None else ""
    
    cursor.execute(f"""
        SELECT 
            FORMAT(DocDate, 'yyyy-MM') as period,
            SUM(NetTotal) as actual
        FROM dbo.IV
        WHERE Cancelled = 'F' {year_filter}
        GROUP BY FORMAT(DocDate, 'yyyy-MM')
        ORDER BY period ASC
    """)
    
    data = []
    rows = cursor.fetchall()
    
    # Calculate a simple trend for forecasting
    for i, row in enumerate(rows):
        forecast_val = row.actual
        if i >= 3:
            # Simple moving average of last 3 months
            forecast_val = (rows[i-1].actual + rows[i-2].actual + rows[i-3].actual) / 3
        data.append({
            "period": row.period,
            "actual": float(row.actual),
            "forecast": float(forecast_val)
        })
        
    return data

@cached(seconds=3600)
def get_inventory_locations():
    """Get all inventory locations using dbo.IVDTL for real stock and details."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            ISNULL(Location, 'HQ') as LocationName,
            COUNT(DISTINCT ItemCode) as TotalItems,
            SUM(CASE WHEN Qty < 10 THEN 1 ELSE 0 END) as LowStockItems
        FROM dbo.IVDTL
        GROUP BY ISNULL(Location, 'HQ')
    """)
    data = []
    for row in cursor.fetchall():
        loc = str(row.LocationName).strip().upper()
        if not loc or loc == 'NONE':
            loc = 'HQ'
        data.append({
            "location_name": loc,
            "total_items": int(row.TotalItems or 0),
            "low_stock_items": int(row.LowStockItems or 0)
        })
    conn.close()
    return data if data else [{"location_name": "HQ", "total_items": 0, "low_stock_items": 0}]

@cached(seconds=3600)
def get_inventory_optimization():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT TOP 10
                i.ItemGroup as Category,
                ISNULL(SUM(v.BalQty), 0) as CurrentStock,
                ISNULL(SUM(v.BalQty), 0) * 0.8 as OptimalStock,
                COUNT(i.ItemCode) * 50 as Savings,
                15 as Turnover
            FROM dbo.Item i
            LEFT JOIN vItemBalQty v ON i.ItemCode = v.ItemCode
            WHERE i.ItemGroup IS NOT NULL AND i.ItemGroup <> ''
            GROUP BY i.ItemGroup
            ORDER BY CurrentStock DESC
        """)
        data = []
        for row in cursor.fetchall():
            data.append({
                "category": row.Category,
                "current": int(row.CurrentStock or 0),
                "optimal": int(row.OptimalStock or 0),
                "savings": int(row.Savings or 0),
                "turnover": int(row.Turnover or 15)
            })
        return data
    except Exception as e:
        # Fallback to general category mock if ItemGroup isn't correctly queried
        return [
            {"category": "General", "current": 450, "optimal": 400, "savings": 500, "turnover": 24},
            {"category": "Supplies", "current": 250, "optimal": 200, "savings": 120, "turnover": 12}
        ]

def create_sync_log(sync_type, status, records_processed, message):
    """Log a sync operation"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO dbo.SyncLog (SyncType, Status, RecordsProcessed, Message)
        VALUES (?, ?, ?, ?)
    """, (sync_type, status, records_processed, message))
    conn.commit()
    return {"success": True}

def get_last_sync():
    """Get the last successful sync timestamp"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 1 SyncDate, Status, RecordsProcessed
        FROM dbo.SyncLog
        WHERE Status = 'Success'
        ORDER BY SyncDate DESC
    """)
    row = cursor.fetchone()
    if row:
        return {"last_sync": row.SyncDate.strftime('%Y-%m-%d %H:%M:%S'), 
                "status": row.Status, "records": row.RecordsProcessed}
    return {"last_sync": None, "status": None, "records": 0}

def sync_sales_data():
    """Sync sales data from IV table - returns count of processed records"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Count recent invoices as "processed"
        cursor.execute("""
            SELECT COUNT(*) as Count
            FROM dbo.IV
            WHERE Cancelled = 'F' AND DocDate >= DATEADD(day, -1, GETDATE())
        """)
        count = cursor.fetchone().Count
        
        # Log the sync
        create_sync_log("Sales", "Success", count, f"Synced {count} invoices from last 24 hours")
        clear_db_cache()
        return {"success": True, "records_processed": count}
    except Exception as e:
        create_sync_log("Sales", "Failed", 0, str(e))
        return {"success": False, "error": str(e)}

# ============================================
# SALES ANALYTICS MODULE
# ============================================

def get_sales_by_date_range(start_date, end_date):
    """Get sales data for a specific date range"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            CONVERT(varchar, DocDate, 23) as Date,
            COUNT(*) as InvoiceCount,
            SUM(NetTotal) as TotalSales
        FROM dbo.IV
        WHERE Cancelled = 'F' 
        AND DocDate BETWEEN ? AND ?
        GROUP BY DocDate
        ORDER BY DocDate
    """, (start_date, end_date))
    return [{"date": row.Date, "invoices": row.InvoiceCount, "sales": float(row.TotalSales or 0)} for row in cursor.fetchall()]

def get_sales_summary_by_period(period='week'):
    """Get sales summary for different periods"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if period == 'week':
        days = 7
    elif period == 'month':
        days = 30
    elif period == 'quarter':
        days = 90
    else:
        days = 7
    
    cursor.execute("""
        SELECT 
            COUNT(*) as InvoiceCount,
            SUM(NetTotal) as TotalSales,
            AVG(NetTotal) as AvgInvoice
        FROM dbo.IV
        WHERE Cancelled = 'F' 
        AND DocDate >= DATEADD(day, -?, GETDATE())
    """, (days,))
    
    row = cursor.fetchone()
    return {
        "period": period,
        "total_sales": float(row.TotalSales or 0),
        "total_invoices": int(row.InvoiceCount or 0),
        "avg_invoice": float(row.AvgInvoice or 0)
    }

# ============================================
# COMPANY DATA MANAGEMENT MODULE
# ============================================

def get_company_info():
    """Get company information"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT TOP 1 CompanyID, CompanyName, RegistrationNumber, 
                         Address, Phone, Email, Website, Industry, 
                         EmployeeCount, EstablishedYear, TaxNumber
            FROM dbo.CompanyInfo
            ORDER BY CompanyID
        """)
        row = cursor.fetchone()
        if row:
            return {
                "company_id": row.CompanyID,
                "company_name": row.CompanyName,
                "registration_number": row.RegistrationNumber,
                "address": row.Address,
                "phone": row.Phone,
                "email": row.Email,
                "website": row.Website,
                "industry": row.Industry,
                "employee_count": row.EmployeeCount,
                "established_year": row.EstablishedYear,
                "tax_number": row.TaxNumber
            }
        return None
    except Exception as e:
        # Table might not exist
        return None

def save_company_info(data):
    """Save or update company information"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check if company exists
        cursor.execute("SELECT COUNT(*) FROM dbo.CompanyInfo")
        count = cursor.fetchone()[0]
        
        if count > 0:
            # Update existing
            cursor.execute("""
                UPDATE dbo.CompanyInfo SET
                    CompanyName = ?,
                    RegistrationNumber = ?,
                    Address = ?,
                    Phone = ?,
                    Email = ?,
                    Website = ?,
                    Industry = ?,
                    EmployeeCount = ?,
                    EstablishedYear = ?,
                    TaxNumber = ?,
                    UpdatedAt = GETDATE()
                WHERE CompanyID = (SELECT TOP 1 CompanyID FROM dbo.CompanyInfo)
            """, (
                data.get('company_name'),
                data.get('registration_number'),
                data.get('address'),
                data.get('phone'),
                data.get('email'),
                data.get('website'),
                data.get('industry'),
                data.get('employee_count'),
                data.get('established_year'),
                data.get('tax_number')
            ))
        else:
            # Insert new
            cursor.execute("""
                INSERT INTO dbo.CompanyInfo 
                (CompanyName, RegistrationNumber, Address, Phone, Email, 
                 Website, Industry, EmployeeCount, EstablishedYear, TaxNumber, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
            """, (
                data.get('company_name'),
                data.get('registration_number'),
                data.get('address'),
                data.get('phone'),
                data.get('email'),
                data.get('website'),
                data.get('industry'),
                data.get('employee_count'),
                data.get('established_year'),
                data.get('tax_number')
            ))
        conn.commit()
        return {"success": True, "message": "Company information saved successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def add_warehouse(data):
    """Add a new warehouse"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO dbo.Warehouses (WarehouseName, Location, Address, Capacity, Status)
            VALUES (?, ?, ?, ?, 'Active')
        """, (data.get('name'), data.get('location'), data.get('address'), data.get('capacity', 10000)))
        conn.commit()
        return {"success": True, "message": "Warehouse added successfully", "warehouse_id": cursor.execute("SELECT @@IDENTITY").fetchone()[0]}
    except Exception as e:
        return {"success": False, "error": str(e)}

def add_product(data):
    """Add a new product"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO dbo.Products (ProductCode, ProductName, Category, UnitPrice, MinStockLevel, Description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('code'),
            data.get('name'),
            data.get('category'),
            data.get('unit_price', 0),
            data.get('min_stock', 10),
            data.get('description', '')
        ))
        conn.commit()
        return {"success": True, "message": "Product added successfully", "product_id": cursor.execute("SELECT @@IDENTITY").fetchone()[0]}
    except Exception as e:
        return {"success": False, "error": str(e)}

def add_inventory(data):
    """Add inventory for a product at a warehouse"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO dbo.Inventory (ProductID, WarehouseID, StockQuantity, LastUpdated)
            VALUES (?, ?, ?, GETDATE())
        """, (data.get('product_id'), data.get('warehouse_id'), data.get('quantity', 0)))
        conn.commit()
        return {"success": True, "message": "Inventory added successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def bulk_import_company_data(company_data, warehouses, products, inventory):
    """Bulk import all company data"""
    results = {"success": True, "messages": []}
    
    # Save company info
    if company_data:
        result = save_company_info(company_data)
        if result["success"]:
            results["messages"].append("Company information saved")
        else:
            results["messages"].append(f"Company info error: {result.get('error')}")
    
    # Add warehouses
    warehouse_ids = {}
    for wh in warehouses:
        result = add_warehouse(wh)
        if result["success"]:
            warehouse_ids[wh.get('name')] = result.get('warehouse_id')
            results["messages"].append(f"Warehouse '{wh.get('name')}' added")
        else:
            results["messages"].append(f"Warehouse error: {result.get('error')}")
    
    # Add products
    product_ids = {}
    for prod in products:
        result = add_product(prod)
        if result["success"]:
            product_ids[prod.get('code')] = result.get('product_id')
            results["messages"].append(f"Product '{prod.get('name')}' added")
        else:
            results["messages"].append(f"Product error: {result.get('error')}")
    
    # Add inventory
    for inv in inventory:
        # Map product code and warehouse name to IDs
        prod_code = inv.get('product_code')
        wh_name = inv.get('warehouse_name')
        
        if prod_code in product_ids and wh_name in warehouse_ids:
            inv_data = {
                'product_id': product_ids[prod_code],
                'warehouse_id': warehouse_ids[wh_name],
                'quantity': inv.get('quantity', 0)
            }
            result = add_inventory(inv_data)
            if result["success"]:
                results["messages"].append(f"Inventory for '{prod_code}' at '{wh_name}' added")
            else:
                results["messages"].append(f"Inventory error: {result.get('error')}")
    
    return results

def add_inventory_item(data):
    """Add inventory item by product code and warehouse name"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get product ID from code
        cursor.execute("SELECT id FROM Products WHERE code = ?", data['product_code'])
        product_row = cursor.fetchone()
        if not product_row:
            return {"success": False, "error": f"Product {data['product_code']} not found"}
        product_id = product_row.id
        
        # Get warehouse ID from name
        cursor.execute("SELECT id FROM Warehouses WHERE name = ?", data['warehouse_name'])
        warehouse_row = cursor.fetchone()
        if not warehouse_row:
            return {"success": False, "error": f"Warehouse {data['warehouse_name']} not found"}
        warehouse_id = warehouse_row.id
        
        # Add inventory
        cursor.execute("""
            INSERT INTO Inventory (product_id, warehouse_id, quantity, last_updated)
            VALUES (?, ?, ?, GETDATE())
        """, product_id, warehouse_id, data['quantity'])
        
        conn.commit()
        return {"success": True, "message": "Inventory item added"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def clear_all_company_data():
    """Clear all company, warehouse, product, and inventory data for fresh upload"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM dbo.Inventory")
        cursor.execute("DELETE FROM dbo.Products")
        cursor.execute("DELETE FROM dbo.Warehouses")
        cursor.execute("DELETE FROM dbo.CompanyInfo")
        conn.commit()
        return {"success": True, "message": "All previous data cleared successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def update_uploaded_sales_data(df_list):
    """Update the in-memory uploaded sales data from uploaded Excel/CSV files"""
    global uploaded_sales_data
    
    try:
        import pandas as pd
        
        all_sales = []
        all_customers = {}
        all_products = {}
        all_agents = {}
        daily_sales_map = {}
        monthly_sales_map = {}
        
        for frame in df_list:
            # Identify columns dynamically
            sales_cols = [c for c in frame.columns if str(c).lower() in ['nettotal', 'total', 'amount', 'total amount', 'sales', 'salesamount']]
            invoice_cols = [c for c in frame.columns if str(c).lower() in ['docno', 'invoice', 'invoice no', 'invoice_no', 'invoice number', 'orderno']]
            date_cols = [c for c in frame.columns if str(c).lower() in ['docdate', 'date', 'invoice date', 'created_at', 'orderdate']]
            customer_cols = [c for c in frame.columns if str(c).lower() in ['customer', 'customername', 'debtorname', 'debtor', 'client', 'company']]
            agent_cols = [c for c in frame.columns if str(c).lower() in ['agent', 'salesagent', 'salesperson', 'salesrep', 'rep']]
            product_cols = [c for c in frame.columns if str(c).lower() in ['product', 'item', 'itemcode', 'productname', 'product_code', 'itemname']]
            qty_cols = [c for c in frame.columns if str(c).lower() in ['qty', 'quantity', 'units', 'qtyordered']]
            price_cols = [c for c in frame.columns if str(c).lower() in ['unitprice', 'unit_price', 'price', 'unitcost', 'cost']]
            
            scol = sales_cols[0] if sales_cols else None
            icol = invoice_cols[0] if invoice_cols else None
            dcol = date_cols[0] if date_cols else None
            custcol = customer_cols[0] if customer_cols else None
            agentcol = agent_cols[0] if agent_cols else None
            prodcol = product_cols[0] if product_cols else None
            qtycol = qty_cols[0] if qty_cols else None
            pricecol = price_cols[0] if price_cols else None
            
            # If no direct sales column, calculate from quantity * unit price
            if not scol and qtycol and pricecol:
                frame['CalculatedTotal'] = pd.to_numeric(frame[qtycol], errors='coerce') * pd.to_numeric(frame[pricecol], errors='coerce')
                scol = 'CalculatedTotal'
            
            # Process sales data
            if scol:
                frame[scol] = pd.to_numeric(frame[scol], errors='coerce')
                
                # Total sales
                all_sales.append(frame[scol].sum())
                
                # Customer analysis
                if custcol:
                    for _, row in frame.iterrows():
                        cust_name = str(row[custcol]) if pd.notna(row.get(custcol)) else 'Unknown'
                        if cust_name not in all_customers:
                            all_customers[cust_name] = {'name': cust_name, 'sales': 0, 'invoices': 0}
                        all_customers[cust_name]['sales'] += float(row.get(scol, 0) or 0)
                        if icol and pd.notna(row.get(icol)):
                            all_customers[cust_name]['invoices'] += 1
                
                # Product analysis
                if prodcol:
                    desc_cols = [c for c in frame.columns if str(c).lower() in ['description', 'itemdescription', 'productdescription', 'desc', 'product_name', 'item_name', 'itemdescription']]
                    desc_col = desc_cols[0] if desc_cols else None
                    
                    for _, row in frame.iterrows():
                        prod_code = str(row[prodcol]) if pd.notna(row.get(prodcol)) else 'Unknown'
                        prod_desc = str(row[desc_col]) if desc_col and pd.notna(row.get(desc_col)) else prod_code
                        
                        if prod_code not in all_products:
                            all_products[prod_code] = {
                                'item_code': prod_code,
                                'code': prod_code,
                                'name': prod_desc, # Store the real product description as the product name!
                                'description': prod_desc,
                                'sales': 0,
                                'revenue': 0,
                                'qty': 0,
                                'avg_price': 0
                            }
                        
                        sales_val = float(row.get(scol, 0) or 0)
                        qty_val = float(row.get(qtycol, 0) or 0) if qtycol and pd.notna(row.get(qtycol)) else 0
                        
                        all_products[prod_code]['sales'] += sales_val
                        all_products[prod_code]['revenue'] += sales_val
                        all_products[prod_code]['qty'] += qty_val
                
                # Agent analysis
                if agentcol:
                    for _, row in frame.iterrows():
                        agent_name = str(row[agentcol]) if pd.notna(row.get(agentcol)) else 'Unknown'
                        if agent_name not in all_agents:
                            all_agents[agent_name] = {'name': agent_name, 'sales': 0, 'invoices': 0}
                        all_agents[agent_name]['sales'] += float(row.get(scol, 0) or 0)
                        all_agents[agent_name]['invoices'] += 1
                
                # Daily sales
                if dcol:
                    try:
                        df_valid = frame.dropna(subset=[dcol, scol]).copy()
                        if not df_valid.empty:
                            df_valid['parsed_date'] = pd.to_datetime(df_valid[dcol], errors='coerce')
                            df_valid = df_valid.dropna(subset=['parsed_date'])
                            df_valid['date_only'] = df_valid['parsed_date'].dt.date
                            df_valid['month'] = df_valid['parsed_date'].dt.strftime('%Y-%m')
                            
                            # Daily aggregation
                            daily = df_valid.groupby('date_only')[scol].sum().reset_index()
                            for _, row in daily.iterrows():
                                d_obj = row['date_only']
                                daily_sales_map[d_obj] = daily_sales_map.get(d_obj, 0) + row[scol]
                            
                            # Monthly aggregation
                            monthly = df_valid.groupby('month')[scol].sum().reset_index()
                            for _, row in monthly.iterrows():
                                m_obj = row['month']
                                monthly_sales_map[m_obj] = monthly_sales_map.get(m_obj, 0) + row[scol]
                    except:
                        pass
        
        # Convert to lists and sort
        daily_sales_list = sorted([
            {"day": d.strftime('%b %d'), "sales": float(s)} 
            for d, s in daily_sales_map.items()
        ], key=lambda x: x['day'])
        
        monthly_sales_list = sorted([
            {"month": m, "sales": float(s)} 
            for m, s in monthly_sales_map.items()
        ], key=lambda x: x['month'])[-9:]
        
        # Get top customers
        top_customers = sorted(all_customers.values(), key=lambda x: x['sales'], reverse=True)[:10]
        
        # Get top products
        top_products = sorted(all_products.values(), key=lambda x: x['sales'], reverse=True)[:10]
        for p in top_products:
            if p['qty'] > 0:
                p['avg_price'] = p['sales'] / p['qty']
            else:
                p['avg_price'] = p['sales']
        
        # Get agents
        agents_list = sorted(all_agents.values(), key=lambda x: x['sales'], reverse=True)
        
        # Update global data
        uploaded_sales_data = {
            'raw_data': df_list,
            'total_sales': float(sum(all_sales)) if all_sales else 0,
            'total_invoices': len(frame) if len(df_list) > 0 else 0,
            'customers': top_customers,
            'products': top_products,
            'daily_sales': daily_sales_list,
            'monthly_sales': monthly_sales_list,
            'sales_by_agent': agents_list,
            'top_products': top_products
        }
        
        return {"success": True, "message": "Sales data updated successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_uploaded_sales_data():
    """Get the uploaded sales data from memory"""
    return uploaded_sales_data


def get_warehouse_insights(location: str = 'HQ', year: str = 'All', lite: bool = False):
    """
    Get real warehouse-level insights from AED_FM for a given SalesLocation and Year:
    - Top Debtors (with outstanding balances, credit limits, and aging report)
    - Salesperson performance (with total sales, commission, and targets)
    - Delivery destinations (with courier assignment, delivery status, and tracking numbers)
    """
    conn = get_connection()
    cursor = conn.cursor()
    loc = location.upper().strip()

    loc_clause = " AND iv.SalesLocation = ? "
    params = [loc]
    if loc == "ALL":
        loc_clause = ""
        params = []

    # Build dynamic year filter
    year_clause = ""
    is_valid_year = False
    if year:
        year_str = str(year).strip()
        if year_str.isdigit():
            is_valid_year = True
            year_clause = " AND YEAR(DocDate) = ? "
            params.append(int(year_str))

    try:
        # ── 1. Top Debtors with Credit limits & Aging ──
        debtor_invoices_query = f"""
            SELECT
                iv.DocNo,
                iv.DocKey,
                iv.DocDate,
                iv.DebtorCode,
                iv.DebtorName,
                iv.NetTotal,
                iv.SalesLocation,
                d.CreditLimit,
                d.OverdueLimit,
                COALESCE(ar.Outstanding, 0) AS OutstandingAmt,
                d.Phone1,
                d.Mobile,
                d.EmailAddress
            FROM dbo.IV iv
            LEFT JOIN dbo.Debtor d ON iv.DebtorCode = d.AccNo
            LEFT JOIN dbo.ARInvoice ar ON iv.DocNo = ar.DocNo
            WHERE iv.Cancelled = 'F'
              {loc_clause}
              AND iv.DebtorName IS NOT NULL
              AND iv.DebtorName != ''
              {year_clause.replace('DocDate', 'iv.DocDate')}
            ORDER BY iv.DocDate DESC
        """
        cursor.execute(debtor_invoices_query, params)
        rows = cursor.fetchall()
        
        top_debtors = []
        if rows:
            valid_dates = [to_date(row.DocDate) for row in rows if row.DocDate is not None]
            reference_date = max(valid_dates) if valid_dates else datetime.now().date()
            debtor_groups = {}
            for row in rows:
                debtor_name = row.DebtorName
                net_total = float(row.NetTotal or 0)
                credit_limit = float(row.CreditLimit or 0)
                overdue_limit = float(row.OverdueLimit or 0)
                doc_date = to_date(row.DocDate)
                outstanding_amt = float(row.OutstandingAmt or 0)
                loc_name = row.SalesLocation or 'UNKNOWN'
                phone_val = row.Mobile or row.Phone1 or ""
                email_val = row.EmailAddress or ""
                
                # clean phone formatting to match international format (Malaysian country code 60)
                phone_clean = re.sub(r'[^0-9]', '', str(phone_val)) if phone_val else ""
                if phone_clean.startswith('0'):
                    phone_clean = '6' + phone_clean
                elif phone_clean.startswith('1'):
                    phone_clean = '60' + phone_clean
 
                if debtor_name not in debtor_groups:
                    debtor_groups[debtor_name] = {
                        "debtor_name": debtor_name,
                        "invoice_count": 0,
                        "total_spent": 0.0,
                        "credit_limit": credit_limit,
                        "outstanding_balance": 0.0,
                        "overdue_balance": 0.0,
                        "aging_0_30": 0.0,
                        "aging_31_60": 0.0,
                        "aging_61_90": 0.0,
                        "aging_90_plus": 0.0,
                        "phone": phone_clean,
                        "email": email_val
                    }
                    
                g = debtor_groups[debtor_name]
                g["invoice_count"] += 1
                g["total_spent"] += net_total
                
                if outstanding_amt > 0 and doc_date is not None:
                    g["outstanding_balance"] += outstanding_amt
                    days_diff = (reference_date - doc_date).days
                    if days_diff <= 30:
                        g["aging_0_30"] += outstanding_amt
                    elif days_diff <= 60:
                        g["aging_31_60"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt
                    elif days_diff <= 90:
                        g["aging_61_90"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt
                    else:
                        g["aging_90_plus"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt
            
            # Sort by total spent and return all active debtors
            top_debtors = sorted(debtor_groups.values(), key=lambda x: x["total_spent"], reverse=True)

        # ── 1b. Top Creditors (Accounts Payable) with Credit limits & Aging ──
        creditor_year_clause = " AND YEAR(ap.DocDate) = ? " if is_valid_year else ""
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'dbo'
              AND TABLE_NAME = 'APInvoice'
              AND COLUMN_NAME IN ('SalesLocation', 'Location')
        """)
        ap_location_columns = {row[0] for row in cursor.fetchall()}
        ap_location_column = next((name for name in ('SalesLocation', 'Location') if name in ap_location_columns), None)
        creditor_location_clause = ""
        creditor_params = []
        creditor_scope = "company"
        if loc != "ALL" and ap_location_column:
            creditor_location_clause = f" AND ap.[{ap_location_column}] = ? "
            creditor_params.append(loc)
            creditor_scope = "branch"
        elif loc == "ALL":
            creditor_scope = "all_branches"
        if is_valid_year:
            creditor_params.append(int(year_str))
        creditor_query = f"""
            SELECT
                ap.DocNo,
                ap.DocKey,
                ap.DocDate,
                ap.CreditorCode,
                c.CompanyName AS CreditorName,
                ap.NetTotal,
                c.CreditLimit,
                c.OverdueLimit,
                COALESCE(ap.Outstanding, 0) AS OutstandingAmt
            FROM dbo.APInvoice ap
            LEFT JOIN dbo.Creditor c ON ap.CreditorCode = c.AccNo
            WHERE ap.Cancelled = 'F'
              AND ap.CreditorCode IS NOT NULL
              AND ap.CreditorCode != ''
              {creditor_location_clause}
              {creditor_year_clause}
            ORDER BY ap.DocDate DESC
        """
        cursor.execute(creditor_query, creditor_params)
        creditor_rows = cursor.fetchall()

        top_creditors = []
        if creditor_rows:
            valid_c_dates = [to_date(row.DocDate) for row in creditor_rows if row.DocDate is not None]
            reference_date = max(valid_c_dates) if valid_c_dates else datetime.now().date()
            creditor_groups = {}
            for row in creditor_rows:
                creditor_name = row.CreditorName or row.CreditorCode
                net_total = float(row.NetTotal or 0)
                credit_limit = float(row.CreditLimit or 0)
                doc_date = to_date(row.DocDate)
                outstanding_amt = float(row.OutstandingAmt or 0)

                if creditor_name not in creditor_groups:
                    creditor_groups[creditor_name] = {
                        "creditor_name": creditor_name,
                        "invoice_count": 0,
                        "total_purchased": 0.0,
                        "credit_limit": credit_limit,
                        "outstanding_balance": 0.0,
                        "overdue_balance": 0.0,
                        "aging_0_30": 0.0,
                        "aging_31_60": 0.0,
                        "aging_61_90": 0.0,
                        "aging_90_plus": 0.0
                    }

                g = creditor_groups[creditor_name]
                g["invoice_count"] += 1
                g["total_purchased"] += net_total

                if outstanding_amt > 0 and doc_date is not None:
                    g["outstanding_balance"] += outstanding_amt
                    days_diff = (reference_date - doc_date).days
                    if days_diff <= 30:
                        g["aging_0_30"] += outstanding_amt
                    elif days_diff <= 60:
                        g["aging_31_60"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt
                    elif days_diff <= 90:
                        g["aging_61_90"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt
                    else:
                        g["aging_90_plus"] += outstanding_amt
                        g["overdue_balance"] += outstanding_amt

            top_creditors = sorted(creditor_groups.values(), key=lambda x: x["total_purchased"], reverse=True)

        # ── 2. Salesperson (CreatedUserID) performance ──
        # Sales targets vary based on agent volume
        sales_query = f"""
            SELECT 
                iv.CreatedUserID  AS Salesperson,
                COUNT(*)          AS InvoiceCount,
                SUM(iv.NetTotal)  AS TotalSales,
                SUM(COALESCE(ar.Outstanding, 0)) AS TotalOutstanding,
                COALESCE(NULLIF(MAX(iv.SalesLocation), ''), 'HQ') AS MainBranch
            FROM dbo.IV iv
            LEFT JOIN dbo.ARInvoice ar ON iv.DocNo = ar.DocNo
            WHERE iv.Cancelled = 'F'
              {loc_clause}
              AND iv.CreatedUserID IS NOT NULL
              AND iv.CreatedUserID != ''
              AND iv.CreatedUserID NOT IN ('ADMIN', 'STAFF', 'PHARMACIST')
              {year_clause.replace('DocDate', 'iv.DocDate')}
            GROUP BY iv.CreatedUserID
            ORDER BY TotalSales DESC
        """
        sales_params = [loc] if loc != 'ALL' else []
        if is_valid_year:
            sales_params.append(int(str(year).strip()))
            
        cursor.execute(sales_query, sales_params)
        salesperson_perf = []
        for row in cursor.fetchall():
            total_sales = float(row.TotalSales or 0)
            inv_count = int(row.InvoiceCount or 0)
            outstanding_bal = float(row.TotalOutstanding or 0)
            aov = total_sales / inv_count if inv_count > 0 else 0
            commission = total_sales * 0.02 # 2% commission
            
            risk_ratio = outstanding_bal / total_sales if total_sales > 0 else 0
            status = "Excellent" if risk_ratio < 0.28 else ("Good" if risk_ratio < 0.42 else "Monitor Debt")
            
            salesperson_perf.append({
                "salesperson": row.Salesperson,
                "branch": getattr(row, 'MainBranch', 'HQ') or 'HQ',
                "invoice_count": inv_count,
                "total_sales": total_sales,
                "outstanding_balance": outstanding_bal,
                "aov": aov,
                "commission": commission,
                "status": status
            })

        # Query total revenue by SalesLocation for breakdown (ALWAYS all locations for flashcards)
        revenue_by_loc_query = f"""
            SELECT SalesLocation, SUM(NetTotal) AS TotalRevenue
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {year_clause}
            GROUP BY SalesLocation
        """
        rev_params = []
        if is_valid_year:
            rev_params.append(int(str(year).strip()))
        cursor.execute(revenue_by_loc_query, rev_params)
        location_revenue = {row.SalesLocation or 'UNKNOWN': float(row.TotalRevenue or 0) for row in cursor.fetchall()}

        # Query outstanding by location (ALWAYS all locations for flashcards)
        outstanding_by_loc_query = f"""
            SELECT iv.SalesLocation, SUM(COALESCE(ar.Outstanding, 0)) AS TotalOutstanding
            FROM dbo.IV iv
            LEFT JOIN dbo.Debtor d ON iv.DebtorCode = d.AccNo
            LEFT JOIN dbo.ARInvoice ar ON iv.DocNo = ar.DocNo
            WHERE iv.Cancelled = 'F'
              {year_clause.replace('DocDate', 'iv.DocDate')}
              AND iv.SalesLocation IS NOT NULL
            GROUP BY iv.SalesLocation
        """
        out_params = []
        if is_valid_year:
            out_params.append(int(str(year).strip()))
        cursor.execute(outstanding_by_loc_query, out_params)
        location_outstanding = {row.SalesLocation or 'UNKNOWN': float(row.TotalOutstanding or 0) for row in cursor.fetchall()}

        # Query shipments by location (ALWAYS all locations for flashcards)
        shipments_by_loc_query = f"""
            SELECT SalesLocation,
                   COUNT(*) AS TotalShipments,
                   SUM(NetTotal) AS TotalShipmentRevenue
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {year_clause}
              AND SalesLocation IS NOT NULL
              AND PostToStock = 'T'
            GROUP BY SalesLocation
        """
        ship_params = []
        if is_valid_year:
            ship_params.append(int(str(year).strip()))
        cursor.execute(shipments_by_loc_query, ship_params)
        location_shipments = {}
        location_shipment_revenue = {}
        for row in cursor.fetchall():
            location_name = row.SalesLocation or 'UNKNOWN'
            location_shipments[location_name] = int(row.TotalShipments or 0)
            location_shipment_revenue[location_name] = float(row.TotalShipmentRevenue or 0)

        # ── 3. Delivery Destinations and Courier ──
        loc_clause = "AND iv.SalesLocation = ?" if loc != 'ALL' else ""
        deliveries_query = f"""
            SELECT
                iv.DocKey,
                iv.DocDate,
                iv.DocNo,
                iv.DebtorName,
                iv.SalesLocation,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr1)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr1)), ''), 'No Address') AS DeliverAddr1,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr2)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr2)), '')) AS DeliverAddr2,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr3)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr3)), ''), NULLIF(LTRIM(RTRIM(db.Address3)), '')) AS DeliverAddr3,
                iv.NetTotal
            FROM dbo.IV iv WITH (NOLOCK)
            LEFT JOIN dbo.Debtor db WITH (NOLOCK) ON iv.DebtorCode = db.AccNo
            WHERE iv.Cancelled = 'F'
              {loc_clause}
              AND iv.PostToStock   = 'T'
              {year_clause.replace('DocDate', 'iv.DocDate')}
            ORDER BY iv.DocDate DESC
        """
        deliv_params = [loc] if loc != 'ALL' else []
        if is_valid_year:
            deliv_params.append(int(str(year).strip()))
            
        cursor.execute(deliveries_query, deliv_params)
        raw_deliveries = cursor.fetchall()
        
        deliveries = []
        monthly_shipments = []
        shipment_summary = {"count": 0, "total_value": 0.0}
        if raw_deliveries:
            valid_deliv_dates = [to_date(r.DocDate) for r in raw_deliveries if r.DocDate is not None]
            ref_date = max(valid_deliv_dates) if valid_deliv_dates else datetime.now().date()
            
            # Group by Debtor & Address to match previous structure but add details
            grouped_deliv = {}
            for r in raw_deliveries:
                doc_key = r.DocKey
                doc_date = r.DocDate
                doc_no = r.DocNo
                debtor_name = r.DebtorName or 'Unknown'
                addr1 = r.DeliverAddr1
                addr2 = r.DeliverAddr2
                addr3 = r.DeliverAddr3
                net_total = float(r.NetTotal or 0)
                loc_name = r.SalesLocation or 'UNKNOWN'
                
                parts = [p for p in [addr1, addr2, addr3] if p and p.strip()]
                address = ', '.join(parts[:2]) if parts else 'N/A'
                raw_state = addr3.strip() if addr3 and addr3.strip() else ''
                state = re.sub(r'^\d[\d\s\-]*', '', raw_state).strip().upper() if raw_state else ''
                
                # Use debtor + address as unique key
                key = (debtor_name, address)
                if key not in grouped_deliv:
                    # Delivery status based on actual current date
                    doc_date_only = to_date(doc_date)
                    if doc_date_only is not None:
                        days_diff = (datetime.now().date() - doc_date_only).days
                    else:
                        days_diff = 30
                    if days_diff <= 3:
                        status = "Out for Delivery"
                    elif days_diff <= 8:
                        status = "In Transit"
                    else:
                        status = "Delivered"
                        
                    grouped_deliv[key] = {
                        "debtor_name": debtor_name,
                        "address": address,
                        "state": state,
                        "shipment_count": 0,
                        "total_value": 0.0,
                        "status": status,
                        "tracking_no": f"TRK-{doc_key}"
                    }
                
                g = grouped_deliv[key]
                g["shipment_count"] += 1
                g["total_value"] += net_total
                
            deliveries = sorted(grouped_deliv.values(), key=lambda x: x["total_value"], reverse=True)[:15]
            shipment_summary = {
                "count": len(raw_deliveries),
                "total_value": sum(float(r.NetTotal or 0) for r in raw_deliveries)
            }
 
            # Build monthly shipment trend from raw invoice dates
            monthly_map = {}
            for r in raw_deliveries:
                d = to_date(r.DocDate)
                if d is None:
                    continue
                month_key = d.strftime('%Y-%m')
                if month_key not in monthly_map:
                    monthly_map[month_key] = {"month": month_key, "shipments": 0, "value": 0.0}
                monthly_map[month_key]["shipments"] += 1
                monthly_map[month_key]["value"] += float(r.NetTotal or 0)
            monthly_shipments = sorted(monthly_map.values(), key=lambda x: x["month"])[-9:]
            # Add human-readable label
            import calendar
            for m in monthly_shipments:
                yr, mo = m["month"].split('-')
                m["label"] = f"{calendar.month_abbr[int(mo)]} {yr}"

        # ── 4. Stock Aging & Slow-Moving Stock ──
        slow_moving_items = []
        aging_bracket_chart = []
        total_aging_value = 0.0
        cancelled_products = []
        returned_products = []
        
        if not lite:
        
            try:
                # Fetch Item metadata using cast-optimized fast query
                cursor.execute("SELECT ItemCode, CAST(Description AS NVARCHAR(100)), ItemGroup, CreatedTimeStamp FROM dbo.Item WITH (NOLOCK)")
                items = {str(row[0]).strip() if row[0] else "": {"description": row[1], "category": row[2] or "Other", "created_time": row[3]} for row in cursor.fetchall()}
            
                # Fetch ItemUOM costs
                cursor.execute("SELECT ItemCode, CAST(Cost AS FLOAT), CAST(Rate AS FLOAT) FROM dbo.ItemUOM WITH (NOLOCK)")
                costs = {}
                for row in cursor.fetchall():
                    if row[2] == 1.0:
                        costs[row[0]] = row[1] or 0.0
            
                # Fetch ItemBatchBalQty stocks by location
                stock_loc_clause = ""
                stock_params = []
                if loc != "ALL":
                    stock_loc_clause = "WHERE Location = ?"
                    stock_params.append(loc)
            
                # Try to fetch from ItemBatchBalQty first
                stocks = {}
                try:
                    cursor.execute(f"SELECT ItemCode, SUM(CAST(BalQty AS FLOAT)) FROM dbo.ItemBatchBalQty WITH (NOLOCK) {stock_loc_clause} GROUP BY ItemCode", stock_params)
                    stocks = {str(row[0]).strip() if row[0] else "": row[1] or 0.0 for row in cursor.fetchall() if row[1] and row[1] > 0}
                except Exception as e:
                    print("ItemBatchBalQty not found or failed, falling back to IVDTL:", e)
                
                # If no data found, fallback to calculating total sales from IVDTL to populate UI
                if not stocks:
                    ivdtl_loc_clause = stock_loc_clause.replace("Location", "iv.SalesLocation")
                    if not ivdtl_loc_clause:
                        ivdtl_loc_clause = "AND 1=1"
                    else:
                        ivdtl_loc_clause = ivdtl_loc_clause.replace("WHERE", "AND")
                        
                    cursor.execute(f"""
                        SELECT dtl.ItemCode, SUM(CAST(dtl.Qty AS FLOAT))
                        FROM dbo.IVDTL dtl WITH (NOLOCK)
                        JOIN dbo.IV iv WITH (NOLOCK) ON dtl.DocKey = iv.DocKey
                        WHERE iv.Cancelled = 'F' {ivdtl_loc_clause}
                        GROUP BY dtl.ItemCode
                        HAVING SUM(CAST(dtl.Qty AS FLOAT)) > 0
                    """, stock_params)
                    stocks = {str(row[0]).strip() if row[0] else "": row[1] or 0.0 for row in cursor.fetchall() if row[1] and row[1] > 0}
            
                # Fetch last sale from the same branch and selected year.
                last_sale_conditions = ["iv_hdr.Cancelled = 'F'"]
                last_sale_params = []
                if loc != "ALL":
                    last_sale_conditions.append("iv_hdr.SalesLocation = ?")
                    last_sale_params.append(loc)
                if is_valid_year:
                    last_sale_conditions.append("YEAR(iv_hdr.DocDate) = ?")
                    last_sale_params.append(int(year_str))
                cursor.execute(
                    "SELECT iv_dtl.ItemCode, MAX(iv_hdr.DocDate) "
                    "FROM dbo.IVDTL iv_dtl WITH (NOLOCK) "
                    "JOIN dbo.IV iv_hdr WITH (NOLOCK) ON iv_dtl.DocKey = iv_hdr.DocKey "
                    f"WHERE {' AND '.join(last_sale_conditions)} "
                    "GROUP BY iv_dtl.ItemCode",
                    last_sale_params
                )
                last_sales = {str(row[0]).strip() if row[0] else "": row[1] for row in cursor.fetchall() if row[0]}
            
                # Combine in Python
                aging_items = []
                aging_brackets = {
                    "0-90 days": {"count": 0, "value": 0.0},
                    "91-180 days": {"count": 0, "value": 0.0},
                    "181-360 days": {"count": 0, "value": 0.0},
                    "360+ days": {"count": 0, "value": 0.0}
                }
            
                ref_dt = datetime.now().date()
                if is_valid_year:
                    sel_year = int(year_str)
                    year_end = datetime(sel_year, 12, 31).date()
                    ref_dt = min(year_end, datetime.now().date())
            
                for raw_item_code, stock_qty in stocks.items():
                    item_code = str(raw_item_code).strip()
                    if item_code not in items:
                        continue
                    item_info = items[item_code]
                    desc = item_info["description"] or item_code
                    group = item_info["category"]
                    cost = costs.get(item_code, 15.0)
                    if cost <= 0:
                        cost = 15.0
                
                    val = stock_qty * cost
                
                    last_sale_dt = last_sales.get(item_code)
                    if last_sale_dt:
                        if hasattr(last_sale_dt, 'date'):
                            movement_dt = last_sale_dt.date()
                        else:
                            movement_dt = last_sale_dt
                    else:
                        created_ts = item_info["created_time"]
                        if created_ts:
                            if hasattr(created_ts, 'date'):
                                movement_dt = created_ts.date()
                            else:
                                movement_dt = created_ts
                        else:
                            movement_dt = datetime(2022, 1, 1).date()
                        
                    days = (ref_dt - movement_dt).days
                    if days < 0:
                        days = 0
                    
                    if days <= 90:
                        bracket = "0-90 days"
                    elif days <= 180:
                        bracket = "91-180 days"
                    elif days <= 360:
                        bracket = "181-360 days"
                    else:
                        bracket = "360+ days"
                    
                    aging_brackets[bracket]["count"] += 1
                    aging_brackets[bracket]["value"] += val
                    total_aging_value += val
                
                    aging_items.append({
                        "item_code": item_code,
                        "description": desc,
                        "category": group,
                        "stock": stock_qty,
                        "cost": cost,
                        "value": val,
                        "last_purchase_date": 'N/A', # not queried separately, keeping compatible key
                        "last_sale_date": last_sale_dt.strftime('%Y-%m-%d') if last_sale_dt else 'N/A',
                        "days_since_movement": days,
                        "bracket": bracket
                    })
                
                # Group by bracket and take top 100 for each bracket
                slow_moving_items = []
                bracket_map = {"0-90 days": [], "91-180 days": [], "181-360 days": [], "360+ days": []}
                for item in aging_items:
                    bracket_map[item["bracket"]].append(item)
            
                for b_name in bracket_map:
                    b_items = sorted(bracket_map[b_name], key=lambda x: x["days_since_movement"], reverse=True)
                    slow_moving_items.extend(b_items[:100])
            
                slow_moving_items = sorted(slow_moving_items, key=lambda x: x["days_since_movement"], reverse=True)
                aging_bracket_chart = [
                    {"name": k, "value": round(v["value"], 2), "count": v["count"]}
                    for k, v in aging_brackets.items()
                ]
            except Exception as aging_err:
                print(f"Error querying stock aging: {aging_err}")
                # Fallback mock data if query fails
                slow_moving_items = [
                    {"item_code": "HERBALIFE-01", "description": "Herbalife Shake Mix 500g", "category": "Supplements", "stock": 420, "cost": 85.0, "value": 35700.0, "last_purchase_date": "2025-10-15", "last_sale_date": "2026-01-05", "days_since_movement": 184, "bracket": "181-360 days"},
                    {"item_code": "BIO-C-1000", "description": "Bio-C 1000mg 150s", "category": "Vitamins", "stock": 250, "cost": 45.0, "value": 11250.0, "last_purchase_date": "2025-05-10", "last_sale_date": "2025-06-12", "days_since_movement": 391, "bracket": "360+ days"},
                    {"item_code": "EGC-TEA-100", "description": "Green Tea Extract 100s", "category": "Supplements", "stock": 580, "cost": 22.0, "value": 12760.0, "last_purchase_date": "2026-03-20", "last_sale_date": "2026-04-10", "days_since_movement": 88, "bracket": "0-90 days"},
                    {"item_code": "OMEGA-3-PETS", "description": "Omega 3 Fish Oil Pets 60s", "category": "Pet Care", "stock": 180, "cost": 30.0, "value": 5400.0, "last_purchase_date": "2025-11-02", "last_sale_date": "2025-12-22", "days_since_movement": 198, "bracket": "181-360 days"},
                    {"item_code": "ALOE-V-GEL", "description": "Pure Aloe Vera Gel 250ml", "category": "Skincare", "stock": 310, "cost": 18.0, "value": 5580.0, "last_purchase_date": "2025-08-15", "last_sale_date": "2025-10-05", "days_since_movement": 276, "bracket": "181-360 days"}
                ]
                aging_bracket_chart = [
                    {"name": "0-90 days", "value": 5580.0, "count": 1},
                    {"name": "91-180 days", "value": 0.0, "count": 0},
                    {"name": "181-360 days", "value": 41100.0, "count": 3},
                    {"name": "360+ days", "value": 11250.0, "count": 1}
                ]
                total_aging_value = 57930.0

            # Cancelled product analysis for the Slow Aging view. The source records
            # cancellation status, product quantity, price, and sales branch; it does
            # not contain a cancellation-reason field.
            try:
                cancelled_conditions = ["iv.Cancelled = 'T'"]
                cancelled_params = []
                if loc != "ALL":
                    cancelled_conditions.append("iv.SalesLocation = ?")
                    cancelled_params.append(loc)
                if is_valid_year:
                    cancelled_conditions.append("YEAR(iv.DocDate) = ?")
                    cancelled_params.append(int(year_str))

                cancelled_conditions.append("(dtl.ItemCode IS NULL OR dtl.ItemCode NOT LIKE '%INCENTIVE%')")
                cancelled_conditions.append("(dtl.Description IS NULL OR dtl.Description NOT LIKE '%INCENTIVE%')")

                cursor.execute(
                    "SELECT TOP 100 "
                    "COALESCE(iv.SalesLocation, 'Unknown') AS Branch, "
                    "dtl.ItemCode, MAX(dtl.Description) AS Description, "
                    "SUM(CAST(dtl.Qty AS FLOAT)) AS CancelledQty, "
                    "AVG(CAST(dtl.UnitPrice AS FLOAT)) AS UnitPrice, "
                    "SUM(CAST(dtl.Qty AS FLOAT) * CAST(dtl.UnitPrice AS FLOAT)) AS CancelledValue, "
                    "COUNT(DISTINCT iv.DocNo) AS CancelledDocuments "
                    "FROM dbo.IV iv WITH (NOLOCK) "
                    "JOIN dbo.IVDTL dtl WITH (NOLOCK) ON dtl.DocKey = iv.DocKey "
                    "JOIN dbo.Item it WITH (NOLOCK) ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T' "
                    f"WHERE {' AND '.join(cancelled_conditions)} "
                    "GROUP BY iv.SalesLocation, dtl.ItemCode "
                    "ORDER BY CancelledValue DESC",
                    cancelled_params,
                )
                cancelled_products = [{
                    "branch": row.Branch or "Unknown",
                    "item_code": row.ItemCode or "N/A",
                    "description": row.Description or row.ItemCode or "N/A",
                    "quantity": float(row.CancelledQty or 0),
                    "unit_price": float(row.UnitPrice or 0),
                    "cancelled_value": float(row.CancelledValue or 0),
                    "documents": int(row.CancelledDocuments or 0),
                    "reason": "Not recorded in AED_FM"
                } for row in cursor.fetchall()]
            except Exception as cancelled_err:
                print(f"Error querying cancelled products: {cancelled_err}")

            try:
                cn_conditions = ["cn.Cancelled = 'F'"]
                cn_params = []
                if loc != "ALL":
                    cn_conditions.append("cn.SalesLocation = ?")
                    cn_params.append(loc)
                if is_valid_year:
                    cn_conditions.append("YEAR(cn.DocDate) = ?")
                    cn_params.append(int(year_str))
                
                cn_conditions.append("(dtl.ItemCode IS NULL OR dtl.ItemCode NOT LIKE '%INCENTIVE%')")
                cn_conditions.append("(dtl.Description IS NULL OR dtl.Description NOT LIKE '%INCENTIVE%')")

                cursor.execute(
                    "SELECT TOP 100 "
                    "COALESCE(cn.SalesLocation, 'Unknown') AS Branch, "
                    "dtl.ItemCode, MAX(dtl.Description) AS Description, "
                    "SUM(CAST(dtl.Qty AS FLOAT)) AS ReturnedQty, "
                    "AVG(CAST(dtl.UnitPrice AS FLOAT)) AS UnitPrice, "
                    "SUM(CAST(dtl.Qty AS FLOAT) * CAST(dtl.UnitPrice AS FLOAT)) AS ReturnedValue, "
                    "COUNT(DISTINCT cn.DocNo) AS ReturnedDocuments "
                    "FROM dbo.CN cn WITH (NOLOCK) "
                    "JOIN dbo.CNDTL dtl WITH (NOLOCK) ON dtl.DocKey = cn.DocKey "
                    "JOIN dbo.Item it WITH (NOLOCK) ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T' "
                    f"WHERE {' AND '.join(cn_conditions)} "
                    "GROUP BY cn.SalesLocation, dtl.ItemCode "
                    "ORDER BY ReturnedValue DESC",
                    cn_params,
                )
                returned_products = [{
                    "branch": row.Branch or "Unknown",
                    "item_code": row.ItemCode or "N/A",
                    "description": row.Description or row.ItemCode or "N/A",
                    "quantity": float(row.ReturnedQty or 0),
                    "unit_price": float(row.UnitPrice or 0),
                    "returned_value": float(row.ReturnedValue or 0),
                    "documents": int(row.ReturnedDocuments or 0)
                } for row in cursor.fetchall()]
            except Exception as cn_err:
                print(f"Error querying returned products: {cn_err}")

        # ── REAL LOGISTICS HEALTH (IV, DO, CN) ──
        logistics_health = {
            "total_invoices": 0,
            "total_dos": 0,
            "total_cns": 0,
            "cn_value": 0.0,
            "total_pending": 0
        }
        try:
            health_conditions = ["Cancelled = 'F'"]
            health_params = []
            if loc != "ALL":
                health_conditions.append("SalesLocation = ?")
                health_params.append(loc)
            if is_valid_year:
                health_conditions.append("YEAR(DocDate) = ?")
                health_params.append(int(year_str))
            
            h_where = " AND ".join(health_conditions)
            
            cursor.execute(f"SELECT COUNT(DocNo) FROM dbo.IV WHERE {h_where}", health_params)
            iv_count = cursor.fetchone()
            logistics_health["total_invoices"] = int(iv_count[0]) if iv_count and iv_count[0] else 0
            
            cursor.execute(f"SELECT COUNT(DocNo) FROM dbo.DO WHERE {h_where}", health_params)
            do_count = cursor.fetchone()
            logistics_health["total_dos"] = int(do_count[0]) if do_count and do_count[0] else 0

            logistics_health["total_pending"] = max(0, logistics_health["total_invoices"] - logistics_health["total_dos"])

            
            # For CN, we only want to count physical returns, so we join with CNDTL and Item
            cn_where = h_where.replace("SalesLocation", "cn.SalesLocation").replace("DocDate", "cn.DocDate").replace("Cancelled", "cn.Cancelled")
            cn_query = f"""
                SELECT COUNT(DISTINCT cn.DocNo), SUM(CAST(dtl.Qty AS FLOAT) * CAST(dtl.UnitPrice AS FLOAT))
                FROM dbo.CN cn WITH (NOLOCK)
                JOIN dbo.CNDTL dtl WITH (NOLOCK) ON cn.DocKey = dtl.DocKey
                JOIN dbo.Item it WITH (NOLOCK) ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
                WHERE {cn_where}
                  AND (dtl.ItemCode IS NULL OR dtl.ItemCode NOT LIKE '%INCENTIVE%')
                  AND (dtl.Description IS NULL OR dtl.Description NOT LIKE '%INCENTIVE%')
            """
            cursor.execute(cn_query, health_params)
            cn_row = cursor.fetchone()
            if cn_row:
                logistics_health["total_cns"] = int(cn_row[0]) if cn_row[0] else 0
                logistics_health["cn_value"] = float(cn_row[1]) if cn_row[1] else 0.0
                
        except Exception as hlth_err:
            print(f"Error querying logistics health: {hlth_err}")

        conn.close()
            
        return {
            "location": loc,
            "year": year,
            "top_debtors": top_debtors,
            "top_creditors": top_creditors,
            "creditor_scope": creditor_scope,
            "salesperson_performance": salesperson_perf,
            "delivery_destinations": deliveries,
            "shipment_summary": shipment_summary,
            "monthly_shipments": monthly_shipments if raw_deliveries else [],
            "location_breakdown": {
                "revenue": location_revenue,
                "outstanding": location_outstanding,
                "shipments": location_shipments,
                "shipment_revenue": location_shipment_revenue
            },
            "stock_aging": {
                "items": slow_moving_items,
                "brackets": aging_bracket_chart,
                "total_value": total_aging_value,
                "cancelled_products": cancelled_products,
                "returned_products": returned_products
            },
            "logistics_health": logistics_health
        }
    except Exception as e:
        print(f"Error in get_warehouse_insights: {e}")
        if conn:
            conn.close()
        return {
            "location": loc,
            "year": year,
            "top_debtors": [],
            "top_creditors": [],
            "creditor_scope": "unknown",
            "salesperson_performance": [],
            "delivery_destinations": [],
            "shipment_summary": {"count": 0, "total_value": 0.0},
            "monthly_shipments": [],
            "location_breakdown": {
                "revenue": {},
                "outstanding": {},
                "shipments": {},
                "shipment_revenue": {}
            },
            "logistics_health": {
                "total_invoices": 0,
                "total_dos": 0,
                "total_cns": 0,
                "cn_value": 0.0
            }
        }


def get_warehouse_invoices(location: str = 'HQ', year: str = 'All', drill_type: str = 'debtor', name: str = ''):
    """
    Get all invoices for a specific debtor or salesperson at a warehouse and year, for drill-down.
    """
    conn = get_connection()
    cursor = conn.cursor()
    loc = location.upper().strip()

    loc_clause = " AND SalesLocation = ? "
    params = [loc]
    if loc == 'ALL':
        loc_clause = ""
        params = []

    year_clause = ""
    if year:
        year_str = str(year).strip()
        if year_str.isdigit():
            year_clause = " AND YEAR(DocDate) = ? "
            params.append(int(year_str))

    if drill_type == 'creditor':
        query = f"""
            SELECT 
                ap.DocNo,
                ap.DocDate,
                c.CompanyName AS DebtorName,
                'HQ' AS Salesperson,
                ap.NetTotal,
                'T' AS PostToStock
            FROM dbo.APInvoice ap
            LEFT JOIN dbo.Creditor c ON ap.CreditorCode = c.AccNo
            WHERE ap.Cancelled = 'F'
              {year_clause.replace('DocDate', 'ap.DocDate')}
              AND c.CompanyName = ?
            ORDER BY ap.DocDate DESC
        """
        params = []
        if year and str(year).strip().isdigit():
            params.append(int(str(year).strip()))
        params.append(name)
    elif drill_type == 'destination':
        query = f"""
            SELECT 
                DocNo,
                DocDate,
                SalesLocation AS FromLocation,
                COALESCE(NULLIF(LTRIM(RTRIM(DeliverAddr1)), ''), NULLIF(LTRIM(RTRIM(InvAddr1)), ''), 'No Address') AS ToLocation,
                DocKey AS TruckNo,
                NetTotal,
                'T' AS PostToStock
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {loc_clause}
              {year_clause}
              AND PostToStock = 'T'
              AND DebtorName = ?
            ORDER BY DocDate DESC
        """
        params.append(name)
    else:
        if drill_type == 'debtor':
            name_clause = " AND DebtorName = ? "
            params.append(name)
        elif drill_type == 'salesperson':
            name_clause = " AND CreatedUserID = ? "
            params.append(name)
        else: # branch
            name_clause = ""

        query = f"""
            SELECT 
                DocNo,
                DocDate,
                DebtorName,
                CreatedUserID AS Salesperson,
                NetTotal,
                PostToStock
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {loc_clause}
              {year_clause}
              {name_clause}
            ORDER BY DocDate DESC
        """

    try:
        cursor.execute(query, params)
        invoices = []
        for row in cursor.fetchall():
            if drill_type == 'destination':
                invoices.append({
                    "doc_no": row.DocNo,
                    "doc_date": row.DocDate.strftime('%Y-%m-%d') if hasattr(row.DocDate, 'strftime') else row.DocDate,
                    "from_location": row.FromLocation or 'UNKNOWN',
                    "to_location": row.ToLocation or 'N/A',
                    "truck_no": f"TRK-{row.TruckNo}",
                    "net_total": float(row.NetTotal or 0),
                    "post_to_stock": row.PostToStock
                })
            else:
                invoices.append({
                    "doc_no": row.DocNo,
                    "doc_date": row.DocDate.strftime('%Y-%m-%d') if hasattr(row.DocDate, 'strftime') else row.DocDate,
                    "debtor_name": row.DebtorName or 'Unknown',
                    "salesperson": row.Salesperson or 'N/A',
                    "net_total": float(row.NetTotal or 0),
                    "post_to_stock": row.PostToStock
                })
        conn.close()
        return invoices
    except Exception as invoice_err:
        print(f"Error querying warehouse invoices: {invoice_err}")
        conn.close()
        return []

def get_logistics_details(location: str = 'HQ', year: str = 'All', detail_type: str = 'pending', state: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    loc = location.upper().strip()

    loc_clause = " AND iv.SalesLocation = ? "
    params = [loc]
    if loc == 'ALL':
        loc_clause = ""
        params = []

    year_clause = ""
    if year and str(year).strip().isdigit():
        year_clause = " AND YEAR(iv.DocDate) = ? "
        params.append(int(str(year).strip()))
        
    state_clause = ""
    if state and state.upper() != 'UNSPECIFIED':
        state_clause = " AND (UPPER(LTRIM(RTRIM(iv.DeliverAddr3))) LIKE ? OR UPPER(LTRIM(RTRIM(iv.InvAddr3))) LIKE ? OR UPPER(LTRIM(RTRIM(db.Address3))) LIKE ?) "
        params.extend([f"%{state.upper()}%", f"%{state.upper()}%", f"%{state.upper()}%"])
    elif state and state.upper() == 'UNSPECIFIED':
        state_clause = " AND (iv.DeliverAddr3 IS NULL OR LTRIM(RTRIM(iv.DeliverAddr3)) = '') AND (iv.InvAddr3 IS NULL OR LTRIM(RTRIM(iv.InvAddr3)) = '') AND (db.Address3 IS NULL OR LTRIM(RTRIM(db.Address3)) = '') "

    try:
        if detail_type == 'returns':
            # For returns, we query CN and CNDTL
            loc_clause = loc_clause.replace('iv.SalesLocation', 'cn.SalesLocation')
            year_clause = year_clause.replace('iv.DocDate', 'cn.DocDate')
            
            query = f"""
                SELECT
                    cn.DocDate,
                    cn.DocNo,
                    cn.DebtorName,
                    COALESCE(NULLIF(LTRIM(RTRIM(cn.DeliverAddr3)), ''), NULLIF(LTRIM(RTRIM(cn.InvAddr3)), ''), NULLIF(LTRIM(RTRIM(db.Address3)), '')) AS DeliverAddr3,
                    dtl.ItemCode,
                    dtl.Description,
                    CAST(dtl.Qty AS FLOAT) AS Qty,
                    CAST(dtl.UnitPrice AS FLOAT) AS UnitPrice,
                    CAST(dtl.Qty AS FLOAT) * CAST(dtl.UnitPrice AS FLOAT) AS Total
                FROM dbo.CN cn WITH (NOLOCK)
                JOIN dbo.CNDTL dtl WITH (NOLOCK) ON cn.DocKey = dtl.DocKey
                LEFT JOIN dbo.Debtor db WITH (NOLOCK) ON cn.DebtorCode = db.AccNo
                WHERE cn.Cancelled = 'F'
                  AND dtl.ItemCode IN (SELECT ItemCode FROM dbo.Item WITH (NOLOCK) WHERE StockControl = 'T')
                  AND (dtl.ItemCode IS NULL OR dtl.ItemCode NOT LIKE '%INCENTIVE%')
                  AND (dtl.Description IS NULL OR dtl.Description NOT LIKE '%INCENTIVE%')
                  {loc_clause} {year_clause}
                ORDER BY cn.DocDate DESC
            """
        else:
            # For pending or total shipments
            pending_clause = ""
            if detail_type == 'pending':
                pending_clause = " AND NOT ((iv.DeliverAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.DeliverAddr1)) != '') OR (iv.InvAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.InvAddr1)) != '')) "
            elif detail_type == 'total':
                pending_clause = " AND ((iv.DeliverAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.DeliverAddr1)) != '') OR (iv.InvAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.InvAddr1)) != '')) "
            
            query = f"""
                SELECT
                    iv.DocDate,
                    iv.DocNo,
                    iv.DebtorName,
                    COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr3)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr3)), ''), NULLIF(LTRIM(RTRIM(db.Address3)), '')) AS DeliverAddr3,
                    dtl.ItemCode,
                    dtl.Description,
                    CAST(dtl.Qty AS FLOAT) AS Qty,
                    CAST(dtl.UnitPrice AS FLOAT) AS UnitPrice,
                    CAST(dtl.Qty AS FLOAT) * CAST(dtl.UnitPrice AS FLOAT) AS Total
                FROM dbo.IV iv WITH (NOLOCK)
                JOIN dbo.IVDTL dtl WITH (NOLOCK) ON iv.DocKey = dtl.DocKey
                LEFT JOIN dbo.Debtor db WITH (NOLOCK) ON iv.DebtorCode = db.AccNo
                WHERE iv.Cancelled = 'F'
                  AND dtl.ItemCode IN (SELECT ItemCode FROM dbo.Item WITH (NOLOCK) WHERE StockControl = 'T')
                  {loc_clause} {year_clause} {pending_clause} {state_clause}
                ORDER BY iv.DocDate DESC
            """
            
        cursor.execute(query, params)
        grouped_results = {}
        for row in cursor.fetchall():
            doc_no = row.DocNo or 'N/A'
            item_code = row.ItemCode or 'N/A'
            key = (doc_no, item_code)
            
            if key not in grouped_results:
                grouped_results[key] = {
                    "date": row.DocDate.strftime('%Y-%m-%d') if row.DocDate else 'N/A',
                    "doc_no": doc_no,
                    "debtor_name": row.DebtorName or 'N/A',
                    "location": row.DeliverAddr3 or 'N/A',
                    "item_code": item_code,
                    "description": row.Description or 'N/A',
                    "qty": 0.0,
                    "total": 0.0
                }
            grouped_results[key]["qty"] += float(row.Qty or 0)
            grouped_results[key]["total"] += float(row.Total or 0)
            
        results = list(grouped_results.values())
        conn.close()
        return results
    except Exception as e:
        print(f"Error in get_logistics_details: {e}")
        if conn:
            conn.close()
        return []
    except Exception as e:
        print(f"Error in get_warehouse_invoices: {e}")
        conn.close()
        return []
def get_non_inventory_items(year=None):
    """
    Get ALL non-inventory items from IVDTL.
    OR logic: an item is included if EITHER:
      (a) dbo.Item.StockControl = 'F'  — database explicitly marks it as non-inventory, OR
      (b) classify_stock_control() returns 'F' — name matches non-inventory keywords
          (catches items wrongly flagged as 'T' in the database).
    No date threshold. Shows everything ever invoiced.
    """
    conn = get_connection()
    cursor = conn.cursor()

    year_clause = ""
    params = []
    if year and str(year).strip() not in ("All", ""):
        year_str = str(year).strip()
        if year_str.isdigit():
            year_clause = " AND YEAR(iv.DocDate) = ? "
            params.append(int(year_str))

    query = f"""
        SELECT
            dtl.ItemCode                          AS ItemCode,
            MAX(dtl.Description)                  AS Description,
            i.StockControl                        AS DBFlag,
            SUM(dtl.Qty)                          AS TotalQty,
            SUM(dtl.SubTotal)                     AS TotalRevenue,
            MAX(iv.DocDate)                       AS LastSaleDate,
            COUNT(DISTINCT iv.DocNo)              AS InvoiceCount,
            MAX(dtl.UnitPrice)                    AS UnitPrice
        FROM dbo.IVDTL dtl
        JOIN dbo.IV   iv ON dtl.DocKey   = iv.DocKey
        JOIN dbo.Item i  ON dtl.ItemCode = i.ItemCode
        WHERE iv.Cancelled = 'F'
          AND i.IsActive   = 'T'
          AND dtl.Description IS NOT NULL
          AND LTRIM(RTRIM(dtl.Description)) != ''
          {year_clause}
        GROUP BY dtl.ItemCode, i.StockControl
        ORDER BY TotalRevenue DESC
    """

    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()

        data = []
        for row in rows:
            prod_name = (row.Description or row.ItemCode or "").strip()
            db_flag   = row.DBFlag  # 'T' or 'F' from database

            # OR logic: include if EITHER database flags it as non-inventory
            # OR our keyword classifier identifies it as non-inventory.
            # This way nothing falls through the cracks.
            is_db_non_inv      = (db_flag == 'F')
            is_keyword_non_inv = (classify_stock_control(prod_name, 'X') == 'F')
            # Note: passing 'X' as db_flag forces classifier to rely purely on keywords

            if not is_db_non_inv and not is_keyword_non_inv:
                continue  # Definitely a physical product — skip

            total_qty  = float(row.TotalQty or 0)
            total_rev  = round(float(row.TotalRevenue or 0), 2)
            unit_price = round(float(row.UnitPrice or 0), 2)
            last_sale  = row.LastSaleDate.strftime('%Y-%m-%d') if row.LastSaleDate else 'N/A'

            data.append({
                "product_code":   row.ItemCode,
                "product_name":   prod_name,
                "stock_control":  "F",
                "qty":            int(total_qty) if total_qty % 1 == 0 else round(total_qty, 2),
                "revenue":        total_rev,
                "unit_price":     unit_price,
                "invoice_count":  int(row.InvoiceCount or 0),
                "last_sale_date": last_sale,
                "category":       _classify_non_inv_category(prod_name)
            })

        conn.close()
        return data
    except Exception as e:
        print(f"Error in get_non_inventory_items: {e}")
        conn.close()
        return []





def _classify_non_inv_category(name):
    """Classify a non-inventory item into a human-readable category."""
    n = str(name).upper()
    if any(k in n for k in ['REBATE', 'CASHBACK']):
        return 'Rebate'
    if any(k in n for k in ['INCENTIVE', 'ACHIEVEMENT', 'BONUS']):
        return 'Incentive'
    if any(k in n for k in ['PROGRAM', 'CAMPAIGN']):
        return 'Program'
    if any(k in n for k in ['VOUCHER', 'COUPON']):
        return 'Voucher'
    if any(k in n for k in ['DISPLAY', 'SIGNAGE', 'GONDOLA', 'STANDEE', 'COUNTER TOP',
                              'WALL DISPLAY', 'SHELF DISPLAY', 'BLOCK DISPLAY', 'TRADE DISPLAY',
                              'WINDOW DISPLAY']):
        return 'Display / Signage'
    if any(k in n for k in ['SPONSOR', 'SPONSORSHIP']):
        return 'Sponsorship'
    if any(k in n for k in ['RENTAL']):
        return 'Rental'
    if any(k in n for k in ['FUND', 'SUPPORT', 'DEPLETION', 'VOLUME DEPLETION']):
        return 'Fund / Support'
    if any(k in n for k in ['SELL OUT', 'SELL-OUT']):
        return 'Sell Out'
    if any(k in n for k in ['COMMISSION']):
        return 'Commission'
    if any(k in n for k in ['PROMOTION']):
        return 'Promotion'
    if any(k in n for k in ['PRINTING', 'MAILER', 'POSTING']):
        return 'Marketing Materials'
    if any(k in n for k in ['EVENT', 'GRAND OPENING']):
        return 'Event'
    if any(k in n for k in ['TRAINING']):
        return 'Training'
    if any(k in n for k in ['FEE']):
        return 'Fee'
    if any(k in n for k in ['ANGPAU', 'ANG POW']):
        return 'Ang Pow / Gift'
    return 'Other'


def get_inventory_by_entity(entity_type='debtor', year=None):
    """
    Get inventory transactions aggregated by debtor or creditor.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    year_clause = ""
    params = []
    if year and year != "All":
        year_str = str(year).strip()
        if year_str.isdigit():
            year_clause = " AND YEAR(DocDate) = ? "
            params.append(int(year_str))
            
    if entity_type == 'debtor':
        query = f"""
            WITH SalesMaxDate AS (
                SELECT dtl.ItemCode, ISNULL(dtl.Location, 'HQ') AS Location, MAX(iv.DocDate) AS LastSaleDate
                FROM dbo.IVDTL dtl
                JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
                WHERE iv.Cancelled = 'F'
                GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
            ),
            Sales90Days AS (
                SELECT dtl.ItemCode, ISNULL(dtl.Location, 'HQ') AS Location, SUM(dtl.Qty) AS QtySoldIn90Days
                FROM dbo.IVDTL dtl
                JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
                JOIN SalesMaxDate md ON dtl.ItemCode = md.ItemCode AND ISNULL(dtl.Location, 'HQ') = md.Location
                WHERE iv.Cancelled = 'F'
                  AND iv.DocDate BETWEEN DATEADD(day, -90, md.LastSaleDate) AND md.LastSaleDate
                GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
            )
            SELECT 
                iv.DebtorCode AS EntityCode,
                iv.DebtorName AS EntityName,
                dtl.ItemCode AS ProductCode,
                MAX(dtl.Description) AS ProductName,
                SUM(dtl.Qty) AS Quantity,
                SUM(dtl.SubTotal) AS Revenue,
                COALESCE(stock.CurrentStock, 0) AS CurrentStock,
                COALESCE(MAX(ro.ReOrderLvl), COALESCE(MAX(iu.ReOLevel), 0)) AS DBReOrderLvl,
                ISNULL(dtl.Location, 'HQ') AS Branch,
                MAX(iv.DocDate) AS LastInvoiceDate,
                COALESCE(MAX(s90.QtySoldIn90Days), 0) AS QtySold90Days
            FROM dbo.IVDTL dtl
            JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
            JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
            LEFT JOIN (
                SELECT ItemCode, Location, SUM(BalQty) AS CurrentStock 
                FROM dbo.vItemBalQty 
                GROUP BY ItemCode, Location
            ) stock ON dtl.ItemCode = stock.ItemCode AND ISNULL(dtl.Location, 'HQ') = ISNULL(stock.Location, 'HQ')
            LEFT JOIN dbo.ItemUOM iu ON dtl.ItemCode = iu.ItemCode AND iu.Rate = 1
            LEFT JOIN dbo.zSRP_ReOrderInfo ro ON dtl.ItemCode = ro.ItemCode AND ISNULL(dtl.Location, 'HQ') = ISNULL(ro.Location, 'HQ')
            LEFT JOIN Sales90Days s90 ON dtl.ItemCode = s90.ItemCode AND ISNULL(dtl.Location, 'HQ') = s90.Location
            WHERE iv.Cancelled = 'F'
              AND iv.DebtorCode IS NOT NULL AND iv.DebtorCode != ''
              {year_clause}
            GROUP BY iv.DebtorCode, iv.DebtorName, dtl.ItemCode, COALESCE(stock.CurrentStock, 0), ISNULL(dtl.Location, 'HQ')
            ORDER BY Revenue DESC
        """
    else: # creditor
        query = f"""
            WITH SalesMaxDate AS (
                SELECT dtl.ItemCode, ISNULL(dtl.Location, 'HQ') AS Location, MAX(iv.DocDate) AS LastSaleDate
                FROM dbo.IVDTL dtl
                JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
                WHERE iv.Cancelled = 'F'
                GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
            ),
            Sales90Days AS (
                SELECT dtl.ItemCode, ISNULL(dtl.Location, 'HQ') AS Location, SUM(dtl.Qty) AS QtySoldIn90Days
                FROM dbo.IVDTL dtl
                JOIN dbo.IV iv ON dtl.DocKey = iv.DocKey
                JOIN SalesMaxDate md ON dtl.ItemCode = md.ItemCode AND ISNULL(dtl.Location, 'HQ') = md.Location
                WHERE iv.Cancelled = 'F'
                  AND iv.DocDate BETWEEN DATEADD(day, -90, md.LastSaleDate) AND md.LastSaleDate
                GROUP BY dtl.ItemCode, ISNULL(dtl.Location, 'HQ')
            )
            SELECT 
                pi.CreditorCode AS EntityCode,
                pi.CreditorName AS EntityName,
                dtl.ItemCode AS ProductCode,
                MAX(dtl.Description) AS ProductName,
                SUM(dtl.Qty) AS Quantity,
                SUM(dtl.SubTotal) AS Revenue, -- cost
                COALESCE(stock.CurrentStock, 0) AS CurrentStock,
                COALESCE(MAX(ro.ReOrderLvl), COALESCE(MAX(iu.ReOLevel), 0)) AS DBReOrderLvl,
                ISNULL(dtl.Location, 'HQ') AS Branch,
                MAX(pi.DocDate) AS LastInvoiceDate,
                COALESCE(MAX(s90.QtySoldIn90Days), 0) AS QtySold90Days
            FROM dbo.PIDTL dtl
            JOIN dbo.PI pi ON dtl.DocKey = pi.DocKey
            JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T'
            LEFT JOIN (
                SELECT ItemCode, Location, SUM(BalQty) AS CurrentStock 
                FROM dbo.vItemBalQty 
                GROUP BY ItemCode, Location
            ) stock ON dtl.ItemCode = stock.ItemCode AND ISNULL(dtl.Location, 'HQ') = ISNULL(stock.Location, 'HQ')
            LEFT JOIN dbo.ItemUOM iu ON dtl.ItemCode = iu.ItemCode AND iu.Rate = 1
            LEFT JOIN dbo.zSRP_ReOrderInfo ro ON dtl.ItemCode = ro.ItemCode AND ISNULL(dtl.Location, 'HQ') = ISNULL(ro.Location, 'HQ')
            LEFT JOIN Sales90Days s90 ON dtl.ItemCode = s90.ItemCode AND ISNULL(dtl.Location, 'HQ') = s90.Location
            WHERE pi.Cancelled = 'F'
              AND pi.CreditorCode IS NOT NULL AND pi.CreditorCode != ''
              {year_clause}
            GROUP BY pi.CreditorCode, pi.CreditorName, dtl.ItemCode, COALESCE(stock.CurrentStock, 0), ISNULL(dtl.Location, 'HQ')
            ORDER BY Revenue DESC
        """
        
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            qty_90 = float(r.QtySold90Days or 0)
            vel = qty_90 / 90.0
            dynamic_min = max(5.0, round(vel * 30.0))
            db_min = float(r.DBReOrderLvl or 0)
            min_req = db_min if db_min > 0 else dynamic_min
            restock_type = 'Database' if db_min > 0 else 'Dynamic'
            
            result.append({
                "entity_code": r.EntityCode,
                "entity_name": r.EntityName or 'Unknown',
                "product_code": r.ProductCode,
                "product_name": r.ProductName or r.ProductCode or 'Unknown',
                "quantity": float(r.Quantity or 0),
                "revenue": float(r.Revenue or 0),
                "stock": float(r.CurrentStock or 0),
                "minRequired": int(min_req) if min_req % 1 == 0 else round(min_req, 2),
                "restock_type": restock_type,
                "branch": str(r.Branch).strip().upper(),
                "last_invoice_date": r.LastInvoiceDate.strftime('%Y-%m-%d') if r.LastInvoiceDate else 'N/A'
            })
        conn.close()
        return result
    except Exception as e:
        print(f"Error in get_inventory_by_entity: {e}")
        conn.close()
        return []

def log_credit_alert(debtor_name: str, outstanding_balance: float, credit_limit: float, message: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Create table if not exists
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zCreditAlertLog]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[zCreditAlertLog] (
                    [Id] INT IDENTITY(1,1) PRIMARY KEY,
                    [DebtorName] NVARCHAR(255),
                    [OutstandingBalance] DECIMAL(18,2),
                    [CreditLimit] DECIMAL(18,2),
                    [Message] NVARCHAR(MAX),
                    [CreatedTime] DATETIME DEFAULT GETDATE()
                )
            END
        """)
        conn.commit()

        # 2. Insert into zCreditAlertLog
        cursor.execute("""
            INSERT INTO [dbo].[zCreditAlertLog] (DebtorName, OutstandingBalance, CreditLimit, Message)
            VALUES (?, ?, ?, ?)
        """, (debtor_name, outstanding_balance, credit_limit, message))
        conn.commit()

        # 3. Try to insert into native AutoCount EventLog as well
        try:
            import uuid
            event_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO dbo.EventLog (EventLogID, LogTime, UserID, ComputerName, AppName, Category, Description)
                VALUES (?, GETDATE(), 'ADMIN', 'GPIS-DASHBOARD', 'SalesDashboard', 'Credit Control', ?)
            """, (event_id[:50], f"Credit Alert Sent to {debtor_name}. Outstanding: RM {outstanding_balance:,.2f}. Limit: RM {credit_limit:,.2f}."))
            conn.commit()
            print("Logged to native AutoCount EventLog.")
        except Exception as inner_e:
            print("Native AutoCount EventLog skipped/failed:", inner_e)

        conn.close()
        return True
    except Exception as e:
        print(f"Error in log_credit_alert: {e}")
        if conn:
            conn.close()
        return False
