import { useState, useEffect } from 'react';
import { fetchAuditTrail, formatTimestamp } from '../../utils/councilAPI';

function AuditTrail({ caseId }) {
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAuditTrail();
  }, [caseId]);

  const loadAuditTrail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const auditData = await fetchAuditTrail(caseId);
      const sortedVotes = auditData.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      setVotes(sortedVotes);
    } catch (err) {
      console.error('Error loading audit trail:', err);
      setError('Failed to load voting history');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="audit-trail">
      <div className="audit-trail-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Voting History ({votes.length} votes)</h3>
        <button className="expand-btn">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="audit-trail-content">
          {isLoading ? (
            <div className="loading-container">
              <p>Loading voting history...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              {error}
            </div>
          ) : votes.length === 0 ? (
            <div className="no-votes">
              <p>No votes recorded yet</p>
            </div>
          ) : (
            <div className="votes-list">
              {votes.map((vote, index) => (
                <div key={index} className="vote-entry">
                  <div className="vote-entry-header">
                    <div className="voter-info">
                      <span className="voter-name">{vote.verifierName}</span>
                      <span className="voter-org">{vote.verifierOrg}</span>
                    </div>
                    <span className={`vote-type ${vote.voteType.Approve !== undefined ? 'approve' : 'reject'}`}>
                      {vote.voteType.Approve !== undefined ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  </div>

                  <div className="vote-entry-meta">
                    <span className="vote-timestamp">
                      {formatTimestamp(vote.timestamp)}
                    </span>
                  </div>

                  {vote.comment && vote.comment.length > 0 && (
                    <div className="vote-comment">
                      <p>{vote.comment[0]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
