import React, { useState, useRef, useEffect } from 'react';
import { HiSparkles, HiX, HiPaperAirplane, HiShieldCheck, HiArrowRight, HiChatAlt2, HiAdjustments } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import './SphereAIAssistant.css';

const QUICK_SUGGESTIONS = [
  '⚡ Run AI Smart Advisor Wizard',
  '🏥 Recommend a Health plan for my family',
  '📄 Explain policy fine print & waiting periods',
  '💰 What are Section 80D tax deductions?',
];

function SphereAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am **SphereAI**, your 24/7 personal insurance advisor. How can I help you find the perfect coverage today?',
      recommendedPolicies: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend) => {
    const message = textToSend || inputMessage.trim();
    if (!message || loading) return;

    if (message.includes('Smart Advisor Wizard') || message.includes('Run AI Smart Advisor')) {
      setIsOpen(false);
      navigate('/smart-advisor');
      return;
    }

    // Add user message
    const userMsgObj = { sender: 'user', text: message };
    setMessages((prev) => [...prev, userMsgObj]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message });
      const aiMsgObj = {
        sender: 'ai',
        text: response.data.reply,
        recommendedPolicies: response.data.recommendedPolicies || [],
      };
      setMessages((prev) => [...prev, aiMsgObj]);
    } catch (error) {
      console.error('SphereAI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I am having trouble connecting right now. Please try again in a moment!',
          recommendedPolicies: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const renderFormattedText = (text) => {
    if (!text) return '';
    // Split by markdown bold syntax **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="sphere-ai-container">
      {/* Floating Launcher Button */}
      <button
        className={`sphere-ai-launcher ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ask SphereAI Assistant"
      >
        {isOpen ? <HiX size={24} /> : <HiSparkles size={24} className="sparkle-pulse" />}
        {!isOpen && <span className="launcher-text">SphereAI Advisor</span>}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="sphere-ai-chat-window animate-fade-in-up">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-avatar">
                <HiSparkles />
              </div>
              <div>
                <h4>SphereAI Assistant</h4>
                <span className="online-status">● Live AI Recommendation Engine</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                className="btn btn-xs btn-ghost text-white"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/smart-advisor');
                }}
                title="Launch AI Advisor Hub"
                style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', color: 'white' }}
              >
                <HiAdjustments /> Advisor Hub
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <HiX />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.sender}`}>
                {msg.sender === 'ai' && (
                  <div className="ai-msg-avatar">
                    <HiSparkles />
                  </div>
                )}
                <div className="message-bubble">
                  <div className="msg-text">{renderFormattedText(msg.text)}</div>

                  {/* Render Recommended Policy Cards */}
                  {msg.recommendedPolicies && msg.recommendedPolicies.length > 0 && (
                    <div className="ai-policy-cards">
                      {msg.recommendedPolicies.map((policy) => (
                        <div key={policy.id} className="ai-policy-card">
                          <div className="ai-card-top">
                            <span className="ai-card-cat">{policy.category}</span>
                            {policy.matchScore && (
                              <span className="ai-match-badge">
                                <HiSparkles size={12} /> {policy.matchScore}% Match
                              </span>
                            )}
                          </div>
                          <h5>{policy.name}</h5>
                          <div className="ai-card-stats">
                            <div>
                              <span className="lbl">Coverage: </span>
                              <strong className="stat-val-cov">{formatCurrency(policy.coverageAmount)}</strong>
                            </div>
                            <div>
                              <span className="lbl">Premium: </span>
                              <strong className="stat-val-prem">{formatCurrency(policy.premium)}/yr</strong>
                            </div>
                          </div>
                          <Link
                            to={`/catalog/${policy.id}`}
                            className="btn btn-primary btn-sm ai-card-btn"
                            onClick={() => setIsOpen(false)}
                          >
                            View Plan Details <HiArrowRight />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}


            {loading && (
              <div className="message-row ai">
                <div className="ai-msg-avatar">
                  <HiSparkles />
                </div>
                <div className="message-bubble ai-typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="ai-quick-chips">
            {QUICK_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                className="chip-btn"
                onClick={() => handleSend(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            className="ai-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask SphereAI anything about insurance..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!inputMessage.trim() || loading}>
              <HiPaperAirplane />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SphereAIAssistant;

