import Blob "mo:base/Blob";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Option "mo:base/Option";

persistent actor BlobStore {

    type ChunkId = Nat;
    type FileId = Text;

    type Chunk = {
        id: ChunkId;
        fileId: FileId;
        data: Blob;
        hash: Text;
        index: Nat;
        timestamp: Time.Time;
    };

    type FileMetadata = {
        fileId: FileId;
        totalChunks: Nat;
        totalSize: Nat;
        mimeType: Text;
        uploadedAt: Time.Time;
        uploadedBy: ?Principal;
        isComplete: Bool;
    };

    type Result<Ok, Err> = Result.Result<Ok, Err>;

    private transient let MAX_CHUNK_SIZE : Nat = 2_000_000;

    private stable var chunkIdCounter : Nat = 0;
    private stable var chunksEntries : [(Nat, Chunk)] = [];
    private stable var filesMetadataEntries : [(Text, FileMetadata)] = [];
    private stable var fileChunksMapEntries : [(Text, [Nat])] = [];

    private func natHash(n : Nat) : Hash.Hash {
        Text.hash(Nat.toText(n))
    };

    private transient var chunks = HashMap.HashMap<Nat, Chunk>(
        100,
        Nat.equal,
        natHash
    );

    private transient var filesMetadata = HashMap.HashMap<Text, FileMetadata>(
        10,
        Text.equal,
        Text.hash
    );

    private transient var fileChunksMap = HashMap.HashMap<Text, [Nat]>(
        10,
        Text.equal,
        Text.hash
    );

    system func preupgrade() {
        chunksEntries := Iter.toArray(chunks.entries());
        filesMetadataEntries := Iter.toArray(filesMetadata.entries());
        fileChunksMapEntries := Iter.toArray(fileChunksMap.entries());
    };

    system func postupgrade() {
        chunks := HashMap.fromIter<Nat, Chunk>(
            chunksEntries.vals(),
            chunksEntries.size(),
            Nat.equal,
            natHash
        );

        filesMetadata := HashMap.fromIter<Text, FileMetadata>(
            filesMetadataEntries.vals(),
            filesMetadataEntries.size(),
            Text.equal,
            Text.hash
        );

        fileChunksMap := HashMap.fromIter<Text, [Nat]>(
            fileChunksMapEntries.vals(),
            fileChunksMapEntries.size(),
            Text.equal,
            Text.hash
        );

        chunksEntries := [];
        filesMetadataEntries := [];
        fileChunksMapEntries := [];
    };

    public shared(msg) func createFile(
        fileId: Text,
        totalChunks: Nat,
        mimeType: Text
    ) : async Result<FileId, Text> {
        switch (filesMetadata.get(fileId)) {
            case (?_) {
                #err("File already exists")
            };
            case null {
                let metadata : FileMetadata = {
                    fileId = fileId;
                    totalChunks = totalChunks;
                    totalSize = 0;
                    mimeType = mimeType;
                    uploadedAt = Time.now();
                    uploadedBy = ?msg.caller;
                    isComplete = false;
                };
                filesMetadata.put(fileId, metadata);
                fileChunksMap.put(fileId, []);
                #ok(fileId)
            };
        }
    };

    public shared(msg) func uploadChunk(
        fileId: Text,
        index: Nat,
        data: Blob,
        hash: Text
    ) : async Result<ChunkId, Text> {
        switch (filesMetadata.get(fileId)) {
            case null {
                #err("File not found. Create file first.")
            };
            case (?metadata) {
                if (metadata.isComplete) {
                    return #err("File is already finalized");
                };

                if (index >= metadata.totalChunks) {
                    return #err("Chunk index out of bounds");
                };

                if (data.size() > MAX_CHUNK_SIZE) {
                    return #err("Chunk size exceeds 2MB limit");
                };

                let existingChunks = Option.get(fileChunksMap.get(fileId), []);
                let isDuplicate = Array.find<Nat>(
                    existingChunks,
                    func (chunkId: Nat) : Bool {
                        switch (chunks.get(chunkId)) {
                            case (?chunk) { chunk.index == index };
                            case null { false };
                        }
                    }
                );

                switch (isDuplicate) {
                    case (?_) {
                        #err("Chunk at this index already uploaded")
                    };
                    case null {
                        let chunkId = chunkIdCounter;
                        chunkIdCounter += 1;

                        let newChunk : Chunk = {
                            id = chunkId;
                            fileId = fileId;
                            data = data;
                            hash = hash;
                            index = index;
                            timestamp = Time.now();
                        };

                        chunks.put(chunkId, newChunk);

                        let updatedChunks = Array.append<Nat>(existingChunks, [chunkId]);
                        fileChunksMap.put(fileId, updatedChunks);

                        let updatedMetadata : FileMetadata = {
                            fileId = metadata.fileId;
                            totalChunks = metadata.totalChunks;
                            totalSize = metadata.totalSize + data.size();
                            mimeType = metadata.mimeType;
                            uploadedAt = metadata.uploadedAt;
                            uploadedBy = metadata.uploadedBy;
                            isComplete = metadata.isComplete;
                        };
                        filesMetadata.put(fileId, updatedMetadata);

                        #ok(chunkId)
                    };
                }
            };
        }
    };

    public shared func finalizeFile(fileId: Text) : async Result<(), Text> {
        switch (filesMetadata.get(fileId)) {
            case null {
                #err("File not found")
            };
            case (?metadata) {
                if (metadata.isComplete) {
                    return #err("File already finalized");
                };

                let chunkIds = Option.get(fileChunksMap.get(fileId), []);

                if (chunkIds.size() != metadata.totalChunks) {
                    return #err("Not all chunks uploaded. Expected: " # Nat.toText(metadata.totalChunks) # ", Got: " # Nat.toText(chunkIds.size()));
                };

                let updatedMetadata : FileMetadata = {
                    fileId = metadata.fileId;
                    totalChunks = metadata.totalChunks;
                    totalSize = metadata.totalSize;
                    mimeType = metadata.mimeType;
                    uploadedAt = metadata.uploadedAt;
                    uploadedBy = metadata.uploadedBy;
                    isComplete = true;
                };
                filesMetadata.put(fileId, updatedMetadata);

                #ok(())
            };
        }
    };

    public query func getChunk(fileId: Text, index: Nat) : async ?Chunk {
        let chunkIds = fileChunksMap.get(fileId);
        switch (chunkIds) {
            case null { null };
            case (?ids) {
                let foundChunkId = Array.find<Nat>(
                    ids,
                    func (chunkId: Nat) : Bool {
                        switch (chunks.get(chunkId)) {
                            case (?chunk) { chunk.index == index };
                            case null { false };
                        }
                    }
                );
                switch (foundChunkId) {
                    case null { null };
                    case (?id) { chunks.get(id) };
                }
            };
        }
    };

    public query func getFileMetadata(fileId: Text) : async ?FileMetadata {
        filesMetadata.get(fileId)
    };

    public query func getAllChunks(fileId: Text) : async [Chunk] {
        let chunkIds = fileChunksMap.get(fileId);
        switch (chunkIds) {
            case null { [] };
            case (?ids) {
                let chunksArray = Array.mapFilter<Nat, Chunk>(
                    ids,
                    func (id: Nat) : ?Chunk {
                        chunks.get(id)
                    }
                );
                Array.sort<Chunk>(
                    chunksArray,
                    func (a: Chunk, b: Chunk) : { #less; #equal; #greater } {
                        if (a.index < b.index) { #less }
                        else if (a.index > b.index) { #greater }
                        else { #equal }
                    }
                )
            };
        }
    };

    public query func verifyFileIntegrity(fileId: Text) : async Bool {
        switch (filesMetadata.get(fileId)) {
            case null { false };
            case (?metadata) {
                if (not metadata.isComplete) {
                    return false;
                };

                let chunkIds = Option.get(fileChunksMap.get(fileId), []);

                if (chunkIds.size() != metadata.totalChunks) {
                    return false;
                };

                var allIndicesPresent = true;
                var i = 0;
                while (i < metadata.totalChunks and allIndicesPresent) {
                    let hasIndex = Array.find<Nat>(
                        chunkIds,
                        func (chunkId: Nat) : Bool {
                            switch (chunks.get(chunkId)) {
                                case (?chunk) { chunk.index == i };
                                case null { false };
                            }
                        }
                    );
                    allIndicesPresent := Option.isSome(hasIndex);
                    i += 1;
                };

                allIndicesPresent
            };
        }
    };

    public query func getStorageUsed() : async Nat {
        var total : Nat = 0;
        for ((_, metadata) in filesMetadata.entries()) {
            total += metadata.totalSize;
        };
        total
    };

    public query func getChunkCount() : async Nat {
        chunks.size()
    };
}
