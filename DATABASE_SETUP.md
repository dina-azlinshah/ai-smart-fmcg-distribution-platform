# Database Configuration Guide

## For New Developers

When you first clone/download this project, you need to configure the database connection:

### Step 1: Copy the configuration template
```bash
cp .env.example .env
```

### Step 2: Edit `.env` with your database details
Open the `.env` file and update the database connection details:

```
DB_SERVER=YOUR-SERVER-NAME\YOUR-INSTANCE
DB_NAME=AED_FM
```

**Find your SQL Server name:**
- Open SQL Server Management Studio (SSMS)
- Look at the top where it says "Server name:"
- Copy that name exactly (e.g., `YOUR-PC\SQLEXPRESS` or `DESKTOP-ABC123\A2022`)

### Step 3: Verify connection
Run the backend:
```bash
cd backend
python main.py
```

Check the console for "DB Check Error" messages. If you see them, your database connection string is wrong.

### Example Configurations

**User 1 (Original developer):**
```
DB_SERVER=DESKTOP-JGIHF8T\A2022
DB_NAME=AED_FM
```

**User 2 (Friend collaborating):**
```
DB_SERVER=LAPTOP-XYZ\AED_YOU
DB_NAME=AED_FM
```

**User 3 (Remote server):**
```
DB_SERVER=192.168.1.100\SQLEXPRESS
DB_NAME=AED_FM
```

### Important Notes
- The `.env` file is **NOT** shared in Git (it's in `.gitignore`)
- Each person must have their own `.env` file with their database details
- Never commit `.env` to version control
- Database must already be set up with the schema before running the website
