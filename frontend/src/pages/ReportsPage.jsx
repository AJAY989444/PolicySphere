import { useState, useEffect } from 'react';
import {
  HiDocumentReport,
  HiCurrencyDollar,
  HiUsers,
  HiShieldCheck,
  HiDownload,
  HiPrinter,
  HiRefresh,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
  HiTrendingUp,
  HiCalendar,
  HiOfficeBuilding,
  HiScale,
  HiReceiptTax,
  HiUserGroup,
  HiEye,
  HiX,
  HiSparkles,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import './ReportsPage.css';

function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'ADVISOR';
  const [activeTab, setActiveTab] = useState('executive');
  const [period, setPeriod] = useState('ALL_TIME');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Domain data states
  const [executiveData, setExecutiveData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [renewalData, setRenewalData] = useState(null);
  const [claimsData, setClaimsData] = useState(null);
  const [fraudData, setFraudData] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [operationalData, setOperationalData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [advisorData, setAdvisorData] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  // Form 80D Modal State
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loadingCert, setLoadingCert] = useState(false);

  // Set default tab when user loads
  useEffect(() => {
    if (!authLoading && user) {
      if (!activeTab) {
        setActiveTab('executive');
      }
    }
  }, [user, authLoading]);

  // Fetch active tab data
  const fetchData = async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);

      // Keep executive KPIs loaded for domain header KPI bar
      if (activeTab !== 'customer' && activeTab !== 'history') {
        const execRes = await api.get(`/reports/executive?period=${period}`);
        if (execRes.data.success) setExecutiveData(execRes.data);
      }

      if (activeTab === 'executive') {
        // Executive data already fetched above
      } else if (activeTab === 'sales') {
        const res = await api.get(`/reports/sales?period=${period}`);
        if (res.data.success) setSalesData(res.data);
      } else if (activeTab === 'renewals') {
        const res = await api.get('/reports/renewals');
        if (res.data.success) setRenewalData(res.data);
      } else if (activeTab === 'claims') {
        const res = await api.get(`/reports/claims?period=${period}`);
        if (res.data.success) setClaimsData(res.data);
      } else if (activeTab === 'fraud') {
        const res = await api.get('/reports/fraud');
        if (res.data.success) setFraudData(res.data);
      } else if (activeTab === 'commissions') {
        const res = await api.get('/reports/commissions');
        if (res.data.success) setCommissionData(res.data);
      } else if (activeTab === 'revenue') {
        const res = await api.get('/reports/revenue');
        if (res.data.success) setRevenueData(res.data);
      } else if (activeTab === 'tax') {
        const res = await api.get('/reports/tax');
        if (res.data.success) setTaxData(res.data);
      } else if (activeTab === 'operational') {
        const res = await api.get('/reports/operational');
        if (res.data.success) setOperationalData(res.data);
      } else if (activeTab === 'customer') {
        const res = await api.get('/reports/customer');
        if (res.data.success) setCustomerData(res.data);
      } else if (activeTab === 'advisor') {
        const res = await api.get(`/reports/advisor?period=${period}`);
        if (res.data.success) setAdvisorData(res.data);
      } else if (activeTab === 'history') {
        const res = await api.get('/reports/history');
        if (res.data.success) setExportHistory(res.data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      toast.error(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [activeTab, period, user, authLoading]);

  // Universal Export Handler
  const handleExport = async (format = 'CSV') => {
    try {
      setExporting(true);
      let reportType = 'EXECUTIVE_OVERVIEW';
      if (activeTab === 'customer') reportType = 'CUSTOMER_PORTFOLIO';
      else if (activeTab === 'sales') reportType = 'SALES_GWP';
      else if (activeTab === 'renewals') reportType = 'RENEWAL_RADAR';
      else if (activeTab === 'claims') reportType = 'CLAIMS_RATIO_TAT';
      else if (activeTab === 'fraud') reportType = 'FRAUD_AUDIT';
      else if (activeTab === 'commissions') reportType = 'COMMISSION_STATEMENT';
      else if (activeTab === 'revenue') reportType = 'REVENUE_FINANCIAL';
      else if (activeTab === 'tax') reportType = 'TAX_COMPLIANCE';
      else if (activeTab === 'operational') reportType = 'OPERATIONAL_SLA';
      else if (activeTab === 'advisor') reportType = 'ADVISOR_PERFORMANCE';

      const res = await api.post('/reports/export', {
        reportType,
        format,
        filters: { period },
      });

      if (res.data.success && res.data.downloadContent) {
        const mimeType = format === 'JSON' ? 'application/json' : 'text/csv;charset=utf-8;';
        const blob = new Blob([res.data.downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${reportType.replace(/_/g, ' ')} exported as ${format}!`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Open Form 80D Tax Exemption Certificate Modal
  const openTaxCertificate = async (userPolicyId) => {
    try {
      setLoadingCert(true);
      const res = await api.get(`/reports/tax-80d/${userPolicyId}`);
      if (res.data.success && res.data.certificate) {
        setSelectedCertificate(res.data.certificate);
      }
    } catch (err) {
      toast.error('Could not load tax certificate');
    } finally {
      setLoadingCert(false);
    }
  };

  return (
    <div className="reports-container">
      {/* ─── Header & Period Selector ──────────────────────── */}
      <div className="reports-header">
        <div className="reports-title-area">
          <h1>{activeTab === 'customer' ? 'My Insurance Reports & Tax Certificates' : 'Enterprise Reporting & Executive Analytics'}</h1>
          <p>
            {activeTab === 'customer'
              ? 'Download IRDAI-compliant Form 80D Tax Exemption Certificates and review your policy portfolio summary'
              : 'Multi-dimensional audit metrics, IRDAI-compliant tax certificates, and executive KPI intelligence'}
          </p>
        </div>

        <div className="reports-header-actions">
          {/* Time Filter */}
          <div className="period-selector">
            {[
              { id: 'ALL_TIME', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'LAST_7_DAYS', label: '7D' },
              { id: 'LAST_30_DAYS', label: '30D' },
              { id: 'QTD', label: 'QTD' },
              { id: 'YTD', label: 'YTD' },
            ].map((p) => (
              <button
                key={p.id}
                className={`period-btn ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export Group */}
          <div className="export-btn-group">
            <button
              className="report-action-btn primary"
              onClick={() => handleExport('CSV')}
              disabled={exporting}
            >
              <HiDownload /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              className="report-action-btn"
              onClick={() => handleExport('JSON')}
              disabled={exporting}
            >
              <HiDocumentReport /> Export JSON
            </button>
            <button className="report-action-btn" onClick={() => window.print()} title="Print Current View">
              <HiPrinter /> Print
            </button>
          </div>
        </div>
      </div>

      {/* ─── Executive KPI Bar (GWP, ICR, Persistency, Revenue, CSAT) ── */}
      {activeTab !== 'customer' && executiveData?.kpis && (
        <div className="reports-kpi-grid">
          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Gross Written Premium (GWP)
              <HiCurrencyDollar style={{ fontSize: '1.2rem', color: '#3b82f6' }} />
            </div>
            <div className="report-kpi-value">${executiveData.kpis.gwp.toLocaleString()}</div>
            <div className="report-kpi-footer">
              <span className="kpi-badge success">Live</span>
              <span className="kpi-subtext">{executiveData.kpis.transactionCount} Successful Deals</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Incurred Claim Ratio (ICR)
              <HiShieldCheck style={{ fontSize: '1.2rem', color: '#10b981' }} />
            </div>
            <div className="report-kpi-value">{executiveData.kpis.icr}%</div>
            <div className="report-kpi-footer">
              <span className={`kpi-badge ${executiveData.kpis.icrStatus === 'OPTIMAL' ? 'success' : executiveData.kpis.icrStatus === 'LOSS_WARNING' ? 'danger' : 'warning'}`}>
                {executiveData.kpis.icrStatus?.replace(/_/g, ' ')}
              </span>
              <span className="kpi-subtext">IRDAI Benchmark: 65–85%</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              13th Month Persistency
              <HiTrendingUp style={{ fontSize: '1.2rem', color: '#8b5cf6' }} />
            </div>
            <div className="report-kpi-value">{executiveData.kpis.persistency13th}%</div>
            <div className="report-kpi-footer">
              <span className="kpi-badge info">IRDAI Persistency</span>
              <span className="kpi-subtext">Client Retention Rate</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Platform Net Revenue
              <HiSparkles style={{ fontSize: '1.2rem', color: '#f59e0b' }} />
            </div>
            <div className="report-kpi-value">${executiveData.kpis.netRevenue.toLocaleString()}</div>
            <div className="report-kpi-footer">
              <span className="kpi-subtext">Commission margins less gateway fees</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              SLA Compliance & CSAT
              <HiCheckCircle style={{ fontSize: '1.2rem', color: '#06b6d4' }} />
            </div>
            <div className="report-kpi-value">{executiveData.kpis.slaComplianceRate}%</div>
            <div className="report-kpi-footer">
              <span className="kpi-badge success">★ {executiveData.kpis.avgCsat} / 5.0</span>
              <span className="kpi-subtext">Support Desk CSAT</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Customer Portfolio KPI Bar ─────────────────────── */}
      {activeTab === 'customer' && customerData?.portfolioSummary && (
        <div className="reports-kpi-grid">
          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Active Coverages
              <HiShieldCheck style={{ fontSize: '1.2rem', color: '#10b981' }} />
            </div>
            <div className="report-kpi-value">{customerData.portfolioSummary.activePoliciesCount}</div>
            <div className="report-kpi-footer">
              <span className="kpi-badge success">Active</span>
              <span className="kpi-subtext">{customerData.portfolioSummary.totalPolicies} Total Subscriptions</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Total Sum Assured
              <HiCurrencyDollar style={{ fontSize: '1.2rem', color: '#3b82f6' }} />
            </div>
            <div className="report-kpi-value">${customerData.portfolioSummary.totalSumAssured.toLocaleString()}</div>
            <div className="report-kpi-footer">
              <span className="kpi-subtext">Cumulative policy coverage</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Annual Premium Outlay
              <HiTrendingUp style={{ fontSize: '1.2rem', color: '#8b5cf6' }} />
            </div>
            <div className="report-kpi-value">${customerData.portfolioSummary.totalAnnualPremium.toLocaleString()}</div>
            <div className="report-kpi-footer">
              <span className="kpi-subtext">Annual insurance investment</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Section 80D Tax Saved
              <HiReceiptTax style={{ fontSize: '1.2rem', color: '#16a34a' }} />
            </div>
            <div className="report-kpi-value">
              ${customerData.tax80DItems.reduce((acc, i) => acc + (i.basePremium || 0), 0).toLocaleString()}
            </div>
            <div className="report-kpi-footer">
              <span className="kpi-badge success">Tax Exempt</span>
              <span className="kpi-subtext">{customerData.tax80DItems.length} Health Certificates</span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-label">
              Claims Lodged
              <HiDocumentReport style={{ fontSize: '1.2rem', color: '#06b6d4' }} />
            </div>
            <div className="report-kpi-value">{customerData.claimsHistory.length}</div>
            <div className="report-kpi-footer">
              <span className="kpi-subtext">{customerData.claimsHistory.filter((c) => c.status === 'APPROVED').length} Approved payouts</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Domain Navigation Tabs ─────────────────────────── */}
      <div className="reports-tabs-bar">
        <button
          className={`domain-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          onClick={() => setActiveTab('executive')}
        >
          📊 Executive Overview
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          💼 Sales & GWP
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'renewals' ? 'active' : ''}`}
          onClick={() => setActiveTab('renewals')}
        >
          🔄 Renewals & Radar
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          🛡️ Claims & TAT
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'fraud' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraud')}
        >
          ⚠️ Fraud & Risk
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          💰 Commissions
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          📈 Revenue & Margins
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          📜 Tax & GST (18%)
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'operational' ? 'active' : ''}`}
          onClick={() => setActiveTab('operational')}
        >
          ⚡ Operations & SLA
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
          onClick={() => setActiveTab('advisor')}
        >
          🎯 Advisor Velocity
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          👤 Customer Tax & Portfolio
        </button>
        <button
          className={`domain-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          🗄️ Export History & Audit
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <HiRefresh className="spin" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
          <div>Compiling analytics & calculating audit metrics...</div>
        </div>
      )}

      {/* ─── TAB 1: EXECUTIVE OVERVIEW ───────────────────────── */}
      {!loading && activeTab === 'executive' && executiveData && (
        <div className="domain-section">
          <div className="report-grid-2">
            {/* Sales Volume Trend */}
            <div className="report-card">
              <div className="report-card-header">
                <div>
                  <div className="report-card-title">
                    <HiTrendingUp style={{ color: '#2563eb' }} /> Monthly GWP Velocity Trend
                  </div>
                  <div className="report-card-subtitle">Last 6 months premium collection trajectory</div>
                </div>
              </div>

              <div className="chart-bars-container">
                {executiveData.monthlyTrend.map((m, idx) => {
                  const maxGwp = Math.max(...executiveData.monthlyTrend.map((x) => x.gwp)) || 1;
                  const heightPercent = Math.max(15, Math.round((m.gwp / maxGwp) * 100));
                  return (
                    <div key={idx} className="chart-bar-column">
                      <div className="chart-bar-value">${(m.gwp / 1000).toFixed(1)}k</div>
                      <div className="chart-bar-fill" style={{ height: `${heightPercent}%` }} />
                      <div className="chart-bar-label">{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Share Distribution */}
            <div className="report-card">
              <div className="report-card-header">
                <div>
                  <div className="report-card-title">
                    <HiShieldCheck style={{ color: '#10b981' }} /> Portfolio Category Share
                  </div>
                  <div className="report-card-subtitle">Distribution of issued policies across sectors</div>
                </div>
              </div>

              <div className="report-table-wrapper">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Active Policies</th>
                      <th>Share Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(executiveData.categoryDistribution || {}).map(([cat, count]) => {
                      const total = executiveData.kpis.totalPoliciesSold || 1;
                      const pct = ((count / total) * 100).toFixed(1);
                      return (
                        <tr key={cat}>
                          <td><span className={`cat-pill ${cat}`}>{cat}</span></td>
                          <td><strong>{count}</strong> policies</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, background: '#e2e8f0', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ background: '#2563eb', height: '100%', width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SALES & GWP ──────────────────────────────── */}
      {!loading && activeTab === 'sales' && salesData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Average Deal Size</div>
              <div className="report-kpi-value" style={{ margin: '0.75rem 0' }}>
                ${salesData.summary.avgTicketSize.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Mean premium per policy issued</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Premium Tier Breakdown</div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>Micro (&lt;$2k): <strong>{salesData.ticketTiers.MICRO}</strong></div>
                <div>Standard ($2k–$10k): <strong>{salesData.ticketTiers.STANDARD}</strong></div>
                <div>Premium ($10k–$50k): <strong>{salesData.ticketTiers.PREMIUM}</strong></div>
                <div>High Net Worth (&gt;$50k): <strong>{salesData.ticketTiers.HNW}</strong></div>
              </div>
            </div>

            <div className="report-card">
              <div className="report-card-title">Acquisition Channel ROI</div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>⚡ Smart Advisor AI: <strong>{salesData.channelAttribution.SMART_ADVISOR || 0}</strong> deals</div>
                <div>🔍 Catalog Search: <strong>{salesData.channelAttribution.CATALOG_INQUIRY || 0}</strong> deals</div>
                <div>🤝 Advisor Referral: <strong>{salesData.channelAttribution.REFERRAL || 0}</strong> deals</div>
                <div>🌐 Landing Page: <strong>{salesData.channelAttribution.LANDING_PAGE || 0}</strong> deals</div>
              </div>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Top Selling Product Leaderboard</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Insurer Provider</th>
                    <th>Category</th>
                    <th>Sales Volume</th>
                    <th>Gross Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.leaderboard.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.provider}</td>
                      <td><span className={`cat-pill ${item.category}`}>{item.category}</span></td>
                      <td>{item.salesCount} policies</td>
                      <td><strong>${item.revenue.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: RENEWALS & RADAR ─────────────────────────── */}
      {!loading && activeTab === 'renewals' && renewalData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="report-card-title">Critical Renewals (30 Days)</div>
              <div className="report-kpi-value" style={{ color: '#ef4444', margin: '0.75rem 0' }}>
                {renewalData.queues.due30DaysCount}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Immediate advisor outreach queue</p>
            </div>

            <div className="report-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="report-card-title">Grace Period Alerts</div>
              <div className="report-kpi-value" style={{ color: '#f59e0b', margin: '0.75rem 0' }}>
                {renewalData.queues.gracePeriodCount}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Expired &lt;30 days — grace period active</p>
            </div>

            <div className="report-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="report-card-title">IRDAI 13th Month Persistency</div>
              <div className="report-kpi-value" style={{ color: '#10b981', margin: '0.75rem 0' }}>
                {renewalData.persistencyCurve.month13}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>25th Mo: {renewalData.persistencyCurve.month25}% | 37th Mo: {renewalData.persistencyCurve.month37}%</p>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Upcoming 30-Day Renewal Queue</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Product</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th>Premium</th>
                    <th>Days Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {renewalData.upcomingPoliciesDue.map((p) => (
                    <tr key={p.id}>
                      <td><code>{p.policyNumber}</code></td>
                      <td>{p.policyName}</td>
                      <td><strong>{p.customerName}</strong></td>
                      <td>{p.customerEmail}</td>
                      <td>${p.premium}</td>
                      <td>
                        <span className="status-tag PENDING">
                          <HiClock style={{ marginRight: '0.25rem' }} /> {p.daysRemaining} days left
                        </span>
                      </td>
                    </tr>
                  ))}
                  {renewalData.upcomingPoliciesDue.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No policies currently due for renewal in next 30 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: CLAIMS & TAT ─────────────────────────────── */}
      {!loading && activeTab === 'claims' && claimsData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Claims Settlement Ratio</div>
              <div className="report-kpi-value" style={{ color: '#10b981', margin: '0.75rem 0' }}>
                {claimsData.kpis.settlementRatio}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Approved vs Settled Ratio</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Average Settlement TAT</div>
              <div className="report-kpi-value" style={{ color: '#2563eb', margin: '0.75rem 0' }}>
                {claimsData.kpis.avgSettlementTatDays} Days
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>From filing to payout disbursement</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Total Approved Payouts</div>
              <div className="report-kpi-value" style={{ color: '#0f172a', margin: '0.75rem 0' }}>
                ${claimsData.kpis.totalApprovedAmount.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Total claimed: ${claimsData.kpis.totalClaimedAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="report-grid-2">
            <div className="report-card">
              <div className="report-card-header">
                <div className="report-card-title">Common Rejection Reasons</div>
              </div>
              <div className="report-table-wrapper">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Cases</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsData.rejectionReasons.map((r, i) => (
                      <tr key={i}>
                        <td>{r.reason}</td>
                        <td><strong>{r.count}</strong></td>
                        <td>{r.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-card">
              <div className="report-card-header">
                <div className="report-card-title">Recent Claims Ledger</div>
              </div>
              <div className="report-table-wrapper">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Risk Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsData.recentClaims.map((c) => (
                      <tr key={c.id}>
                        <td><code>{c.claimNumber}</code></td>
                        <td>{c.customerName}</td>
                        <td><strong>${c.amount}</strong></td>
                        <td><span className={`status-tag ${c.status}`}>{c.status}</span></td>
                        <td><span className={`kpi-badge ${c.fraudRiskTier === 'LOW' ? 'success' : 'warning'}`}>{c.fraudRiskTier}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: FRAUD & RISK ─────────────────────────────── */}
      {!loading && activeTab === 'fraud' && fraudData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Average Fraud Risk Score</div>
              <div className="report-kpi-value" style={{ margin: '0.75rem 0' }}>
                {fraudData.summary.avgFraudScore} / 100
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>AI anomaly & velocity risk model</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Fast-Track Auto Approvals</div>
              <div className="report-kpi-value" style={{ color: '#10b981', margin: '0.75rem 0' }}>
                {fraudData.summary.fastTrackApprovalRate}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Low-risk claims cleared instantly</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Special Investigation (SIU)</div>
              <div className="report-kpi-value" style={{ color: '#ef4444', margin: '0.75rem 0' }}>
                {fraudData.summary.highRiskCount}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>High-risk flagged claim cases</p>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Flagged Fraud Anomalies & Red Flags</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Anomaly Category</th>
                    <th>Description</th>
                    <th>Occurrences</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudData.flaggedAnomalies.map((a, i) => (
                    <tr key={i}>
                      <td><strong>{a.type}</strong></td>
                      <td>{a.description}</td>
                      <td>{a.occurrences}</td>
                      <td>
                        <span className={`kpi-badge ${a.severity === 'CRITICAL' ? 'warning' : 'info'}`}>
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: COMMISSIONS & TDS ────────────────────────── */}
      {!loading && activeTab === 'commissions' && commissionData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Gross Advisor Commission</div>
              <div className="report-kpi-value" style={{ margin: '0.75rem 0' }}>
                ${commissionData.summary.totalGross.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Total commission liability</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">TDS Withheld (Section 194H)</div>
              <div className="report-kpi-value" style={{ color: '#b45309', margin: '0.75rem 0' }}>
                ${commissionData.summary.tdsWithheld5.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>5% statutory tax withholding</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Net Disbursed Payouts</div>
              <div className="report-kpi-value" style={{ color: '#166534', margin: '0.75rem 0' }}>
                ${commissionData.summary.netDisbursed.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Net transferred to advisors</p>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Advisor Commission Leaderboard</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Advisor Name</th>
                    <th>Email</th>
                    <th>Deals Closed</th>
                    <th>Gross Earnings</th>
                    <th>TDS (5%)</th>
                    <th>Net Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData.leaderboard.map((adv) => (
                    <tr key={adv.advisorId}>
                      <td><strong>{adv.advisorName}</strong></td>
                      <td>{adv.email}</td>
                      <td>{adv.dealsCount} deals</td>
                      <td>${adv.grossAmount.toLocaleString()}</td>
                      <td>${adv.tds.toLocaleString()}</td>
                      <td><strong>${adv.netAmount.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                  {commissionData.leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No commission statements available for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: TAX & GST (18%) COMPLIANCE ────────────────── */}
      {!loading && activeTab === 'tax' && taxData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Total 18% GST Collected</div>
              <div className="report-kpi-value" style={{ color: '#2563eb', margin: '0.75rem 0' }}>
                ${taxData.gstSummary.totalGst18.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>CGST 9% (${taxData.gstSummary.cgst9}) + SGST 9% (${taxData.gstSummary.sgst9})</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">TDS Section 194H</div>
              <div className="report-kpi-value" style={{ color: '#f59e0b', margin: '0.75rem 0' }}>
                ${taxData.tdsSummary.totalTdsWithheld.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>5.00% withholding on commission</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Section 80D Deductions</div>
              <div className="report-kpi-value" style={{ color: '#10b981', margin: '0.75rem 0' }}>
                {taxData.exemption80D.totalCertificatesEligible}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Total health certificates generated</p>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Statutory Regulatory Filing Matrix</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Statute / Section</th>
                    <th>Compliance Scope</th>
                    <th>Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>GST Act 2017</strong></td>
                    <td>Indirect Tax on Digital Insurance Premiums</td>
                    <td>18% (9% CGST + 9% SGST / 18% IGST)</td>
                    <td><span className="status-tag SUCCESS">Compliant</span></td>
                  </tr>
                  <tr>
                    <td><strong>Income Tax Sec 194H</strong></td>
                    <td>Tax Deducted at Source on Advisor Commission</td>
                    <td>5.00% Flat</td>
                    <td><span className="status-tag SUCCESS">Compliant</span></td>
                  </tr>
                  <tr>
                    <td><strong>Income Tax Sec 80D</strong></td>
                    <td>Customer Health Insurance Premium Exemption</td>
                    <td>Up to ₹25,000 (Self) / ₹50,000 (Senior Parents)</td>
                    <td><span className="status-tag SUCCESS">Certificates Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 8: OPERATIONS & SLA ─────────────────────────── */}
      {!loading && activeTab === 'operational' && operationalData && (
        <div className="domain-section">
          <div className="report-grid-3">
            <div className="report-card">
              <div className="report-card-title">Underwriting Auto-Approval Rate</div>
              <div className="report-kpi-value" style={{ color: '#10b981', margin: '0.75rem 0' }}>
                {operationalData.underwriting.autoApprovalRate}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Avg Underwriting TAT: {operationalData.underwriting.avgUnderwritingTatHours} hrs</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Support Desk SLA Compliance</div>
              <div className="report-kpi-value" style={{ color: '#2563eb', margin: '0.75rem 0' }}>
                {operationalData.supportSla.slaCompliancePercent}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>FRT: {operationalData.supportSla.avgFirstResponseTimeMinutes} mins | MTTR: {operationalData.supportSla.avgMeanTimeToResolutionHours} hrs</p>
            </div>

            <div className="report-card">
              <div className="report-card-title">Net Promoter Score (NPS)</div>
              <div className="report-kpi-value" style={{ color: '#f59e0b', margin: '0.75rem 0' }}>
                +{operationalData.csatAndNps.nps}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Overall CSAT: {operationalData.csatAndNps.avgCsat} / 5.0 Stars</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 9: CUSTOMER TAX & PORTFOLIO ─────────────────── */}
      {!loading && activeTab === 'customer' && customerData && (
        <div className="domain-section">
          <div className="report-grid-2">
            <div className="report-card">
              <div className="report-card-header">
                <div className="report-card-title">
                  <HiShieldCheck style={{ color: '#2563eb' }} /> Policy Portfolio Summary
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Active Policies</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{customerData.portfolioSummary.activePoliciesCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Sum Assured</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#166534' }}>
                    ${customerData.portfolioSummary.totalSumAssured.toLocaleString()}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Total Annual Premium Outlay: <strong>${customerData.portfolioSummary.totalAnnualPremium.toLocaleString()}</strong>
              </p>
            </div>

            <div className="report-card">
              <div className="report-card-header">
                <div className="report-card-title">
                  <HiReceiptTax style={{ color: '#16a34a' }} /> Section 80D Tax Certificates
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
                Download IRDAI-compliant certificates for Income Tax deduction under Section 80D.
              </p>

              {customerData.tax80DItems.map((item) => (
                <div
                  key={item.userPolicyId}
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.policyName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <code>{item.policyNumber}</code> • Paid: ${item.premiumPaid} (incl. 18% GST)
                    </div>
                  </div>
                  <button
                    className="report-action-btn primary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => openTaxCertificate(item.userPolicyId)}
                    disabled={loadingCert}
                  >
                    <HiEye /> View Certificate
                  </button>
                </div>
              ))}
              {customerData.tax80DItems.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No eligible health policies found.</p>
              )}
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">My Insurance Coverages</div>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Product</th>
                    <th>Provider</th>
                    <th>Category</th>
                    <th>Coverage</th>
                    <th>Premium</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customerData.policies.map((p) => (
                    <tr key={p.id}>
                      <td><code>{p.policyNumber}</code></td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.provider}</td>
                      <td><span className={`cat-pill ${p.category}`}>{p.category}</span></td>
                      <td>${p.coverageAmount?.toLocaleString()}</td>
                      <td>${p.premium}</td>
                      <td>
                        {p.category === 'HEALTH' ? (
                          <button
                            className="report-action-btn"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                            onClick={() => openTaxCertificate(p.id)}
                          >
                            80D Certificate
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 10: EXPORT HISTORY & AUDIT ──────────────────── */}
      {!loading && activeTab === 'history' && (
        <div className="domain-section">
          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-title">Audit Log of Generated Reports</div>
              <button className="report-action-btn" onClick={fetchData}>
                <HiRefresh /> Refresh
              </button>
            </div>
            <div className="report-table-wrapper">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Report Title</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Date Range</th>
                    <th>Generated By</th>
                    <th>Size (KB)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((rep) => (
                    <tr key={rep.id}>
                      <td><strong>{rep.title}</strong></td>
                      <td><code>{rep.reportType}</code></td>
                      <td><span className="kpi-badge info">{rep.format}</span></td>
                      <td>{rep.dateRange}</td>
                      <td>{rep.user ? `${rep.user.firstName} ${rep.user.lastName}` : 'System'}</td>
                      <td>{rep.fileSizeKb} KB</td>
                      <td>{new Date(rep.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {exportHistory.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No export audit records found. Click "Export CSV" or "Export JSON" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── OFFICIAL PRINTABLE FORM 80D CERTIFICATE MODAL ──── */}
      {selectedCertificate && (
        <div className="certificate-modal-backdrop" onClick={() => setSelectedCertificate(null)}>
          <div className="certificate-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="certificate-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Official Income Tax Exemption Certificate
              </h3>
              <div className="certificate-actions">
                <button
                  className="report-action-btn primary"
                  onClick={() => window.print()}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  <HiPrinter /> Print Certificate
                </button>
                <button
                  className="report-action-btn"
                  onClick={() => setSelectedCertificate(null)}
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <HiX />
                </button>
              </div>
            </div>

            {/* Printable View */}
            <div className="certificate-print-view">
              <div className="cert-official-header">
                <div className="cert-logo-title">
                  <h2>PolicySphere</h2>
                  <div className="cert-tagline">Authorized Digital Insurance Aggregator & Underwriter</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Regulated under Insurance Regulatory and Development Authority of India (IRDAI)
                  </div>
                </div>
                <div className="cert-meta-right">
                  <div><strong>Certificate No:</strong> {selectedCertificate.certificateNumber}</div>
                  <div><strong>Issue Date:</strong> {selectedCertificate.issueDate}</div>
                  <div><strong>Financial Year:</strong> {selectedCertificate.financialYear}</div>
                  <div><strong>Assessment Year:</strong> {selectedCertificate.assessmentYear}</div>
                </div>
              </div>

              <div className="cert-title-banner">
                <h3>CERTIFICATE OF PREMIUM PAYMENT FOR DEDUCTION UNDER SECTION 80D</h3>
                <p>Issued under Section 80D of the Income Tax Act, 1961 for medical insurance premium paid</p>
              </div>

              <div className="cert-grid-2">
                <div className="cert-info-box">
                  <h4>Policyholder Information</h4>
                  <div className="cert-info-row">
                    <span>Name of Assessee:</span>
                    <span>{selectedCertificate.policyholder.name}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>Email Address:</span>
                    <span>{selectedCertificate.policyholder.email}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>Phone:</span>
                    <span>{selectedCertificate.policyholder.phone}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>Assessee PAN:</span>
                    <span>{selectedCertificate.policyholder.panNumber}</span>
                  </div>
                </div>

                <div className="cert-info-box">
                  <h4>Insurance Policy Details</h4>
                  <div className="cert-info-row">
                    <span>Policy Number:</span>
                    <span><code>{selectedCertificate.policyDetails.policyNumber}</code></span>
                  </div>
                  <div className="cert-info-row">
                    <span>Product Name:</span>
                    <span>{selectedCertificate.policyDetails.productName}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>Underwriting Insurer:</span>
                    <span>{selectedCertificate.insurer.name}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>IRDAI Registration:</span>
                    <span>{selectedCertificate.insurer.irdaRegNo}</span>
                  </div>
                  <div className="cert-info-row">
                    <span>Cover Period:</span>
                    <span>{selectedCertificate.policyDetails.periodCovered}</span>
                  </div>
                </div>
              </div>

              <table className="cert-tax-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Statutory Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount (USD / INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Base Health Insurance Premium (Excluding Taxes)</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right' }}><strong>${selectedCertificate.taxBreakup.basePremium}</strong></td>
                  </tr>
                  <tr>
                    <td>Central Goods and Services Tax (CGST)</td>
                    <td>9.00%</td>
                    <td style={{ textAlign: 'right' }}>${selectedCertificate.taxBreakup.cgst9}</td>
                  </tr>
                  <tr>
                    <td>State Goods and Services Tax (SGST)</td>
                    <td>9.00%</td>
                    <td style={{ textAlign: 'right' }}>${selectedCertificate.taxBreakup.sgst9}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                    <td>Total Gross Premium Paid</td>
                    <td>18.00% GST Total</td>
                    <td style={{ textAlign: 'right' }}>${selectedCertificate.taxBreakup.grossPremiumPaid}</td>
                  </tr>
                  <tr style={{ background: '#eff6ff', color: '#1e40af', fontWeight: '800' }}>
                    <td>Eligible Deduction Amount under Section 80D</td>
                    <td>Statutory Ceiling: $25,000</td>
                    <td style={{ textAlign: 'right' }}>${selectedCertificate.taxBreakup.eligibleDeduction80D}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                * Note: Under Section 80D of the Income Tax Act, deduction is admissible only for the base premium paid.
                GST and any late fee charges are not eligible for tax exemption. The maximum statutory deduction allowable
                is ₹25,000 for self, spouse, and dependent children, and up to ₹50,000 if covering senior citizen parents.
              </div>

              <div className="cert-footer-seal">
                <div className="cert-seal-badge">
                  <HiShieldCheck style={{ fontSize: '1.4rem' }} />
                  <div>
                    <div>VERIFIED DIGITAL SEAL</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600 }}>{selectedCertificate.verificationCode}</div>
                  </div>
                </div>

                <div className="cert-signature-box">
                  <div className="cert-signature-line" />
                  <div>Authorized Signatory</div>
                  <div>PolicySphere Regulatory Compliance Desk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
