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

  const serializedPub = typeof partnerPublicKeyJwkString === 'string'
    ? partnerPublicKeyJwkString
    : JSON.stringify(partnerPublicKeyJwkString);
  const cacheKey = `${partnerId}:${serializedPub}`;
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
  } catch {
    // If decryption fails (e.g. key mismatch or unencrypted text), return safe fallback
    return '[Unable to decrypt message]';
  }
};

export const clearSharedKeyCacheForPartner = (partnerId) => {
  if (!partnerId) return;
  const prefix = `${partnerId}:`;
  for (const key of SHARED_KEY_CACHE.keys()) {
    if (key.startsWith(prefix)) {
      SHARED_KEY_CACHE.delete(key);
    }
  }
};

export const exportUserKeyBackup = (userId) => {
  if (!userId) return null;
  const storedPriv = localStorage.getItem(`ss_e2ee_priv_${userId}`);
  const storedPub = localStorage.getItem(`ss_e2ee_pub_${userId}`);
  if (!storedPriv || !storedPub) return null;

  return JSON.stringify({
    version: 1,
    userId,
    privateJwk: JSON.parse(storedPriv),
    publicJwk: JSON.parse(storedPub),
    exportedAt: new Date().toISOString()
  }, null, 2);
};

export const importUserKeyBackup = async (userId, backupString) => {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API is not supported in this browser');
  }
  if (!userId || !backupString?.trim()) {
    throw new Error('Backup JSON is required');
  }

  const parsed = JSON.parse(backupString);
  if (!parsed?.privateJwk || !parsed?.publicJwk) {
    throw new Error('Invalid E2EE backup format');
  }

  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    parsed.privateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Verify public JWK imports cleanly too
  await window.crypto.subtle.importKey(
    'jwk',
    parsed.publicJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );

  const pubString = JSON.stringify(parsed.publicJwk);
  localStorage.setItem(`ss_e2ee_priv_${userId}`, JSON.stringify(parsed.privateJwk));
  localStorage.setItem(`ss_e2ee_pub_${userId}`, pubString);
  SHARED_KEY_CACHE.clear();

  return {
    privateKey,
    publicKeyJwkString: pubString
  };
};

const derivePasswordWrapKey = async (password, saltBytes, usages) => {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
};

export const encryptKeyBackupWithPassword = async (password, userId) => {
  if (!window.crypto?.subtle || !password || !userId) return null;
  const backupJson = exportUserKeyBackup(userId);
  if (!backupJson) return null;

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrapKey = await derivePasswordWrapKey(password, salt, ['encrypt']);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrapKey,
    new TextEncoder().encode(backupJson)
  );

  return JSON.stringify({
    v: 1,
    kdf: 'PBKDF2-SHA256',
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ct: uint8ArrayToBase64(new Uint8Array(encrypted))
  });
};

export const decryptKeyBackupWithPassword = async (password, userId, encryptedBackupString) => {
  if (!window.crypto?.subtle || !password || !userId || !encryptedBackupString) {
    throw new Error('Password and encrypted backup are required');
  }

  const envelope = typeof encryptedBackupString === 'string'
    ? JSON.parse(encryptedBackupString)
    : encryptedBackupString;

  if (!envelope?.salt || !envelope?.iv || !envelope?.ct) {
    throw new Error('Invalid encrypted key backup payload');
  }

  const salt = base64ToUint8Array(envelope.salt);
  const iv = base64ToUint8Array(envelope.iv);
  const ct = base64ToUint8Array(envelope.ct);
  const unwrapKey = await derivePasswordWrapKey(password, salt, ['decrypt']);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    unwrapKey,
    ct
  );

  const backupJson = new TextDecoder().decode(decryptedBuffer);
  return importUserKeyBackup(userId, backupJson);
};
