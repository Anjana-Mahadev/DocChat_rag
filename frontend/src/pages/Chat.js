
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ModernChatLayout.css";

const SUGGESTED = [
  "What are the company policies?",
  "How do I request time off?",
  "What are the IT security guidelines?",
  "Explain the expense reimbursement process"
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {sender: 'user'|'ai', text: string}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Get token and user id from localStorage (set after login)
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send user query to backend
  const sendQuery = async (question) => {
    setLoading(true);
    setError("");
    setMessages((msgs) => [...msgs, { sender: "user", text: question }]);
    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error from backend");
      }
      const data = await res.json();
      setMessages((msgs) => [...msgs, { sender: "ai", text: data.answer }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: "ai", text: err.message || "Error" }]);
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    await sendQuery(input.trim());
    setInput("");
  };

  const handleSuggested = async (q) => {
    if (loading) return;
    setInput("");
    await sendQuery(q);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setError("");
    setInput("");
  };

  // Sign out: clear token and userId, go to home
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div className="docchat-root">
      {/* Sidebar */}
      <aside className="docchat-sidebar" style={{boxShadow: '2px 0 12px rgba(24,26,32,0.13)'}}>
        <div className="docchat-sidebar-content">
          {/* Profile section */}
          <div className="docchat-sidebar-header" style={{padding: '0 1.1rem 0.7rem 1.1rem', borderBottom: '1px solid #23242a'}}>
            <span role="img" aria-label="profile" className="docchat-logo" style={{fontSize: 22, background: '#23242a', borderRadius: '50%', padding: 5, marginRight: 6}}>🧑</span>
            <div>
              <div style={{fontWeight: 700, fontSize: '0.98rem', color: '#22d3ee'}}>Profile</div>
              <div style={{fontSize: '0.85rem', color: '#a1a1aa', marginTop: 1}}>{userId || "User"}</div>
            </div>
          </div>
          <button className="docchat-newchat-btn" style={{margin: '1.1rem 1.1rem 0.7rem 1.1rem', boxShadow: '0 2px 8px rgba(34,197,94,0.10)', fontSize: '0.93rem', padding: '0.5rem 0', background: 'linear-gradient(90deg, #22d3ee 0%, #6366f1 100%)', color: '#181a20'}} onClick={handleNewConversation} disabled={loading}>+ New Conversation</button>
          <div style={{margin: '0.7rem 0 0.3rem 0', padding: '0 1.1rem'}}>
            <div style={{fontWeight: 600, color: '#f3f4f6', fontSize: '0.97rem', marginBottom: '0.4rem'}}>Common Questions</div>
            <div className="docchat-sidebar-questions" style={{gap: 6}}>
              {SUGGESTED.map((s, i) => (
                <button key={i} className="docchat-suggested-btn small" style={{width: '100%', marginBottom: 6, border: '1.2px solid #23242a', background: '#23242a', color: '#f3f4f6', boxShadow: '0 1px 4px rgba(24,26,32,0.13)', fontSize: '0.82rem', height: 34, padding: '0.4rem 0.4rem'}} onClick={() => handleSuggested(s)} disabled={loading}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        {/* Sign out at bottom */}
        <div className="docchat-sidebar-footer" onClick={handleSignOut} style={{marginBottom: 0, color: '#f87171', fontWeight: 600, cursor: 'pointer', marginTop: 'auto', borderTop: '1px solid #23242a', padding: '1.2rem 1.5rem 0.7rem 1.5rem', background: '#20222b'}}>
          <span role="img" aria-label="signout">⎗</span> Sign Out
        </div>
      </aside>
      {/* Main chat area */}
      <main className="docchat-main" style={{padding: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: '#181a20'}}>
        <div className="docchat-content" style={{alignItems: 'center', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 600, margin: '0 auto'}}>
          {messages.length === 0 && (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.4rem'}}>
              <div className="docchat-welcome-icon" style={{margin: 0, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <img src="https://public.readdy.ai/ai/img_res/2843383d-d3a4-4825-9ff5-4537b840cea4.png" alt="DocChat Logo" style={{width: 72, height: 72, objectFit: 'contain'}} />
              </div>
              <div>
                <div className="docchat-welcome-title" style={{marginBottom: 0, textAlign: 'center', fontSize: '1.08rem', color: '#f3f4f6'}}>How can I help you today?</div>
                <div className="docchat-welcome-desc" style={{marginBottom: 0, marginTop: '0.13rem', fontSize: '0.89rem', textAlign: 'center', color: '#a1a1aa'}}>Ask me anything about company documents, policies, procedures, or guidelines. I'm connected to your company's knowledge base.</div>
              </div>
            </div>
          )}
          {/* Chat history with scroll - only show if there are messages */}
          {messages.length > 0 && (
            <div style={{
              width: '100%',
              maxWidth: 600,
              margin: '0 auto',
              maxHeight: 650,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              background: '#23242a',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(24,26,32,0.13)',
              border: '1px solid #23242a',
              padding: '0.7rem 1rem',
            }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  background: msg.sender === 'user' ? 'linear-gradient(90deg, #22d3ee 0%, #6366f1 100%)' : '#181a20',
                  color: msg.sender === 'user' ? '#181a20' : '#f3f4f6',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  borderRadius: 10,
                  padding: '0.5rem 0.8rem',
                  marginBottom: 7,
                  maxWidth: '80%',
                  boxShadow: msg.sender === 'user' ? '0 2px 6px rgba(34,197,94,0.08)' : '0 2px 6px rgba(24,26,32,0.13)',
                  fontSize: '0.93rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  marginLeft: msg.sender === 'user' ? 'auto' : 0,
                  marginRight: msg.sender === 'ai' ? 'auto' : 0,
                  border: msg.sender === 'user' ? 'none' : '1px solid #23242a',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}>
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div style={{background: '#23242a', color: '#a1a1aa', borderRadius: 10, padding: '0.5rem 0.8rem', marginBottom: 7, maxWidth: '80%', fontSize: '0.93rem', opacity: 0.7}}>Thinking...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div style={{width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 10}}>
          <form className="docchat-inputbar" style={{margin: 0, width: '100%', padding: '0.6rem 1rem', background: '#23242a', borderRadius: 10, boxShadow: '0 2px 8px rgba(24,26,32,0.13)', border: '1px solid #23242a', display: 'flex', alignItems: 'center', gap: '0.7rem'}} onSubmit={handleSend}>
            <input
              className="docchat-input"
              placeholder="Ask about company documents..."
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{minWidth: 0, width: '100%', background: '#181a20', border: '1px solid #23242a', borderRadius: 6, padding: '0.5rem 0.8rem', fontSize: '0.97rem', color: '#f3f4f6'}}
              disabled={loading}
            />
            <button className="docchat-send-btn" type="submit" style={{flexShrink: 0, boxShadow: '0 2px 6px rgba(34,197,94,0.08)', width: 34, height: 34, fontSize: '1.05rem', background: 'linear-gradient(90deg, #22d3ee 0%, #6366f1 100%)', color: '#181a20'}} disabled={loading || !input.trim()}>
              <span role="img" aria-label="send">➤</span>
            </button>
          </form>
        </div>
        {error && <div style={{color: '#e53e3e', textAlign: 'center', marginTop: 8}}>{error}</div>}
      </main>
    </div>
  );
}
