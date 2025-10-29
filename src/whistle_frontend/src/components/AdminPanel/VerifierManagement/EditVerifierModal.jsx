import { useState } from 'react';
import { verifier_registry } from 'declarations/verifier_registry';

function EditVerifierModal({ verifier, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: verifier.name || '',
    organization: verifier.organization || '',
    role: verifier.role || 'Journalist'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    'Journalist',
    'NGO Representative',
    'Legal Expert',
    'Academic',
    'Human Rights Advocate',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.organization.trim()) {
      setError('Name and organization are required');
      return;
    }

    setSubmitting(true);

    try {
      await verifier_registry.updateVerifier(
        verifier.principal,
        formData.name,
        formData.organization,
        formData.role
      );

      onSuccess();
    } catch (err) {
      console.error('Error updating verifier:', err);
      setError('Failed to update verifier: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Verifier</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Principal ID (Immutable)</label>
            <input
              type="text"
              value={verifier.principal?.toString()}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">
              Organization <span className="required">*</span>
            </label>
            <input
              id="organization"
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              maxLength={150}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={submitting}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditVerifierModal;
