

import React from "react";
import "../styles/Landing.css";

export default function Home() {
  return (
    <div className="landing-bg">
      {/* Header */}
      <header className="landing-header">
        <div className="header-left">
          <img src="https://public.readdy.ai/ai/img_res/2843383d-d3a4-4825-9ff5-4537b840cea4.png" alt="Logo" className="header-logo" />
          <span className="header-title">DocChat</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <h1 className="landing-title">
          Chat with Your Company<br />
          <span className="landing-title-highlight">Documents</span>
        </h1>
        <p className="landing-desc">
          Access company policies, procedures, and knowledge through an intelligent AI chatbot. Get instant answers from your document database.
        </p>
        <div className="landing-btn-row">
          <a href="/register" className="landing-btn primary">Register</a>
          <a href="/login" className="landing-btn secondary">Sign In</a>
        </div>
        <div className="landing-features-row">
          <div className="feature-card">
            <div className="feature-icon-bg"><span className="feature-icon">🛡️</span></div>
            <div className="feature-title">Secure Access</div>
            <div className="feature-desc">Role-based authentication ensures only authorized personnel access sensitive documents.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-bg"><span className="feature-icon">⚙️</span></div>
            <div className="feature-title">AI-Powered</div>
            <div className="feature-desc">Advanced RAG technology provides accurate answers from your company's knowledge base.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-bg"><span className="feature-icon">⏱️</span></div>
            <div className="feature-title">Instant Answers</div>
            <div className="feature-desc">Get immediate responses to questions about policies, procedures, and guidelines.</div>
          </div>
        </div>
      </main>

      {/* Footer removed as requested */}
    </div>
  );
}
