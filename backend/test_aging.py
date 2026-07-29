import sys
import os
sys.path.append(r"c:\Users\User\Downloads\GPIS SOLUTION\website latest\sales-dashboard\backend")
import database as db

conn = db.get_connection()
cursor = conn.cursor()

try:
    cursor.execute("SELECT ItemCode FROM dbo.Item WITH (NOLOCK) WHERE StockControl = 'T'")
    items = cursor.fetchall()
    print("Items with StockControl='T':", len(items))
    
    cursor.execute("SELECT dtl.ItemCode, SUM(CAST(dtl.Qty AS FLOAT)) FROM dbo.IVDTL dtl WITH (NOLOCK) JOIN dbo.IV iv WITH (NOLOCK) ON dtl.DocKey = iv.DocKey WHERE iv.Cancelled = 'F' GROUP BY dtl.ItemCode HAVING SUM(CAST(dtl.Qty AS FLOAT)) > 0")
    ivdtl_items = cursor.fetchall()
    print("Items in IVDTL:", len(ivdtl_items))
    
    match_count = sum(1 for row in ivdtl_items if any(row.ItemCode == i.ItemCode for i in items))
    print("Items in IVDTL that match StockControl='T':", match_count)
    
except Exception as e:
    print("Error:", e)
