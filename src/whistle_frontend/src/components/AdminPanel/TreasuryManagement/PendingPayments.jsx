function PendingPayments({ onRefresh }) {
  return (
    <div className="pending-payments">
      <h3>Pending Reward Payments</h3>
      <p className="coming-soon">No pending payments at this time</p>
      <div className="empty-state">
        <div className="empty-icon">💸</div>
        <p>All authorized rewards have been processed</p>
      </div>
    </div>
  );
}

export default PendingPayments;
