import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Upload, Database, Sparkles
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8001/api`;

const CompanyDataEntry = ({ onBack }) => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExt)) {
      setSubmitError('Please upload a CSV or Excel file');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/company/upload-file`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Save ALL calculated data to localStorage for all packages to use
        if (data.calculated_totals) {
          localStorage.setItem('calculatedTotals', JSON.stringify(data.calculated_totals));
          localStorage.setItem('hasUploadedData', 'true');
          console.log('Saved uploaded data to localStorage:', data.calculated_totals);
        }
        
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(data.detail || 'Failed to upload file');
      }
    } catch (error) {
      setSubmitError('Network error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="company-data-entry">
      <div className="cde-bg"></div>
      
      <nav className="cde-navbar">
        <div className="cde-nav-container">
          <div className="cde-logo">
            <Database size={24} />
            <span>Company Data Entry</span>
          </div>
          <button className="cde-back-btn" onClick={onBack}>
            <ArrowLeft size={20} /> Go Back
          </button>
        </div>
      </nav>

      <main className="cde-main">
        <div className="cde-container">
          <div className="cde-header">
            <h1><Sparkles size={28} /> Setup Your Company Data</h1>
            <p>Upload a CSV or Excel file with your company data. The system will automatically retrieve and populate the data across all packages (Standard, Professional, Enterprise).</p>
          </div>

          {submitSuccess && (
            <div className="cde-success-banner">
              <CheckCircle2 size={24} />
              <span>Data imported successfully! All packages will now use this data.</span>
            </div>
          )}

          {submitError && (
            <div className="cde-error-banner">
              <AlertCircle size={24} />
              <span>{submitError}</span>
            </div>
          )}

          <div className="cde-upload-section" style={{marginTop: '2rem'}}>
            <div className="cde-upload-card">
              <Upload size={48} />
              <h3>Upload Your Data File</h3>
              <p>Upload a CSV or Excel file to automatically sync your records to the Cloud.</p>
              
              <div className="cde-file-input-wrapper">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="cde-file-upload-btn">
                  {isUploading ? (
                    <><Upload size={18} className="spin" /> Uploading...</>
                  ) : (
                    <><Upload size={18} /> Choose File</>
                  )}
                </label>
                {uploadedFile && (
                  <div className="cde-file-info">
                    <CheckCircle2 size={16} />
                    <span>{uploadedFile.name}</span>
                  </div>
                )}
              </div>

              <div className="cde-file-template">
                <h4><Database size={16} /> Expected File Format</h4>
                <p>Your CSV/Excel file can include the following columns:</p>
                <div className="cde-template-columns">
                  <div className="cde-column-group">
                    <strong>Company Info:</strong>
                    <span>company_name, registration_number, address, phone, email, website, industry</span>
                  </div>
                  <div className="cde-column-group">
                    <strong>Warehouses:</strong>
                    <span>warehouse_name, warehouse_location, warehouse_address, warehouse_capacity</span>
                  </div>
                  <div className="cde-column-group">
                    <strong>Products:</strong>
                    <span>product_code, product_name, product_category, unit_price, min_stock, description</span>
                  </div>
                  <div className="cde-column-group">
                    <strong>Inventory:</strong>
                    <span>product_code, warehouse_name, quantity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CompanyDataEntry;
