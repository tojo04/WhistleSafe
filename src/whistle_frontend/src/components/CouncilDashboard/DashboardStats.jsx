import { useState, useEffect } from 'react';

function DashboardStats({ cases, myVotes }) {
  const [stats, setStats] = useState({
    totalPending: 0,
    totalReview: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPublished: 0,
    myVotesCount: 0,
    awaitingMyVote: 0
  });

  useEffect(() => {
    calculateStats();
  }, [cases, myVotes]);

  const calculateStats = () => {
    if (!cases || cases.length === 0) {
      return;
    }

    const pending = cases.filter(c => !c.isResolved && c.votes.length === 0).length;
    const review = cases.filter(c => !c.isResolved && c.votes.length > 0).length;
    const approved = cases.filter(c => c.isResolved && c.finalDecision.length > 0 && 'Approve' in c.finalDecision[0]).length;
    const rejected = cases.filter(c => c.isResolved && c.finalDecision.length > 0 && 'Reject' in c.finalDecision[0]).length;
    const published = cases.filter(c => c.isPublished).length;

    const myVotesCount = Object.values(myVotes).filter(v => v !== null).length;
    const awaitingMyVote = cases.filter(c => !c.isResolved && !myVotes[c.caseId]).length;

    setStats({
      totalPending: pending,
      totalReview: review,
      totalApproved: approved,
      totalRejected: rejected,
      totalPublished: published,
      myVotesCount,
      awaitingMyVote
    });
  };

  return (
    <div className="dashboard-stats">
      <div className="stat-card stat-pending">
        <div className="stat-icon">⏳</div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalPending}</div>
          <div className="stat-label">Pending Cases</div>
        </div>
      </div>

      <div className="stat-card stat-review">
        <div className="stat-icon">🔍</div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalReview}</div>
          <div className="stat-label">Under Review</div>
        </div>
      </div>

      <div className="stat-card stat-approved">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalApproved}</div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      <div className="stat-card stat-rejected">
        <div className="stat-icon">❌</div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalRejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="stat-card stat-published">
        <div className="stat-icon">📢</div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalPublished}</div>
          <div className="stat-label">Published</div>
        </div>
      </div>

      <div className="stat-card stat-my-votes">
        <div className="stat-icon">🗳️</div>
        <div className="stat-content">
          <div className="stat-number">{stats.myVotesCount}</div>
          <div className="stat-label">Your Votes</div>
        </div>
      </div>

      <div className="stat-card stat-awaiting">
        <div className="stat-icon">⏰</div>
        <div className="stat-content">
          <div className="stat-number">{stats.awaitingMyVote}</div>
          <div className="stat-label">Awaiting Your Vote</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
