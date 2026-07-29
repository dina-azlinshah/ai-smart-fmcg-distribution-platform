import sys

file_path = r"c:\Users\User\Downloads\GPIS SOLUTION\website latest\sales-dashboard\frontend\src\EnterpriseWarehouseMonitoring.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The missing block is to replace lines 153 to 157 (0-indexed 152 to 156)
# Let's find exactly where "creditors: data.top_creditors || []," is.
idx_start = -1
for i, line in enumerate(lines):
    if "creditors: data.top_creditors || []," in line:
        idx_start = i + 1
        break

idx_end = -1
for i, line in enumerate(lines):
    if "  // Prepare data & computed metrics" in line:
        idx_end = i
        break

if idx_start != -1 and idx_end != -1:
    missing_code = """        deliveries,
        products: data.stock_aging?.items || []
      };
    });
  }, [insights, branchInsights, salespersonAvatars]);

  const activeBranches = useMemo(() => {
    if (selectedYear === 'All') return ENTERPRISE_BRANCHES;
    return ENTERPRISE_BRANCHES.filter(loc => {
      const card = branchCards.find(c => c.loc === loc);
      if (!card) return false;
      return card.rev > 0 || card.ships > 0 || card.salespeople.length > 0;
    });
  }, [branchCards, selectedYear]);

  useEffect(() => {
    if (selectedBranch !== 'ALL' && !activeBranches.includes(selectedBranch)) {
      setSelectedBranch('ALL');
    }
  }, [activeBranches, selectedBranch]);

  // Fetch warehouse insights (debtors, creditors, sales agents, shipping)
  useEffect(() => {
    setLoading(true);
    const apiBase = `http://${window.location.hostname}:8001/api`;
    const yearParam = selectedYear ? `&year=${selectedYear}` : '&year=All';

    Promise.all([
      fetch(`${apiBase}/warehouse/insights?location=ALL${yearParam}`).then(res => res.json()),
      Promise.all(ENTERPRISE_BRANCHES.map((branch) =>
        fetch(`${apiBase}/warehouse/insights?location=${encodeURIComponent(branch)}${yearParam}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      ))
    ])
      .then(([allData, branchData]) => {
        setInsights(allData);
        setBranchInsights(ENTERPRISE_BRANCHES.reduce((acc, branch, index) => {
          acc[branch] = branchData[index];
          return acc;
        }, {}));
      })
      .catch(err => {
        console.error("Error fetching warehouse insights:", err);
        setInsights(null);
        setBranchInsights({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedYear]);

  // Fetch Logistics Drilldown Details
  useEffect(() => {
    if (['pending', 'returns', 'total_shipment'].includes(activeLogisticsModal)) {
      setLogisticsDetailsLoading(true);
      const apiBase = `http://${window.location.hostname}:8001/api`;
      const typeMap = { pending: 'pending', returns: 'returns', total_shipment: 'total' };
      const locParam = selectedBranch ? `&location=${encodeURIComponent(selectedBranch)}` : '&location=ALL';
      const yearParam = selectedYear ? `&year=${selectedYear}` : '&year=All';
      
      fetch(`${apiBase}/logistics-details?type=${typeMap[activeLogisticsModal]}${locParam}${yearParam}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          setLogisticsDetailsData(Array.isArray(data) ? data : (data.data || []));
        })
        .catch(err => {
          console.error("Error fetching logistics details:", err);
          setLogisticsDetailsData([]);
        })
        .finally(() => {
          setLogisticsDetailsLoading(false);
        });
    } else {
      setLogisticsDetailsData(null);
    }
  }, [activeLogisticsModal, selectedBranch, selectedYear]);

  const handleAvatarUpload = (agentName, file) => {
    if (!agentName || !file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatars = { ...salespersonAvatars, [agentName]: reader.result };
      setSalespersonAvatars(newAvatars);
      try {
        localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
      } catch (e) {
        console.error("Error saving salesperson photo:", e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = (agentName) => {
    if (!agentName) return;
    const newAvatars = { ...salespersonAvatars };
    delete newAvatars[agentName];
    setSalespersonAvatars(newAvatars);
    try {
      localStorage.setItem('gpis_salesperson_avatars', JSON.stringify(newAvatars));
    } catch (e) {
      console.error("Error removing salesperson photo:", e);
    }
  };

  // Execute workflow action simulator
  const triggerWorkflowAction = (actionId, delay = 1500) => {
    setActionExecuting(actionId);
    setTimeout(() => {
      setActionExecuting(null);
      setExecutedActions(prev => [...prev, actionId]);
    }, delay);
  };
"""
    new_lines = lines[:idx_start] + [missing_code + "\n"] + lines[idx_end:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("FIX APPLIED SUCCESSFULLY.")
else:
    print(f"Could not find markers. start: {idx_start}, end: {idx_end}")
