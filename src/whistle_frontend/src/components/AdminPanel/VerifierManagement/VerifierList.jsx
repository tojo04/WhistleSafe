import { useState } from 'react';
import AddVerifierModal from './AddVerifierModal';
import EditVerifierModal from './EditVerifierModal';
import RemoveVerifierModal from './RemoveVerifierModal';

function VerifierList({ verifiers, onRefresh, loading }) {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVerifier, setEditingVerifier] = useState(null);
  const [removingVerifier, setRemovingVerifier] = useState(null);
  const [sortField, setSortField] = useState('addedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const filteredVerifiers = verifiers
    .filter(v => {
      const matchesFilter = filter === 'All' ||
        (filter === 'Active' && v.active) ||
        (filter === 'Inactive' && !v.active);

      const matchesSearch = searchTerm === '' ||
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.principal?.toString().includes(searchTerm);

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      return (Number(aVal) - Number(bVal)) * direction;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) / 1000000);
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="verifier-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading verifiers...</p>
      </div>
    );
  }

  return (
    <div className="verifier-list-container">
      <div className="verifier-list-header">
        <h2>Council Members</h2>
        <button className="add-verifier-button" onClick={() => setShowAddModal(true)}>
          + Add Verifier
        </button>
      </div>

      <div className="verifier-controls">
        <div className="filter-buttons">
          {['All', 'Active', 'Inactive'].map(status => (
            <button
              key={status}
              className={`filter-button ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by name, organization, or principal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="verifier-table-container">
        <table className="verifier-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('organization')} className="sortable">
                Organization {sortField === 'organization' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Role</th>
              <th onClick={() => handleSort('active')} className="sortable">
                Status {sortField === 'active' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Principal</th>
              <th onClick={() => handleSort('addedAt')} className="sortable">
                Added Date {sortField === 'addedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerifiers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-results">
                  No verifiers found
                </td>
              </tr>
            ) : (
              filteredVerifiers.map((verifier, index) => (
                <tr key={index}>
                  <td className="verifier-name">{verifier.name}</td>
                  <td>{verifier.organization}</td>
                  <td>{verifier.role}</td>
                  <td>
                    <span className={`status-badge ${verifier.active ? 'active' : 'inactive'}`}>
                      {verifier.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="principal-cell">
                      <code className="principal-id">
                        {verifier.principal?.toString().slice(0, 10)}...
                      </code>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(verifier.principal?.toString())}
                        title="Copy full principal"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{formatDate(verifier.addedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => setEditingVerifier(verifier)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="remove-button"
                        onClick={() => setRemovingVerifier(verifier)}
                        title="Remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="verifier-stats-footer">
        <span>Showing {filteredVerifiers.length} of {verifiers.length} verifiers</span>
      </div>

      {showAddModal && (
        <AddVerifierModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {editingVerifier && (
        <EditVerifierModal
          verifier={editingVerifier}
          onClose={() => setEditingVerifier(null)}
          onSuccess={() => {
            setEditingVerifier(null);
            onRefresh();
          }}
        />
      )}

      {removingVerifier && (
        <RemoveVerifierModal
          verifier={removingVerifier}
          onClose={() => setRemovingVerifier(null)}
          onSuccess={() => {
            setRemovingVerifier(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default VerifierList;
