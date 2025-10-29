import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import AccessDenied from '../Auth/AccessDenied';
import DashboardStats from './DashboardStats';
import CaseList from './CaseList';
import CaseDetailModal from './CaseDetailModal';
import CouncilProfile from './CouncilProfile';
import { fetchAllCases } from '../../utils/councilAPI';
import { getMyVote } from '../../utils/councilAPI';
import './CouncilDashboard.css';

function CouncilDashboard() {
  const { isAuthenticated, isVerified, isLoading } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (isVerified) {
      loadAllData();
    }
  }, [isVerified, refreshTrigger]);

  const loadAllData = async () => {
    try {
      const cases = await fetchAllCases();
      setAllCases(cases);

      const votesMap = {};
      for (const caseReview of cases) {
        const vote = await getMyVote(caseReview.caseId);
        votesMap[caseReview.caseId] = vote;
      }
      setMyVotes(votesMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleCaseClick = (caseId) => {
    setSelectedCaseId(caseId);
  };

  const handleModalClose = () => {
    setSelectedCaseId(null);
  };

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="council-dashboard loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isVerified) {
    return <AccessDenied />;
  }

  const myVotesCount = Object.values(myVotes).filter(v => v !== null).length;

  return (
    <div className="council-dashboard">
      <div className="dashboard-sidebar">
        <CouncilProfile votesCount={myVotesCount} />
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Council Dashboard</h1>
          <p className="dashboard-subtitle">
            Review submissions and cast votes on whistleblower cases
          </p>
        </div>

        <DashboardStats cases={allCases} myVotes={myVotes} />

        <CaseList onCaseClick={handleCaseClick} />
      </div>

      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={handleModalClose}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

export default CouncilDashboard;
