import { useState } from 'react';
import SubmissionForm from './components/SubmissionForm';

function App() {
  const [showStatus, setShowStatus] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/logo2.svg" alt="WhistleSafe" className="logo" />
            <div>
              <h1>WhistleSafe</h1>
              <p className="tagline">Decentralized Whistleblower Protection Platform</p>
            </div>
          </div>
          <nav className="header-nav">
            <button
              className="nav-button"
              onClick={() => setShowStatus(!showStatus)}
            >
              {showStatus ? 'Submit Report' : 'Check Status'}
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {!showStatus ? (
          <SubmissionForm />
        ) : (
          <div className="status-check-container">
            <h2>Check Submission Status</h2>
            <p>Enter your Case ID to check the status of your submission</p>
            <input
              type="text"
              placeholder="Enter Case ID"
              className="status-input"
            />
            <button className="primary-button">Check Status</button>
            <p className="status-note">
              Status tracking coming soon. Your Case ID will allow you to monitor the review process.
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built on the Internet Computer Protocol</p>
        <p className="footer-note">
          100% anonymous • Client-side encryption • Tamper-proof blockchain storage
        </p>
      </footer>
    </div>
  );
}

export default App;
