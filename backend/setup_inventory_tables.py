"""
Script to create inventory, warehouse, and product tables for the Sales Dashboard.
Run this once to set up the database tables.
"""
import pyodbc
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

server = os.getenv('DB_SERVER', r'DESKTOP-JGIHF8T\A2022')
db_name = os.getenv('DB_NAME', 'AED_FM')

def get_connection():
    return pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        f'SERVER={server};'
        f'DATABASE={db_name};'
        'Trusted_Connection=yes;'
    )

def setup_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Create Warehouses table
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Warehouses')
        CREATE TABLE dbo.Warehouses (
            WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
            WarehouseName NVARCHAR(100) NOT NULL,
            Location NVARCHAR(200),
            Address NVARCHAR(500),
            Capacity INT,
            Status NVARCHAR(20) DEFAULT 'Active',
            CreatedDate DATETIME DEFAULT GETDATE()
        )
    """)
    
    # 2. Create Products table
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
        CREATE TABLE dbo.Products (
            ProductID INT IDENTITY(1,1) PRIMARY KEY,
            ProductCode NVARCHAR(50) UNIQUE NOT NULL,
            ProductName NVARCHAR(200) NOT NULL,
            Description NVARCHAR(500),
            Category NVARCHAR(100),
            UnitPrice DECIMAL(18,2),
            MinStockLevel INT DEFAULT 10,
            CreatedDate DATETIME DEFAULT GETDATE()
        )
    """)
    
    # 3. Create Inventory table (links Products to Warehouses)
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inventory')
        CREATE TABLE dbo.Inventory (
            InventoryID INT IDENTITY(1,1) PRIMARY KEY,
            ProductID INT NOT NULL,
            WarehouseID INT NOT NULL,
            StockQuantity INT DEFAULT 0,
            LastUpdated DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID),
            FOREIGN KEY (WarehouseID) REFERENCES dbo.Warehouses(WarehouseID)
        )
    """)
    
    # 4. Create SyncLog table for tracking data syncs
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncLog')
        CREATE TABLE dbo.SyncLog (
            SyncID INT IDENTITY(1,1) PRIMARY KEY,
            SyncType NVARCHAR(50) NOT NULL,
            Status NVARCHAR(20) NOT NULL,
            RecordsProcessed INT,
            SyncDate DATETIME DEFAULT GETDATE(),
            Message NVARCHAR(500)
        )
    """)
    
    conn.commit()
    print("Tables created successfully!")
    
    # Insert sample data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM dbo.Warehouses")
    if cursor.fetchone()[0] == 0:
        print("Inserting sample warehouse data...")
        cursor.execute("""
            INSERT INTO dbo.Warehouses (WarehouseName, Location, Address, Capacity, Status)
            VALUES 
            ('Main Warehouse KL', 'Kuala Lumpur', 'No. 25, Jalan Universiti, Seksyen 13, 40100 Shah Alam, Selangor', 10000, 'Active'),
            ('Regional Hub Penang', 'Penang', '42, Jalan Burma, Georgetown, 10050 Penang', 8000, 'Active'),
            ('South Hub Johor', 'Johor Bahru', '88, Jalan Tebrau, 80250 Johor Bahru, Johor', 6000, 'Active')
        """)
    
    cursor.execute("SELECT COUNT(*) FROM dbo.Products")
    if cursor.fetchone()[0] == 0:
        print("Inserting sample product data...")
        cursor.execute("""
            INSERT INTO dbo.Products (ProductCode, ProductName, Description, Category, UnitPrice, MinStockLevel)
            VALUES 
            ('PROD-001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'Electronics', 45.00, 20),
            ('PROD-002', 'Mechanical Keyboard', 'RGB mechanical gaming keyboard', 'Electronics', 150.00, 15),
            ('PROD-003', 'USB-C Cable', 'Fast charging USB-C to USB-C cable 2m', 'Accessories', 25.00, 50),
            ('PROD-004', 'Laptop Stand', 'Adjustable aluminum laptop stand', 'Accessories', 85.00, 10),
            ('PROD-005', 'Webcam 1080p', 'Full HD webcam with microphone', 'Electronics', 120.00, 12),
            ('PROD-006', 'Desk Lamp LED', 'LED desk lamp with touch control', 'Furniture', 65.00, 8),
            ('PROD-007', 'Monitor 24 inch', '24-inch Full HD IPS monitor', 'Electronics', 450.00, 5),
            ('PROD-008', 'HDMI Cable 3m', 'High-speed HDMI cable 3 meters', 'Accessories', 35.00, 30)
        """)
    
    cursor.execute("SELECT COUNT(*) FROM dbo.Inventory")
    if cursor.fetchone()[0] == 0:
        print("Inserting sample inventory data...")
        cursor.execute("""
            INSERT INTO dbo.Inventory (ProductID, WarehouseID, StockQuantity)
            VALUES 
            (1, 1, 45), (1, 2, 20), (1, 3, 15),
            (2, 1, 8), (2, 2, 12), (2, 3, 5),
            (3, 1, 120), (3, 2, 80), (3, 3, 60),
            (4, 1, 23), (4, 2, 18), (4, 3, 10),
            (5, 1, 5), (5, 2, 8), (5, 3, 12),
            (6, 1, 15), (6, 2, 10), (6, 3, 8),
            (7, 1, 3), (7, 2, 5), (7, 3, 2),
            (8, 1, 67), (8, 2, 45), (8, 3, 30)
        """)
    
    conn.commit()
    print("Sample data inserted successfully!")
    conn.close()
    print("Setup complete!")

if __name__ == "__main__":
    setup_tables()
