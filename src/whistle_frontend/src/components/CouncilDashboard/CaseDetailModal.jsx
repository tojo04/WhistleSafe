import { useState, useEffect } from 'react';
import DecryptionPanel from './DecryptionPanel';
import FileDownloader from './FileDownloader';
import VotingPanel from './VotingPanel';
import AuditTrail from './AuditTrail';
import PublicationModal from './PublicationModal';
import { fetchSubmissionDetails, fetchCaseReview, getMyVote, formatTimestamp } from '../../utils/councilAPI';

function CaseDetailModal({ caseId, onClose, onUpdate }) {
  const [caseReview, setCaseReview] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [decryptedStatement, setDecryptedStatement] = useState('');

  useEffect(() => {
    loadCaseDetails();
  }, [caseId]);

  const loadCaseDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [reviewData, submissionData, voteData] = await Promise.all([
        fetchCaseReview(caseId),
        fetchSubmissionDetails(caseId),
        getMyVote(caseId)
      ]);

      setCaseReview(reviewData);
      setSubmission(submissionData);
      setMyVote(voteData);
    } catch (err) {
      console.error('Error loading case details:', err);
      setError('Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSuccess = async () => {
    await loadCaseDetails();
    if (onUpdate) {
      onUpdate();
    }
  };

  const handlePublishSuccess = async () => {
    await loadCaseDetails();
    if (onUpdate) {
      onUpdate();
    }
  };

  const getStatus = () => {
    if (!caseReview) return 'Unknown';
    if (caseReview.isPublished) return 'Published';
    if (caseReview.isResolved) {
      if (caseReview.finalDecision.length > 0) {
        return 'Approve' in caseReview.finalDecision[0] ? 'Approved' : 'Rejected';
      }
    }
    if (caseReview.votes.length > 0) return 'Under Review';
    return 'Pending';
  };

  const canPublish = () => {
    if (!caseReview) return false;
    return caseReview.isResolved &&
           !caseReview.isPublished &&
           caseReview.finalDecision.length > 0 &&
           'Approve' in caseReview.finalDecision[0];
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading case details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseReview || !submission) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="error-message">
            {error || 'Case not found'}
          </div>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>{caseId}</h2>
              <span className={`case-status-badge status-${getStatus().toLowerCase().replace(' ', '-')}`}>
                {getStatus()}
              </span>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body case-detail-content">
            <div className="case-meta-info">
              <div className="meta-item">
                <label>Submitted</label>
                <span>{formatTimestamp(submission.submittedAt)}</span>
              </div>
              <div className="meta-item">
                <label>Last Updated</label>
                <span>{formatTimestamp(submission.updatedAt)}</span>
              </div>
              {submission.rewardAddress && submission.rewardAddress.length > 0 && (
                <div className="meta-item">
                  <label>Reward Address</label>
                  <span className="reward-address">{submission.rewardAddress[0]}</span>
                </div>
              )}
            </div>

            <DecryptionPanel
              encryptedStatement={submission.encryptedStatement}
              onDecrypted={setDecryptedStatement}
            />

            {submission.fileIds && submission.fileIds.length > 0 && (
              <FileDownloader fileIds={submission.fileIds} />
            )}

            <VotingPanel
              caseReview={caseReview}
              myVote={myVote}
              onVoteSuccess={handleVoteSuccess}
            />

            {canPublish() && (
              <div className="publication-section">
                <h3>Publication</h3>
                <p>This case has been approved and can be published to the public registry.</p>
                <button
                  className="publish-case-btn"
                  onClick={() => setShowPublicationModal(true)}
                >
                  📢 Publish Case
                </button>
              </div>
            )}

            {caseReview.isPublished && (
              <div className="published-info">
                <h3>✅ Case Published</h3>
                <p>Published on: {formatTimestamp(caseReview.publishedAt[0])}</p>
                <p>This case is now visible in the public case browser.</p>
              </div>
            )}

            <AuditTrail caseId={caseId} />
          </div>
        </div>
      </div>

      {showPublicationModal && (
        <PublicationModal
          caseReview={caseReview}
          onClose={() => setShowPublicationModal(false)}
          onPublishSuccess={handlePublishSuccess}
        />
      )}
    </>
  );
}

export default CaseDetailModal;
