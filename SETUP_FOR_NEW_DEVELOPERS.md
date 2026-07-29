# Setup Instructions for New Developers

This guide will help your friend and any new developers set up the FMCG Sales Dashboard on their machine.

## Prerequisites

Before starting, ensure you have:
- **SQL Server** installed with the `AED_FM` database (or your custom database name)
- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **Git** (if cloning the repository)

## Step 1: Get Your Database Server Name

You need to find your SQL Server instance name:

### On Windows:
1. Open **SQL Server Management Studio (SSMS)**
2. Look at the **Server name** field when you connect
3. It will look something like:
   - `DESKTOP-ABC123\A2022`
   - `YOUR-PC\SQLEXPRESS`
   - `LAPTOP-XYZ\AED_YOU`
   - Or just a server IP address like `192.168.1.100`

### If you don't have SSMS:
1. Open **PowerShell** as Administrator
2. Run:
   ```powershell
   Get-ChildItem 'HKLM:\Software\Microsoft\Microsoft SQL Server' | Select-Object -ExpandProperty PSChildName
   ```
3. This will show you SQL Server instances installed on your machine

## Step 2: Clone/Download the Project

If you don't have the project yet:
```bash
git clone <repository-url>
cd sales-dashboard
```

Or if you have it downloaded, open a terminal in the `sales-dashboard` folder.

## Step 3: Create Your `.env` File

1. In the `sales-dashboard` folder, copy the template file:
   ```bash
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)

2. Open the `.env` file in any text editor (VS Code, Notepad, etc.)

3. Update the database connection:
   ```
   # Replace with YOUR database server name
   DB_SERVER=YOUR-SERVER-NAME\YOUR-INSTANCE
   
   # Usually stays the same, unless you have a different database name
   DB_NAME=AED_FM
   ```

   **Examples:**

   **User 1:**
   ```
   DB_SERVER=DESKTOP-JGIHF8T\A2022
   DB_NAME=AED_FM
   ```

   **User 2 (Friend):**
   ```
   DB_SERVER=LAPTOP-FRIEND\AED_YOU
   DB_NAME=AED_FM
   ```

4. Save the file

## Step 4: Set Up Python Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Verify database connection
python -c "from database import test_connection; print('DB Connected!' if test_connection() else 'DB Connection Failed!')"
```

If you see `DB Connected!`, you're good! If you see `DB Connection Failed!`, check your `DB_SERVER` value in `.env`.

## Step 5: Set Up Node.js Frontend

```bash
cd ../frontend

# Install Node dependencies
npm install
```

## Step 6: Start the Website

Go back to the main `sales-dashboard` folder:

```bash
# Option 1: Use the start script (Windows only)
.\start_website.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend (new terminal window)
cd frontend
npm run dev
```

The website will open automatically at **http://localhost:5173**

---

## Troubleshooting

### ❌ "DB Connection Failed!"

**Problem:** Cannot connect to SQL Server

**Solutions:**
1. **Wrong server name** - Check your `DB_SERVER` value in `.env`
   - Open SQL Server Management Studio
   - Copy the exact server name shown
   
2. **SQL Server not running** - Start SQL Server:
   ```bash
   # Windows Services > SQL Server
   # Or via Services.msc
   ```

3. **Database doesn't exist** - Create the database:
   - Ask your original developer for the database backup/script
   - Import it into SQL Server with your server name

4. **Firewall/Network issue** - If using a remote server:
   - Ensure TCP/IP is enabled in SQL Server Configuration Manager
   - Check firewall rules

### ❌ "Cannot find module" or "No module named..."

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```

### ❌ Frontend not loading at localhost:5173

```bash
cd frontend
npm run dev
```

Make sure the terminal shows "Local: http://localhost:5173"

### ❌ Backend errors

```bash
cd backend
python main.py
```

Check the console output for specific errors. Most common:
- Database connection (see above)
- Missing Python packages - reinstall with `pip install -r requirements.txt`

---

## Important Notes

⚠️ **DO NOT share your `.env` file** - it contains your personal database connection details

⚠️ **Never commit `.env` to Git** - it's automatically ignored by `.gitignore`

⚠️ **Each person needs their own `.env` file** with their database server name

---

## Getting Help

If you encounter issues:

1. Check that Python/Node.js/SQL Server are properly installed
2. Verify your database server name in `.env`
3. Check the backend console for error messages
4. Contact the original developer with the error message

Good luck! 🚀
