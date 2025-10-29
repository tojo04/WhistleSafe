import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Option "mo:base/Option";

persistent actor VerifierRegistry {

    type VerifierId = Principal;

    type Verifier = {
        id: VerifierId;
        name: Text;
        organization: Text;
        role: Text;
        addedAt: Time.Time;
        addedBy: Principal;
        isActive: Bool;
    };

    type Result<Ok, Err> = Result.Result<Ok, Err>;

    private stable var verifiersEntries : [(Principal, Verifier)] = [];
    private transient var verifiers = HashMap.HashMap<Principal, Verifier>(
        10,
        Principal.equal,
        Principal.hash
    );

    private stable var controllerPrincipal : Principal = Principal.fromText("aaaaa-aa");

    system func preupgrade() {
        verifiersEntries := Iter.toArray(verifiers.entries());
    };

    system func postupgrade() {
        verifiers := HashMap.fromIter<Principal, Verifier>(
            verifiersEntries.vals(),
            verifiersEntries.size(),
            Principal.equal,
            Principal.hash
        );
        verifiersEntries := [];
    };

    private func isController(caller: Principal) : Bool {
        Principal.equal(caller, controllerPrincipal)
    };

    public shared(msg) func initController() : async Result<(), Text> {
        if (Principal.toText(controllerPrincipal) == "aaaaa-aa") {
            controllerPrincipal := msg.caller;
            #ok(())
        } else {
            #err("Controller already initialized")
        }
    };

    public shared(msg) func addVerifier(
        name: Text,
        organization: Text,
        role: Text,
        verifierId: Principal
    ) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can add verifiers");
        };

        switch (verifiers.get(verifierId)) {
            case (?_) {
                #err("Verifier already exists")
            };
            case null {
                let newVerifier : Verifier = {
                    id = verifierId;
                    name = name;
                    organization = organization;
                    role = role;
                    addedAt = Time.now();
                    addedBy = msg.caller;
                    isActive = true;
                };
                verifiers.put(verifierId, newVerifier);
                #ok(())
            };
        }
    };

    public shared(msg) func removeVerifier(verifierId: Principal) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can remove verifiers");
        };

        switch (verifiers.remove(verifierId)) {
            case (?_) { #ok(()) };
            case null { #err("Verifier not found") };
        }
    };

    public shared(msg) func updateVerifier(
        verifierId: Principal,
        name: Text,
        organization: Text,
        role: Text
    ) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can update verifiers");
        };

        switch (verifiers.get(verifierId)) {
            case (?existing) {
                let updated : Verifier = {
                    id = existing.id;
                    name = name;
                    organization = organization;
                    role = role;
                    addedAt = existing.addedAt;
                    addedBy = existing.addedBy;
                    isActive = existing.isActive;
                };
                verifiers.put(verifierId, updated);
                #ok(())
            };
            case null {
                #err("Verifier not found")
            };
        }
    };

    public shared(msg) func activateVerifier(verifierId: Principal) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can activate verifiers");
        };

        switch (verifiers.get(verifierId)) {
            case (?existing) {
                let updated : Verifier = {
                    id = existing.id;
                    name = existing.name;
                    organization = existing.organization;
                    role = existing.role;
                    addedAt = existing.addedAt;
                    addedBy = existing.addedBy;
                    isActive = true;
                };
                verifiers.put(verifierId, updated);
                #ok(())
            };
            case null {
                #err("Verifier not found")
            };
        }
    };

    public shared(msg) func deactivateVerifier(verifierId: Principal) : async Result<(), Text> {
        if (not isController(msg.caller)) {
            return #err("Unauthorized: Only controller can deactivate verifiers");
        };

        switch (verifiers.get(verifierId)) {
            case (?existing) {
                let updated : Verifier = {
                    id = existing.id;
                    name = existing.name;
                    organization = existing.organization;
                    role = existing.role;
                    addedAt = existing.addedAt;
                    addedBy = existing.addedBy;
                    isActive = false;
                };
                verifiers.put(verifierId, updated);
                #ok(())
            };
            case null {
                #err("Verifier not found")
            };
        }
    };

    public query func isVerified(verifierId: Principal) : async Bool {
        switch (verifiers.get(verifierId)) {
            case (?verifier) { verifier.isActive };
            case null { false };
        }
    };

    public query func getVerifier(verifierId: Principal) : async ?Verifier {
        verifiers.get(verifierId)
    };

    public query func listAllVerifiers() : async [Verifier] {
        Iter.toArray(verifiers.vals())
    };

    public query func listActiveVerifiers() : async [Verifier] {
        let activeVerifiers = Array.filter<Verifier>(
            Iter.toArray(verifiers.vals()),
            func (v: Verifier) : Bool { v.isActive }
        );
        activeVerifiers
    };

    public query func getVerifierCount() : async Nat {
        verifiers.size()
    };
}
