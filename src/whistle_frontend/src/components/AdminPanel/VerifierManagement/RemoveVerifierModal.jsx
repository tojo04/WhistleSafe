import { useState } from 'react';
import { verifier_registry } from 'declarations/verifier_registry';

function RemoveVerifierModal({ verifier, onClose, onSuccess }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRemove = async () => {
    if (confirmText !== verifier.name) {
      setError(`Please type "${verifier.name}" to confirm`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await verifier_registry.removeVerifier(verifier.principal);
      onSuccess();
    } catch (err) {
      console.error('Error removing verifier:', err);
      setError('Failed to remove verifier: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal danger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header danger">
          <h2>⚠️ Remove Verifier</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="warning-box">
            <h3>This action is permanent and cannot be undone!</h3>
            <p>Removing <strong>{verifier.name}</strong> will:</p>
            <ul>
              <li>Delete all their verifier data</li>
              <li>Revoke their voting privileges immediately</li>
              <li>Remove them from the council permanently</li>
              <li>Their past votes will remain in the audit trail</li>
            </ul>
          </div>

          <div className="verifier-info-box">
            <h4>Verifier Details:</h4>
            <p><strong>Name:</strong> {verifier.name}</p>
            <p><strong>Organization:</strong> {verifier.organization}</p>
            <p><strong>Role:</strong> {verifier.role}</p>
            <p><strong>Principal:</strong> <code>{verifier.principal?.toString()}</code></p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmText">
              Type <strong>{verifier.name}</strong> to confirm removal:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={verifier.name}
              disabled={submitting}
              className="confirm-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

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
            type="button"
            className="danger-button"
            onClick={handleRemove}
            disabled={submitting || confirmText !== verifier.name}
          >
            {submitting ? 'Removing...' : 'Remove Verifier'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveVerifierModal;
