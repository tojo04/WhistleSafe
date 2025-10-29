import { formatTimestamp } from '../../utils/councilAPI';

function CaseCard({ caseReview, submissionData, myVote, onClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Under Review': return 'status-review';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Published': return 'status-published';
      default: return 'status-pending';
    }
  };

  const getStatus = () => {
    if (caseReview.isPublished) return 'Published';
    if (caseReview.isResolved) {
      if (caseReview.finalDecision.length > 0) {
        return 'Approve' in caseReview.finalDecision[0] ? 'Approved' : 'Rejected';
      }
    }
    if (caseReview.votes.length > 0) return 'Under Review';
    return 'Pending';
  };

  const status = getStatus();
  const previewText = submissionData?.encryptedStatement?.substring(0, 100) + '...' || 'No statement';

  return (
    <div className={`case-card ${getStatusColor(status)}`} onClick={onClick}>
      <div className="case-card-header">
        <h3 className="case-id">{caseReview.caseId}</h3>
        <span className={`case-status ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      <div className="case-card-meta">
        <span className="case-date">
          Submitted: {formatTimestamp(caseReview.assignedAt)}
        </span>
      </div>

      <div className="case-preview">
        <p>{previewText}</p>
      </div>

      <div className="case-card-footer">
        <div className="vote-counts">
          <span className="vote-approve">
            ✅ {caseReview.approvalCount}
          </span>
          <span className="vote-reject">
            ❌ {caseReview.rejectionCount}
          </span>
        </div>

        {myVote && (
          <div className="my-vote-badge">
            {myVote.voteType.Approve !== undefined ? (
              <span className="voted-approve">You voted: ✅ Approved</span>
            ) : (
              <span className="voted-reject">You voted: ❌ Rejected</span>
            )}
          </div>
        )}
      </div>

      <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
        View Details
      </button>
    </div>
  );
}

export default CaseCard;
