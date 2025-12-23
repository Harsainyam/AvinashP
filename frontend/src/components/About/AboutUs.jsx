import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../Common/Loader';
import { toast } from 'react-toastify';
import '../../styles/components/About.css';

const AboutUs = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/about');
      
      if (response.data.success) {
        setContent(response.data.data);
        setCached(response.data.cached);
        
        if (response.data.cached) {
          console.log('✅ Content loaded from Redis cache');
        } else {
          console.log('📝 Content generated and cached in Redis');
        }
      }
    } catch (error) {
      console.error('Failed to load about content:', error);
      toast.error('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading about us..." />;
  }

  if (!content) {
    return (
      <div className="about-error">
        <h2>Failed to load content</h2>
        <button onClick={fetchAboutContent} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="about-container">
      {/* Header */}
      <header className="about-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>
        <div className="cache-indicator">
          {cached ? (
            <span className="cached">⚡ Cached Content</span>
          ) : (
            <span className="fresh">🔄 Fresh Content</span>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="about-hero">
        <h1>{content.title}</h1>
        <p className="mission">{content.mission}</p>
        <p className="description">{content.description}</p>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="stat-item">
          <h3>{content.stats.users}</h3>
          <p>Active Users</p>
        </div>
        <div className="stat-item">
          <h3>{content.stats.transactions}</h3>
          <p>Transactions</p>
        </div>
        <div className="stat-item">
          <h3>{content.stats.uptime}</h3>
          <p>Uptime</p>
        </div>
        <div className="stat-item">
          <h3>{content.stats.countries}</h3>
          <p>Countries</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <h2>Why Choose Credora?</h2>
        <div className="features-grid">
          {content.features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <h2>Our Team</h2>
        <div className="team-grid">
          {content.team.map((member, index) => (
            <div key={index} className="team-card">
              <h3>{member.name}</h3>
              <p className="role">{member.role}</p>
              <p className="description">{member.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-contact">
        <h2>Get in Touch</h2>
        <div className="contact-info">
          <div className="contact-item">
            <span className="icon">📧</span>
            <div>
              <h4>Email</h4>
              <p>{content.contact.email}</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="icon">📞</span>
            <div>
              <h4>Phone</h4>
              <p>{content.contact.phone}</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="icon">📍</span>
            <div>
              <h4>Address</h4>
              <p>{content.contact.address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <p>Last Updated: {new Date(content.lastUpdated).toLocaleString()}</p>
        <button onClick={fetchAboutContent} className="btn-secondary">
          Refresh Content
        </button>
      </footer>
    </div>
  );
};

export default AboutUs;