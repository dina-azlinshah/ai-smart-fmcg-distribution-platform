import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Package, Warehouse, Brain, 
  ArrowRight, Check, Mail, Phone, 
  MapPin, Menu, X, Sparkles, Database, Settings, LineChart,
  Shield, Clock, Zap, Globe, Award
} from 'lucide-react';

// --- COMPONENTS ---

const Navbar = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Methodology', href: '#methodology' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => window.scrollTo(0, 0)}>
          <img src="/logo.png" alt="Logo" className="logo-img" />
          <span>DistributionAI</span>
        </div>
        
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <button className="btn-primary" onClick={() => onNavigate('dashboard')}>
            View Demo
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

const Hero = ({ onNavigate }) => (
  <section className="hero">
    <div className="hero-bg-pattern"></div>
    <div className="hero-content">
      <div className="hero-badge">
        <Sparkles size={16} />
        <span>AI-Powered Distribution Intelligence</span>
      </div>
      <h1 className="hero-title">
        Transform Your Distribution
        <span className="gradient-text"> with Intelligent Analytics</span>
      </h1>
      <p className="hero-subtitle">
        Connect your AutoCount ERP with advanced AI analytics. Get real-time insights 
        into sales performance, inventory optimization, and demand forecasting to 
        drive smarter business decisions.
      </p>
      <div className="hero-cta">
        <button className="btn-primary btn-large" onClick={() => document.getElementById('pricing').scrollIntoView({behavior: 'smooth'})}>
          Get Started <ArrowRight size={20} />
        </button>
        <button className="btn-secondary btn-large" onClick={() => onNavigate('dashboard')}>
          View Live Demo
        </button>
      </div>
      <div className="hero-stats">
        <div className="stat-item">
          <div className="stat-value">500+</div>
          <div className="stat-label">Businesses Served</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">30%</div>
          <div className="stat-label">Avg. Efficiency Gain</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">99.9%</div>
          <div className="stat-label">Uptime Guaranteed</div>
        </div>
      </div>
    </div>
  </section>
);

const Architecture = () => (
  <section id="architecture" className="architecture-section">
    <div className="container">
      <div className="section-header">
        <h2>AI Distribution Intelligence Platform</h2>
        <p>The system architecture connects your existing ERP infrastructure with advanced analytics capabilities.</p>
      </div>
      
      <div className="architecture-flow">
        <div className="arch-step">
          <div className="arch-icon">
            <Database size={28} />
          </div>
          <div className="arch-content">
            <h3>AutoCount ERP System</h3>
            <p>Sales, inventory, and purchasing data sources</p>
          </div>
          <div className="arch-arrow">
            <ArrowRight size={24} />
          </div>
        </div>

        <div className="arch-step">
          <div className="arch-icon">
            <Settings size={28} />
          </div>
          <div className="arch-content">
            <h3>Data Integration Layer</h3>
            <p>Database and API connections for seamless data flow</p>
          </div>
          <div className="arch-arrow">
            <ArrowRight size={24} />
          </div>
        </div>

        <div className="arch-step">
          <div className="arch-icon">
            <Zap size={28} />
          </div>
          <div className="arch-content">
            <h3>Data Processing Engine</h3>
            <p>Cleaning, validation, and aggregation of operational data</p>
          </div>
          <div className="arch-arrow">
            <ArrowRight size={24} />
          </div>
        </div>

        <div className="arch-step">
          <div className="arch-icon">
            <Brain size={28} />
          </div>
          <div className="arch-content">
            <h3>AI Analytics Engine</h3>
            <p>Pattern analysis, trend detection, and demand forecasting</p>
          </div>
          <div className="arch-arrow">
            <ArrowRight size={24} />
          </div>
        </div>

        <div className="arch-step">
          <div className="arch-icon">
            <LineChart size={28} />
          </div>
          <div className="arch-content">
            <h3>Management Dashboard</h3>
            <p>Visual insights, alerts, and actionable recommendations</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Features = () => {
  const features = [
    {
      icon: <TrendingUp size={32} />,
      title: 'Sales Analytics',
      description: 'Product sales performance analysis with fast-moving and slow-moving item identification. Track revenue trends and identify growth opportunities across your product portfolio.'
    },
    {
      icon: <Package size={32} />,
      title: 'Inventory Intelligence',
      description: 'Real-time inventory monitoring with low stock alerts. Never miss a reorder opportunity again with automated notifications when stock reaches critical levels.'
    },
    {
      icon: <Warehouse size={32} />,
      title: 'Warehouse Monitoring',
      description: 'Multi-location inventory visibility across all your distribution centres. Track stock movement and allocation between warehouses for optimal inventory positioning.'
    },
    {
      icon: <Brain size={32} />,
      title: 'AI Insights',
      description: 'Demand pattern analysis and smart reorder suggestions. Machine learning algorithms identify seasonal patterns and recommend optimal order quantities and timing.'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <h2>Distribution Intelligence Features</h2>
          <p>Comprehensive tools designed to optimize your distribution operations</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Methodology = () => {
  const steps = [
    {
      number: '01',
      title: 'Business Analysis',
      description: 'Review distribution workflow and operational processes to identify key requirements and pain points'
    },
    {
      number: '02',
      title: 'System Integration',
      description: 'Connect the system with ERP data sources and validate data quality and completeness'
    },
    {
      number: '03',
      title: 'Data Processing Setup',
      description: 'Configure data pipelines and processing logic tailored to your business operations'
    },
    {
      number: '04',
      title: 'Dashboard Development',
      description: 'Develop operational and management dashboards with relevant KPIs and metrics'
    },
    {
      number: '05',
      title: 'Training & Deployment',
      description: 'Train users on system operation and deploy into production environment'
    }
  ];

  return (
    <section id="methodology" className="methodology-section">
      <div className="container">
        <div className="section-header">
          <h2>Implementation Methodology</h2>
          <p>Our implementation includes both technical deployment and business process analysis to ensure maximum value.</p>
        </div>
        
        <div className="methodology-grid">
          {steps.map((step, index) => (
            <div key={index} className="method-card">
              <div className="method-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = ({ onNavigate }) => {
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
      popular: false
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
      popular: true
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
      popular: false
    }
  ];

  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <div className="section-header">
          <h2>Implementation Packages</h2>
          <p>Choose the package that best fits your business needs</p>
        </div>
        
        <div className="pricing-grid">
          {packages.map((pkg, index) => (
            <div key={index} className={`pricing-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="popular-badge">Most Popular</div>}
              <div className="pricing-header">
                <h3>{pkg.name}</h3>
                <div className="pricing-price">
                  <span className="currency">RM</span>
                  <span className="amount">{pkg.price}</span>
                </div>
                <p className="pricing-desc">{pkg.description}</p>
              </div>
              
              <div className="pricing-features-static">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="pricing-feature-static">
                    <div className="feature-check-static">
                      <Check size={16} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    package: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Ready to Transform Your Distribution?</h2>
            <p>Get in touch with our team to discuss how our AI Distribution Intelligence Platform can help optimize your operations.</p>
            
            <div className="contact-details">
              <div className="contact-item">
                <Mail size={20} />
                <span>contact@distributionai.com</span>
              </div>
              <div className="contact-item">
                <Phone size={20} />
                <span>+60 3-XXXX XXXX</span>
              </div>
              <div className="contact-item">
                <MapPin size={20} />
                <span>Kuala Lumpur, Malaysia</span>
              </div>
            </div>

            <div className="trust-badges">
              <div className="trust-badge">
                <Shield size={20} />
                <span>Enterprise Security</span>
              </div>
              <div className="trust-badge">
                <Clock size={20} />
                <span>24/7 Support</span>
              </div>
              <div className="trust-badge">
                <Award size={20} />
                <span>Certified Partner</span>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3>Request a Consultation</h3>
              
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  placeholder="Your Company Sdn Bhd"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Interested Package</label>
                <select 
                  value={formData.package}
                  onChange={(e) => setFormData({...formData, package: e.target.value})}
                  required
                >
                  <option value="">Select a package</option>
                  <option value="standard">Standard (RM30,000)</option>
                  <option value="professional">Professional (RM60,000)</option>
                  <option value="enterprise">Enterprise (RM100,000)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea 
                  rows="4"
                  placeholder="Tell us about your requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary btn-full btn-large">
                {submitted ? 'Message Sent!' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/logo.png" alt="Logo" />
            <span>DistributionAI</span>
          </div>
          <p>Transforming distribution businesses with intelligent analytics and AI-powered insights.</p>
        </div>
        
        <div className="footer-links">
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#architecture">Architecture</a>
        </div>
        
        <div className="footer-links">
          <h4>Company</h4>
          <a href="#contact">Contact</a>
          <a href="#methodology">Methodology</a>
          <a href="#">About Us</a>
        </div>
        
        <div className="footer-links">
          <h4>Support</h4>
          <a href="#">Documentation</a>
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2026 DistributionAI. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// --- MAIN LANDING PAGE COMPONENT ---

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} />
      <Architecture />
      <Features />
      <Methodology />
      <Pricing onNavigate={onNavigate} />
      <Contact />
      <Footer />
    </div>
  );
}
