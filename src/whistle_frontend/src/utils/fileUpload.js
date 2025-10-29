import { encryptData, computeHash, concatenateEncrypted } from './crypto';

const CHUNK_SIZE = 2 * 1024 * 1024;

export async function chunkAndEncryptFile(file, encryptionKey) {
  const chunks = [];
  const fileSize = file.size;
  let offset = 0;

  while (offset < fileSize) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const chunkBytes = new Uint8Array(await chunk.arrayBuffer());

    const { ciphertext, iv } = await encryptData(chunkBytes, encryptionKey);
    const combined = concatenateEncrypted(iv, ciphertext);

    chunks.push({
      data: combined,
      size: combined.length
    });

    offset += CHUNK_SIZE;
  }

  return chunks;
}

export async function uploadChunksToBlob(chunks, blobStoreActor, onProgress) {
  const chunkSpecs = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const blobId = await blobStoreActor.putChunk(Array.from(chunks[i].data));

      chunkSpecs.push({
        blobId: Number(blobId),
        size: Number(chunks[i].size)
      });

      if (onProgress) {
        onProgress((i + 1) / chunks.length * 100);
      }
    } catch (error) {
      console.error(`Failed to upload chunk ${i}:`, error);
      throw new Error(`Upload failed at chunk ${i + 1}/${chunks.length}`);
    }
  }

  return chunkSpecs;
}

export async function encryptText(text, encryptionKey) {
  const { ciphertext, iv } = await encryptData(text, encryptionKey);
  return concatenateEncrypted(iv, ciphertext);
}

export async function computeFileHash(encryptedChunks) {
  const allBytes = new Uint8Array(
    encryptedChunks.reduce((total, chunk) => total + chunk.data.length, 0)
  );

  let offset = 0;
  for (const chunk of encryptedChunks) {
    allBytes.set(chunk.data, offset);
    offset += chunk.data.length;
  }

  return await computeHash(allBytes);
}
