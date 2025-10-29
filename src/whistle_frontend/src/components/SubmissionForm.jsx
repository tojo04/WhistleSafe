import { useState } from 'react';
import FileUpload from './FileUpload';
import SubmissionSuccess from './SubmissionSuccess';
import { blob_store } from 'declarations/blob_store';
import { submission } from 'declarations/submission';
import { generateEncryptionKey, exportKey } from '../utils/crypto';
import { chunkAndEncryptFile, uploadChunksToBlob, encryptText, computeFileHash } from '../utils/fileUpload';

function SubmissionForm() {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [tags, setTags] = useState('');
  const [rewardAddress, setRewardAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!statement.trim() && files.length === 0) {
      setError('Please provide a statement or upload files');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const encryptionKey = await generateEncryptionKey();
      const exportedKey = await exportKey(encryptionKey);

      let allChunks = [];
      let totalSize = 0;

      if (statement.trim()) {
        const encryptedStatement = await encryptText(statement, encryptionKey);
        allChunks.push({
          data: encryptedStatement,
          size: encryptedStatement.length,
          type: 'statement'
        });
        totalSize += encryptedStatement.length;
      }

      for (const file of files) {
        const fileChunks = await chunkAndEncryptFile(file, encryptionKey);
        allChunks = allChunks.concat(fileChunks);
        totalSize += fileChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      }

      const chunkSpecs = await uploadChunksToBlob(
        allChunks,
        blob_store,
        setUploadProgress
      );

      const fileHash = await computeFileHash(allChunks);

      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

      const reportMeta = {
        title: title.trim(),
        tags: tagArray,
        contentType: files.length > 0 ? files[0].type || 'application/octet-stream' : 'text/plain'
      };

      const reportId = await submission.submit(
        reportMeta,
        chunkSpecs,
        fileHash,
        rewardAddress.trim() ? [rewardAddress.trim()] : []
      );

      setSubmissionResult({
        caseId: reportId.toString(),
        encryptionKey: exportedKey
      });

    } catch (err) {
      console.error('Submission error:', err);
      setError(`Submission failed: ${err.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setTitle('');
    setStatement('');
    setTags('');
    setRewardAddress('');
    setIsSubmitting(false);
    setUploadProgress(0);
    setSubmissionResult(null);
    setError('');
  };

  if (submissionResult) {
    return (
      <SubmissionSuccess
        caseId={submissionResult.caseId}
        encryptionKey={submissionResult.encryptionKey}
        onNewSubmission={resetForm}
      />
    );
  }

  return (
    <div className="submission-form-container">
      <div className="form-header">
        <h2>Submit Anonymous Report</h2>
        <p className="form-description">
          Your submission will be encrypted client-side before upload. No personal information is collected.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-group">
          <label htmlFor="title">
            Report Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief descriptive title"
            disabled={isSubmitting}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="statement">Statement / Description</label>
          <textarea
            id="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Describe the wrongdoing, provide context, names, dates, locations..."
            disabled={isSubmitting}
            rows={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., corruption, fraud, workplace-abuse"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>Evidence Files (Optional)</label>
          <FileUpload files={files} setFiles={setFiles} />
        </div>

        <div className="form-group">
          <label htmlFor="rewardAddress">
            Reward Address (Optional)
          </label>
          <input
            id="rewardAddress"
            type="text"
            value={rewardAddress}
            onChange={(e) => setRewardAddress(e.target.value)}
            placeholder="ICP/ICRC-1 address for potential rewards"
            disabled={isSubmitting}
          />
          <small className="help-text">
            If your report leads to verified action, you may receive a reward
          </small>
        </div>

        <div className="privacy-notice">
          <h4>🔒 Privacy & Security</h4>
          <ul>
            <li>All data is encrypted in your browser before submission</li>
            <li>WhistleSafe does not collect IP addresses or personal information</li>
            <li>Only verified council members can review approved submissions</li>
            <li>You will receive an encryption key - save it securely</li>
          </ul>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isSubmitting && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">
              {uploadProgress < 100
                ? `Uploading... ${Math.round(uploadProgress)}%`
                : 'Finalizing submission...'}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Encrypted Report'}
        </button>
      </form>
    </div>
  );
}

export default SubmissionForm;
