import { useState, useEffect } from 'react';
import CaseCard from './CaseCard';
import { fetchPendingCases, fetchResolvedCases, fetchSubmissionDetails, getMyVote } from '../../utils/councilAPI';

function CaseList({ onCaseClick }) {
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [casesData, setCasesData] = useState({});
  const [myVotes, setMyVotes] = useState({});

  useEffect(() => {
    loadCases();
  }, [filter]);

  const loadCases = async () => {
    setIsLoading(true);
    setError('');

    try {
      let allCases = [];

      if (filter === 'all' || filter === 'pending' || filter === 'review') {
        const pending = await fetchPendingCases();
        allCases = [...allCases, ...pending];
      }

      if (filter === 'all' || filter === 'approved' || filter === 'rejected' || filter === 'published') {
        const resolved = await fetchResolvedCases(100, 0);
        allCases = [...allCases, ...resolved];
      }

      const filteredCases = filterCases(allCases);

      const submissionsPromises = filteredCases.map(c => fetchSubmissionDetails(c.caseId));
      const submissions = await Promise.all(submissionsPromises);

      const votesPromises = filteredCases.map(c => getMyVote(c.caseId));
      const votes = await Promise.all(votesPromises);

      const dataMap = {};
      const votesMap = {};

      filteredCases.forEach((caseReview, index) => {
        dataMap[caseReview.caseId] = submissions[index];
        votesMap[caseReview.caseId] = votes[index];
      });

      setCases(filteredCases);
      setCasesData(dataMap);
      setMyVotes(votesMap);
    } catch (err) {
      console.error('Error loading cases:', err);
      setError('Failed to load cases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCases = (allCases) => {
    let filtered = allCases;

    if (filter === 'pending') {
      filtered = allCases.filter(c => !c.isResolved && c.votes.length === 0);
    } else if (filter === 'review') {
      filtered = allCases.filter(c => !c.isResolved && c.votes.length > 0);
    } else if (filter === 'approved') {
      filtered = allCases.filter(c => c.isResolved && c.finalDecision.length > 0 && 'Approve' in c.finalDecision[0]);
    } else if (filter === 'rejected') {
      filtered = allCases.filter(c => c.isResolved && c.finalDecision.length > 0 && 'Reject' in c.finalDecision[0]);
    } else if (filter === 'published') {
      filtered = allCases.filter(c => c.isPublished);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.caseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredCases = cases.filter(c =>
    c.caseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="case-list-container">
      <div className="case-list-header">
        <h2>Cases</h2>
        <button className="refresh-btn" onClick={loadCases}>
          🔄 Refresh
        </button>
      </div>

      <div className="case-filters">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'review' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('review')}
          >
            Under Review
          </button>
          <button
            className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={filter === 'rejected' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={filter === 'published' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('published')}
          >
            Published
          </button>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by Case ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading cases...</p>
        </div>
      ) : (
        <div className="cases-grid">
          {filteredCases.length === 0 ? (
            <div className="no-cases">
              <p>No cases found</p>
            </div>
          ) : (
            filteredCases.map((caseReview) => (
              <CaseCard
                key={caseReview.caseId}
                caseReview={caseReview}
                submissionData={casesData[caseReview.caseId]}
                myVote={myVotes[caseReview.caseId]}
                onClick={() => onCaseClick(caseReview.caseId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CaseList;
