// End-to-End Encryption (E2EE) Utility for SkillSwap
// Powered by browser native Web Cryptography API (SubtleCrypto)
// Uses ECDH (Curve P-256) for Key Exchange and AES-GCM (256-bit) for Authenticated Encryption

const SHARED_KEY_CACHE = new Map();

/**
 * Convert Uint8Array to Base64 string
 */
export const uint8ArrayToBase64 = (uint8Array) => {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
};

/**
 * Convert Base64 string to Uint8Array
 */
export const base64ToUint8Array = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Retrieves existing user keypair or generates a new ECDH P-256 keypair
 */
export const getOrInitUserKeyPair = async (userId) => {
  if (!window.crypto?.subtle) {
    console.warn('[E2EE] Web Crypto API not supported in this environment');
    return null;
  }

  const privStorageKey = `ss_e2ee_priv_${userId}`;
  const pubStorageKey = `ss_e2ee_pub_${userId}`;

  try {
    const storedPriv = localStorage.getItem(privStorageKey);
    const storedPub = localStorage.getItem(pubStorageKey);

    if (storedPriv && storedPub) {
      const privJwk = JSON.parse(storedPriv);
      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        privJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      return {
        privateKey,
        publicKeyJwkString: storedPub,
        isNew: false
      };
    }

    // Generate new ECDH P-256 key pair
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const exportedPriv = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const exportedPub = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const pubString = JSON.stringify(exportedPub);

    localStorage.setItem(privStorageKey, JSON.stringify(exportedPriv));
    localStorage.setItem(pubStorageKey, pubString);

    return {
      privateKey: keyPair.privateKey,
      publicKeyJwkString: pubString,
      isNew: true
    };
  } catch (err) {
    console.error('[E2EE] Failed to get or generate keypair:', err);
    return null;
  }
};

/**
 * Derives a shared AES-GCM-256 encryption key using ECDH
 */
export const getOrDeriveSharedKey = async (myPrivateKey, partnerId, partnerPublicKeyJwkString) => {
  if (!myPrivateKey || !partnerPublicKeyJwkString) return null;

  const cacheKey = `${partnerId}_${partnerPublicKeyJwkString.length}`;
  if (SHARED_KEY_CACHE.has(cacheKey)) {
    return SHARED_KEY_CACHE.get(cacheKey);
  }

  try {
    const partnerPubJwk = typeof partnerPublicKeyJwkString === 'string'
      ? JSON.parse(partnerPublicKeyJwkString)
      : partnerPublicKeyJwkString;

    const importedPartnerPub = await window.crypto.subtle.importKey(
      'jwk',
      partnerPubJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: importedPartnerPub
      },
      myPrivateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    SHARED_KEY_CACHE.set(cacheKey, sharedKey);
    return sharedKey;
  } catch (err) {
    console.error('[E2EE] Error deriving shared encryption key:', err);
    return null;
  }
};

/**
 * Encrypt plaintext using AES-GCM
 */
export const encryptMessageText = async (plainText, sharedKey) => {
  if (!plainText || !sharedKey) {
    return { ciphertext: plainText, iv: null, isEncrypted: false };
  }

  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      sharedKey,
      encoded
    );

    return {
      ciphertext: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
      iv: uint8ArrayToBase64(iv),
      isEncrypted: true
    };
  } catch (err) {
    console.error('[E2EE] Encryption failed:', err);
    return { ciphertext: plainText, iv: null, isEncrypted: false };
  }
};

/**
 * Decrypt ciphertext using AES-GCM
 */
export const decryptMessageText = async (ciphertextBase64, ivBase64, sharedKey) => {
  if (!ciphertextBase64 || !ivBase64 || !sharedKey) {
    return ciphertextBase64;
  }

  try {
    const iv = base64ToUint8Array(ivBase64);
    const cipherBytes = base64ToUint8Array(ciphertextBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      sharedKey,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails (e.g. key mismatch or unencrypted text), return safe fallback
    return '[Unable to decrypt message]';
  }
};
