"""
Script to set up CompanyInfo table for company data management
Run this script to create the necessary database tables
"""

import pyodbc
import sys
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

def setup_company_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Setting up CompanyInfo table...")
    
    # Check if CompanyInfo table exists
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'CompanyInfo'
    """)
    
    if cursor.fetchone()[0] == 0:
        print("Creating CompanyInfo table...")
        cursor.execute("""
            CREATE TABLE dbo.CompanyInfo (
                CompanyID INT IDENTITY(1,1) PRIMARY KEY,
                CompanyName NVARCHAR(200) NOT NULL,
                RegistrationNumber NVARCHAR(50),
                Address NVARCHAR(500),
                Phone NVARCHAR(50),
                Email NVARCHAR(100),
                Website NVARCHAR(100),
                Industry NVARCHAR(50),
                EmployeeCount INT,
                EstablishedYear INT,
                TaxNumber NVARCHAR(50),
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE()
            )
        """)
        print("CompanyInfo table created successfully!")
    else:
        print("CompanyInfo table already exists.")
    
    # Check if Warehouses table exists
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Warehouses'
    """)
    
    if cursor.fetchone()[0] == 0:
        print("Creating Warehouses table...")
        cursor.execute("""
            CREATE TABLE dbo.Warehouses (
                WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
                WarehouseName NVARCHAR(100) NOT NULL,
                Location NVARCHAR(100),
                Address NVARCHAR(500),
                Capacity INT DEFAULT 10000,
                Status NVARCHAR(20) DEFAULT 'Active',
                CreatedAt DATETIME DEFAULT GETDATE()
            )
        """)
        print("Warehouses table created successfully!")
    else:
        print("Warehouses table already exists.")
    
    # Check if Products table exists
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Products'
    """)
    
    if cursor.fetchone()[0] == 0:
        print("Creating Products table...")
        cursor.execute("""
            CREATE TABLE dbo.Products (
                ProductID INT IDENTITY(1,1) PRIMARY KEY,
                ProductCode NVARCHAR(50) NOT NULL UNIQUE,
                ProductName NVARCHAR(200) NOT NULL,
                Category NVARCHAR(50),
                UnitPrice DECIMAL(18,2) DEFAULT 0,
                MinStockLevel INT DEFAULT 10,
                Description NVARCHAR(500),
                CreatedAt DATETIME DEFAULT GETDATE()
            )
        """)
        print("Products table created successfully!")
    else:
        print("Products table already exists.")
    
    # Check if Inventory table exists
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Inventory'
    """)
    
    if cursor.fetchone()[0] == 0:
        print("Creating Inventory table...")
        cursor.execute("""
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
        print("Inventory table created successfully!")
    else:
        print("Inventory table already exists.")
    
    # Check if SyncLog table exists
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'SyncLog'
    """)
    
    if cursor.fetchone()[0] == 0:
        print("Creating SyncLog table...")
        cursor.execute("""
            CREATE TABLE dbo.SyncLog (
                LogID INT IDENTITY(1,1) PRIMARY KEY,
                SyncType NVARCHAR(50),
                Status NVARCHAR(20),
                RecordsProcessed INT DEFAULT 0,
                Message NVARCHAR(500),
                SyncDate DATETIME DEFAULT GETDATE()
            )
        """)
        print("SyncLog table created successfully!")
    else:
        print("SyncLog table already exists.")
    
    conn.commit()
    conn.close()
    
    print("\n[SUCCESS] All tables setup complete!")
    print("\nYou can now use the Company Data Entry page to:")
    print("- Add your company information")
    print("- Add warehouse locations")
    print("- Add products")
    print("- Set initial inventory levels")
    print("\nThis data will automatically populate across all packages!")

if __name__ == "__main__":
    try:
        setup_company_tables()
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        sys.exit(1)
