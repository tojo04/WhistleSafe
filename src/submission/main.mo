import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Option "mo:base/Option";
import Principal "mo:base/Principal";

persistent actor Submission {

    type CaseId = Text;

    type SubmissionStatus = {
        #Pending;
        #UnderReview;
        #Approved;
        #Rejected;
        #Published;
    };

    type Submission = {
        caseId: CaseId;
        encryptedStatement: Text;
        encryptionParams: Text;
        fileIds: [Text];
        rewardAddress: ?Text;
        status: SubmissionStatus;
        submittedAt: Time.Time;
        updatedAt: Time.Time;
    };

    type Result<Ok, Err> = Result.Result<Ok, Err>;

    private stable var submissionsEntries : [(Text, Submission)] = [];
    private stable var caseIdCounter : Nat = 0;

    private transient var submissions = HashMap.HashMap<Text, Submission>(
        100,
        Text.equal,
        Text.hash
    );

    private stable var authorizedCallers : [Principal] = [];

    system func preupgrade() {
        submissionsEntries := Iter.toArray(submissions.entries());
    };

    system func postupgrade() {
        submissions := HashMap.fromIter<Text, Submission>(
            submissionsEntries.vals(),
            submissionsEntries.size(),
            Text.equal,
            Text.hash
        );
        submissionsEntries := [];
    };

    private func generateCaseId() : Text {
        let id = caseIdCounter;
        caseIdCounter += 1;
        "CASE-" # Nat.toText(id) # "-" # Nat.toText(Int.abs(Time.now()))
    };

    public shared(msg) func authorizeCanister(canister: Principal) : async Result<(), Text> {
        if (Option.isSome(Array.find<Principal>(authorizedCallers, func (p: Principal) : Bool { Principal.equal(p, canister) }))) {
            return #err("Canister already authorized");
        };

        authorizedCallers := Array.append<Principal>(authorizedCallers, [canister]);
        #ok(())
    };

    private func isAuthorized(caller: Principal) : Bool {
        Option.isSome(
            Array.find<Principal>(
                authorizedCallers,
                func (p: Principal) : Bool { Principal.equal(p, caller) }
            )
        )
    };

    public shared func submitCase(
        encryptedStatement: Text,
        encryptionParams: Text,
        fileIds: [Text],
        rewardAddress: ?Text
    ) : async Result<CaseId, Text> {
        if (Text.size(encryptedStatement) == 0) {
            return #err("Encrypted statement cannot be empty");
        };

        if (Text.size(encryptionParams) == 0) {
            return #err("Encryption parameters cannot be empty");
        };

        let caseId = generateCaseId();
        let now = Time.now();

        let newSubmission : Submission = {
            caseId = caseId;
            encryptedStatement = encryptedStatement;
            encryptionParams = encryptionParams;
            fileIds = fileIds;
            rewardAddress = rewardAddress;
            status = #Pending;
            submittedAt = now;
            updatedAt = now;
        };

        submissions.put(caseId, newSubmission);
        #ok(caseId)
    };

    public query func getSubmission(caseId: Text) : async ?Submission {
        submissions.get(caseId)
    };

    public query func listSubmissions(
        status: ?SubmissionStatus,
        limit: Nat,
        offset: Nat
    ) : async [Submission] {
        var allSubmissions = Iter.toArray(submissions.vals());

        switch (status) {
            case (?s) {
                allSubmissions := Array.filter<Submission>(
                    allSubmissions,
                    func (sub: Submission) : Bool {
                        statusEqual(sub.status, s)
                    }
                );
            };
            case null {};
        };

        allSubmissions := Array.sort<Submission>(
            allSubmissions,
            func (a: Submission, b: Submission) : { #less; #equal; #greater } {
                if (a.submittedAt > b.submittedAt) { #less }
                else if (a.submittedAt < b.submittedAt) { #greater }
                else { #equal }
            }
        );

        let total = allSubmissions.size();
        let start = if (offset < total) { offset } else { total };
        let end = if (start + limit < total) { start + limit } else { total };

        if (start >= total) {
            return [];
        };

        Array.tabulate<Submission>(
            end - start,
            func (i: Nat) : Submission {
                allSubmissions[start + i]
            }
        )
    };

    public query func getSubmissionCount() : async Nat {
        submissions.size()
    };

    public query func getSubmissionsByStatus(status: SubmissionStatus) : async [Submission] {
        let filtered = Array.filter<Submission>(
            Iter.toArray(submissions.vals()),
            func (sub: Submission) : Bool {
                statusEqual(sub.status, status)
            }
        );
        filtered
    };

    public shared(msg) func updateSubmissionStatus(
        caseId: Text,
        newStatus: SubmissionStatus,
        caller: Principal
    ) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Unauthorized: Only authorized canisters can update status");
        };

        switch (submissions.get(caseId)) {
            case null {
                #err("Submission not found")
            };
            case (?existing) {
                let updated : Submission = {
                    caseId = existing.caseId;
                    encryptedStatement = existing.encryptedStatement;
                    encryptionParams = existing.encryptionParams;
                    fileIds = existing.fileIds;
                    rewardAddress = existing.rewardAddress;
                    status = newStatus;
                    submittedAt = existing.submittedAt;
                    updatedAt = Time.now();
                };
                submissions.put(caseId, updated);
                #ok(())
            };
        }
    };

    private func statusEqual(a: SubmissionStatus, b: SubmissionStatus) : Bool {
        switch (a, b) {
            case (#Pending, #Pending) { true };
            case (#UnderReview, #UnderReview) { true };
            case (#Approved, #Approved) { true };
            case (#Rejected, #Rejected) { true };
            case (#Published, #Published) { true };
            case (_, _) { false };
        }
    };
}
