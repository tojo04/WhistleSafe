import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { verifier_registry } from 'declarations/verifier_registry';
import VerifierList from './VerifierManagement/VerifierList';
import TreasuryDashboard from './TreasuryManagement/TreasuryDashboard';
import './AdminPanel.css';

function AdminPanel() {
  const { isAuthenticated, principal, login, logout, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && principal) {
      checkAdminStatus();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, principal, authLoading]);

  async function checkAdminStatus() {
    try {
      const verified = await verifier_registry.isVerified(principal);
      setIsAdmin(verified);

      if (verified) {
        await loadVerifiers();
      } else {
        setError('You do not have admin privileges');
      }
    } catch (err) {
      console.error('Admin check error:', err);
      setError('Failed to verify admin status');
    } finally {
      setLoading(false);
    }
  }

  async function loadVerifiers() {
    try {
      const allVerifiers = await verifier_registry.listAllVerifiers();
      setVerifiers(allVerifiers);
    } catch (err) {
      console.error('Error loading verifiers:', err);
    }
  }

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAdmin(false);
      setVerifiers([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-panel loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-panel login-required">
        <div className="admin-login-card">
          <div className="admin-icon">🔐</div>
          <h2>Admin Authentication Required</h2>
          <p>Only system administrators can access this panel</p>
          <button className="admin-login-button" onClick={handleLogin}>
            Admin Login
          </button>
          <div className="admin-info">
            <h4>Administrator Access</h4>
            <p>You must be a verified system administrator to access the admin panel. Contact the platform owner if you believe you should have access.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-panel access-denied">
        <div className="access-denied-card">
          <div className="denied-icon">🚫</div>
          <h2>Admin Access Denied</h2>
          <p>{error || 'You do not have administrator privileges'}</p>
          <div className="denied-info">
            <h4>Administrator Verification Failed</h4>
            <p>Your principal is not authorized as a system administrator.</p>
            <p className="principal-display">
              Principal: <code>{principal?.toString()}</code>
            </p>
            <p>Please contact the platform owner to request admin access.</p>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🛡️ Admin Panel</h1>
          <p className="admin-subtitle">WhistleSafe Platform Administration</p>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span className="admin-badge">Administrator</span>
            <span className="admin-principal">{principal?.toString().slice(0, 12)}...</span>
          </div>
          <button className="admin-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-body">
        <nav className="admin-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="sidebar-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`sidebar-item ${activeSection === 'verifiers' ? 'active' : ''}`}
            onClick={() => setActiveSection('verifiers')}
          >
            <span className="sidebar-icon">👥</span>
            Verifier Management
          </button>
          <button
            className={`sidebar-item ${activeSection === 'treasury' ? 'active' : ''}`}
            onClick={() => setActiveSection('treasury')}
          >
            <span className="sidebar-icon">💰</span>
            Treasury
          </button>
          <button
            className={`sidebar-item ${activeSection === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveSection('monitoring')}
          >
            <span className="sidebar-icon">📈</span>
            System Monitoring
          </button>
          <button
            className={`sidebar-item ${activeSection === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveSection('audit')}
          >
            <span className="sidebar-icon">📋</span>
            Audit Log
          </button>
          <button
            className={`sidebar-item ${activeSection === 'config' ? 'active' : ''}`}
            onClick={() => setActiveSection('config')}
          >
            <span className="sidebar-icon">⚙️</span>
            Configuration
          </button>
          <button
            className={`sidebar-item ${activeSection === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveSection('emergency')}
          >
            <span className="sidebar-icon">🚨</span>
            Emergency Controls
          </button>
        </nav>

        <main className="admin-content">
          {activeSection === 'dashboard' && (
            <div className="dashboard-section">
              <h2>Admin Dashboard</h2>
              <div className="dashboard-stats">
                <div className="dashboard-card">
                  <div className="card-icon">👥</div>
                  <div className="card-content">
                    <div className="card-value">{verifiers.length}</div>
                    <div className="card-label">Total Verifiers</div>
                  </div>
                </div>
                <div className="dashboard-card">
                  <div className="card-icon">✅</div>
                  <div className="card-content">
                    <div className="card-value">
                      {verifiers.filter(v => v.active).length}
                    </div>
                    <div className="card-label">Active Verifiers</div>
                  </div>
                </div>
                <div className="dashboard-card">
                  <div className="card-icon">🟢</div>
                  <div className="card-content">
                    <div className="card-value">Online</div>
                    <div className="card-label">System Status</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'verifiers' && (
            <VerifierList
              verifiers={verifiers}
              onRefresh={loadVerifiers}
              loading={false}
            />
          )}

          {activeSection === 'treasury' && (
            <TreasuryDashboard />
          )}

          {activeSection === 'monitoring' && (
            <div className="monitoring-section">
              <h2>System Monitoring</h2>
              <p className="coming-soon">System monitoring dashboard coming soon...</p>
              <div className="system-status">
                <div className="status-item">
                  <span className="status-indicator online">🟢</span>
                  <span>Verifier Registry: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator online">🟢</span>
                  <span>Blob Store: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator online">🟢</span>
                  <span>Submission Canister: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator online">🟢</span>
                  <span>Council Canister: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator online">🟢</span>
                  <span>Treasury: Online</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'audit' && (
            <div className="audit-section">
              <h2>Audit Log</h2>
              <p className="coming-soon">Comprehensive audit log viewer coming soon...</p>
            </div>
          )}

          {activeSection === 'config' && (
            <div className="config-section">
              <h2>System Configuration</h2>
              <p className="coming-soon">Configuration panel coming soon...</p>
            </div>
          )}

          {activeSection === 'emergency' && (
            <div className="emergency-section">
              <h2>Emergency Controls</h2>
              <div className="emergency-warning">
                <h3>⚠️ Critical System Controls</h3>
                <p>These controls should only be used in emergency situations</p>
              </div>
              <p className="coming-soon">Emergency control panel coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
