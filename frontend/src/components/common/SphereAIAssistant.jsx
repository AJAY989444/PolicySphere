import React, { useState, useRef, useEffect } from 'react';
import {
  HiSparkles,
  HiX,
  HiPaperAirplane,
  HiArrowRight,
  HiAdjustments,
  HiMicrophone,
  HiVolumeUp,
  HiVolumeOff,
  HiStop,
} from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './SphereAIAssistant.css';

const QUICK_SUGGESTIONS = [
  '⚡ Run AI Smart Advisor Wizard',
  '📈 Predict 5-Year Premium',
  '🎲 Calculate Claim Probability',
  '🔍 Test AI Fraud Anomaly Check',
  '🎙️ How does Voice Assistant work?',
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
      text: 'Hello! I am **SphereAI**, your 24/7 personal insurance advisor. You can type or click the **Microphone** to speak hands-free!',
      recommendedPolicies: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Web Speech Recognition (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage(transcript);
          handleSend(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow mic access in your browser.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Bulletproof Speech Stop: immediately cuts off all speech queues and unpauses
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
          activeUtteranceRef.current.onstart = null;
          activeUtteranceRef.current = null;
        }
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (err) {
        console.error('Error stopping speech:', err);
      }
    }
    setSpeakingIndex(null);
  };

  // Preload browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // When assistant drawer/tab is closed, immediately silence all voice speech
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // When browser window/tab is closed, navigated, or component unmounts, stop speech
  useEffect(() => {
    const handleUnload = () => {
      stopSpeech();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      stopSpeech();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // Text to Speech (TTS) Synthesizer
  const speakText = (text, index = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice audio is not supported in this browser.');
      return;
    }

    // If currently speaking this specific message, clicking it toggles it OFF
    if (speakingIndex === index && index !== null) {
      stopSpeech();
      return;
    }

    // Stop and clear any previous speech without pausing
    try {
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current.onstart = null;
        activeUtteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.warn('Speech reset error:', e);
    }

    // Clean markdown bold, bullets, hashes, and links for natural voice
    const cleanText = (text || '')
      .replace(/\*\*/g, '')
      .replace(/[•#]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Best-effort natural voice selection
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira') || v.name.includes('Jenny'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
    } catch (err) {}

    utterance.onstart = () => {
      setSpeakingIndex(index);
    };

    utterance.onend = () => {
      setSpeakingIndex(null);
      activeUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.warn('Speech synthesis utterance error:', event);
      setSpeakingIndex(null);
      activeUtteranceRef.current = null;
    };

    activeUtteranceRef.current = utterance;
    setSpeakingIndex(index);

    // Chrome unfreeze: resume if browser is in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        stopSpeech();
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start error:', err);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const message = textToSend || inputMessage.trim();
    if (!message || loading) return;

    // Immediately stop any prior speech
    stopSpeech();

    if (message.includes('Smart Advisor Wizard') || message.includes('Run AI Smart Advisor')) {
      stopSpeech();
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
      setMessages((prev) => {
        const nextMsgs = [...prev, aiMsgObj];
        if (speechEnabled && response.data.reply) {
          setTimeout(() => speakText(response.data.reply, nextMsgs.length - 1), 200);
        }
        return nextMsgs;
      });
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
        onClick={() => {
          if (isOpen) {
            stopSpeech();
          }
          setIsOpen(!isOpen);
        }}
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
                <span className="online-status">● Live AI Voice & Recommendation Engine</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {speakingIndex !== null && (
                <button
                  className="btn btn-xs"
                  onClick={stopSpeech}
                  title="Stop AI Voice Audio Immediately"
                  style={{
                    fontSize: '0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 800,
                  }}
                >
                  <HiStop size={14} className="animate-pulse" /> Stop Voice
                </button>
              )}

              <button
                className="btn btn-xs"
                onClick={() => {
                  if (speakingIndex !== null) {
                    stopSpeech();
                  }
                  setSpeechEnabled(!speechEnabled);
                  toast(speechEnabled ? 'Auto-Voice Narration OFF' : 'Auto-Voice Narration ON', { icon: speechEnabled ? '🔇' : '🔊' });
                }}
                title={speechEnabled ? 'Auto-Voice is ON (Click to turn OFF)' : 'Auto-Voice is OFF (Click to turn ON)'}
                style={{
                  fontSize: '0.75rem',
                  background: speechEnabled ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  padding: '0.35rem 0.55rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {speechEnabled ? <HiVolumeUp size={16} /> : <HiVolumeOff size={16} />}
                <span>{speechEnabled ? 'Voice ON' : 'Voice OFF'}</span>
              </button>

              <button
                className="btn btn-xs btn-ghost text-white"
                onClick={() => {
                  stopSpeech();
                  setIsOpen(false);
                  navigate('/smart-advisor');
                }}
                title="Launch AI Advisor Hub"
                style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', color: 'white' }}
              >
                <HiAdjustments /> Advisor Hub
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  stopSpeech();
                  setIsOpen(false);
                }}
                title="Close SphereAI"
              >
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
                  {msg.sender === 'ai' && (
                    <div className="bubble-top-bar">
                      <button
                        className={`msg-speech-btn ${speakingIndex === index ? 'speaking' : ''}`}
                        onClick={() => speakText(msg.text, index)}
                        title={speakingIndex === index ? 'Stop reading' : 'Read aloud with AI voice'}
                      >
                        {speakingIndex === index ? (
                          <>
                            <HiStop size={14} className="text-danger animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <HiVolumeUp size={14} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="msg-text">{renderFormattedText(msg.text)}</div>

                  {/* Render Recommended Policy Cards */}
                  {msg.recommendedPolicies && msg.recommendedPolicies.length > 0 && (
                    <>
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
                              onClick={() => {
                                stopSpeech();
                                setIsOpen(false);
                              }}
                            >
                              View Plan Details <HiArrowRight />
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Listen / Stop Button for Tall Cards View */}
                      <div className="bubble-bottom-bar mt-2">
                        <button
                          className={`msg-speech-btn ${speakingIndex === index ? 'speaking' : ''}`}
                          onClick={() => speakText(msg.text, index)}
                          title={speakingIndex === index ? 'Stop reading' : 'Read aloud with AI voice'}
                        >
                          {speakingIndex === index ? (
                            <>
                              <HiStop size={14} className="text-danger animate-pulse" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <HiVolumeUp size={14} />
                              <span>Listen to Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
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

          {/* Active Speaking Player Banner */}
          {speakingIndex !== null && (
            <div className="active-speech-banner animate-fade-in">
              <div className="speech-pulse-info">
                <HiVolumeUp size={16} className="text-danger animate-pulse" />
                <span>SphereAI Voice is playing...</span>
              </div>
              <button
                className="speech-stop-action-btn"
                onClick={stopSpeech}
                title="Stop Speaking"
              >
                <HiStop size={14} /> Stop
              </button>
            </div>
          )}

          {/* Listening Pulsing Banner */}
          {isListening && (
            <div className="listening-pulse-banner animate-fade-in">
              <span className="pulse-recording-dot"></span>
              <span>Listening to your voice... Speak your insurance query clearly</span>
            </div>
          )}

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

          {/* Input Box with Microphone Voice Button */}
          <form
            className="ai-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now" : "Ask SphereAI anything or use microphone..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              type="button"
              className={`mic-dictate-btn ${isListening ? 'listening-active' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Listening... click to cancel" : "Click to speak with voice"}
            >
              <HiMicrophone size={18} />
            </button>
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

