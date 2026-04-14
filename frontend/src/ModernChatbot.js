import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from './ModernChatbot.module.css';

function ModernChatbot({ token, onLogout }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    const userMsg = { role: 'user', text: question };
    setMessages(msgs => [...msgs, userMsg]);
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/query',
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(msgs => [...msgs, { role: 'bot', text: res.data.answer }]);
      setQuestion('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error getting answer');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className={styles.modernBg}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <span className={styles.title}>RAG Chat with Gemma</span>
            <div className={styles.subtitle}>Ask a question based on the loaded context.</div>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={handleClear}>Clear Chat</button>
            <button className={styles.actionBtn} onClick={onLogout}>Logout</button>
          </div>
        </div>
        <div className={styles.messages}>
          {messages.length === 0 && <div className={styles.thinking}>Ask your first question...</div>}
          {messages.map((msg, i) => (
            <div key={i} className={styles.messageRow} style={{justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
              <div className={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className={styles.thinking}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <form className={styles.formRow} onSubmit={handleSend}>
          <input
            className={styles.input}
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask your question..."
            disabled={loading}
          />
          <button className={styles.sendBtn} type="submit" disabled={loading || !question.trim()}>
            Ask
          </button>
        </form>
        {error && <div className="error-message" style={{margin:'24px 48px 0 48px'}}>{error}</div>}
      </div>
    </div>
  );
}

export default ModernChatbot;
// Removed for new frontend
