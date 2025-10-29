import { useAuth } from '../../hooks/useAuth.jsx';
import { formatTimestamp } from '../../utils/councilAPI';

function CouncilProfile({ votesCount }) {
  const { verifier, principal } = useAuth();

  if (!verifier) {
    return null;
  }

  return (
    <div className="council-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {verifier.name.charAt(0).toUpperCase()}
        </div>
        <h3>Council Member</h3>
      </div>

      <div className="profile-info">
        <div className="profile-field">
          <label>Name</label>
          <span>{verifier.name}</span>
        </div>

        <div className="profile-field">
          <label>Organization</label>
          <span>{verifier.organization}</span>
        </div>

        <div className="profile-field">
          <label>Role</label>
          <span>{verifier.role}</span>
        </div>

        <div className="profile-field">
          <label>Member Since</label>
          <span>{formatTimestamp(verifier.addedAt)}</span>
        </div>

        <div className="profile-field">
          <label>Status</label>
          <span className={verifier.isActive ? 'status-active' : 'status-inactive'}>
            {verifier.isActive ? '✅ Active' : '⛔ Inactive'}
          </span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="stat-value">{votesCount || 0}</div>
          <div className="stat-label">Votes Cast</div>
        </div>
      </div>

      <div className="profile-principal">
        <label>Principal ID</label>
        <code className="principal-id">{principal?.toText().substring(0, 20)}...</code>
      </div>
    </div>
  );
}

export default CouncilProfile;
