import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"
import { hasAnyUserApiKey } from "@/lib/ai-keys/server"
import { protectedProcedure, createTRPCRouter } from "@/trpc/init"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

export const messageRoute = createTRPCRouter({
    getMany: protectedProcedure
        .input(
            z.object({
                projectId: z.string()
                    .min(1, { message: "Project is required" })
            })
        )
        .query(async ({ input, ctx }) => {
            const message = await prisma.message.findMany({
                where: {
                    projectId: input.projectId,
                    Project: {
                        userId: ctx.auth.userId
                    }
                },
                orderBy: {
                    updatedAt: "asc",
                },
                include: {
                    Fragment: true
                }
            });

            return message;
        })
    ,

    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, { message: "Message is required" })
                    .max(10000, { message: "Message is too long" }),
                projectId: z.string()
                    .min(1, { message: "Project is required" })
            })
        )
        .mutation(async ({ input, ctx }) => {
            const exitingProject = await prisma.project.findUnique({
                where: {
                    id: input.projectId,
                    userId: ctx.auth.userId
                }
            });

            if (!exitingProject) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
            }

            const hasKey = await hasAnyUserApiKey(ctx.auth.userId)
            if (!hasKey) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "No AI API key configured. Go to Settings → API Keys.",
                })
            }

            const createMessage = await prisma.message.create({
                data: {
                    content: input.value,
                    projectId: exitingProject.id,
                    role: "USER",
                    type: "RESULT",
                }
            })

            await inngest.send({
                name: "code-agent/plan",
                data: {
                    value: input.value,
                    projectId: input.projectId
                },
            })

            return createMessage;
        }),

    approvePlan: protectedProcedure
        .input(
            z.object({
                projectId: z.string().min(1),
                messageId: z.string().min(1),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const planMessage = await prisma.message.findUnique({
                where: {
                    id: input.messageId,
                    projectId: input.projectId,
                    Project: {
                        userId: ctx.auth.userId
                    }
                }
            });

            if (!planMessage) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Plan message not found" });
            }

            if (planMessage.type !== "PLAN") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Message is not a plan" });
            }

            // Trigger code generation
            await inngest.send({
                name: "code-agent/generate",
                data: {
                    value: "Generate code based on the approved plan.", // Context is handled by previous messages
                    projectId: input.projectId,
                }
            });

            return { success: true };
        }),
}) 