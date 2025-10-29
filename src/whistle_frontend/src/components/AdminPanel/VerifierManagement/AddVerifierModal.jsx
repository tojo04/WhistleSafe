import { useState } from 'react';
import { verifier_registry } from 'declarations/verifier_registry';

function AddVerifierModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    principal: '',
    name: '',
    organization: '',
    role: 'Journalist'
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

  const validatePrincipal = (principal) => {
    return principal.length > 20 && principal.includes('-');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.principal.trim()) {
      setError('Principal ID is required');
      return;
    }

    if (!validatePrincipal(formData.principal)) {
      setError('Invalid principal format');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.organization.trim()) {
      setError('Organization is required');
      return;
    }

    setSubmitting(true);

    try {
      await verifier_registry.addVerifier(
        formData.principal,
        formData.name,
        formData.organization,
        formData.role
      );

      onSuccess();
    } catch (err) {
      console.error('Error adding verifier:', err);
      if (err.message?.includes('already exists')) {
        setError('This principal is already registered as a verifier');
      } else {
        setError('Failed to add verifier: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Verifier</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="principal">
              Principal ID <span className="required">*</span>
            </label>
            <input
              id="principal"
              type="text"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
              disabled={submitting}
            />
            <small>The ICP principal ID of the council member</small>
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
              placeholder="John Doe"
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
              placeholder="Example News Network"
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
              {submitting ? 'Adding...' : 'Add Verifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVerifierModal;
