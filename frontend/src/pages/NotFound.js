import React from "react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #0a0a1a)',
      color: 'var(--text-primary, #f1f5f9)',
      fontFamily: 'var(--font, Inter, sans-serif)',
      gap: '1rem',
      padding: '2rem'
    }}>
      <div style={{
        fontSize: '5rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        letterSpacing: '-2px'
      }}>404</div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-primary, #f1f5f9)',
        margin: 0
      }}>Page not found</h1>
      <p style={{
        color: 'var(--text-secondary, #94a3b8)',
        fontSize: '1rem',
        margin: 0
      }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{
        marginTop: '0.5rem',
        padding: '0.6rem 1.5rem',
        background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        color: '#fff',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'opacity 0.2s'
      }}>Go Home</a>
    </div>
  );
}
