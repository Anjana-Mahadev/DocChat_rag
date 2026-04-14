
import React from "react";
import "../styles/Landing.css";

export default function Home() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-icon">D</div>
          <span className="landing-brand-name">DocChat</span>
        </div>
        <div className="landing-nav-links">
          <a href="/login" className="landing-nav-link">Sign In</a>
          <a href="/register" className="landing-nav-link primary">Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-badge-dot"></span>
          AI-Powered Document Intelligence
        </div>
        <h1 className="landing-heading">
          Chat with Your<br />
          Company <span className="landing-heading-accent">Documents</span>
        </h1>
        <p className="landing-subtitle">
          Access company policies, procedures, and knowledge through an intelligent 
          AI assistant. Get instant, accurate answers from your document database.
        </p>
        <div className="landing-cta-row">
          <a href="/register" className="landing-cta primary">
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a href="/login" className="landing-cta secondary">Sign In</a>
        </div>

        {/* Features */}
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon-wrap cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="feature-title">Secure Access</div>
            <div className="feature-desc">Role-based authentication ensures only authorized personnel access sensitive documents.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10h16V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="2"/></svg>
            </div>
            <div className="feature-title">AI-Powered RAG</div>
            <div className="feature-desc">Advanced retrieval-augmented generation provides accurate answers from your knowledge base.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div className="feature-title">Instant Answers</div>
            <div className="feature-desc">Get immediate responses to questions about policies, procedures, and guidelines.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
