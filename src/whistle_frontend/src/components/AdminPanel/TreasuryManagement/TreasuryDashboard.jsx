import { useState, useEffect } from 'react';
import { treasury } from 'declarations/treasury';
import FundTreasuryModal from './FundTreasuryModal';
import WithdrawModal from './WithdrawModal';
import PendingPayments from './PendingPayments';
import PaymentHistory from './PaymentHistory';

function TreasuryDashboard() {
  const [balance, setBalance] = useState(BigInt(0));
  const [stats, setStats] = useState({
    totalAuthorized: BigInt(0),
    totalPaid: BigInt(0),
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTreasuryData();
  }, []);

  async function loadTreasuryData() {
    try {
      const [bal, pending, history] = await Promise.all([
        treasury.getTreasuryBalance(),
        treasury.listPendingPayments(),
        treasury.getPaymentHistory(100, 0)
      ]);

      setBalance(bal);
      setStats({
        totalAuthorized: pending.reduce((sum, p) => sum + p.amount, BigInt(0)),
        totalPaid: history.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, BigInt(0)),
        pendingCount: pending.length
      });
    } catch (error) {
      console.error('Error loading treasury data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatICP = (amount) => {
    return (Number(amount) / 100000000).toFixed(2) + ' ICP';
  };

  const getBalanceStatus = () => {
    const icpBalance = Number(balance) / 100000000;
    if (icpBalance > 100) return 'healthy';
    if (icpBalance > 10) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="treasury-loading">
        <div className="loading-spinner"></div>
        <p>Loading treasury data...</p>
      </div>
    );
  }

  return (
    <div className="treasury-dashboard">
      <div className="treasury-header">
        <h2>Treasury Management</h2>
        <div className="treasury-actions">
          <button className="fund-button" onClick={() => setShowFundModal(true)}>
            + Fund Treasury
          </button>
          <button className="withdraw-button" onClick={() => setShowWithdrawModal(true)}>
            Withdraw
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="treasury-stats">
            <div className={`balance-card ${getBalanceStatus()}`}>
              <div className="balance-label">Current Balance</div>
              <div className="balance-amount">{formatICP(balance)}</div>
              <div className="balance-status">
                {getBalanceStatus() === 'healthy' && '🟢 Healthy'}
                {getBalanceStatus() === 'warning' && '🟡 Low Balance'}
                {getBalanceStatus() === 'critical' && '🔴 Critical - Fund Soon'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-value">{stats.pendingCount}</div>
                <div className="stat-label">Pending Payments</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{formatICP(stats.totalAuthorized)}</div>
                <div className="stat-label">Total Authorized</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{formatICP(stats.totalPaid)}</div>
                <div className="stat-label">Total Paid</div>
              </div>
            </div>
          </div>

          <div className="treasury-info">
            <div className="info-box">
              <h3>Treasury Operations</h3>
              <ul>
                <li>Manage platform reward payments</li>
                <li>Fund treasury to enable rewards</li>
                <li>Process authorized payments manually</li>
                <li>View complete payment history</li>
                <li>Withdraw excess funds if needed</li>
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="treasury-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments ({stats.pendingCount})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
      </div>

      {activeTab === 'pending' && (
        <PendingPayments onRefresh={loadTreasuryData} />
      )}

      {activeTab === 'history' && (
        <PaymentHistory />
      )}

      {showFundModal && (
        <FundTreasuryModal
          currentBalance={balance}
          onClose={() => setShowFundModal(false)}
          onSuccess={() => {
            setShowFundModal(false);
            loadTreasuryData();
          }}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          currentBalance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            loadTreasuryData();
          }}
        />
      )}
    </div>
  );
}

export default TreasuryDashboard;
