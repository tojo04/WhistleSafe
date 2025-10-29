function AccessDenied() {
  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🚫</div>
        <h2>Access Denied</h2>
        <p>You are not authorized to access the Council Dashboard.</p>
        <p className="access-denied-details">
          Only verified council members can review submissions and cast votes.
          If you believe you should have access, please contact the platform administrator.
        </p>
        <div className="access-denied-info">
          <h3>To become a verified council member:</h3>
          <ul>
            <li>Contact the WhistleSafe administrator</li>
            <li>Provide your credentials and organization details</li>
            <li>Wait for verification approval</li>
            <li>Login with Internet Identity after approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
