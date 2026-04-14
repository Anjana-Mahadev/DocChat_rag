
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../styles/ModernChatLayout.css";

const SUGGESTED = [
  "What are the company policies?",
  "How do I request time off?",
  "What are the IT security guidelines?",
  "Explain the expense reimbursement process"
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (question) => {
    setLoading(true);
    setError("");
    // Build history from current messages before adding the new user message
    const history = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));
    setMessages((msgs) => [...msgs, { sender: "user", text: question }]);
    try {
      const res = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question, history })
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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const userInitial = userId ? userId.charAt(0).toUpperCase() : "U";

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-logo">D</div>
          <div className="chat-sidebar-brand">
            <span className="chat-sidebar-brand-name">DocChat</span>
            <span className="chat-sidebar-brand-sub">AI Assistant</span>
          </div>
        </div>

        <button className="chat-new-btn" onClick={handleNewConversation} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          New Conversation
        </button>

        <div className="chat-sidebar-profile">
          <div className="chat-avatar">{userInitial}</div>
          <div className="chat-user-info">
            <span className="chat-user-name">{userId || "User"}</span>
            <span className="chat-user-role">Authenticated</span>
          </div>
        </div>

        <div className="chat-sidebar-section">
          <div className="chat-sidebar-section-title">Quick Questions</div>
          <div className="chat-suggested-list">
            {SUGGESTED.map((s, i) => (
              <button key={i} className="chat-suggested-btn" onClick={() => handleSuggested(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-signout">
          <button className="chat-signout-btn" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-main">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="chat-welcome-title">How can I help you today?</div>
            <div className="chat-welcome-desc">
              Ask me anything about company documents, policies, procedures, or guidelines. 
              I'm connected to your company's knowledge base.
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.sender}`}>
                {msg.sender === "ai" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-typing">
                <span className="chat-typing-dot"></span>
                <span className="chat-typing-dot"></span>
                <span className="chat-typing-dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="chat-input-bar">
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              className="chat-input"
              placeholder="Ask about company documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
          {error && <div className="chat-error">{error}</div>}
        </div>
      </main>
    </div>
  );
}
