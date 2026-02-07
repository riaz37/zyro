import prisma from "@/lib/prisma";
import { getDecryptedUserApiKey, MissingUserApiKeyError } from "@/lib/ai-keys/server";
import { lastAssistantMessageContent } from "@/lib/utils";
import { FRAGMENT_TITLE_PROMPT, PLANNING_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { Sandbox } from "@e2b/code-interpreter";
import { anthropic, createAgent, createNetwork, createState, createTool, gemini, openai, type Message, type Tool } from "@inngest/agent-kit";
import { z } from "zod";
import { inngest } from "./client";
import { getSandbox } from "./utils";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState {
    summary: string;
    files: { [path: string]: string };
}

type AiProviderId = "GEMINI" | "OPENAI" | "ANTHROPIC" | "GROK" | "OPENROUTER"
type AgentPurpose = "code" | "title" | "response"

function getAgentModel(provider: AiProviderId, apiKey: string, purpose: AgentPurpose) {
    switch (provider) {
        case "GEMINI":
            return gemini({
                model: "gemini-2.0-flash",
                apiKey,
            })
        case "OPENAI":
            return openai({
                model: "gpt-4o-mini",
                apiKey,
            })
        case "GROK":
            return openai({
                // xAI Grok uses an OpenAI-compatible API surface
                baseUrl: "https://api.x.ai/v1",
                model: "grok-2-latest",
                apiKey,
            })
        case "ANTHROPIC":
            return anthropic({
                model: purpose === "code" ? "claude-3-5-sonnet-latest" : "claude-3-5-haiku-latest",
                apiKey,
                defaultParameters: {
                    max_tokens: purpose === "code" ? 4096 : 1024,
                },
            })
        case "OPENROUTER":
            return openai({
                // OpenRouter uses an OpenAI-compatible API
                baseUrl: "https://openrouter.ai/api/v1",
                model: purpose === "code"
                    ? "mistralai/devstral-2512:free"  // Free Devstral 2 for agentic coding
                    : "mistralai/mistral-7b-instruct:free",  // Free Mistral 7B for titles and responses
                apiKey,
            })
    }
}

export const codeAgentPlan = inngest.createFunction(
    { id: "code-agent-plan" },
    { event: "code-agent/plan" },
    async ({ event, step }) => {
        const project = await step.run("get-project", async () => {
            return prisma.project.findUnique({
                where: { id: event.data.projectId },
                select: { userId: true },
            })
        })

        if (!project) {
            throw new Error("Project not found")
        }

        let provider: AiProviderId
        let apiKey: string

        try {
            const result = await step.run("get-user-api-key", async () => {
                return getDecryptedUserApiKey(project.userId)
            })
            provider = result.provider
            apiKey = result.apiKey
        } catch (e) {
            if (e instanceof MissingUserApiKeyError) {
                await step.run("save-missing-api-key-message", async () => {
                    return prisma.message.create({
                        data: {
                            projectId: event.data.projectId,
                            content: e.message,
                            role: "ASSISTANT",
                            type: "ERROR",
                        },
                    })
                })
                return {
                    summary: "Missing API Key"
                }
            }
            throw e
        }

        const previousMessage = await step.run("get-previous-message", async () => {
            const formattedMessage: Message[] = []
            const messages = await prisma.message.findMany({
                where: { projectId: event.data.projectId },
                orderBy: { createdAt: "desc" },
                take: 5
            })
            for (const message of messages) {
                if (!message.content) continue;
                formattedMessage.push({
                    type: "text",
                    role: message.role === "ASSISTANT" ? "assistant" : "user",
                    content: message.content
                })
            }
            return formattedMessage.reverse();
        })

        const state = createState<AgentState>(
            { summary: "", files: {} },
            { messages: previousMessage }
        )

        const planAgent = createAgent<AgentState>({
            name: "plan-agent",
            description: "A planning agent",
            system: PLANNING_PROMPT,
            model: getAgentModel(provider, apiKey, "code"),
            lifecycle: {
                onResponse: async ({ result, network }) => {
                    const lastAssistantTextMessageText = lastAssistantMessageContent(result);

                    if (lastAssistantTextMessageText && network) {
                        network.state.data.summary = lastAssistantTextMessageText
                    }

                    return result
                },
            }
        });

        const network = createNetwork<AgentState>({
            name: "plan-agent-network",
            agents: [planAgent],
            maxIter: 1,
            defaultState: state,
        })

        const result = await network.run(event.data.value, { state })

        const planContent = result.state.data.summary || "Failed to generate plan.";

        await step.run("save-plan", async () => {
            return prisma.message.create({
                data: {
                    projectId: event.data.projectId,
                    content: planContent,
                    role: "ASSISTANT",
                    type: "PLAN",
                }
            })
        })

        return { summary: planContent }
    }
)

export const codeAgentGenerate = inngest.createFunction(
    { id: "code-agent-generate" },
    { event: "code-agent/generate" },
    async ({ event, step }) => {
        const project = await step.run("get-project", async () => {
            return prisma.project.findUnique({
                where: { id: event.data.projectId },
                select: { userId: true },
            })
        })

        if (!project) {
            throw new Error("Project not found")
        }

        let provider: AiProviderId
        let apiKey: string

        try {
            const result = await step.run("get-user-api-key", async () => {
                return getDecryptedUserApiKey(project.userId)
            })
            provider = result.provider
            apiKey = result.apiKey
        } catch (e) {
            if (e instanceof MissingUserApiKeyError) {
                return { title: "Error", summary: "Missing API Key", url: "", files: {} }
            }
            throw e
        }

        const sandboxId = await step.run("get-sandbox", async () => {
            const sandbox = await Sandbox.create("zyro-nextjs-riaz37");
            await sandbox.setTimeout(SANDBOX_TIMEOUT);
            return sandbox.sandboxId;
        });

        const previousMessage = await step.run("get-previous-message", async () => {
            const formattedMessage: Message[] = []
            const messages = await prisma.message.findMany({
                where: { projectId: event.data.projectId },
                orderBy: { createdAt: "desc" },
                take: 10
            })
            for (const message of messages) {
                if (!message.content) continue;
                formattedMessage.push({
                    type: "text",
                    role: message.role === "ASSISTANT" ? "assistant" : "user",
                    content: message.content
                })
            }
            return formattedMessage.reverse();
        })

        const state = createState<AgentState>(
            {
                summary: "",
                files: {}
            },
            {
                messages: previousMessage
            }
        )

        const codeAgent = createAgent<AgentState>({
            name: "code-agent",
            description: "An expert code agent",
            system: PROMPT,
            model: getAgentModel(provider, apiKey, "code"),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string(),
                    }),
                    handler: async ({ command }, { step }) => {
                        return await step?.run("terminal", async () => {
                            const buffers = { stdout: "", stderr: "" };

                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data;
                                    }
                                })

                                return result.stdout;
                            } catch (error) {
                                console.error(
                                    `Command failed: ${error} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}`
                                );
                            }
                        })
                    }
                }),
                createTool({
                    name: "createOrUpdateFile",
                    description: "Create or update a file in the sandbox",
                    parameters: z.object({
                        files: z.array(
                            z.object({
                                path: z.string(),
                                content: z.string(),
                            }),
                        )
                    }),
                    handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
                        const newFiles = await step?.run("createOrUpdateFile", async () => {
                            try {
                                const updateFiles = network.state.data.files || {}
                                const sandbox = await getSandbox(sandboxId);
                                for (const file of files) {
                                    await sandbox.files.write(file.path, file.content);
                                    updateFiles[file.path] = file.content
                                }

                                return updateFiles
                            } catch (error) {
                                return "Error: " + error
                            }
                        })

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles
                        }
                    }
                }),
                createTool({
                    name: "readFile",
                    description: "Read a file from the sandbox",
                    parameters: z.object({
                        files: z.array(z.string()),
                    }),
                    handler: async ({ files }, { step }) => {
                        return await step?.run("readFile", async () => {
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const contents = []
                                for (const file of files) {
                                    const fileContent = await sandbox.files.read(file)
                                    contents.push({ path: file, content: fileContent })
                                }

                                return JSON.stringify(contents)
                            } catch (error) {
                                return "Error: " + error
                            }
                        })
                    }
                }),

            ],
            lifecycle: {
                onResponse: async ({ result, network }) => {
                    const lastAssistantTextMessageText = lastAssistantMessageContent(result);

                    if (lastAssistantTextMessageText && network) {
                        if (lastAssistantTextMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantTextMessageText
                        }
                    }

                    return result
                },
            }
        });

        const network = createNetwork<AgentState>({
            name: "codding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            defaultState: state,
            router: async ({ network }) => {
                const summary = network.state.data.summary

                if (summary) {
                    return;
                }

                return codeAgent;
            }
        })

        const result = await network.run(event.data.value, { state })


        const fragmentTitleGenerator = createAgent({
            name: "fragment-title-generator",
            description: "A fragment title generator",
            system: FRAGMENT_TITLE_PROMPT,
            model: getAgentModel(provider, apiKey, "title"),
        });

        const responseGenerator = createAgent({
            name: "response-generator",
            description: "A response generator",
            system: RESPONSE_PROMPT,
            model: getAgentModel(provider, apiKey, "response"),
        });

        const { output: fragmentTitleOutput } = await step.run("generate-fragment-title", async () => {
            return await fragmentTitleGenerator.run(result.state.data.summary);
        });
        const { output: responseOutput } = await step.run("generate-response", async () => {
            return await responseGenerator.run(result.state.data.summary);
        });

        const generateFragmentTitle = () => {
            const firstOutput = fragmentTitleOutput[0];

            if (firstOutput?.type === "text") {
                return firstOutput.content || "Fragment";
            }

            if (firstOutput?.type === "tool_result") {
                const content = firstOutput.content;
                if (Array.isArray(content)) {
                    return content[0]?.content || "Fragment";
                }
                return content || "Fragment";
            }

            return "Fragment";
        };

        const generateResponse = () => {
            const firstOutput = responseOutput[0];

            if (firstOutput?.type === "text") {
                return firstOutput.content || "Here you go!";
            }

            if (firstOutput?.type === "tool_result") {
                const content = firstOutput.content;
                if (Array.isArray(content)) {
                    return content[0]?.content || "Here you go!";
                }
                return content || "Here you go!";
            }

            return "Here you go!";
        };


        const isError =
            !result.state.data.summary ||
            Object.keys(result.state.data.files).length === 0

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            const rawHost = sandbox.getHost(3000);
            const host = rawHost.replace(/^https?:\/\//, '');
            const sandboxUrl = `https://${host}`;

            try {
                // 1. Initial health check (very lenient)
                const checkStatus = await sandbox.commands.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo '000'", {
                    timeoutMs: 10000
                }).catch(() => ({ stdout: "000" }));

                if (checkStatus.stdout.trim() === "200") {
                    return sandboxUrl;
                }

                // 2. Attempt to start server (no pkill, just start)
                // We use || true to ensure the command itself doesn't crash the step
                await sandbox.commands.run("cd /home/user && (npm run dev > /tmp/nextjs.log 2>&1 &) || true", {
                    timeoutMs: 15000
                }).catch(e => console.log("Start command skipped or failed:", e.message));

                // 3. Short wait and return
                // We don't poll indefinitely here to avoid Inngest step timeouts
                await new Promise(resolve => setTimeout(resolve, 3000));

                return sandboxUrl;
            } catch (error) {
                console.error("Error in health check logic (continuing with fallback):", error);
                return sandboxUrl;
            }
        });

        await step.run("save-result", async () => {
            if (isError) {
                console.error(result.state.data.summary)
                return await prisma.message.create({
                    data: {
                        projectId: event.data.projectId,
                        content: "Something went wrong. Please try again.",
                        role: "ASSISTANT",
                        type: "ERROR",
                    }
                })
            }

            return prisma.message.create({
                data: {
                    projectId: event.data.projectId,
                    content: generateResponse(),
                    role: "ASSISTANT",
                    type: "RESULT",
                    Fragment: {
                        create: {
                            sandboxUrl: sandboxUrl,
                            sandboxId: sandboxId,
                            title: generateFragmentTitle(),
                            files: result.state.data.files
                        }
                    }
                }
            })
        })

        return {
            url: sandboxUrl,
            title: "Fragment",
            files: result.state.data.files,
            summary: result.state.data.summary
        };
    }
);
