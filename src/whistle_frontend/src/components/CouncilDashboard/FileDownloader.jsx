import { useState } from 'react';
import { downloadFileChunks } from '../../utils/councilAPI';
import { importKey, decryptFile, downloadBlob } from '../../utils/decryption';

function FileDownloader({ fileIds }) {
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleDownloadAndDecrypt = async (fileId) => {
    if (!decryptionKey.trim()) {
      setError('Please enter a decryption key');
      return;
    }

    setIsDownloading(true);
    setError('');
    setDownloadProgress(0);

    try {
      const key = await importKey(decryptionKey.trim());

      setDownloadProgress(30);

      const chunks = await downloadFileChunks([fileId]);

      setDownloadProgress(60);

      if (chunks.length === 0) {
        throw new Error('File not found');
      }

      const encryptedData = chunks[0].data;
      const decryptedData = await decryptFile(encryptedData, key);

      setDownloadProgress(90);

      const blob = new Blob([decryptedData]);
      downloadBlob(blob, `decrypted-file-${fileId}.bin`);

      setDownloadProgress(100);

      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    } catch (err) {
      console.error('Download/decrypt error:', err);
      setError(`Failed to download and decrypt file: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadEncrypted = async (fileId) => {
    setIsDownloading(true);
    setError('');

    try {
      const chunks = await downloadFileChunks([fileId]);

      if (chunks.length === 0) {
        throw new Error('File not found');
      }

      const blob = new Blob([chunks[0].data]);
      downloadBlob(blob, `encrypted-file-${fileId}.enc`);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download file: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!fileIds || fileIds.length === 0) {
    return (
      <div className="file-downloader">
        <p className="no-files">No files attached to this submission</p>
      </div>
    );
  }

  return (
    <div className="file-downloader">
      <h3>Attached Files</h3>

      <div className="decryption-key-input">
        <label htmlFor="file-decryption-key">Decryption Key for Files</label>
        <input
          id="file-decryption-key"
          type="text"
          value={decryptionKey}
          onChange={(e) => setDecryptionKey(e.target.value)}
          placeholder="Enter encryption key"
          disabled={isDownloading}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {downloadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="progress-text">Downloading and decrypting... {downloadProgress}%</p>
        </div>
      )}

      <div className="files-list">
        {fileIds.map((fileId, index) => (
          <div key={fileId} className="file-item">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <div className="file-details">
                <span className="file-name">File {index + 1}</span>
                <span className="file-id">ID: {fileId}</span>
              </div>
            </div>

            <div className="file-actions">
              <button
                className="download-btn"
                onClick={() => handleDownloadEncrypted(fileId)}
                disabled={isDownloading}
              >
                Download (Encrypted)
              </button>
              <button
                className="decrypt-download-btn"
                onClick={() => handleDownloadAndDecrypt(fileId)}
                disabled={isDownloading || !decryptionKey}
              >
                Download & Decrypt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileDownloader;
