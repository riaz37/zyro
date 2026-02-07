import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { codeAgentPlan, codeAgentGenerate } from "@/inngest/functions";

// Create an API that serves the plan and generate functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        codeAgentPlan,
        codeAgentGenerate,
    ],
});
