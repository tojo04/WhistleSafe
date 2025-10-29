export async function importKey(keyHex) {
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );

  return await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function decryptData(encryptedData, key) {
  const combinedArray = typeof encryptedData === 'string'
    ? Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    : encryptedData;

  const iv = combinedArray.slice(0, 12);
  const ciphertext = combinedArray.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertext
  );

  return new Uint8Array(decrypted);
}

export async function decryptText(encryptedData, key) {
  const decryptedBytes = await decryptData(encryptedData, key);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

export async function decryptFile(encryptedData, key) {
  return await decryptData(encryptedData, key);
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
