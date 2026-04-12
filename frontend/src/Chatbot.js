import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from './Chatbot.module.css';

function Chatbot({ token, onLogout }) {
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
    let botMsg = null;
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/query',
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      botMsg = { role: 'bot', text: res.data.answer };
      setMessages(msgs => [...msgs, userMsg, botMsg]);
      setQuestion('');
    } catch (err) {
      setMessages(msgs => [...msgs, userMsg]);
      setError(err.response?.data?.detail || 'Error getting answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.header}>
        <span className={styles.title}>RAG Chatbot</span>
        <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
      <div className={styles.messages}>
        {messages.length === 0 && <div style={{color:'#94a3b8'}}>Ask a question to get started.</div>}
        {messages.map((msg, i) => (
          <div key={i} className={styles.messageRow} style={{justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
            <div className={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className={styles.formRow} onSubmit={handleSend}>
        <input
          className={styles.input}
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button className={styles.sendBtn} type="submit" disabled={loading || !question.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {error && <div className="error-message" style={{margin:'24px 40px 0 40px'}}>{error}</div>}
    </div>
  );
}

export default Chatbot;
// Removed for new frontend
