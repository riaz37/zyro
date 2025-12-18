import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"
import { protectedProcedure, createTRPCRouter } from "@/trpc/init"
import { z } from "zod"
import { generateSlug } from "random-word-slugs"
import { TRPCError } from "@trpc/server"
import { hasAnyUserApiKey } from "@/lib/ai-keys/server"

export const projectRoute = createTRPCRouter({
    getOne: protectedProcedure
        .input(
            z.object({
                id: z.string()
                    .min(1, { message: "Id is required" })
            })
        )
        .query(async ({ input, ctx }) => {
            const exitingProjects = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId
                }
            });

            if (!exitingProjects) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
            }

            return exitingProjects;
        }),

    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, { message: "Value is required" })
                    .max(10000, { message: "Value is too long" }),
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                console.log("Starting project creation for user:", ctx.auth.userId);

                const hasKey = await hasAnyUserApiKey(ctx.auth.userId)
                if (!hasKey) {
                    throw new TRPCError({
                        code: "PRECONDITION_FAILED",
                        message: "No AI API key configured. Go to Settings → API Keys.",
                    })
                }

                console.log("Creating project in database...");
                const createProject = await prisma.project.create({
                    data: {
                        userId: ctx.auth.userId,
                        name: generateSlug(2, {
                            format: "kebab",
                        }),
                        messages: {
                            create: {
                                content: input.value,
                                role: "USER",
                                type: "RESULT",
                            }
                        }
                    }
                })
                console.log("Project created successfully:", createProject.id);

                console.log("Sending Inngest event...");
                await inngest.send({
                    name: "code-agent/run",
                    data: {
                        value: input.value,
                        projectId: createProject.id
                    },
                })
                console.log("Inngest event sent successfully");

                return createProject;
            } catch (error) {
                console.error("Error in project creation:", error);

                // Re-throw the original error for debugging
                throw error;
            }
        }),

    getMany: protectedProcedure
        .query(async ({ ctx }) => {
            const projects = await prisma.project.findMany({
                where: {
                    userId: ctx.auth.userId
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return projects;
        }),
}) 