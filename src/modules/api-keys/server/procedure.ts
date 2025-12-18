import prisma from "@/lib/prisma"
import { encryptApiKey } from "@/lib/ai-keys/crypto"
import { decryptApiKey } from "@/lib/ai-keys/crypto"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { z } from "zod"
import { TRPCError } from "@trpc/server"

const providerSchema = z.enum(["GEMINI", "OPENAI", "ANTHROPIC", "GROK"])

export const apiKeysRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId

    const [settings, keys] = await Promise.all([
      prisma.userAiSettings.findUnique({
        where: { userId },
        select: { defaultProvider: true },
      }),
      prisma.userAiProviderKey.findMany({
        where: { userId },
        select: { provider: true, updatedAt: true },
      }),
    ])

    const byProvider = new Map<
      "GEMINI" | "OPENAI" | "ANTHROPIC" | "GROK",
      { updatedAt: Date }
    >()

    for (const k of keys) {
      byProvider.set(k.provider as "GEMINI" | "OPENAI" | "ANTHROPIC" | "GROK", {
        updatedAt: k.updatedAt,
      })
    }

    const pack = (provider: "GEMINI" | "OPENAI" | "ANTHROPIC" | "GROK") => {
      const v = byProvider.get(provider)
      return v
        ? { configured: true, updatedAt: v.updatedAt }
        : { configured: false, updatedAt: null }
    }

    return {
      defaultProvider: (settings?.defaultProvider as
        | "GEMINI"
        | "OPENAI"
        | "ANTHROPIC"
        | undefined) ?? "GEMINI",
      providers: {
        GEMINI: pack("GEMINI"),
        OPENAI: pack("OPENAI"),
        ANTHROPIC: pack("ANTHROPIC"),
        GROK: pack("GROK"),
      },
    }
  }),

  getKey: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const row = await prisma.userAiProviderKey.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: input.provider,
          },
        },
        select: {
          iv: true,
          ciphertext: true,
          authTag: true,
        },
      })

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No API key configured for this provider.",
        })
      }

      const apiKey = decryptApiKey({
        iv: row.iv,
        ciphertext: row.ciphertext,
        authTag: row.authTag,
      })

      return { apiKey }
    }),

  setKey: protectedProcedure
    .input(
      z.object({
        provider: providerSchema,
        apiKey: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      let encrypted
      try {
        encrypted = encryptApiKey(input.apiKey)
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Invalid API key",
        })
      }

      await prisma.userAiProviderKey.upsert({
        where: {
          userId_provider: {
            userId,
            provider: input.provider,
          },
        },
        create: {
          userId,
          provider: input.provider,
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
          authTag: encrypted.authTag,
          last4: encrypted.last4,
        },
        update: {
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
          authTag: encrypted.authTag,
          last4: encrypted.last4,
        },
      })

      // Ensure settings row exists (don’t overwrite if it already does)
      await prisma.userAiSettings.upsert({
        where: { userId },
        create: { userId, defaultProvider: input.provider },
        update: {},
      })

      return { ok: true }
    }),

  clearKey: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      await prisma.userAiProviderKey.deleteMany({
        where: { userId, provider: input.provider },
      })

      return { ok: true }
    }),

  setDefaultProvider: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      await prisma.userAiSettings.upsert({
        where: { userId },
        create: { userId, defaultProvider: input.provider },
        update: { defaultProvider: input.provider },
      })

      return { ok: true }
    }),
})

