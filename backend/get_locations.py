import database as db
conn = db.get_connection()
cursor = conn.cursor()
cursor.execute("SELECT SalesLocation, COUNT(*) FROM dbo.IV WHERE Cancelled='F' AND SalesLocation IS NOT NULL GROUP BY SalesLocation")
print([list(x) for x in cursor.fetchall()])
