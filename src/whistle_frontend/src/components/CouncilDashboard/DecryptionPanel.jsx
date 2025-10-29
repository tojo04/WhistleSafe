import { useState } from 'react';
import { importKey, decryptText } from '../../utils/decryption';

function DecryptionPanel({ encryptedStatement, onDecrypted }) {
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState('');
  const [showDecrypted, setShowDecrypted] = useState(false);

  const handleDecrypt = async () => {
    if (!decryptionKey.trim()) {
      setError('Please enter a decryption key');
      return;
    }

    setIsDecrypting(true);
    setError('');

    try {
      const key = await importKey(decryptionKey.trim());
      const decrypted = await decryptText(encryptedStatement, key);

      setDecryptedText(decrypted);
      setShowDecrypted(true);

      if (onDecrypted) {
        onDecrypted(decrypted);
      }
    } catch (err) {
      console.error('Decryption error:', err);
      setError('Failed to decrypt. Please check your key and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClear = () => {
    setDecryptedText('');
    setShowDecrypted(false);
    setDecryptionKey('');
    setError('');
  };

  return (
    <div className="decryption-panel">
      <h3>Encrypted Statement</h3>

      {!showDecrypted ? (
        <div className="decryption-form">
          <div className="encrypted-preview">
            <code>{encryptedStatement.substring(0, 200)}...</code>
          </div>

          <div className="decryption-input-group">
            <label htmlFor="decryption-key">Decryption Key</label>
            <input
              id="decryption-key"
              type="text"
              value={decryptionKey}
              onChange={(e) => setDecryptionKey(e.target.value)}
              placeholder="Enter encryption key provided by whistleblower"
              disabled={isDecrypting}
            />
            <small className="help-text">
              🔒 Decryption happens in your browser - data never sent to server
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="decrypt-btn"
            onClick={handleDecrypt}
            disabled={isDecrypting}
          >
            {isDecrypting ? 'Decrypting...' : 'Decrypt Statement'}
          </button>
        </div>
      ) : (
        <div className="decrypted-content">
          <div className="decrypted-header">
            <h4>✅ Decrypted Statement</h4>
            <button className="clear-btn" onClick={handleClear}>
              Clear & Re-encrypt
            </button>
          </div>

          <div className="decrypted-text">
            <pre>{decryptedText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default DecryptionPanel;
