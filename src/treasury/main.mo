import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Option "mo:base/Option";

persistent actor Treasury {

    type PaymentStatus = {
        #Pending;
        #Authorized;
        #Paid;
        #Failed;
        #Cancelled;
    };

    type Reward = {
        caseId: Text;
        recipientAddress: Text;
        amount: Nat;
        status: PaymentStatus;
        authorizedBy: ?Principal;
        authorizedAt: ?Time.Time;
        paidAt: ?Time.Time;
        transactionId: ?Text;
    };

    type Result<Ok, Err> = Result.Result<Ok, Err>;

    private stable var rewardsEntries : [(Text, Reward)] = [];
    private stable var treasuryBalance : Nat = 0;
    private stable var controllerPrincipal : Principal = Principal.fromText("aaaaa-aa");
    private stable var authorizedCallers : [Principal] = [];

    private transient var rewards = HashMap.HashMap<Text, Reward>(
        100,
        Text.equal,
        Text.hash
    );

    system func preupgrade() {
        rewardsEntries := Iter.toArray(rewards.entries());
    };

    system func postupgrade() {
        rewards := HashMap.fromIter<Text, Reward>(
            rewardsEntries.vals(),
            rewardsEntries.size(),
            Text.equal,
            Text.hash
        );
        rewardsEntries := [];
    };

    private func isController(caller: Principal) : Bool {
        Principal.equal(caller, controllerPrincipal)
    };

    private func isAuthorized(caller: Principal) : Bool {
        isController(caller) or Option.isSome(
            Array.find<Principal>(
                authorizedCallers,
                func (p: Principal) : Bool { Principal.equal(p, caller) }
            )
        )
    };

    public shared(msg) func initController() : async Result<(), Text> {
        if (Principal.toText(controllerPrincipal) == "aaaaa-aa") {
            controllerPrincipal := msg.caller;
            #ok(())
        } else {
            #err("Controller already initialized")
        }
    };

    public shared(msg) func authorizeCanister(canister: Principal) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can authorize canisters");
        };

        if (Option.isSome(Array.find<Principal>(authorizedCallers, func (p: Principal) : Bool { Principal.equal(p, canister) }))) {
            return #err("Canister already authorized");
        };

        authorizedCallers := Array.append<Principal>(authorizedCallers, [canister]);
        #ok(())
    };

    public shared(msg) func authorizeReward(
        caseId: Text,
        amount: Nat
    ) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Unauthorized: Only authorized canisters can authorize rewards");
        };

        switch (rewards.get(caseId)) {
            case (?existing) {
                #err("Reward already exists for this case")
            };
            case null {
                if (amount > treasuryBalance) {
                    return #err("Insufficient treasury balance");
                };

                let newReward : Reward = {
                    caseId = caseId;
                    recipientAddress = "";
                    amount = amount;
                    status = #Authorized;
                    authorizedBy = ?msg.caller;
                    authorizedAt = ?Time.now();
                    paidAt = null;
                    transactionId = null;
                };

                rewards.put(caseId, newReward);
                #ok(())
            };
        }
    };

    public shared(msg) func setRecipientAddress(
        caseId: Text,
        recipientAddress: Text
    ) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Unauthorized");
        };

        switch (rewards.get(caseId)) {
            case null {
                #err("Reward not found")
            };
            case (?existing) {
                let updated : Reward = {
                    caseId = existing.caseId;
                    recipientAddress = recipientAddress;
                    amount = existing.amount;
                    status = existing.status;
                    authorizedBy = existing.authorizedBy;
                    authorizedAt = existing.authorizedAt;
                    paidAt = existing.paidAt;
                    transactionId = existing.transactionId;
                };
                rewards.put(caseId, updated);
                #ok(())
            };
        }
    };

    public shared(msg) func processPayment(caseId: Text) : async Result<Text, Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can process payments");
        };

        switch (rewards.get(caseId)) {
            case null {
                #err("Reward not found")
            };
            case (?reward) {
                if (not statusEqual(reward.status, #Authorized)) {
                    return #err("Reward not in authorized state");
                };

                if (reward.amount > treasuryBalance) {
                    return #err("Insufficient treasury balance");
                };

                if (Text.size(reward.recipientAddress) == 0) {
                    return #err("Recipient address not set");
                };

                let txId = "TX-" # caseId # "-" # Nat.toText(Int.abs(Time.now()));

                treasuryBalance -= reward.amount;

                let updatedReward : Reward = {
                    caseId = reward.caseId;
                    recipientAddress = reward.recipientAddress;
                    amount = reward.amount;
                    status = #Paid;
                    authorizedBy = reward.authorizedBy;
                    authorizedAt = reward.authorizedAt;
                    paidAt = ?Time.now();
                    transactionId = ?txId;
                };

                rewards.put(caseId, updatedReward);
                #ok(txId)
            };
        }
    };

    public shared(msg) func cancelReward(caseId: Text) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can cancel rewards");
        };

        switch (rewards.get(caseId)) {
            case null {
                #err("Reward not found")
            };
            case (?reward) {
                if (statusEqual(reward.status, #Paid)) {
                    return #err("Cannot cancel already paid reward");
                };

                let updatedReward : Reward = {
                    caseId = reward.caseId;
                    recipientAddress = reward.recipientAddress;
                    amount = reward.amount;
                    status = #Cancelled;
                    authorizedBy = reward.authorizedBy;
                    authorizedAt = reward.authorizedAt;
                    paidAt = null;
                    transactionId = null;
                };

                rewards.put(caseId, updatedReward);
                #ok(())
            };
        }
    };

    public query func getReward(caseId: Text) : async ?Reward {
        rewards.get(caseId)
    };

    public query func listPendingPayments() : async [Reward] {
        let pending = Array.filter<Reward>(
            Iter.toArray(rewards.vals()),
            func (r: Reward) : Bool {
                statusEqual(r.status, #Authorized) or statusEqual(r.status, #Pending)
            }
        );
        pending
    };

    public query func getPaymentHistory(limit: Nat, offset: Nat) : async [Reward] {
        var allRewards = Iter.toArray(rewards.vals());

        allRewards := Array.sort<Reward>(
            allRewards,
            func (a: Reward, b: Reward) : { #less; #equal; #greater } {
                let aTime = Option.get(a.authorizedAt, 0);
                let bTime = Option.get(b.authorizedAt, 0);
                if (aTime > bTime) { #less }
                else if (aTime < bTime) { #greater }
                else { #equal }
            }
        );

        let total = allRewards.size();
        let start = if (offset < total) { offset } else { total };
        let end = if (start + limit < total) { start + limit } else { total };

        if (start >= total) {
            return [];
        };

        Array.tabulate<Reward>(
            end - start,
            func (i: Nat) : Reward {
                allRewards[start + i]
            }
        )
    };

    public query func getTreasuryBalance() : async Nat {
        treasuryBalance
    };

    public shared(msg) func fundTreasury(amount: Nat) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can fund treasury");
        };

        treasuryBalance += amount;
        #ok(())
    };

    public shared(msg) func withdrawFromTreasury(
        amount: Nat,
        recipient: Principal
    ) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can withdraw from treasury");
        };

        if (amount > treasuryBalance) {
            return #err("Insufficient treasury balance");
        };

        treasuryBalance -= amount;
        #ok(())
    };

    private func statusEqual(a: PaymentStatus, b: PaymentStatus) : Bool {
        switch (a, b) {
            case (#Pending, #Pending) { true };
            case (#Authorized, #Authorized) { true };
            case (#Paid, #Paid) { true };
            case (#Failed, #Failed) { true };
            case (#Cancelled, #Cancelled) { true };
            case (_, _) { false };
        }
    };
}
