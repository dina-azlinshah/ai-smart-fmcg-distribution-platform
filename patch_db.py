import sys

file_path = r"c:\Users\User\Downloads\GPIS SOLUTION\website latest\sales-dashboard\backend\database.py"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "def get_warehouse_insights(location='HQ', year=None):" in line:
        lines[i] = "def get_warehouse_insights(location='HQ', year=None, lite=False):\n"
        break

for i, line in enumerate(lines):
    if "        # ── 4. Stock Aging & Slow-Moving Stock ──" in line:
        idx_aging = i
        break

for i, line in enumerate(lines):
    if "        # ── REAL LOGISTICS HEALTH (IV, DO, CN) ──" in line:
        idx_logistics = i
        break

if idx_aging != -1 and idx_logistics != -1:
    # We need to wrap everything between idx_aging+4 and idx_logistics with if not lite:
    # First, let's locate the initialization of these variables
    init_vars = """        slow_moving_items = []
        aging_bracket_chart = []
        total_aging_value = 0.0
        cancelled_products = []
        returned_products = []
        
        if not lite:
"""
    
    # Let's replace the original initialization lines with our new block
    # The original starts at idx_aging + 1
    # slow_moving_items = []
    # aging_bracket_chart = []
    # total_aging_value = 0.0
    
    lines[idx_aging + 1] = init_vars
    lines[idx_aging + 2] = ""
    lines[idx_aging + 3] = ""
    
    # Now we need to indent everything from idx_aging + 4 up to idx_logistics - 1
    for i in range(idx_aging + 4, idx_logistics):
        # cancelled_products = [] and returned_products = [] are defined later in the code.
        # But we already initialized them above, so we can just indent.
        if "cancelled_products = []" in lines[i]:
            lines[i] = ""
        elif "returned_products = []" in lines[i]:
            lines[i] = ""
        elif lines[i].strip() != "":
            lines[i] = "    " + lines[i]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("DATABASE PATCHED")
