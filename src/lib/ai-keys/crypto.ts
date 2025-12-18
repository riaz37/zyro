import "server-only"

import crypto from "node:crypto"

export interface EncryptedApiKey {
  iv: Uint8Array<ArrayBuffer>
  ciphertext: Uint8Array<ArrayBuffer>
  authTag: Uint8Array<ArrayBuffer>
  last4: string
}

function getEncryptionKey(): Buffer {
  const raw = process.env.API_KEY_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      "Missing API_KEY_ENCRYPTION_KEY (required to encrypt/decrypt user API keys)"
    )
  }

  const key =
    /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64")

  if (key.length !== 32) {
    throw new Error(
      `API_KEY_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length})`
    )
  }

  return key
}

export function encryptApiKey(apiKey: string): EncryptedApiKey {
  const normalized = apiKey.trim()
  if (!normalized) {
    throw new Error("API key is required")
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // 96-bit nonce recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  const ciphertext = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()
  const last4 = normalized.slice(-4)

  return {
    iv: Uint8Array.from(iv),
    ciphertext: Uint8Array.from(ciphertext),
    authTag: Uint8Array.from(authTag),
    last4,
  }
}

export function decryptApiKey(payload: {
  iv: Buffer | Uint8Array
  ciphertext: Buffer | Uint8Array
  authTag: Buffer | Uint8Array
}): string {
  const key = getEncryptionKey()

  const iv = Buffer.from(payload.iv)
  const ciphertext = Buffer.from(payload.ciphertext)
  const authTag = Buffer.from(payload.authTag)

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString("utf8")
}

