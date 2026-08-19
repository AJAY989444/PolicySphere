import { Link } from 'react-router-dom';
import { HiShieldCheck, HiTrendingUp, HiUserGroup, HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <HiSparkles /> Digital Insurance Reimagined
          </div>
          <h1 className="hero-title">
            Smart Insurance Protection for Your <span className="text-gradient">Family & Future</span>
          </h1>
          <p className="hero-subtitle">
            Compare plans, customize coverage, and buy instant insurance policies from top-rated providers across health, life, motor, and travel.
          </p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn btn-primary btn-lg">Explore Marketplace</Link>
            {!user && <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>}
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number">50+</span>
              <span className="stat-label">Insurers Partnered</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">99.2%</span>
              <span className="stat-label">Claim Settlement Ratio</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">2M+</span>
              <span className="stat-label">Active Policyholders</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose PolicySphere?</h2>
            <p>Designed to make insurance transparent, effortless, and accessible for everyone.</p>
          </div>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon"><HiShieldCheck /></div>
              <h3>Instant Policy Generation</h3>
              <p>Get digital certificates directly to your vault within 60 seconds after payment confirmation.</p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon"><HiTrendingUp /></div>
              <h3>Dynamic Premium Comparison</h3>
              <p>Transparent pricing matrix comparing coverage limits, riders, and claim settlement metrics side by side.</p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon"><HiUserGroup /></div>
              <h3>Dedicated Advisor Network</h3>
              <p>Get tailored guidance from certified insurance advisors who assist you from purchase to claim settlement.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
