import database as db
conn = db.get_connection()
cursor = conn.cursor()

try:
    cursor.execute("SELECT TOP 10 * FROM dbo.ItemBatchBalQty")
    rows = cursor.fetchall()
    print("ItemBatchBalQty rows:", len(rows))
except Exception as e:
    print("ItemBatchBalQty error:", e)

try:
    cursor.execute("SELECT TOP 10 ItemCode, Location, BalQty FROM dbo.ItemLocation")
    rows = cursor.fetchall()
    print("ItemLocation rows:", len(rows))
    for r in rows: print(r)
except Exception as e:
    print("ItemLocation error:", e)
