function PaymentHistory() {
  return (
    <div className="payment-history">
      <h3>Payment History</h3>
      <p className="coming-soon">No payment history available</p>
      <div className="empty-state">
        <div className="empty-icon">📜</div>
        <p>Payment records will appear here once rewards are processed</p>
      </div>
    </div>
  );
}

export default PaymentHistory;
