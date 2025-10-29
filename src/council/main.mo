import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Option "mo:base/Option";

actor Council {

    type VoteType = {
        #Approve;
        #Reject;
    };

    type Vote = {
        voter: Principal;
        caseId: Text;
        voteType: VoteType;
        timestamp: Time.Time;
        comment: ?Text;
    };

    type CaseReview = {
        caseId: Text;
        assignedAt: Time.Time;
        votes: [Vote];
        approvalCount: Nat;
        rejectionCount: Nat;
        isResolved: Bool;
        finalDecision: ?VoteType;
        publishedAt: ?Time.Time;
        isPublished: Bool;
    };

    type SubmissionStatus = {
        #Pending;
        #UnderReview;
        #Approved;
        #Rejected;
        #Published;
    };

    type Result<Ok, Err> = Result.Result<Ok, Err>;

    private let APPROVAL_THRESHOLD : Nat = 3;
    private let REJECTION_THRESHOLD : Nat = 3;

    private stable var caseReviewsEntries : [(Text, CaseReview)] = [];
    private stable var votesEntries : [(Text, [Vote])] = [];

    private var caseReviews = HashMap.HashMap<Text, CaseReview>(
        100,
        Text.equal,
        Text.hash
    );

    private stable var verifierRegistryCanister : ?Principal = null;
    private stable var submissionCanister : ?Principal = null;
    private stable var treasuryCanister : ?Principal = null;

    system func preupgrade() {
        caseReviewsEntries := Iter.toArray(caseReviews.entries());
    };

    system func postupgrade() {
        caseReviews := HashMap.fromIter<Text, CaseReview>(
            caseReviewsEntries.vals(),
            caseReviewsEntries.size(),
            Text.equal,
            Text.hash
        );
        caseReviewsEntries := [];
    };

    public shared(msg) func setVerifierRegistryCanister(canisterId: Principal) : async Result<(), Text> {
        verifierRegistryCanister := ?canisterId;
        #ok(())
    };

    public shared(msg) func setSubmissionCanister(canisterId: Principal) : async Result<(), Text> {
        submissionCanister := ?canisterId;
        #ok(())
    };

    public shared(msg) func setTreasuryCanister(canisterId: Principal) : async Result<(), Text> {
        treasuryCanister := ?canisterId;
        #ok(())
    };

    private func isVerifiedMember(caller: Principal) : async Bool {
        switch (verifierRegistryCanister) {
            case null { false };
            case (?canisterId) {
                let verifierRegistry = actor(Principal.toText(canisterId)) : actor {
                    isVerified: (Principal) -> async Bool;
                };
                await verifierRegistry.isVerified(caller)
            };
        }
    };

    private func updateSubmissionStatus(caseId: Text, status: SubmissionStatus) : async Result<(), Text> {
        switch (submissionCanister) {
            case null {
                #err("Submission canister not configured")
            };
            case (?canisterId) {
                let submission = actor(Principal.toText(canisterId)) : actor {
                    updateSubmissionStatus: (Text, SubmissionStatus, Principal) -> async Result<(), Text>;
                };
                await submission.updateSubmissionStatus(caseId, status, Principal.fromActor(Council))
            };
        }
    };

    private func authorizeReward(caseId: Text, amount: Nat) : async Result<(), Text> {
        switch (treasuryCanister) {
            case null {
                #err("Treasury canister not configured")
            };
            case (?canisterId) {
                let treasury = actor(Principal.toText(canisterId)) : actor {
                    authorizeReward: (Text, Nat) -> async Result<(), Text>;
                };
                await treasury.authorizeReward(caseId, amount)
            };
        }
    };

    public shared func assignCaseForReview(caseId: Text) : async Result<(), Text> {
        switch (caseReviews.get(caseId)) {
            case (?_) {
                #err("Case already assigned for review")
            };
            case null {
                let newReview : CaseReview = {
                    caseId = caseId;
                    assignedAt = Time.now();
                    votes = [];
                    approvalCount = 0;
                    rejectionCount = 0;
                    isResolved = false;
                    finalDecision = null;
                    publishedAt = null;
                    isPublished = false;
                };
                caseReviews.put(caseId, newReview);

                ignore await updateSubmissionStatus(caseId, #UnderReview);

                #ok(())
            };
        }
    };

    public shared(msg) func castVote(
        caseId: Text,
        voteType: VoteType,
        comment: ?Text
    ) : async Result<(), Text> {
        let isVerified = await isVerifiedMember(msg.caller);
        if (not isVerified) {
            return #err("Unauthorized: Only verified council members can vote");
        };

        switch (caseReviews.get(caseId)) {
            case null {
                #err("Case not found or not assigned for review")
            };
            case (?review) {
                if (review.isResolved) {
                    return #err("Case already resolved");
                };

                let hasVoted = Option.isSome(
                    Array.find<Vote>(
                        review.votes,
                        func (v: Vote) : Bool {
                            Principal.equal(v.voter, msg.caller)
                        }
                    )
                );

                if (hasVoted) {
                    return #err("You have already voted on this case");
                };

                let newVote : Vote = {
                    voter = msg.caller;
                    caseId = caseId;
                    voteType = voteType;
                    timestamp = Time.now();
                    comment = comment;
                };

                let updatedVotes = Array.append<Vote>(review.votes, [newVote]);
                let newApprovalCount = if (voteTypeEqual(voteType, #Approve)) {
                    review.approvalCount + 1
                } else {
                    review.approvalCount
                };
                let newRejectionCount = if (voteTypeEqual(voteType, #Reject)) {
                    review.rejectionCount + 1
                } else {
                    review.rejectionCount
                };

                var isResolved = review.isResolved;
                var finalDecision = review.finalDecision;

                if (newApprovalCount >= APPROVAL_THRESHOLD) {
                    isResolved := true;
                    finalDecision := ?#Approve;
                    ignore await updateSubmissionStatus(caseId, #Approved);
                } else if (newRejectionCount >= REJECTION_THRESHOLD) {
                    isResolved := true;
                    finalDecision := ?#Reject;
                    ignore await updateSubmissionStatus(caseId, #Rejected);
                };

                let updatedReview : CaseReview = {
                    caseId = review.caseId;
                    assignedAt = review.assignedAt;
                    votes = updatedVotes;
                    approvalCount = newApprovalCount;
                    rejectionCount = newRejectionCount;
                    isResolved = isResolved;
                    finalDecision = finalDecision;
                    publishedAt = review.publishedAt;
                    isPublished = review.isPublished;
                };

                caseReviews.put(caseId, updatedReview);
                #ok(())
            };
        }
    };

    public shared(msg) func getMyVote(caseId: Text) : async ?Vote {
        switch (caseReviews.get(caseId)) {
            case null { null };
            case (?review) {
                Array.find<Vote>(
                    review.votes,
                    func (v: Vote) : Bool {
                        Principal.equal(v.voter, msg.caller)
                    }
                )
            };
        }
    };

    public query func hasVoted(caseId: Text, voter: Principal) : async Bool {
        switch (caseReviews.get(caseId)) {
            case null { false };
            case (?review) {
                Option.isSome(
                    Array.find<Vote>(
                        review.votes,
                        func (v: Vote) : Bool {
                            Principal.equal(v.voter, voter)
                        }
                    )
                )
            };
        }
    };

    public query func getCaseReview(caseId: Text) : async ?CaseReview {
        caseReviews.get(caseId)
    };

    public query func listPendingCases() : async [CaseReview] {
        let pending = Array.filter<CaseReview>(
            Iter.toArray(caseReviews.vals()),
            func (review: CaseReview) : Bool {
                not review.isResolved
            }
        );
        pending
    };

    public query func listResolvedCases(limit: Nat, offset: Nat) : async [CaseReview] {
        var resolved = Array.filter<CaseReview>(
            Iter.toArray(caseReviews.vals()),
            func (review: CaseReview) : Bool {
                review.isResolved
            }
        );

        resolved := Array.sort<CaseReview>(
            resolved,
            func (a: CaseReview, b: CaseReview) : { #less; #equal; #greater } {
                if (a.assignedAt > b.assignedAt) { #less }
                else if (a.assignedAt < b.assignedAt) { #greater }
                else { #equal }
            }
        );

        let total = resolved.size();
        let start = if (offset < total) { offset } else { total };
        let end = if (start + limit < total) { start + limit } else { total };

        if (start >= total) {
            return [];
        };

        Array.tabulate<CaseReview>(
            end - start,
            func (i: Nat) : CaseReview {
                resolved[start + i]
            }
        )
    };

    public query func getVoteCount(caseId: Text) : async { approvals: Nat; rejections: Nat } {
        switch (caseReviews.get(caseId)) {
            case null {
                { approvals = 0; rejections = 0 }
            };
            case (?review) {
                { approvals = review.approvalCount; rejections = review.rejectionCount }
            };
        }
    };

    public shared func publishCase(caseId: Text) : async Result<(), Text> {
        switch (caseReviews.get(caseId)) {
            case null {
                #err("Case not found")
            };
            case (?review) {
                if (not review.isResolved) {
                    return #err("Case not resolved yet");
                };

                if (review.finalDecision != ?#Approve) {
                    return #err("Only approved cases can be published");
                };

                if (review.isPublished) {
                    return #err("Case already published");
                };

                let updatedReview : CaseReview = {
                    caseId = review.caseId;
                    assignedAt = review.assignedAt;
                    votes = review.votes;
                    approvalCount = review.approvalCount;
                    rejectionCount = review.rejectionCount;
                    isResolved = review.isResolved;
                    finalDecision = review.finalDecision;
                    publishedAt = ?Time.now();
                    isPublished = true;
                };

                caseReviews.put(caseId, updatedReview);

                ignore await updateSubmissionStatus(caseId, #Published);

                #ok(())
            };
        }
    };

    public shared func unpublishCase(caseId: Text) : async Result<(), Text> {
        switch (caseReviews.get(caseId)) {
            case null {
                #err("Case not found")
            };
            case (?review) {
                if (not review.isPublished) {
                    return #err("Case not published");
                };

                let updatedReview : CaseReview = {
                    caseId = review.caseId;
                    assignedAt = review.assignedAt;
                    votes = review.votes;
                    approvalCount = review.approvalCount;
                    rejectionCount = review.rejectionCount;
                    isResolved = review.isResolved;
                    finalDecision = review.finalDecision;
                    publishedAt = null;
                    isPublished = false;
                };

                caseReviews.put(caseId, updatedReview);

                ignore await updateSubmissionStatus(caseId, #Approved);

                #ok(())
            };
        }
    };

    public query func getAuditTrail(caseId: Text) : async [Vote] {
        switch (caseReviews.get(caseId)) {
            case null { [] };
            case (?review) { review.votes };
        }
    };

    public query func getVoterHistory(voter: Principal) : async [Vote] {
        var allVotes : [Vote] = [];

        for ((_, review) in caseReviews.entries()) {
            let voterVotes = Array.filter<Vote>(
                review.votes,
                func (v: Vote) : Bool {
                    Principal.equal(v.voter, voter)
                }
            );
            allVotes := Array.append<Vote>(allVotes, voterVotes);
        };

        allVotes
    };

    private func voteTypeEqual(a: VoteType, b: VoteType) : Bool {
        switch (a, b) {
            case (#Approve, #Approve) { true };
            case (#Reject, #Reject) { true };
            case (_, _) { false };
        }
    };
}
