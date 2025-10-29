import { useState } from 'react';

function SubmissionSuccess({ caseId, encryptionKey, onNewSubmission }) {
  const [copied, setCopied] = useState({ id: false, key: false });

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ ...copied, [type]: true });
      setTimeout(() => {
        setCopied({ ...copied, [type]: false });
      }, 2000);
    });
  };

  const downloadKey = () => {
    const element = document.createElement('a');
    const file = new Blob([`WhistleSafe Decryption Key\n\nCase ID: ${caseId}\nEncryption Key: ${encryptionKey}\n\nIMPORTANT: Keep this key secure and private. You will need it to access your submission if the council approves it for review.`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `whistlesafe-key-${caseId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="success-container">
      <div className="success-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2>Submission Successful</h2>
      <p className="success-message">
        Your anonymous report has been securely encrypted and submitted to the WhistleSafe platform.
      </p>

      <div className="info-box">
        <div className="info-section">
          <label>Case ID</label>
          <div className="copy-field">
            <code className="case-id">{caseId}</code>
            <button
              className="copy-button"
              onClick={() => copyToClipboard(caseId, 'id')}
            >
              {copied.id ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="info-section critical">
          <label className="warning-label">
            🔒 Encryption Key (CRITICAL - Save This!)
          </label>
          <div className="copy-field">
            <code className="encryption-key">{encryptionKey}</code>
            <button
              className="copy-button"
              onClick={() => copyToClipboard(encryptionKey, 'key')}
            >
              {copied.key ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button className="download-button" onClick={downloadKey}>
            Download Key as File
          </button>
        </div>
      </div>

      <div className="warning-box">
        <h3>⚠️ Important Security Notice</h3>
        <ul>
          <li>Store your encryption key in a secure location</li>
          <li>This key is required to decrypt your submission if approved for review</li>
          <li>WhistleSafe does not store your key - if you lose it, your submission cannot be decrypted</li>
          <li>Do not share this key with anyone except the verified council members</li>
        </ul>
      </div>

      <div className="next-steps">
        <h3>What Happens Next?</h3>
        <ol>
          <li>Your submission is queued for review by the verified council</li>
          <li>Council members will vote on whether to unlock and review your evidence</li>
          <li>If approved (3 of 5 votes), they can decrypt and verify your submission</li>
          <li>You can check your case status using your Case ID</li>
          <li>If eligible, rewards will be sent to your provided crypto address</li>
        </ol>
      </div>

      <button className="primary-button" onClick={onNewSubmission}>
        Submit Another Report
      </button>
    </div>
  );
}

export default SubmissionSuccess;
