WhistleSafe — Decentralized Whistleblower Protection Platform (on ICP)

WhistleSafe is a LegalTech dApp built on the Internet Computer Protocol (ICP) that allows individuals to anonymously report wrongdoing — such as corruption, fraud, or workplace abuse — in a secure, tamper-proof, and censorship-resistant way.

It replaces traditional whistleblower channels (emails, web forms, PDFs) with a fully on-chain system that ensures:

🔐 Core Idea

Anonymous users can encrypt and submit evidence (documents, videos, statements) directly to the blockchain.
These reports are then reviewed and verified manually by a trusted council of NGOs and journalists whose identities are registered in the system.
Once verified, the council can unlock, redact, and publish the report — optionally issuing token-based rewards to the whistleblower’s crypto address.

🧩 Key Components
Component	Description
Anonymous Submission	Users upload files or messages encrypted client-side (AES-GCM). The system stores only ciphertext and metadata — no IPs, no names.
Blob Storage Canister	Stores encrypted report chunks immutably and verifiably on ICP.
Council Governance	A 3-of-5 verifier council manually reviews, unlocks, and decides on publication using on-chain votes.
Manual Verification Registry	A canister maintaining an allowlist of trusted verifiers (NGOs, journalists) — manually approved by the core team.
Redacted Publishing	Council can release redacted or sanitized versions of verified reports for public transparency.
Optional Reward System	A treasury canister manages token rewards (ICRC-1) to compensate whistleblowers anonymously.
🧱 Built Entirely On-Chain

Unlike Web2 “anonymous tip” portals that rely on central databases or email servers, WhistleSafe runs fully within ICP’s tamper-resistant canister environment.
No third-party cloud storage, no external APIs — every action (submission, review, reward) is auditable and verifiable.

🎯 Purpose

Provide a safe, censorship-free channel for whistleblowers.

Ensure trustworthy verification via registered human reviewers.

Preserve full anonymity and integrity of evidence.

Showcase how ICP’s decentralized web stack can support real-world legal compliance and human rights protection.


System Design 


High-level Overview
[User (Anon Browser)]
   |
   | 1) Client-side encrypt (AES-GCM) + hash
   v
[React Frontend on ICP]
   |
   | 2) upload ciphertext + metadata
   v
+---------------------------+       +---------------------------+
| submission_canister       |  ---> | blob_store_canister       |
| - accepts encrypted       |       | - chunked blob storage    |
|   reports (metadata)      | <---  | - serve encrypted blobs   |
| - timestamps + IDs        |       |                           |
+---------------------------+       +---------------------------+
            | 3) queue
            v
+---------------------------+       +---------------------------+
| council_canister          | <-->  | verifier_registry_canister|
| - manual verification     |       | - allowlist of council    |
| - 3-of-5 unlock votes     |       |   principals (manual)     |
| - publish/unlock actions  |       +---------------------------+
| - reward proposal         |
+-----------+---------------+
            |
            | 4) on approval
            v
+---------------------------+
| treasury_canister         |
| - holds rewards           |
| - pays to user-provided   |
|   crypto address (optional|
|   & still anonymous)      |
+---------------------------+


Trust model:

Council members (NGOs/journalists) are manually allowlisted in verifier_registry_canister.

Users stay fully anonymous (no II login required for submit; we never store IPs/emails).

All reports are client-side encrypted; canisters only store ciphertext + hashes.

2) dfx Project Layout (Motoko + React)
whistlesafe/
├─ dfx.json
├─ package.json
├─ src/
│  ├─ submission/
│  │  ├─ submission.mo
│  │  └─ types.mo
│  ├─ council/
│  │  ├─ council.mo
│  │  └─ types.mo
│  ├─ registry/
│  │  ├─ verifier_registry.mo
│  │  └─ types.mo
│  ├─ treasury/
│  │  ├─ treasury.mo
│  │  └─ types.mo
│  └─ blob/
│     ├─ blob_store.mo
│     └─ types.mo
├─ frontend/
│  └─ react-app/  (Vite or CRA)
│     ├─ src/
│     │  ├─ pages/
│     │  │  ├─ Submit.tsx
│     │  │  ├─ CouncilInbox.tsx
│     │  │  ├─ ReportView.tsx
│     │  │  └─ Rewards.tsx
│     │  ├─ components/
│     │  │  ├─ Encryptor.ts
│     │  │  ├─ Uploader.tsx
│     │  │  ├─ Chunker.ts
│     │  │  └─ CouncilActions.tsx
│     │  ├─ lib/
│     │  │  ├─ crypto.ts (AES-GCM, key wrap)
│     │  │  ├─ api.ts (agent calls)
│     │  │  └─ constants.ts
│     │  └─ styles/
│     └─ index.html
└─ README.md

3) Core Canisters & Responsibilities
3.1 verifier_registry_canister (Manual allowlist)

Purpose: Holds the allowlist of council/verifier principals.

Admin: Controlled by a bootstrapped multisig (founders) for the hackathon.

Data: principal -> VerifierProfile { orgName; role; active; addedAt }

Key ops:

addVerifier(principal, profile) (admins only)

removeVerifier(principal) (admins only)

isVerifier(principal) -> Bool (public query)

listVerifiers() -> [Profile] (public query)

3.2 submission_canister

Purpose: Accepts anonymous submissions (metadata + encrypted payload pointer).

Data: Report { id; sha256; title; tags; createdAt; size; blobChunks[]; status; rewardAddr? }

Status: Pending | UnderReview | Resolved | Rejected | Published

Key ops:

submit(meta, chunksSpec, hash, rewardAddr?) -> reportId

meta: { title; tags; contentType; }

chunksSpec: array of {blobId, size} from blob_store

hash: SHA-256 of ciphertext (frontend computed)

stores minimal metadata; no PII, no IP

getReportSummary(reportId) (query)

listReports(status?, page?) (for council only; gated by verifier_registry)

markUnderReview(reportId) (council)

setStatus(reportId, newStatus) (council)

linkToCouncilCase(reportId, caseId) (council)

3.3 blob_store_canister

Purpose: Chunked storage for encrypted blobs (files, media).

Key ops:

putChunk(chunkBytes) -> blobId

getChunk(blobId) -> chunkBytes (council-gated unless Published)

sealReport(reportId) (freeze writes once submitted)

Notes: Max chunk size (e.g., 1–2 MB) to avoid message limits. Encrypted client-side.

3.4 council_canister

Purpose: Case management + manual verification + unlock voting.

Data: Case { caseId; reportId; state; votes; decision; unlockScope }

Unlock scopes: None | PartialMeta | FullCiphertext | PublishRedacted

Voting: e.g., 3-of-5 from the current active verifier set.

Key ops:

openCase(reportId) -> caseId (council)

vote(caseId, decision, unlockScope) (council)

finalize(caseId) → updates submission_canister status

publish(caseId, redactionSpec?) → sets report Published + adjusts blob gating

proposeReward(caseId, amount, addr) (council)

approveReward(caseId) (council threshold) → triggers treasury_canister

3.5 treasury_canister

Purpose: Hold tokens + pay optional rewards to the provided crypto address.

Token: ICRC-1 / ICP; for demo you can simulate.

Key ops:

deposit(...) (any)

payout(caseId, amount, toAddress) (council threshold only)

Note: Whistleblower remains anonymous; they paste a payout address (can be any chain you choose to support, but easiest is ICP/ICRC-1).

4) Data Types (Motoko sketch)
type ReportId = Nat;
type CaseId = Nat;

type ReportStatus = { #Pending; #UnderReview; #Resolved; #Rejected; #Published };

type ReportMeta = {
  title : Text;
  tags  : [Text];
  contentType : Text;   // e.g. "application/pdf"
};

type ChunkSpec = { blobId : Nat; size : Nat };

type Report = {
  id         : ReportId;
  meta       : ReportMeta;
  sha256     : Blob;         // hash of ciphertext
  size       : Nat;          // total bytes
  chunks     : [ChunkSpec];  // in blob_store
  createdAt  : Nat64;        // ts
  status     : ReportStatus;
  rewardAddr : ?Text;        // optional payout address
};

type Decision = { #NoAction; #Unlock; #Publish; #Reject };
type UnlockScope = { #None; #PartialMeta; #FullCiphertext; #PublishRedacted };

type Vote = { by : Principal; decision : Decision; scope : UnlockScope; ts : Nat64 };

type Case = {
  caseId      : CaseId;
  reportId    : ReportId;
  state       : { #Open; #Finalized };
  votes       : [Vote];
  decision    : ?Decision;
  unlockScope : UnlockScope;
};


All canisters should implement upgrade hooks to persist stable variables and maintain indexes.

5) End-to-End Flows (ASCII Diagrams)
5.1 Anonymous Submission
[User Browser]
   |  (AES-GCM encrypt + SHA-256 hash)
   |--chunks--> [blob_store] : putChunk*N -> blobIds[]
   |--meta+ids+hash----------------------------------------> [submission]
   |  <- reportId -----------------------------------------
   |
[submission] -> writes Report{Pending, blobIds, sha256, meta, rewardAddr?}


Notes:

No login. No PII.

Enforce size limits & rate limit per canister (see §7).

5.2 Council Review & Unlock (Manual Verification)
[council member UI] --listPending--> [submission] (gated via registry)
                                  <-- summaries --
         | select reportId
         |--openCase(reportId)--> [council]
         |--vote(caseId,#Unlock,#FullCiphertext)  (3-of-5)
         |--finalize(caseId)---------------------> [council]
         |                                        |
         |                               if approved, set unlockScope
         |                                        |
         |<--status update-- [submission] <--------+
         |
[council UI] now can fetch ciphertext chunks
      getChunk(blobId) -> [blob_store] (gated if scope allows)

5.3 Publish (Redacted) + Optional Reward
[council UI] --publish(caseId, redactionSpec?)--> [council]
[council] -> instruct [blob_store] to expose only redacted/public assets
[council] -> set [submission].status = Published

(optional reward)
[council UI] --proposeReward(caseId, amt, addr)--> [council]
[council UI] --approveReward(caseId)-------------> [council] (3-of-5)
[council] --payout(caseId, amt, addr)-----------> [treasury]

6) Access Control & Gating

Manual allowlist: verifier_registry_canister.isVerifier(caller) guards council endpoints and privileged reads.

Submission read policies:

Before unlock: Only summaries (no blobs) available to council.

After unlock: Council can read ciphertext blobs to decrypt offline with access keys they manage.

On publish: Mark specific blobs as public or provide redacted variants; unredacted blobs remain gated.

Treasury: Only council_canister may call payout after threshold approval.

7) Privacy, Security & Abuse Mitigation

Client-side crypto

Generate a random AES-GCM key per submission; encrypt data locally.

Derive and store only the ciphertext hash (sha256) in canisters.

Key handling in MVP: Render the decryption key as a one-time code for the user to copy/save. If they wish the council to decrypt, they can optionally submit the key through an ephemeral channel (not stored on-chain) or embed it in a council-only sealed note (still encrypted with council’s public key).

Council may maintain a PGP/EC public key off-chain; users can encrypt the AES key to the council’s public key and attach as “councilKeyBundle” (stored on-chain but unreadable without council private key).

Rate limiting (without deanonymizing)

Per-canister sliding window counters based on HTTP request certificate/ingress signature characteristics (e.g., throttle repeated submissions from same boundary node + user agent fingerprint).

Lightweight proof-of-work or time-delay challenge for uploads over certain sizes.

Size quotas (e.g., 50MB per report, 10 chunks max).

Content safety

For MVP, no auto-scanning. Council unlocks first, evaluates offline, then decides publish + redactions.

Add a “do not publish PII” policy policy checkbox for council.

Logging

Log only event IDs + timestamps (no IPs/UA).

Use certified variables for audit of council actions.

Upgrades

All canisters use stable var migrations and checksum verifications for data integrity.

8) React Frontend (Key Screens)

Submit

Drag-drop files / paste text → client-side AES-GCM encrypt → chunk + upload → show reportId + “Save your decryption key” banner.

Optionally enter reward address.

Council Inbox (gated)

List Pending reports; quick metadata; action buttons: Open Case, Vote Unlock, Finalize, Publish, Propose Reward.

Blob viewer fetches ciphertext chunks once unlock is approved; council decrypts locally with submitted key (or via their private key for key bundle).

Report View

For Published reports, show redacted artifacts and public metadata.

Rewards

Council form to propose/approve payout (amount, token, address).

9) Minimal Motoko API Sketches (signatures only)
actor class VerifierRegistry() {
  public shared(msg) func addVerifier(p : Principal, profile : Profile) : async Bool;
  public shared(msg) func removeVerifier(p : Principal) : async Bool;
  public query func isVerifier(p : Principal) : async Bool;
  public query func listVerifiers() : async [Profile];
}

actor class Submission() {
  public shared func submit(meta : ReportMeta, chunks : [ChunkSpec], sha256 : Blob, rewardAddr : ?Text) : async ReportId;
  public query func getReportSummary(id : ReportId) : async ?ReportSummary;
  public shared(msg) func listReports(status : ?ReportStatus, page : ?Nat) : async [ReportSummary]; // gated by isVerifier(msg.caller)
  public shared(msg) func markUnderReview(id : ReportId) : async Bool;  // gated
  public shared(msg) func setStatus(id : ReportId, s : ReportStatus) : async Bool; // gated
  public shared(msg) func linkToCouncilCase(id : ReportId, caseId : CaseId) : async Bool; // gated
}

actor class BlobStore() {
  public shared func putChunk(c : Blob) : async Nat;       // returns blobId
  public query func getChunk(id : Nat) : async ?Blob;      // gated by ACL / publication state
  public shared(msg) func sealReport(reportId : ReportId) : async Bool; // gated by Submission
}

actor class Council() {
  public shared(msg) func openCase(reportId : ReportId) : async CaseId;        // gated
  public shared(msg) func vote(caseId : CaseId, d : Decision, s : UnlockScope) : async Bool; // gated
  public shared(msg) func finalize(caseId : CaseId) : async Bool;              // gated
  public shared(msg) func publish(caseId : CaseId, redaction : ?RedactionSpec) : async Bool; // gated
  public shared(msg) func proposeReward(caseId : CaseId, amount : Nat, addr : Text) : async Bool; // gated
  public shared(msg) func approveReward(caseId : CaseId) : async Bool;         // threshold logic
}

actor class Treasury() {
  public shared func deposit(...) : async Bool;
  public shared(msg) func payout(caseId : CaseId, amount : Nat, addr : Text) : async Bool; // only Council can call
}

10) Council Threshold Logic
- Registry defines ACTIVE_VERIFIERS = set of principals
- Council keeps CASE.votes[] and computes:
    approvals = count(v where v.decision in {#Unlock,#Publish})
    rejects   = count(v where v.decision == #Reject)
- Threshold policy (MVP): approvals >= 3 AND total distinct voters >= 3
- finalize() checks threshold, sets decision, updates Submission, sets Blob ACL
- Reward approvals: separate vote tally; require approvals >= 3

11) Deployment & Config

Local dev: dfx start --clean, deploy all five canisters; seed registry with 5 council principals (dev identities).

Frontend hosting: Use dfx deploy asset canister or IC static asset canister; configure candid URLs in frontend/src/lib/constants.ts.

Env toggles: MAX_CHUNK_SIZE, MAX_REPORT_SIZE_MB, REWARD_TOKEN_CANISTER_ID, COUNCIL_THRESHOLD.

12) What’s In / Out for the MVP

In (MVP):

Anonymous submit (AES-GCM + hash)

Chunked encrypted storage

Manual allowlist registry

Council inbox, 3-of-5 unlock/publish flow

Optional reward payout to user-provided address

Redacted publish (attach redacted file as new public blob)

Out (later):

ZK proofs, in-browser watermarking, duplicate-detection at scale, automated content analysis, advanced PoW rate limiting, per-org routing.