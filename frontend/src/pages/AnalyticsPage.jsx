import { useState, useEffect } from 'react';
import {
  HiCurrencyDollar,
  HiUsers,
  HiShieldCheck,
  HiDocumentReport,
  HiDownload,
  HiTrendingUp,
  HiRefresh,
  HiCheckCircle,
  HiClock,
  HiXCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import './AnalyticsPage.css';

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load system analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const { financials, users, policies, claims } = data;

    let csvContent = 'POLICYSPHERE EXECUTIVE ANALYTICS REPORT\n';
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`;

    // 1. FINANCIAL SUMMARY
    csvContent += 'FINANCIAL OVERVIEW\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Revenue,$${financials.totalRevenue}\n`;
    csvContent += `Completed Transactions,${financials.transactionCount}\n\n`;

    csvContent += 'REVENUE BY CATEGORY\n';
    csvContent += 'Category,Revenue ($)\n';
    financials.categoryRevenue.forEach((c) => {
      csvContent += `${c.category},$${c.revenue}\n`;
    });
    csvContent += '\n';

    // 2. USER METRICS
    csvContent += 'USER & ACCOUNT METRICS\n';
    csvContent += 'Metric,Count\n';
    csvContent += `Total Accounts,${users.totalUsers}\n`;
    csvContent += `Customer Accounts,${users.customers}\n`;
    csvContent += `Advisor Accounts,${users.advisors}\n\n`;

    // 3. CLAIMS SUMMARY
    csvContent += 'CLAIMS PERFORMANCE\n';
    csvContent += 'Status,Count\n';
    csvContent += `Pending,${claims.byStatus.PENDING}\n`;
    csvContent += `In Review,${claims.byStatus.IN_REVIEW}\n`;
    csvContent += `Approved,${claims.byStatus.APPROVED}\n`;
    csvContent += `Rejected,${claims.byStatus.REJECTED}\n`;
    csvContent += `Claim Approval Rate,${claims.approvalRate}%\n`;
    csvContent += `Total Amount Claimed,$${claims.totalClaimedAmount}\n`;
    csvContent += `Total Approved Payouts,$${claims.approvedClaimedAmount}\n\n`;

    // 4. TOP PRODUCTS
    csvContent += 'TOP INSURANCE PRODUCTS\n';
    csvContent += 'Rank,Policy Name,Provider,Category,Active Subscriptions\n';
    policies.leaderboard.forEach((item, idx) => {
      csvContent += `#${idx + 1},"${item.name}","${item.provider}",${item.category},${item.activeSubscriptions}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolicySphere_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported as CSV!');
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolicySphere_Analytics_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported as JSON!');
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12) 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container text-center py-12">
        <p className="text-secondary">Unable to load metrics at this time.</p>
        <button onClick={fetchAnalytics} className="btn btn-primary mt-4">
          <HiRefresh /> Retry
        </button>
      </div>
    );
  }

  const { financials, users, policies, claims } = data;

  return (
    <div className="container analytics-page animate-fade-in">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>System Performance Analytics</h1>
          <p className="subtitle">Real-time revenue, subscription conversion, and claim performance stats.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm">
            <HiRefresh /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary btn-sm">
            <HiDownload /> Export CSV (Excel)
          </button>
          <button onClick={handleExportJSON} className="btn btn-ghost btn-sm">
            Export JSON
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <div className="kpi-card glassmorphism">
          <div className="kpi-icon-wrapper revenue">
            <HiCurrencyDollar />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Revenue</span>
            <h2 className="kpi-value">${financials.totalRevenue.toLocaleString()}</h2>
            <span className="kpi-subtext">
              <HiTrendingUp className="text-emerald-500" /> {financials.transactionCount} Successful Checkout(s)
            </span>
          </div>
        </div>

        <div className="kpi-card glassmorphism">
          <div className="kpi-icon-wrapper users">
            <HiUsers />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Platform Customers</span>
            <h2 className="kpi-value">{users.customers}</h2>
            <span className="kpi-subtext">{users.totalUsers} Total Accounts Registered</span>
          </div>
        </div>

        <div className="kpi-card glassmorphism">
          <div className="kpi-icon-wrapper subscriptions">
            <HiShieldCheck />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Subscriptions</span>
            <h2 className="kpi-value">{policies.activeSubscriptions}</h2>
            <span className="kpi-subtext">{policies.totalActivePolicies} Catalog Plans Online</span>
          </div>
        </div>

        <div className="kpi-card glassmorphism">
          <div className="kpi-icon-wrapper claims">
            <HiDocumentReport />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Claim Approval Rate</span>
            <h2 className="kpi-value">{claims.approvalRate}%</h2>
            <span className="kpi-subtext">{claims.totalClaims} Claims Processed</span>
          </div>
        </div>
      </div>

      {/* Analytics Sections Grid */}
      <div className="analytics-sections-grid">
        {/* Category Revenue Breakdown */}
        <div className="analytics-card glassmorphism">
          <h3>Revenue Breakdown by Category</h3>
          <p className="card-sub">Distribution of customer policy purchases</p>

          <div className="category-progress-list">
            {financials.categoryRevenue.length === 0 ? (
              <p className="text-muted py-4">No completed purchases yet.</p>
            ) : (
              financials.categoryRevenue.map((cat, idx) => {
                const percentage = financials.totalRevenue > 0
                  ? ((cat.revenue / financials.totalRevenue) * 100).toFixed(1)
                  : 0;
                return (
                  <div key={idx} className="category-progress-item">
                    <div className="cat-info">
                      <span className="cat-name">{cat.category}</span>
                      <span className="cat-amount">${cat.revenue.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Claim Resolution Health */}
        <div className="analytics-card glassmorphism">
          <h3>Claim Resolution Breakdown</h3>
          <p className="card-sub">Operational efficiency & claim volume</p>

          <div className="claims-status-grid">
            <div className="status-box pending">
              <HiClock />
              <h4>{claims.byStatus.PENDING}</h4>
              <span>Pending</span>
            </div>
            <div className="status-box in-review">
              <HiRefresh />
              <h4>{claims.byStatus.IN_REVIEW}</h4>
              <span>In Review</span>
            </div>
            <div className="status-box approved">
              <HiCheckCircle />
              <h4>{claims.byStatus.APPROVED}</h4>
              <span>Approved</span>
            </div>
            <div className="status-box rejected">
              <HiXCircle />
              <h4>{claims.byStatus.REJECTED}</h4>
              <span>Rejected</span>
            </div>
          </div>

          <div className="payout-summary-box mt-4">
            <div className="payout-item">
              <span>Total Claimed</span>
              <strong>${claims.totalClaimedAmount.toLocaleString()}</strong>
            </div>
            <div className="payout-item">
              <span>Approved Payouts</span>
              <strong className="text-emerald-500">${claims.approvedClaimedAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Insurance Leaderboard */}
      <div className="analytics-card glassmorphism mt-6">
        <h3>Top Performing Insurance Products</h3>
        <p className="card-sub">Most subscribed plans across the marketplace</p>

        {policies.leaderboard.length === 0 ? (
          <p className="text-muted py-4">No subscription data recorded yet.</p>
        ) : (
          <div className="table-responsive mt-3">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Policy Plan Name</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Active Subscriptions</th>
                </tr>
              </thead>
              <tbody>
                {policies.leaderboard.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.provider}</td>
                    <td>
                      <span className="badge badge-secondary">{item.category}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {item.activeSubscriptions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
