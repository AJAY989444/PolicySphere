import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import CatalogPage from './pages/CatalogPage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import ComparePage from './pages/ComparePage';
import DashboardPage from './pages/DashboardPage';
import ClaimsPage from './pages/ClaimsPage';
import SubmitClaimPage from './pages/SubmitClaimPage';
import AdvisorDashboardPage from './pages/AdvisorDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManagePolicyPage from './pages/ManagePolicyPage';
import BillingHistoryPage from './pages/BillingHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MyProposalsPage from './pages/MyProposalsPage';
import ProposalWizardPage from './pages/ProposalWizardPage';
import SmartAdvisorPage from './pages/SmartAdvisorPage';
import AdvisorCrmPage from './pages/AdvisorCrmPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        
        {/* Public Catalog & Comparison Workspace */}
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:id" element={<PolicyDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="smart-advisor" element={<SmartAdvisorPage />} />

        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="claims/new" element={<SubmitClaimPage />} />
          <Route path="billing" element={<BillingHistoryPage />} />
          <Route path="proposals" element={<MyProposalsPage />} />
          <Route path="proposals/wizard" element={<ProposalWizardPage />} />
          <Route path="proposals/wizard/:proposalId" element={<ProposalWizardPage />} />
          <Route path="advisor" element={<AdvisorDashboardPage />} />
        </Route>

        {/* Staff & Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADVISOR']} />}>
          <Route path="advisor/crm" element={<AdvisorCrmPage />} />
          <Route path="admin/analytics" element={<AnalyticsPage />} />
        </Route>


        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/policies/new" element={<ManagePolicyPage />} />
          <Route path="admin/policies/edit/:id" element={<ManagePolicyPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
