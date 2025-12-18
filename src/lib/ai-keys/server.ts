import "server-only"

import prisma from "@/lib/prisma"
import { decryptApiKey } from "./crypto"

export type AiProviderId = "GEMINI" | "OPENAI" | "ANTHROPIC"

export class MissingUserApiKeyError extends Error {
  code = "MISSING_USER_API_KEY" as const

  constructor(message = "Missing AI provider API key") {
    super(message)
    this.name = "MissingUserApiKeyError"
  }
}

export async function getUserDefaultProvider(userId: string): Promise<AiProviderId> {
  const settings = await prisma.userAiSettings.findUnique({
    where: { userId },
    select: { defaultProvider: true },
  })

  return (settings?.defaultProvider as AiProviderId | undefined) ?? "GEMINI"
}

export async function getDecryptedUserApiKey(userId: string): Promise<{
  provider: AiProviderId
  apiKey: string
}> {
  const provider = await getUserDefaultProvider(userId)

  const row = await prisma.userAiProviderKey.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    select: {
      iv: true,
      ciphertext: true,
      authTag: true,
      last4: true,
    },
  })

  if (!row) {
    throw new MissingUserApiKeyError(
      `No API key configured for ${provider}. Set one in Settings → API Keys.`
    )
  }

  const apiKey = decryptApiKey({
    iv: row.iv,
    ciphertext: row.ciphertext,
    authTag: row.authTag,
  })

  return { provider, apiKey }
}

export async function hasAnyUserApiKey(userId: string): Promise<boolean> {
  const count = await prisma.userAiProviderKey.count({
    where: { userId },
  })
  return count > 0
}

