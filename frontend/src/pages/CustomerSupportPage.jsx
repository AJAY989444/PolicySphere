import React, { useState, useEffect, useRef } from 'react';
import {
  HiSearch,
  HiOutlineChatAlt2,
  HiOutlinePhone,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiPlus,
  HiX,
  HiPaperAirplane,
  HiThumbUp,
  HiThumbDown,
  HiEye,
  HiStar,
  HiCheckCircle,
  HiExclamationCircle,
  HiOutlineExternalLink,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CustomerSupportPage.css';

const KB_CATEGORIES = [
  { key: 'ALL', label: 'All Topics' },
  { key: 'CLAIM_ASSISTANCE', label: 'Cashless & Claims' },
  { key: 'POLICY_INQUIRY', label: 'Policy Coverage, Tax & NCB' },
  { key: 'PAYMENT_BILLING', label: 'Payment & Billing' },
  { key: 'CANCELLATION_REFUND', label: 'Free-Look & Refunds' },
  { key: 'KYC_VERIFICATION', label: 'C-KYC Verification' },
  { key: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
  { key: 'GENERAL', label: 'General Inquiries' },
];

export default function CustomerSupportPage() {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('KB'); // 'KB' | 'TICKETS'

  // Knowledge Base State
  const [kbArticles, setKbArticles] = useState([]);
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [selectedKbCategory, setSelectedKbCategory] = useState('ALL');
  const [kbLoading, setKbLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Stored article votes: slug -> 'YES' | 'NO'
  const [votedArticles, setVotedArticles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kb_user_voted_articles') || '{}');
    } catch {
      return {};
    }
  });
  const [votingArticle, setVotingArticle] = useState(false);

  // Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketFormData, setTicketFormData] = useState({
    category: 'CLAIM_ASSISTANCE',
    priority: 'MEDIUM',
    subject: '',
    description: '',
    relatedPolicyId: '',
  });
  const [deflectionArticles, setDeflectionArticles] = useState([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

  // CSAT Rating State
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  // Live Chat Drawer State
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Voice Callback Modal State
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackFormData, setCallbackFormData] = useState({
    customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    preferredTime: 'Within 30 Minutes',
    category: 'GENERAL',
    notes: '',
  });
  const [submittingCallback, setSubmittingCallback] = useState(false);

  // WhatsApp Simulator Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waFormData, setWaFormData] = useState({
    phone: user?.phone || '+91 98765 43210',
    message: 'Hi PolicySphere, need immediate help with cashless authorization at hospital desk.',
  });
  const [waResult, setWaResult] = useState(null);
  const [waSimulating, setWaSimulating] = useState(false);

  // ─── Fetch Knowledge Base Articles ─────────────────────────
  const fetchKbArticles = async () => {
    try {
      setKbLoading(true);
      const res = await api.get('/support/kb', {
        params: {
          category: selectedKbCategory !== 'ALL' ? selectedKbCategory : undefined,
          query: kbSearchQuery.trim() || undefined,
        },
      });

      let fetched = res.data?.articles || [];

      // If user typed a search query with a category selected, but 0 matches were in that category,
      // fallback to searching globally across all topics so the user is never stuck with 0 results!
      if (fetched.length === 0 && kbSearchQuery.trim() && selectedKbCategory !== 'ALL') {
        const fallbackRes = await api.get('/support/kb', {
          params: {
            query: kbSearchQuery.trim(),
          },
        });
        if (fallbackRes.data?.articles && fallbackRes.data.articles.length > 0) {
          fetched = fallbackRes.data.articles;
          setSelectedKbCategory('ALL');
        }
      }

      setKbArticles(fetched);
    } catch (err) {
      console.error('Error fetching KB articles:', err);
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    fetchKbArticles();
  }, [selectedKbCategory]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKbArticles();
    }, 350);
    return () => clearTimeout(timer);
  }, [kbSearchQuery]);

  // ─── Fetch Customer Tickets ────────────────────────────────
  const fetchMyTickets = async () => {
    if (!user) return;
    try {
      setTicketsLoading(true);
      const res = await api.get('/support/tickets/my');
      if (res.data?.tickets) {
        setMyTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'TICKETS' && user) {
      fetchMyTickets();
    }
  }, [activeTab, user]);

  // ─── View Knowledge Article Detail & Increment Views ────────
  const openArticleDetail = async (slug) => {
    try {
      const res = await api.get(`/support/kb/${slug}`);
      if (res.data?.article) {
        setSelectedArticle(res.data.article);
      }
    } catch (err) {
      toast.error('Unable to load article details');
    }
  };

  // Vote Article Helpfulness
  const handleVoteArticle = async (isHelpful) => {
    if (!selectedArticle || votingArticle) return;
    const voteKey = isHelpful ? 'YES' : 'NO';
    const currentVote = votedArticles[selectedArticle.slug];

    if (currentVote === voteKey) {
      toast(`You already voted "${voteKey === 'YES' ? 'Yes' : 'No'}" for this guide.`, {
        icon: 'ℹ️',
      });
      return;
    }

    try {
      setVotingArticle(true);
      const res = await api.post(`/support/kb/${selectedArticle.slug}/vote`, {
        isHelpful,
        voterId: user?.id,
      });

      if (res.data?.success) {
        const updatedArticle = res.data.article;
        setSelectedArticle(updatedArticle);

        // Update in articles grid state as well
        setKbArticles((prev) =>
          prev.map((a) => (a.slug === updatedArticle.slug ? { ...a, ...updatedArticle } : a))
        );

        const newVotes = { ...votedArticles, [selectedArticle.slug]: voteKey };
        setVotedArticles(newVotes);
        localStorage.setItem('kb_user_voted_articles', JSON.stringify(newVotes));

        if (res.data.alreadyVoted) {
          toast('Your feedback was already recorded.', { icon: 'ℹ️' });
        } else {
          toast.success(
            currentVote
              ? 'Your vote was updated!'
              : isHelpful
              ? 'Thank you! Marked as helpful.'
              : 'Thank you for your feedback.'
          );
        }
      }
    } catch (err) {
      toast.error('Could not submit feedback');
    } finally {
      setVotingArticle(false);
    }
  };

  // ─── AI Deflection Trigger on Ticket Subject/Description ───
  useEffect(() => {
    if (!showCreateModal) return;
    const query = `${ticketFormData.subject} ${ticketFormData.description}`.trim();
    if (query.length < 4) {
      setDeflectionArticles([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/support/kb', {
          params: {
            category: ticketFormData.category,
            query: ticketFormData.subject || ticketFormData.description,
          },
        });
        if (res.data.success && res.data.articles) {
          setDeflectionArticles(res.data.articles.slice(0, 3));
        }
      } catch (e) {
        // silent fail for background deflection
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [ticketFormData.subject, ticketFormData.description, ticketFormData.category, showCreateModal]);

  // ─── Create Support Ticket ─────────────────────────────────
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketFormData.subject.trim() || !ticketFormData.description.trim()) {
      toast.error('Please enter a subject and description for your ticket.');
      return;
    }

    try {
      setCreatingTicket(true);
      const res = await api.post('/support/tickets', ticketFormData);
      if (res.data.success) {
        toast.success(`Support Ticket ${res.data.ticket.ticketNumber} registered successfully!`);
        setShowCreateModal(false);
        setTicketFormData({
          category: 'CLAIM_ASSISTANCE',
          priority: 'MEDIUM',
          subject: '',
          description: '',
          relatedPolicyId: '',
        });
        setDeflectionArticles([]);
        setActiveTab('TICKETS');
        fetchMyTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit support ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  // ─── View Ticket Details ───────────────────────────────────
  const openTicketDetails = async (ticketId) => {
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
        setCsatRating(res.data.ticket.csatRating || 5);
        setCsatFeedback(res.data.ticket.csatFeedback || '');
      }
    } catch (err) {
      toast.error('Unable to load ticket details');
    }
  };

  // ─── Send Customer Reply in Ticket Thread ──────────────────
  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: ticketReplyText.trim(),
        isInternalNote: false,
      });

      if (res.data.success) {
        setSelectedTicket((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), res.data.message],
        }));
        setTicketReplyText('');
        toast.success('Reply sent to support desk');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // ─── Submit CSAT Rating ────────────────────────────────────
  const handleSubmitCsat = async () => {
    if (!selectedTicket) return;
    try {
      setSubmittingCsat(true);
      const res = await api.post(`/support/tickets/${selectedTicket.id}/csat`, {
        rating: csatRating,
        feedback: csatFeedback,
      });

      if (res.data.success) {
        setSelectedTicket((prev) => ({
          ...prev,
          csatRating: res.data.ticket.csatRating,
          csatFeedback: res.data.ticket.csatFeedback,
        }));
        toast.success('Thank you for rating our service!');
        fetchMyTickets();
      }
    } catch (err) {
      toast.error('Failed to submit satisfaction rating');
    } finally {
      setSubmittingCsat(false);
    }
  };

  // ─── Live Chat Flow ────────────────────────────────────────
  const openLiveChat = async () => {
    setShowChatDrawer(true);
    if (!chatSession) {
      try {
        const res = await api.post('/support/chat/start', {
          customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest User',
          customerEmail: user?.email || 'guest@policysphere.com',
          category: 'POLICY_INQUIRY',
          initialMessage: 'Hello! I need assistance with PolicySphere coverage and claims.',
        });
        if (res.data.success) {
          setChatSession(res.data.session);
          setChatMessages(res.data.session.messages || []);
        }
      } catch (err) {
        console.error('Chat start failed:', err);
      }
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !chatSession) return;

    const userText = chatInputText.trim();
    setChatInputText('');

    try {
      setChatSending(true);
      const res = await api.post(`/support/chat/${chatSession.sessionRef}/message`, {
        sender: 'CUSTOMER',
        text: userText,
        customerName: user ? user.firstName : 'Customer',
      });

      if (res.data.success) {
        setChatSession(res.data.session);
        setChatMessages(res.data.messages || []);

        if (res.data.newTicket) {
          toast.success(`Priority support ticket ${res.data.newTicket.ticketNumber} registered!`);
        }
      }
    } catch (err) {
      toast.error('Failed to deliver message');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Voice Callback Handler ────────────────────────────────
  const handleRequestCallback = async (e) => {
    e.preventDefault();
    if (!callbackFormData.customerName.trim() || !callbackFormData.phone.trim()) {
      toast.error('Please provide your name and phone number.');
      return;
    }

    try {
      setSubmittingCallback(true);
      const res = await api.post('/support/callback', callbackFormData);
      if (res.data.success) {
        toast.success('Callback requested! Our advisor will ring you shortly.');
        setShowCallbackModal(false);
      }
    } catch (err) {
      toast.error('Failed to submit callback request');
    } finally {
      setSubmittingCallback(false);
    }
  };

  // ─── WhatsApp Simulator Handler ────────────────────────────
  const handleSimulateWhatsApp = async (e) => {
    e.preventDefault();
    try {
      setWaSimulating(true);
      const res = await api.post('/support/whatsapp/simulate', {
        phone: waFormData.phone,
        message: waFormData.message,
        customerName: user ? user.firstName : 'Customer',
      });
      if (res.data.success) {
        setWaResult(res.data);
        toast.success(`WhatsApp ticket logged: ${res.data.ticket.ticketNumber}`);
      }
    } catch (err) {
      toast.error('WhatsApp simulation failed');
    } finally {
      setWaSimulating(false);
    }
  };

  // Helper for SLA priority info
  const getSlaHoursText = (priority) => {
    switch (priority) {
      case 'URGENT':
        return '1h First Response / 4h Resolution SLA';
      case 'HIGH':
        return '4h First Response / 12h Resolution SLA';
      case 'MEDIUM':
        return '8h First Response / 24h Resolution SLA';
      case 'LOW':
        return '24h First Response / 48h Resolution SLA';
      default:
        return 'Standard 24h SLA';
    }
  };

  return (
    <div className="support-container">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <div className="support-hero">
        <div className="support-hero-badge">
          <HiOutlineShieldCheck size={18} /> IRDAI Compliant Customer Care
        </div>
        <h1>How can PolicySphere help you today?</h1>
        <p>
          Search verified insurance guidance, access instant 24/7 AI claim deflection, or connect directly with our
          licensed insurance advisors.
        </p>

        {/* Quick Ingestion Channels Grid */}
        <div className="quick-channels-grid">
          <div className="channel-card" onClick={() => setActiveTab('KB')}>
            <div className="channel-icon">
              <HiOutlineDocumentText />
            </div>
            <div className="channel-title">Knowledge Base</div>
            <div className="channel-subtitle">Self-help articles & FAQs</div>
          </div>

          <div
            className="channel-card"
            onClick={() => {
              if (!user) {
                toast.error('Please log in to submit a support ticket');
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            <div className="channel-icon">
              <HiPlus />
            </div>
            <div className="channel-title">Raise Support Ticket</div>
            <div className="channel-subtitle">Guaranteed SLA deadlines</div>
          </div>

          <div className="channel-card" onClick={openLiveChat}>
            <div className="channel-icon">
              <HiOutlineChatAlt2 />
            </div>
            <div className="channel-title">SphereSupport AI</div>
            <div className="channel-subtitle">Instant answers & routing</div>
          </div>

          <div className="channel-card" onClick={() => setShowCallbackModal(true)}>
            <div className="channel-icon">
              <HiOutlinePhone />
            </div>
            <div className="channel-title">Voice Callback</div>
            <div className="channel-subtitle">Phone advisor in 30 mins</div>
          </div>

          <div className="channel-card" onClick={() => setShowWhatsAppModal(true)}>
            <div className="channel-icon">
              <span>💬</span>
            </div>
            <div className="channel-title">WhatsApp Support</div>
            <div className="channel-subtitle">Official verified channel</div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────── */}
      <div className="support-tabs-bar">
        <div className="support-nav-tabs">
          <button
            className={`support-tab-btn ${activeTab === 'KB' ? 'active' : ''}`}
            onClick={() => setActiveTab('KB')}
          >
            <HiOutlineDocumentText /> Knowledge Base & FAQs
          </button>
          <button
            className={`support-tab-btn ${activeTab === 'TICKETS' ? 'active' : ''}`}
            onClick={() => {
              if (!user) {
                toast.error('Please log in to view your tickets');
              } else {
                setActiveTab('TICKETS');
              }
            }}
          >
            <HiOutlineClock /> My Support Tickets
            {myTickets.length > 0 && <span className="tab-badge">{myTickets.length}</span>}
          </button>
        </div>

        {user && activeTab === 'TICKETS' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <HiPlus /> New Support Ticket
          </button>
        )}
      </div>

      {/* ─── Tab 1: Knowledge Base View ───────────────────────── */}
      {activeTab === 'KB' && (
        <div>
          {/* Search Box */}
          <div className="kb-search-box">
            <HiSearch className="kb-search-icon" />
            <input
              type="text"
              className="kb-search-input"
              placeholder="Search cashless hospital admission, 80D tax exemption, NCB bonus, claim forms..."
              value={kbSearchQuery}
              onChange={(e) => setKbSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills">
            {KB_CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`category-pill ${selectedKbCategory === c.key ? 'active' : ''}`}
                onClick={() => setSelectedKbCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {kbLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              Searching knowledge base articles...
            </div>
          ) : kbArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <HiOutlineDocumentText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0f172a' }}>No Knowledge Base Articles Found</h3>
              <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
                {selectedKbCategory !== 'ALL' ? (
                  <>
                    No articles found matching &quot;{kbSearchQuery}&quot; in the selected category.{' '}
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                      onClick={() => setSelectedKbCategory('ALL')}
                    >
                      Search in All Topics
                    </button>
                  </>
                ) : (
                  "We couldn't find an exact match. You can raise a ticket directly to receive personalized support."
                )}
              </p>
              {user && (
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <HiPlus /> Raise Support Ticket
                </button>
              )}
            </div>
          ) : (
            <div className="articles-grid">
              {kbArticles.map((art) => (
                <div key={art.id} className="article-card" onClick={() => openArticleDetail(art.slug)}>
                  <div>
                    <span className="article-category-badge badge-open">{art.category.replace(/_/g, ' ')}</span>
                    <h3 className="article-title">{art.title}</h3>
                    <p className="article-summary">{art.summary}</p>
                  </div>
                  <div className="article-card-footer">
                    <div className="article-metrics">
                      <span>
                        <HiEye /> {art.viewCount} views
                      </span>
                      <span>
                        <HiThumbUp /> {art.helpfulCount} helpful
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Read Guide →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: My Support Tickets ───────────────────────── */}
      {activeTab === 'TICKETS' && (
        <div>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px' }}>
              <HiOutlineShieldCheck size={48} style={{ color: '#2563eb', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0f172a' }}>Log in to view your tickets</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Track real-time resolution SLAs, advisor communications, and satisfaction ratings.
              </p>
              <Link to="/login" className="btn btn-primary">
                Sign In
              </Link>
            </div>
          ) : ticketsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              Loading your support tickets...
            </div>
          ) : myTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <HiCheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0f172a' }}>No Active Support Tickets</h3>
              <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                You have no open tickets or inquiries. Our support advisors are ready to assist whenever needed.
              </p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <HiPlus /> Raise a Support Ticket
              </button>
            </div>
          ) : (
            <div className="tickets-table-container">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject & Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Escalation Tier</th>
                    <th>SLA Deadline</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map((t) => (
                    <tr key={t.id} onClick={() => openTicketDetails(t.id)}>
                      <td>
                        <span className="ticket-num-badge">{t.ticketNumber}</span>
                      </td>
                      <td>
                        <div className="ticket-subject-cell">{t.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.category.replace(/_/g, ' ')}
                          {t.channel !== 'PORTAL' && ` • Channel: ${t.channel}`}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-priority priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </td>
                      <td>
                        <span className={`badge-status badge-${t.status.toLowerCase()}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="badge-tier" style={{ background: '#f1f5f9', color: '#334155' }}>
                          {t.escalationTier === 'TIER_1_AGENT'
                            ? 'Tier 1 Support'
                            : t.escalationTier === 'TIER_2_SPECIALIST'
                            ? 'Tier 2 Specialist'
                            : 'Tier 3 Mgmt'}
                        </span>
                      </td>
                      <td>
                        {t.status === 'RESOLVED' || t.status === 'CLOSED' ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Resolved</span>
                        ) : t.slaBreached ? (
                          <span className="sla-pill sla-breached">SLA Breached</span>
                        ) : (
                          <span className="sla-pill sla-ontrack">
                            Due {new Date(t.slaResolutionDue).toLocaleDateString()}{' '}
                            {new Date(t.slaResolutionDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal 1: Article Reader & Vote ──────────────────── */}
      {selectedArticle && (
        <div className="modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content article-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="article-category-badge badge-open">
                  {selectedArticle.category.replace(/_/g, ' ')}
                </span>
                <h3 style={{ marginTop: '0.25rem' }}>{selectedArticle.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedArticle(null)}>
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="article-body-markdown">
                <div style={{ whiteSpace: 'pre-line' }}>{selectedArticle.content}</div>
              </div>

              {/* Helpfulness Vote Bar */}
              <div className="article-vote-bar">
                <div>
                  <span style={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>
                    Was this article helpful to you?
                  </span>
                  {votedArticles[selectedArticle.slug] && (
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                      ✓ Your vote: &quot;{votedArticles[selectedArticle.slug] === 'YES' ? 'Yes' : 'No'}&quot;
                    </span>
                  )}
                </div>
                <div className="vote-buttons">
                  <button
                    className={`btn btn-sm ${
                      votedArticles[selectedArticle.slug] === 'YES' ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => handleVoteArticle(true)}
                    disabled={votingArticle}
                    title={
                      votedArticles[selectedArticle.slug] === 'YES'
                        ? 'You voted Yes'
                        : 'Mark as helpful'
                    }
                  >
                    <HiThumbUp /> Yes ({selectedArticle.helpfulCount})
                  </button>
                  <button
                    className={`btn btn-sm ${
                      votedArticles[selectedArticle.slug] === 'NO' ? 'btn-danger' : 'btn-outline'
                    }`}
                    onClick={() => handleVoteArticle(false)}
                    disabled={votingArticle}
                    title={
                      votedArticles[selectedArticle.slug] === 'NO'
                        ? 'You voted No'
                        : 'Mark as not helpful'
                    }
                  >
                    <HiThumbDown /> No ({selectedArticle.notHelpfulCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)}>
                Close
              </button>
              {user && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedArticle(null);
                    setShowCreateModal(true);
                  }}
                >
                  Still need help? Raise Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Create Support Ticket with AI Deflection ─── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Official Support Ticket</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={ticketFormData.category}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value })}
                    >
                      <option value="CLAIM_ASSISTANCE">Claim Assistance (Cashless/Reimburse)</option>
                      <option value="POLICY_INQUIRY">Policy Terms & Tax Benefits</option>
                      <option value="PAYMENT_BILLING">Payment & Premium Deduction</option>
                      <option value="ENDORSEMENT">Policy Endorsement / Modification</option>
                      <option value="RENEWAL">Renewal & NCB Continuity</option>
                      <option value="CANCELLATION_REFUND">Free-Look Cancellation & Refund</option>
                      <option value="KYC_VERIFICATION">KYC / AML Documentation</option>
                      <option value="GRIEVANCE">Official Grievance Redressal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={ticketFormData.priority}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
                    >
                      <option value="URGENT">🚨 Urgent (4h SLA)</option>
                      <option value="HIGH">⚡ High (12h SLA)</option>
                      <option value="MEDIUM">🔹 Medium (24h SLA)</option>
                      <option value="LOW">⚪ Low (48h SLA)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {getSlaHoursText(ticketFormData.priority)}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent pre-authorization query for cashless admission at Manipal Hospital"
                    value={ticketFormData.subject}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, subject: e.target.value })}
                    required
                  />
                </div>

                {/* AI Deflection Box */}
                {deflectionArticles.length > 0 && (
                  <div className="deflection-banner">
                    <div className="deflection-header">
                      <HiOutlineSparkles size={18} /> Instant Answers Found in Knowledge Base:
                    </div>
                    {deflectionArticles.map((art) => (
                      <div
                        key={art.id}
                        className="deflection-item"
                        onClick={() => {
                          setSelectedArticle(art);
                        }}
                      >
                        <div className="deflection-title">{art.title}</div>
                        <div className="deflection-summary">{art.summary}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label>Detailed Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue with patient/policy details, hospital name, or transaction ID..."
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Related Policy ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-1029384"
                    value={ticketFormData.relatedPolicyId}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, relatedPolicyId: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingTicket}>
                  {creatingTicket ? 'Submitting Ticket...' : 'Register Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Ticket Thread Details & CSAT ───────────── */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="ticket-num-badge">{selectedTicket.ticketNumber}</span>
                  <span className={`badge-status badge-${selectedTicket.status.toLowerCase()}`}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={{ marginTop: '0.4rem' }}>{selectedTicket.subject}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              {/* Ticket Metadata Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Category:</span>{' '}
                  <strong>{selectedTicket.category.replace(/_/g, ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Priority:</span>{' '}
                  <strong className={`priority-${selectedTicket.priority.toLowerCase()}`}>
                    {selectedTicket.priority}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>SLA Status:</span>{' '}
                  <strong>
                    {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                      ? 'Closed'
                      : selectedTicket.slaBreached
                      ? '⚠️ Overdue'
                      : 'On Track'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Assigned Advisor:</span>{' '}
                  <strong>
                    {selectedTicket.assignedTo
                      ? `${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}`
                      : 'Frontline Support'}
                  </strong>
                </div>
              </div>

              {/* Message Thread */}
              <div className="thread-container">
                {selectedTicket.messages &&
                  selectedTicket.messages.map((m) => {
                    const isStaff = m.senderType === 'STAFF' || m.senderType === 'SYSTEM';
                    return (
                      <div
                        key={m.id}
                        className={`message-bubble ${isStaff ? 'message-staff' : 'message-customer'}`}
                      >
                        <div className="message-header">
                          <strong>{isStaff ? '🛡️ PolicySphere Support' : 'You'}</strong>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                      </div>
                    );
                  })}
              </div>

              {/* CSAT Rating Widget (Shown if ticket is resolved/closed) */}
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="csat-card">
                  <h4>Customer Satisfaction Rating</h4>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.25rem 0' }}>
                    How would you rate the resolution provided by our support team?
                  </p>
                  <div className="csat-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= csatRating ? 'active' : ''}`}
                        onClick={() => setCsatRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                    }}
                    placeholder="Share any comments regarding our speed or response..."
                    value={csatFeedback}
                    onChange={(e) => setCsatFeedback(e.target.value)}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                    onClick={handleSubmitCsat}
                    disabled={submittingCsat}
                  >
                    {submittingCsat ? 'Saving...' : 'Submit 5-Star CSAT Rating'}
                  </button>
                </div>
              )}

              {/* Reply Box (If ticket is active) */}
              {selectedTicket.status !== 'CLOSED' && (
                <form onSubmit={handleSendTicketReply} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                    }}
                    placeholder="Type your response to the support advisor..."
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sendingReply}>
                    <HiPaperAirplane /> Send
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Live Chat Widget & Drawer ──────────────── */}
      {!showChatDrawer && (
        <button className="floating-chat-trigger" onClick={openLiveChat}>
          <HiOutlineChatAlt2 size={22} />
          <span>SphereSupport AI (24/7)</span>
        </button>
      )}

      {showChatDrawer && (
        <div className="chat-drawer">
          <div className="chat-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>SphereSupport AI</strong>
                <div style={{ fontSize: '0.72rem', color: '#bfdbfe' }}>Instant Insurance Assistant</div>
              </div>
            </div>
            <button
              onClick={() => setShowChatDrawer(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.25rem' }}
            >
              <HiX />
            </button>
          </div>

          <div className="chat-messages-container">
            {chatMessages.map((m, idx) => (
              <div
                key={m.id || idx}
                style={{
                  alignSelf: m.sender === 'CUSTOMER' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'CUSTOMER' ? '#2563eb' : '#ffffff',
                  color: m.sender === 'CUSTOMER' ? '#ffffff' : '#1e293b',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  border: m.sender === 'CUSTOMER' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem' }}>
                  {m.sender === 'CUSTOMER' ? 'You' : 'SphereSupport AI'}
                </div>
                <div>{m.text}</div>
              </div>
            ))}
            <div ref={chatMessagesEndRef} />
          </div>

          <form onSubmit={handleSendChatMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask about claims, tax 80D, renewals..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
            />
            <button type="submit" className="chat-send-btn" disabled={chatSending}>
              <HiPaperAirplane />
            </button>
          </form>
        </div>
      )}

      {/* ─── Modal 4: Voice Callback Request ─────────────────── */}
      {showCallbackModal && (
        <div className="modal-backdrop" onClick={() => setShowCallbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Priority Voice Callback</h3>
              <button className="modal-close-btn" onClick={() => setShowCallbackModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleRequestCallback}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={callbackFormData.customerName}
                    onChange={(e) => setCallbackFormData({ ...callbackFormData, customerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number (+91)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={callbackFormData.phone}
                    onChange={(e) => setCallbackFormData({ ...callbackFormData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Time Slot</label>
                  <select
                    value={callbackFormData.preferredTime}
                    onChange={(e) => setCallbackFormData({ ...callbackFormData, preferredTime: e.target.value })}
                  >
                    <option value="Within 30 Minutes">Within 30 Minutes (Priority)</option>
                    <option value="Morning 10 AM - 1 PM">Morning 10:00 AM - 1:00 PM</option>
                    <option value="Afternoon 2 PM - 5 PM">Afternoon 2:00 PM - 5:00 PM</option>
                    <option value="Evening 6 PM - 9 PM">Evening 6:00 PM - 9:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Topic</label>
                  <select
                    value={callbackFormData.category}
                    onChange={(e) => setCallbackFormData({ ...callbackFormData, category: e.target.value })}
                  >
                    <option value="CLAIM_ASSISTANCE">Claim Reimbursement / Cashless query</option>
                    <option value="POLICY_INQUIRY">Policy details & Coverage check</option>
                    <option value="PAYMENT_BILLING">Payment deduction / Refund issue</option>
                    <option value="RENEWAL">Renewal assistance</option>
                    <option value="GENERAL">General support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Brief Issue Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific query or policy number for our advisor..."
                    value={callbackFormData.notes}
                    onChange={(e) => setCallbackFormData({ ...callbackFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCallbackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingCallback}>
                  {submittingCallback ? 'Requesting...' : 'Request Callback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 5: WhatsApp Simulator ────────────────────── */}
      {showWhatsAppModal && (
        <div className="modal-backdrop" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💬</span>
                <h3>WhatsApp Business Support Integration</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowWhatsAppModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSimulateWhatsApp}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                  PolicySphere provides an automated WhatsApp business channel for claim tracking, tax receipts, and
                  ticket logging under IRDAI guidelines.
                </p>

                <div className="form-group">
                  <label>WhatsApp Registered Phone Number</label>
                  <input
                    type="tel"
                    value={waFormData.phone}
                    onChange={(e) => setWaFormData({ ...waFormData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Simulated WhatsApp Message</label>
                  <textarea
                    rows={3}
                    value={waFormData.message}
                    onChange={(e) => setWaFormData({ ...waFormData, message: e.target.value })}
                    required
                  />
                </div>

                {waResult && (
                  <div
                    style={{
                      background: '#dcfce7',
                      border: '1.5px solid #86efac',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    <strong style={{ color: '#166534' }}>
                      ✅ Ticket Created: {waResult.ticket?.ticketNumber}
                    </strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#14532d' }}>
                      <strong>Automated Reply:</strong> {waResult.autoReply}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowWhatsAppModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={waSimulating}>
                  {waSimulating ? 'Sending WhatsApp...' : 'Simulate WhatsApp Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
