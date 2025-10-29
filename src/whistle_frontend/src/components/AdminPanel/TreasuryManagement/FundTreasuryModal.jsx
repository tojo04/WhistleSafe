import { useState } from 'react';
import { treasury } from 'declarations/treasury';

function FundTreasuryModal({ currentBalance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
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

    setSubmitting(true);

    try {
      const amountE8s = BigInt(Math.floor(amountNum * 100000000));
      await treasury.fundTreasury(amountE8s);
      onSuccess();
    } catch (err) {
      console.error('Error funding treasury:', err);
      setError('Failed to fund treasury: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const newBalance = amount ? BigInt(Math.floor(parseFloat(amount) * 100000000)) + currentBalance : currentBalance;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Fund Treasury</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="balance-info">
            <div className="balance-row">
              <span>Current Balance:</span>
              <strong>{formatICP(currentBalance)}</strong>
            </div>
            {amount && (
              <>
                <div className="balance-row">
                  <span>Deposit Amount:</span>
                  <strong>+{amount} ICP</strong>
                </div>
                <div className="balance-row new-balance">
                  <span>New Balance:</span>
                  <strong>{formatICP(newBalance)}</strong>
                </div>
              </>
            )}
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
            <small>Enter amount in ICP to deposit into treasury</small>
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
              className="primary-button"
              disabled={submitting || !amount}
            >
              {submitting ? 'Processing...' : 'Fund Treasury'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FundTreasuryModal;
