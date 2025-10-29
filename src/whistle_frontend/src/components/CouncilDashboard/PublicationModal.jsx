import { useState } from 'react';
import { publishCase } from '../../utils/councilAPI';

function PublicationModal({ caseReview, onClose, onPublishSuccess }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const handlePublish = async () => {
    setIsPublishing(true);
    setError('');

    try {
      await publishCase(caseReview.caseId);

      if (onPublishSuccess) {
        onPublishSuccess();
      }

      onClose();
    } catch (err) {
      console.error('Publication error:', err);
      setError(err.message || 'Failed to publish case. Please try again.');
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content publication-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Publish Case</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="publication-warning">
            <div className="warning-icon">⚠️</div>
            <h3>Important: Case Publication</h3>
            <p>
              Publishing this case will make the encrypted data permanently accessible
              in the public registry. This action cannot be easily undone.
            </p>
          </div>

          <div className="publication-info">
            <h4>Case Details</h4>
            <ul>
              <li><strong>Case ID:</strong> {caseReview.caseId}</li>
              <li><strong>Status:</strong> Approved</li>
              <li><strong>Approval Votes:</strong> {caseReview.approvalCount}</li>
            </ul>
          </div>

          <div className="publication-notice">
            <h4>What happens when you publish?</h4>
            <ul>
              <li>The encrypted case data becomes publicly viewable</li>
              <li>The case appears in the public case browser</li>
              <li>Only users with the decryption key can read the content</li>
              <li>Whistleblower will be notified (off-chain)</li>
            </ul>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publishing...' : 'Publish to Public Registry'}
          </button>
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={isPublishing}
          >
            Keep Private
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublicationModal;
