import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import SubmissionForm from './components/SubmissionForm';
import CouncilDashboard from './components/CouncilDashboard/CouncilDashboard';
import AdminPanel from './components/AdminPanel/AdminPanel';

function App() {
  const [currentView, setCurrentView] = useState('submit');

  return (
    <AuthProvider>
      {currentView === 'admin' ? (
        <AdminPanel />
      ) : (
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
                  className={`nav-button ${currentView === 'submit' ? 'active' : ''}`}
                  onClick={() => setCurrentView('submit')}
                >
                  Submit Report
                </button>
                <button
                  className={`nav-button ${currentView === 'council' ? 'active' : ''}`}
                  onClick={() => setCurrentView('council')}
                >
                  Council Dashboard
                </button>
                <button
                  className={`nav-button ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentView('admin')}
                >
                  Admin Panel
                </button>
              </nav>
            </div>
          </header>

          <main className="app-main">
            {currentView === 'submit' && <SubmissionForm />}
            {currentView === 'council' && <CouncilDashboard />}
          </main>

          {currentView === 'submit' && (
            <footer className="app-footer">
              <p>Built on the Internet Computer Protocol</p>
              <p className="footer-note">
                100% anonymous • Client-side encryption • Tamper-proof blockchain storage
              </p>
            </footer>
          )}
        </div>
      )}
    </AuthProvider>
  );
}

export default App;
