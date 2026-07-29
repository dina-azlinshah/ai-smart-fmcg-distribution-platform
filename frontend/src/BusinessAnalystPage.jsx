import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle, Mail, Building, Package, 
  TrendingDown, AlertTriangle, Eye, Brain, BarChart3,
  Warehouse, Truck, Users, Menu, X, ChevronDown, Sparkles
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8001/api`;

// Navigation Component
const Navbar = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Problems', href: '#problems' },
    { label: 'Impact', href: '#impact' },
    { label: 'Packages', href: '#packages' },
  ];
  
  return (
    <nav className="ba-navbar">
      <div className="ba-navbar-container">
        <div className="ba-navbar-logo" onClick={() => window.scrollTo(0, 0)}>
          <img src="/logo.png" alt="DistributionAI" />
          <span>DistributionAI</span>
        </div>
        
        <div className={`ba-navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <button className="ba-navbar-cta" onClick={() => document.getElementById('signup').scrollIntoView({behavior: 'smooth'})}>
            Get Started
          </button>
        </div>
        
        <button className="ba-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default function BusinessAnalystPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted', { email, company });
    
    if (!email || !company) {
      console.log('Missing fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Send to backend
      const response = await fetch(`${API_BASE}/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, service: 'business-analyst' })
      });
      
      console.log('Response received', response.status);
      setSubmitted(true);
      
      // Redirect to demo features after 2 seconds
      setTimeout(() => {
        console.log('Navigating to demo-features');
        onNavigate('demo-features');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // Still show success and redirect even if backend fails
      setSubmitted(true);
      setTimeout(() => {
        onNavigate('demo-features');
      }, 2000);
    }
  };

  const problems = [
    {
      title: "Stock Shortages",
      description: "Popular items running out of stock during peak demand periods",
      icon: <Package size={24} />
    },
    {
      title: "Overstock Issues",
      description: "Excess inventory of slow-moving products tying up capital",
      icon: <Warehouse size={24} />
    },
    {
      title: "Limited Visibility",
      description: "Difficulty monitoring stock levels across multiple warehouses",
      icon: <Eye size={24} />
    },
    {
      title: "Manual Decisions",
      description: "Time-consuming purchasing decisions based on experience rather than data",
      icon: <Brain size={24} />
    },
    {
      title: "Hidden Losses",
      description: "Unsold or expired inventory reducing profitability",
      icon: <TrendingDown size={24} />
    },
    {
      title: "Performance Gaps",
      description: "Lack of visibility into individual product performance",
      icon: <BarChart3 size={24} />
    }
  ];

  const impacts = [
    { number: "1", title: "Stock Shortages", description: "Lost sales opportunities and dissatisfied customers" },
    { number: "2", title: "Overstock Inventory", description: "Higher storage costs and reduced cash flow" },
    { number: "3", title: "Slow-Moving Products", description: "Cash flow locked in inventory with limited turnover" },
    { number: "4", title: "Manual Decision-Making", description: "Inefficient purchasing and missed opportunities" },
    { number: "5", title: "Limited Insights", description: "Poor planning decisions and reactive responses" }
  ];

  const packages = [
    {
      name: "Standard",
      price: "30,000",
      features: [
        "Basic workflow review",
        "Sales & inventory",
        "Basic operational dashboard",
        "Sales analytics",
        "Stock alerts",
        "Single warehouse",
        "User training"
      ]
    },
    {
      name: "Professional",
      price: "60,000",
      popular: true,
      features: [
        "Detailed analysis",
        "Sales, inventory, purchasing",
        "Customised dashboard",
        "Demand forecasting",
        "Smart reorder",
        "Multi-location",
        "User + management training"
      ]
    },
    {
      name: "Enterprise",
      price: "100,000",
      features: [
        "Full operational study",
        "Multi-module integration",
        "Executive dashboard",
        "Distribution intelligence",
        "Inventory optimisation",
        "Multi-warehouse",
        "Full operational training"
      ]
    }
  ];

  return (
    <div className="business-analyst-page">
      {/* Floating Orb Background */}
      <div className="ba-orb"></div>
      
      {/* Navigation */}
      <Navbar onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="ba-hero">
        <div className="ba-hero-content">
          <div className="ba-hero-badge">
            <Sparkles size={16} />
            <span>AI-Powered Business Intelligence</span>
          </div>
          <h1 className="ba-hero-title">
            Transform Your FMCG Distribution with <span className="gradient-text">Intelligent Analytics</span>
          </h1>
          <p className="ba-hero-description">
            Connect your AutoCount ERP with advanced AI analytics. Get real-time insights 
            into inventory, sales performance, and demand forecasting to drive smarter decisions.
          </p>
          <div className="ba-hero-cta">
            <button className="btn-primary" onClick={() => document.getElementById('signup').scrollIntoView({behavior: 'smooth'})}>
              View Demo <ArrowRight size={18} />
            </button>
            <button className="btn-secondary" onClick={() => onNavigate && onNavigate('standard-package')}>
              Standard Package
            </button>
          </div>
        </div>
        <div className="ba-hero-visual">
          <div className="ba-dashboard-preview">
            <div className="preview-header">
              <div className="preview-dot red"></div>
              <div className="preview-dot yellow"></div>
              <div className="preview-dot green"></div>
            </div>
            <div className="preview-content">
              <div className="preview-chart"></div>
              <div className="preview-stats">
                <div className="preview-stat"></div>
                <div className="preview-stat"></div>
                <div className="preview-stat"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FMCG Distribution Environment */}
      <section id="services" className="ba-section">
        <div className="ba-container">
          <div className="ba-split">
            <div className="ba-text">
              <span className="ba-section-label">Our Expertise</span>
              <h2>FMCG Distribution Intelligence</h2>
              <p>
                Fast-moving consumer goods distributors face unique challenges: rapidly changing demand, 
                high inventory turnover, and complex supply chains. Manual processes and experience-based 
                decisions are no longer sufficient in today's competitive market.
              </p>
              <p>
                Our AI-powered platform integrates seamlessly with your AutoCount ERP to provide 
                real-time visibility, predictive analytics, and automated insights that transform 
                how you manage inventory, forecast demand, and optimize operations.
              </p>
              <ul className="ba-feature-list">
                <li><CheckCircle size={18} /> Real-time inventory tracking</li>
                <li><CheckCircle size={18} /> AI-powered demand forecasting</li>
                <li><CheckCircle size={18} /> Automated reorder suggestions</li>
                <li><CheckCircle size={18} /> Multi-location visibility</li>
              </ul>
            </div>
            <div className="ba-image">
              <div className="ba-fmcg-illustration">
                <div className="fmcg-flow">
                  <div className="fmcg-icon warehouse">
                    <Warehouse size={40} />
                  </div>
                  <div className="fmcg-connector"></div>
                  <div className="fmcg-icon store">
                    <Package size={40} />
                  </div>
                  <div className="fmcg-connector"></div>
                  <div className="fmcg-icon analytics">
                    <BarChart3 size={40} />
                  </div>
                </div>
                <div className="fmcg-labels">
                  <span>Warehouse</span>
                  <span>Distribution</span>
                  <span>Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Problems */}
      <section id="problems" className="ba-section ba-gray">
        <div className="ba-container">
          <div className="ba-section-header">
            <h2>Common Problems in Distribution Operations</h2>
            <p>Many distributors rely on manual monitoring and experience-based decisions, leading to operational inefficiencies.</p>
          </div>
          
          <div className="ba-problems-grid">
            {problems.map((problem, index) => (
              <div key={index} className="ba-problem-card">
                <div className="ba-problem-icon">{problem.icon}</div>
                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact on Business Performance */}
      <section id="impact" className="ba-section">
        <div className="ba-container">
          <div className="ba-section-header">
            <h2>Impact on Business Performance</h2>
            <p>These operational challenges lead to several business risks that affect profitability and growth.</p>
          </div>
          
          <div className="ba-impact-list">
            {impacts.map((impact, index) => (
              <div key={index} className="ba-impact-item">
                <div className="ba-impact-number">{impact.number}</div>
                <div className="ba-impact-content">
                  <h3>{impact.title}</h3>
                  <p>{impact.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Packages */}
      <section id="packages" className="ba-section ba-packages">
        <div className="ba-container">
          <div className="ba-section-header">
            <span className="ba-section-label">Pricing</span>
            <h2>Implementation Packages</h2>
            <p>Choose the package that best fits your business needs and budget</p>
          </div>
          
          <div className="ba-packages-grid">
            {/* Standard Package */}
            <div className="ba-package-card">
              <div className="ba-package-header">
                <h3>Standard</h3>
                <div className="ba-package-price">RM30,000</div>
                <p>Perfect for small distributors</p>
              </div>
              <ul className="ba-package-features">
                <li><CheckCircle size={16} /> Basic workflow review</li>
                <li><CheckCircle size={16} /> Sales & inventory integration</li>
                <li><CheckCircle size={16} /> Basic operational dashboard</li>
                <li><CheckCircle size={16} /> Sales analytics</li>
                <li><CheckCircle size={16} /> Stock alerts</li>
                <li><CheckCircle size={16} /> Single warehouse</li>
                <li><CheckCircle size={16} /> User training</li>
              </ul>
            </div>
            
            {/* Professional Package */}
            <div className="ba-package-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="ba-package-header">
                <h3>Professional</h3>
                <div className="ba-package-price">RM60,000</div>
                <p>Ideal for growing businesses</p>
              </div>
              <ul className="ba-package-features">
                <li><CheckCircle size={16} /> Detailed business analysis</li>
                <li><CheckCircle size={16} /> Sales, inventory, purchasing</li>
                <li><CheckCircle size={16} /> Customised dashboard</li>
                <li><CheckCircle size={16} /> Demand forecasting</li>
                <li><CheckCircle size={16} /> Smart reorder system</li>
                <li><CheckCircle size={16} /> Multi-location support</li>
                <li><CheckCircle size={16} /> User + management training</li>
              </ul>
            </div>
            
            {/* Enterprise Package */}
            <div className="ba-package-card">
              <div className="ba-package-header">
                <h3>Enterprise</h3>
                <div className="ba-package-price">RM100,000</div>
                <p>For large-scale operations</p>
              </div>
              <ul className="ba-package-features">
                <li><CheckCircle size={16} /> Full operational study</li>
                <li><CheckCircle size={16} /> Multi-module integration</li>
                <li><CheckCircle size={16} /> Executive dashboard</li>
                <li><CheckCircle size={16} /> Distribution intelligence</li>
                <li><CheckCircle size={16} /> Inventory optimisation</li>
                <li><CheckCircle size={16} /> Multi-warehouse support</li>
                <li><CheckCircle size={16} /> Full operational training</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Sign Up Section */}
      <section id="signup" className="ba-section ba-signup">
        <div className="ba-container">
          <div className="ba-signup-content">
            {!submitted ? (
              <>
                <div className="ba-signup-icon">
                  <Mail size={48} />
                </div>
                <h2>View Demo Dashboard</h2>
                <p>Sign up with your email to explore our interactive demo dashboard and see how our Business Analyst service can transform your distribution operations.</p>
                
                <form className="ba-signup-form" onSubmit={handleSubmit}>
                  <div className="ba-form-group">
                    <label>Company Name *</label>
                    <div className="ba-input-wrapper">
                      <Building size={18} />
                      <input 
                        type="text" 
                        placeholder="Your Company Sdn Bhd"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="ba-form-group">
                    <label>Email Address *</label>
                    <div className="ba-input-wrapper">
                      <Mail size={18} />
                      <input 
                        type="email" 
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary btn-large btn-full"
                    disabled={loading}
                    onClick={() => console.log('Button clicked')}
                  >
                    {loading ? 'Submitting...' : 'Access Demo Dashboard'}
                  </button>
                </form>
                
                <p className="ba-signup-note">
                  By signing up, you'll get instant access to our Standard Package demo. 
                  No credit card required.
                </p>
              </>
            ) : (
              <div className="ba-success">
                <CheckCircle size={64} color="#10b981" />
                <h2>Thank You!</h2>
                <p>Your information has been received. Redirecting you to the demo dashboard...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ba-footer">
        <div className="ba-container">
          <div className="ba-footer-content">
            <div className="ba-footer-brand">
              <img src="/logo.png" alt="Logo" />
              <span>DistributionAI</span>
            </div>
            <p>&copy; 2026 DistributionAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
