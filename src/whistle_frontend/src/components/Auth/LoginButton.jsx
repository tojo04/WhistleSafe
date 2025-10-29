import { useAuth } from '../../hooks/useAuth.jsx';

function LoginButton() {
  const { isAuthenticated, isLoading, login, logout, verifier } = useAuth();

  if (isLoading) {
    return (
      <button className="auth-button loading" disabled>
        Loading...
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="auth-container">
        {verifier && (
          <div className="auth-info">
            <span className="verifier-name">{verifier.name}</span>
            <span className="verifier-org">{verifier.organization}</span>
          </div>
        )}
        <button className="auth-button logout" onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button className="auth-button login" onClick={login}>
      Login with Internet Identity
    </button>
  );
}

export default LoginButton;
