import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"
import { protectedProcedure, createTRPCRouter } from "@/trpc/init"
import { z } from "zod"
import { generateSlug } from "random-word-slugs"
import { TRPCError } from "@trpc/server"
import { hasAnyUserApiKey } from "@/lib/ai-keys/server"
import { getSandbox } from "@/inngest/utils"

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
                    name: "code-agent/plan",
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

    getSandboxStatus: protectedProcedure
        .input(
            z.object({
                fragmentId: z.string()
                    .min(1, { message: "Fragment Id is required" })
            })
        )
        .query(async ({ input, ctx }) => {
            const fragment = await prisma.fragment.findUnique({
                where: {
                    id: input.fragmentId,
                },
                select: {
                    sandboxId: true,
                    sandboxUrl: true,
                }
            });

            if (!fragment || !fragment.sandboxId) {
                return { isRunning: false, logs: "" };
            }

            try {
                const sandbox = await getSandbox(fragment.sandboxId!);

                // 1. Health check
                const checkStatus = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo '000'", {
                    timeoutMs: 5000
                }).catch(() => ({ stdout: "000" }));

                const isRunning = checkStatus.stdout.trim() === "200";

                // 2. Fetch logs
                const logsResult = await sandbox.files.read("/tmp/nextjs.log").catch(() => "");
                let logs = logsResult || "";

                // 3. Enhance logs with targeted advice if specific errors are detected
                if (!isRunning && logs) {
                    if (logs.includes("React hooks cannot be used in Server Components") ||
                        logs.includes("Event handlers cannot be passed to Client Component props")) {
                        logs += "\n\nCRITICAL ADVICE: This error usually means a 'use client' directive is missing or misplaced. Ensure 'use client'; is the very first line of any component using hooks or event handlers. Do NOT add it to layout.tsx.";
                    } else if (logs.includes("Hydration failed") || logs.includes("Text content did not match")) {
                        logs += "\n\nCRITICAL ADVICE: Hydration error detected. This often happens due to incorrect 'use client' usage or browser-only APIs (window, localStorage) being used during SSR. Use useEffect to wrap browser-only logic.";
                    }

                    // 4. Truncate logs if they are too long (keep last 2000 chars)
                    if (logs.length > 2000) {
                        logs = "..." + logs.slice(-2000);
                    }
                }

                return {
                    isRunning,
                    logs
                };
            } catch (error) {
                console.error("Error checking sandbox status:", error);
                return { isRunning: false, logs: "" };
            }
        }),
}) 