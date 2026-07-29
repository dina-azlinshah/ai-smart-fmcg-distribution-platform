import React, { useState } from 'react';
import { 
  Check, ArrowLeft, Sparkles, Shield, Clock, Award,
  X, Mail, Phone, MapPin, Building, Users, Package,
  Brain, BarChart3, Warehouse, Zap
} from 'lucide-react';

const PackagesPage = ({ onBack, onNavigate }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const featureComparison = [
    {
      feature: 'Business Analysis',
      standard: 'Basic workflow review',
      professional: 'Detailed analysis',
      enterprise: 'Full operational study'
    },
    {
      feature: 'ERP Integration',
      standard: 'Sales & inventory',
      professional: 'Sales, inventory, purchasing',
      enterprise: 'Multi-module integration'
    },
    {
      feature: 'Dashboard',
      standard: 'Basic operational dashboard',
      professional: 'Customised dashboard',
      enterprise: 'Executive dashboard'
    },
    {
      feature: 'AI Capability',
      standard: 'Sales analytics',
      professional: 'Demand forecasting',
      enterprise: 'Distribution intelligence'
    },
    {
      feature: 'Inventory Monitoring',
      standard: 'Stock alerts',
      professional: 'Smart reorder',
      enterprise: 'Inventory optimisation'
    },
    {
      feature: 'Warehouse Monitoring',
      standard: 'Single warehouse',
      professional: 'Multi-location',
      enterprise: 'Multi-warehouse'
    },
    {
      feature: 'Training',
      standard: 'User training',
      professional: 'User + management training',
      enterprise: 'Full operational training'
    }
  ];

  const packages = [
    {
      name: 'Standard',
      price: '30,000',
      description: 'Perfect for small businesses getting started with analytics',
      features: [
        'Basic workflow review',
        'Sales & inventory integration',
        'Basic operational dashboard',
        'Sales analytics',
        'Stock alerts',
        'Single warehouse',
        'User training'
      ],
      popular: false,
      color: '#3b82f6'
    },
    {
      name: 'Professional',
      price: '60,000',
      description: 'Ideal for growing businesses needing advanced insights',
      features: [
        'Detailed business analysis',
        'Sales, inventory, purchasing',
        'Customised dashboard',
        'Demand forecasting',
        'Smart reorder system',
        'Multi-location support',
        'User + management training'
      ],
      popular: true,
      color: '#8b5cf6'
    },
    {
      name: 'Enterprise',
      price: '100,000',
      description: 'Complete solution for large-scale operations',
      features: [
        'Full operational study',
        'Multi-module integration',
        'Executive dashboard',
        'Distribution intelligence',
        'Inventory optimisation',
        'Multi-warehouse support',
        'Full operational training'
      ],
      popular: false,
      color: '#10b981'
    }
  ];

  const handleSubscribe = (pkg) => {
    if (pkg.name === 'Standard' && onNavigate) {
      onNavigate('standard-package-features');
      return;
    }
    if (pkg.name === 'Professional' && onNavigate) {
      onNavigate('professional-package-features');
      return;
    }
    if (pkg.name === 'Enterprise' && onNavigate) {
      onNavigate('enterprise-package-features');
      return;
    }
    setSelectedPackage(pkg);
    setShowContactForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowContactForm(false);
      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
    }, 3000);
  };

  return (
    <div className="packages-page">
      {/* Background Effects */}
      <div className="packages-bg-gradient"></div>
      
      {/* Navigation */}
      <nav className="packages-navbar">
        <div className="packages-nav-container">
          <div className="packages-nav-logo" onClick={onBack}>
            <img src="/logo.png" alt="Logo" />
            <span>DistributionAI</span>
          </div>
          <button className="packages-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="packages-hero">
        <div className="packages-hero-badge">
          <Sparkles size={16} />
          <span>Implementation Packages</span>
        </div>
        <h1 className="packages-hero-title">
          Choose Your <span className="gradient-text">Package</span>
        </h1>
        <p className="packages-hero-subtitle">
          Select the implementation package that best fits your business needs. 
          All packages include full setup, training, and ongoing support.
        </p>
      </section>

      {/* Packages Grid */}
      <section className="packages-grid-section">
        <div className="packages-grid">
          {packages.map((pkg, index) => (
            <div 
              key={index} 
              className={`package-card-v2 ${pkg.popular ? 'popular' : ''}`}
            >
              {pkg.popular && (
                <div className="popular-badge-v2">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}
              
              <div className="package-card-header">
                <h3 className="package-name-v2">{pkg.name}</h3>
                <div className="package-price-v2">
                  <span className="currency-v2">RM</span>
                  <span className="amount-v2">{pkg.price}</span>
                </div>
                <p className="package-description-v2">{pkg.description}</p>
              </div>

              <div className="package-features-v2">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="package-feature-item-v2">
                    <div className="feature-check-v2" style={{ background: pkg.color }}>
                      <Check size={14} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`subscribe-btn ${pkg.popular ? 'popular' : ''}`}
                onClick={() => handleSubscribe(pkg)}
                style={{ 
                  background: pkg.popular ? `linear-gradient(135deg, ${pkg.color}, #6d28d9)` : 'transparent',
                  borderColor: pkg.color,
                  color: pkg.popular ? 'white' : pkg.color
                }}
              >
                Subscribe Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="packages-trust">
        <div className="trust-badges-v2">
          <div className="trust-badge-v2">
            <Shield size={24} />
            <span>Enterprise Security</span>
          </div>
          <div className="trust-badge-v2">
            <Clock size={24} />
            <span>24/7 Support</span>
          </div>
          <div className="trust-badge-v2">
            <Award size={24} />
            <span>Certified Partner</span>
          </div>
        </div>
      </section>

      {/* Subscribe Modal */}
      {showContactForm && (
        <div className="contact-modal-overlay" onClick={() => setShowContactForm(false)}>
          <div className="subscribe-modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowContactForm(false)}>
              <X size={24} />
            </button>

            {submitted ? (
              <div className="modal-success">
                <div className="success-icon">✓</div>
                <h3>Request Submitted!</h3>
                <p>Our team will contact you shortly about the {selectedPackage?.name} Package.</p>
              </div>
            ) : (
              <div className="subscribe-modal-layout">
                {/* Left: Comparison Table */}
                <div className="subscribe-modal-left">
                  <h3 className="modal-table-title">Implementation Packages</h3>
                  <div className="modal-comparison-table-wrap">
                    <table className="modal-comparison-table">
                      <thead>
                        <tr>
                          <th className="col-feature">Feature</th>
                          <th className={`col-pkg ${selectedPackage?.name === 'Standard' ? 'col-selected' : ''}`}>
                            <span className="pkg-th-name">Standard</span>
                            <span className="pkg-th-price">RM30,000</span>
                          </th>
                          <th className={`col-pkg ${selectedPackage?.name === 'Professional' ? 'col-selected' : ''}`}>
                            <span className="pkg-th-name">Professional</span>
                            <span className="pkg-th-price">RM60,000</span>
                          </th>
                          <th className={`col-pkg ${selectedPackage?.name === 'Enterprise' ? 'col-selected' : ''}`}>
                            <span className="pkg-th-name">Enterprise</span>
                            <span className="pkg-th-price">RM100,000</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {featureComparison.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                            <td className="cell-feature">{row.feature}</td>
                            <td className={`cell-value ${selectedPackage?.name === 'Standard' ? 'cell-selected' : ''}`}>{row.standard}</td>
                            <td className={`cell-value ${selectedPackage?.name === 'Professional' ? 'cell-selected' : ''}`}>{row.professional}</td>
                            <td className={`cell-value ${selectedPackage?.name === 'Enterprise' ? 'cell-selected' : ''}`}>{row.enterprise}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Contact Form */}
                <div className="subscribe-modal-right">
                  <div className="modal-form-header">
                    <div
                      className="modal-pkg-badge"
                      style={{
                        background: selectedPackage?.name === 'Standard'
                          ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                          : selectedPackage?.name === 'Professional'
                          ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)'
                          : 'linear-gradient(135deg,#10b981,#059669)'
                      }}
                    >
                      {selectedPackage?.name} Package
                    </div>
                    <h3>Subscribe Now</h3>
                    <p>RM {selectedPackage?.price}</p>
                  </div>

                  <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group-v2">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group-v2">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group-v2">
                      <label>Company Name</label>
                      <input
                        type="text"
                        placeholder="Your Company Sdn Bhd"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group-v2">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+60 12-345 6789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group-v2">
                      <label>Message (Optional)</label>
                      <textarea
                        rows="2"
                        placeholder="Tell us about your requirements..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="submit-btn-v2"
                      style={{
                        background: selectedPackage?.name === 'Standard'
                          ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                          : selectedPackage?.name === 'Professional'
                          ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)'
                          : 'linear-gradient(135deg,#10b981,#059669)'
                      }}
                    >
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="packages-footer">
        <div className="packages-footer-content">
          <div className="footer-contact">
            <div className="footer-contact-item">
              <Mail size={18} />
              <span>contact@distributionai.com</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={18} />
              <span>+60 3-XXXX XXXX</span>
            </div>
            <div className="footer-contact-item">
              <MapPin size={18} />
              <span>Kuala Lumpur, Malaysia</span>
            </div>
          </div>
          <p className="footer-copyright">© 2026 DistributionAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PackagesPage;
