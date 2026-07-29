import database as db
conn = db.get_connection()
cursor = conn.cursor()

try:
    cursor.execute("SELECT COUNT(*) FROM dbo.CN")
    print("CN count:", cursor.fetchone()[0])
except Exception as e:
    print("CN error:", e)

try:
    cursor.execute("SELECT COUNT(*) FROM dbo.CN WHERE Cancelled = 'F'")
    print("CN uncancelled count:", cursor.fetchone()[0])
except Exception as e:
    print("CN uncancelled error:", e)

try:
    cursor.execute("SELECT COUNT(DISTINCT cn.DocNo) FROM dbo.CN cn JOIN dbo.CNDTL dtl ON cn.DocKey = dtl.DocKey JOIN dbo.Item it ON dtl.ItemCode = it.ItemCode AND it.StockControl = 'T' WHERE cn.Cancelled = 'F'")
    print("CN physical items count:", cursor.fetchone()[0])
except Exception as e:
    print("CN physical items error:", e)
