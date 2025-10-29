import { useState } from 'react';

function WithdrawModal({ currentBalance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatICP = (amt) => {
    return (Number(amt) / 100000000).toFixed(2) + ' ICP';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!recipient.trim()) {
      setError('Recipient principal is required');
      return;
    }

    if (!memo.trim()) {
      setError('Memo/reason is required for audit trail');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Mock withdraw:', { amount, recipient, memo });
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError('Failed to withdraw: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal danger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header danger">
          <h2>⚠️ Withdraw from Treasury</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="warning-box">
            <p>This will transfer ICP from the treasury to the specified recipient</p>
          </div>

          <div className="balance-info">
            <div className="balance-row">
              <span>Available Balance:</span>
              <strong>{formatICP(currentBalance)}</strong>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              Amount (ICP) <span className="required">*</span>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipient">
              Recipient Principal <span className="required">*</span>
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="memo">
              Reason/Memo <span className="required">*</span>
            </label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Explain the reason for this withdrawal..."
              rows={3}
              maxLength={500}
              disabled={submitting}
            />
            <small>Required for audit trail</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="danger-button"
              disabled={submitting || !amount || !recipient || !memo}
            >
              {submitting ? 'Processing...' : 'Withdraw Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WithdrawModal;
