import { useState } from 'react';
import { castVote } from '../../utils/councilAPI';

function VotingPanel({ caseReview, myVote, onVoteSuccess }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVoteClick = (voteType) => {
    setSelectedVote(voteType);
    setShowConfirmation(true);
    setError('');
  };

  const handleConfirmVote = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await castVote(caseReview.caseId, selectedVote, comment.trim() || null);

      setShowConfirmation(false);
      setComment('');

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (err) {
      console.error('Vote submission error:', err);
      setError(err.message || 'Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedVote(null);
    setComment('');
    setError('');
  };

  const hasVoted = myVote !== null;
  const isResolved = caseReview.isResolved;

  const votesNeeded = 3 - Math.max(caseReview.approvalCount, caseReview.rejectionCount);

  return (
    <div className="voting-panel">
      <h3>Voting</h3>

      <div className="vote-counts-display">
        <div className="vote-count-item approve">
          <span className="vote-icon">✅</span>
          <span className="vote-label">Approvals</span>
          <span className="vote-number">{caseReview.approvalCount}/3</span>
        </div>
        <div className="vote-count-item reject">
          <span className="vote-icon">❌</span>
          <span className="vote-label">Rejections</span>
          <span className="vote-number">{caseReview.rejectionCount}/3</span>
        </div>
      </div>

      {!isResolved && !hasVoted && (
        <div className="vote-progress">
          <p>
            {votesNeeded > 0
              ? `${votesNeeded} more vote${votesNeeded > 1 ? 's' : ''} needed to reach threshold`
              : 'Threshold reached'}
          </p>
        </div>
      )}

      {isResolved && (
        <div className="case-resolved-banner">
          <h4>
            {caseReview.finalDecision.length > 0 && 'Approve' in caseReview.finalDecision[0]
              ? '✅ Case Approved'
              : '❌ Case Rejected'}
          </h4>
          <p>3-of-5 voting threshold has been reached</p>
        </div>
      )}

      {hasVoted && !isResolved && (
        <div className="already-voted-banner">
          <p>
            You have already voted on this case:
            {myVote.voteType.Approve !== undefined ? ' ✅ Approved' : ' ❌ Rejected'}
          </p>
        </div>
      )}

      {!hasVoted && !isResolved && !showConfirmation && (
        <div className="vote-buttons">
          <button
            className="vote-btn approve-btn"
            onClick={() => handleVoteClick('Approve')}
          >
            ✅ Approve Case
          </button>
          <button
            className="vote-btn reject-btn"
            onClick={() => handleVoteClick('Reject')}
          >
            ❌ Reject Case
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="vote-confirmation">
          <h4>
            Confirm Vote: {selectedVote === 'Approve' ? '✅ Approve' : '❌ Reject'}
          </h4>
          <p className="confirmation-warning">
            Are you sure you want to {selectedVote.toLowerCase()} this case?
            This action cannot be undone.
          </p>

          <div className="comment-section">
            <label htmlFor="vote-comment">Optional Comment</label>
            <textarea
              id="vote-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add reasoning for your vote (optional, max 500 characters)"
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <small className="char-count">{comment.length}/500 characters</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="confirmation-buttons">
            <button
              className="confirm-btn"
              onClick={handleConfirmVote}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Vote'}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VotingPanel;
