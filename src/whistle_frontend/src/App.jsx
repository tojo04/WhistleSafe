import { useState } from 'react';
import { verifier_registry } from 'declarations/verifier_registry';
import { submission } from 'declarations/submission';

function App() {
  const [message, setMessage] = useState('WhistleSafe - Anonymous Whistleblower Platform');
  const [verifierCount, setVerifierCount] = useState(null);

  async function getVerifierCount() {
    try {
      const count = await verifier_registry.getVerifierCount();
      setVerifierCount(Number(count));
      setMessage(`Active Verifiers: ${count}`);
    } catch (error) {
      setMessage('Error fetching verifier count');
      console.error(error);
    }
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <h1>🔒 WhistleSafe</h1>
      <p>Decentralized Whistleblower Protection Platform</p>
      <br />
      <button onClick={getVerifierCount}>Check Verifier Count</button>
      <section id="message">{message}</section>
      <br />
      <p><em>Phases 1-5 Backend Implementation Complete ✅</em></p>
    </main>
  );
}

export default App;
