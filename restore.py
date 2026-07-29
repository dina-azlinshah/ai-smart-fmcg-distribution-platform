import sys

file_path = r"c:\Users\User\Downloads\GPIS SOLUTION\website latest\sales-dashboard\backend\database.py"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

missing_content = """                "aov": aov,
                "commission": commission,
                "status": status
            })

        # Query total revenue by SalesLocation for breakdown (ALWAYS all locations for flashcards)
        revenue_by_loc_query = f\"\"\"
            SELECT SalesLocation, SUM(NetTotal) AS TotalRevenue
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {year_clause}
            GROUP BY SalesLocation
        \"\"\"
        rev_params = []
        if is_valid_year:
            rev_params.append(int(str(year).strip()))
        cursor.execute(revenue_by_loc_query, rev_params)
        location_revenue = {row.SalesLocation or 'UNKNOWN': float(row.TotalRevenue or 0) for row in cursor.fetchall()}

        # Query outstanding by location (ALWAYS all locations for flashcards)
        outstanding_by_loc_query = f\"\"\"
            SELECT iv.SalesLocation, SUM(COALESCE(ar.Outstanding, 0)) AS TotalOutstanding
            FROM dbo.IV iv
            LEFT JOIN dbo.Debtor d ON iv.DebtorCode = d.AccNo
            LEFT JOIN dbo.ARInvoice ar ON iv.DocNo = ar.DocNo
            WHERE iv.Cancelled = 'F'
              {year_clause.replace('DocDate', 'iv.DocDate')}
              AND iv.SalesLocation IS NOT NULL
            GROUP BY iv.SalesLocation
        \"\"\"
        out_params = []
        if is_valid_year:
            out_params.append(int(str(year).strip()))
        cursor.execute(outstanding_by_loc_query, out_params)
        location_outstanding = {row.SalesLocation or 'UNKNOWN': float(row.TotalOutstanding or 0) for row in cursor.fetchall()}

        # Query shipments by location (ALWAYS all locations for flashcards)
        shipments_by_loc_query = f\"\"\"
            SELECT SalesLocation,
                   COUNT(*) AS TotalShipments,
                   SUM(NetTotal) AS TotalShipmentRevenue
            FROM dbo.IV
            WHERE Cancelled = 'F'
              {year_clause}
              AND SalesLocation IS NOT NULL
              AND PostToStock = 'T'
            GROUP BY SalesLocation
        \"\"\"
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
        deliveries_query = f\"\"\"
            SELECT
                iv.DocKey,
                iv.DocDate,
                iv.DocNo,
                iv.DebtorName,
                iv.SalesLocation,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr1)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr1)), ''), 'No Address') AS DeliverAddr1,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr2)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr2)), '')) AS DeliverAddr2,
                COALESCE(NULLIF(LTRIM(RTRIM(iv.DeliverAddr3)), ''), NULLIF(LTRIM(RTRIM(iv.InvAddr3)), '')) AS DeliverAddr3,
                iv.NetTotal
            FROM dbo.IV iv
            WHERE iv.Cancelled = 'F'
              {loc_clause}
              AND iv.PostToStock   = 'T'
              AND (
                  (iv.DeliverAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.DeliverAddr1)) != '')
                  OR (iv.InvAddr1 IS NOT NULL AND LTRIM(RTRIM(iv.InvAddr1)) != '')
              )
              {year_clause}
            ORDER BY iv.DocDate DESC
        \"\"\"
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
                state = re.sub(r'^\\d[\\d\\s\\-]*', '', raw_state).strip().upper() if raw_state else ''
                
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

"""

for i, line in enumerate(lines):
    if '"outstanding_balance": outstanding_bal,' in line:
        # Insert missing content after this line
        lines = lines[:i+1] + [missing_content] + lines[i+1:]
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Restored database.py successfully.")
