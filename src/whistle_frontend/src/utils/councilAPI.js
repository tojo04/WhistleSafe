import { council } from 'declarations/council';
import { submission } from 'declarations/submission';
import { blob_store } from 'declarations/blob_store';
import { verifier_registry } from 'declarations/verifier_registry';

export async function fetchPendingCases() {
  try {
    const cases = await council.listPendingCases();
    return cases;
  } catch (error) {
    console.error('Error fetching pending cases:', error);
    throw error;
  }
}

export async function fetchResolvedCases(limit = 20, offset = 0) {
  try {
    const cases = await council.listResolvedCases(limit, offset);
    return cases;
  } catch (error) {
    console.error('Error fetching resolved cases:', error);
    throw error;
  }
}

export async function fetchCaseReview(caseId) {
  try {
    const review = await council.getCaseReview(caseId);
    return review.length > 0 ? review[0] : null;
  } catch (error) {
    console.error('Error fetching case review:', error);
    throw error;
  }
}

export async function fetchSubmissionDetails(caseId) {
  try {
    const submissionData = await submission.getSubmission(caseId);
    return submissionData.length > 0 ? submissionData[0] : null;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

export async function castVote(caseId, voteType, comment = null) {
  try {
    const voteTypeVariant = voteType === 'Approve' ? { Approve: null } : { Reject: null };
    const commentOpt = comment ? [comment] : [];
    const result = await council.castVote(caseId, voteTypeVariant, commentOpt);

    if ('err' in result) {
      throw new Error(result.err);
    }

    return result;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
}

export async function getMyVote(caseId) {
  try {
    const vote = await council.getMyVote(caseId);
    return vote.length > 0 ? vote[0] : null;
  } catch (error) {
    console.error('Error fetching my vote:', error);
    throw error;
  }
}

export async function fetchAuditTrail(caseId) {
  try {
    const votes = await council.getAuditTrail(caseId);

    const votesWithVerifiers = await Promise.all(
      votes.map(async (vote) => {
        try {
          const verifierData = await verifier_registry.getVerifier(vote.voter);
          const verifier = verifierData.length > 0 ? verifierData[0] : null;
          return {
            ...vote,
            verifierName: verifier?.name || 'Unknown',
            verifierOrg: verifier?.organization || 'Unknown'
          };
        } catch (err) {
          return {
            ...vote,
            verifierName: 'Unknown',
            verifierOrg: 'Unknown'
          };
        }
      })
    );

    return votesWithVerifiers;
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    throw error;
  }
}

export async function publishCase(caseId) {
  try {
    const result = await council.publishCase(caseId);

    if ('err' in result) {
      throw new Error(result.err);
    }

    return result;
  } catch (error) {
    console.error('Error publishing case:', error);
    throw error;
  }
}

export async function downloadFileChunks(fileIds) {
  try {
    const allChunks = [];

    for (const fileId of fileIds) {
      const chunkResult = await blob_store.getChunk(fileId);

      if (chunkResult.length > 0) {
        allChunks.push({
          fileId,
          data: chunkResult[0]
        });
      }
    }

    return allChunks;
  } catch (error) {
    console.error('Error downloading file chunks:', error);
    throw error;
  }
}

export async function fetchAllCases() {
  try {
    const [pending, resolved] = await Promise.all([
      fetchPendingCases(),
      fetchResolvedCases(100, 0)
    ]);

    return [...pending, ...resolved];
  } catch (error) {
    console.error('Error fetching all cases:', error);
    throw error;
  }
}

export function getStatusFromReview(review) {
  if (review.isPublished) return 'Published';
  if (review.isResolved) {
    if (review.finalDecision.length > 0) {
      return 'Approve' in review.finalDecision[0] ? 'Approved' : 'Rejected';
    }
  }
  if (review.votes.length > 0) return 'Under Review';
  return 'Pending';
}

export function formatTimestamp(nanoseconds) {
  const milliseconds = Number(nanoseconds) / 1000000;
  return new Date(milliseconds).toLocaleString();
}
