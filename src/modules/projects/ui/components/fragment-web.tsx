import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import type { Fragment } from "@/generated/prisma"
import { ExternalLinkIcon, RefreshCwIcon, WrenchIcon } from "lucide-react"
import { useState } from "react"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

interface props {
    data: Fragment
    projectId: string
}

export function FragmentWeb({ data, projectId }: props) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [fragmentKey, setFragmentKey] = useState(0);
    const [copied, setCopied] = useState(false);

    const { data: status } = useQuery(
        trpc.projects.getSandboxStatus.queryOptions({
            fragmentId: data.id
        }, {
            refetchInterval: (query) => {
                if (query.state.data?.isRunning) return false;
                return 5000;
            }
        })
    )

    const createMessage = useMutation(trpc.message.create.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries(
                trpc.message.getMany.queryOptions({
                    projectId: projectId
                })
            )
        },
        onError: (error) => {
            toast.error(error.message);
        }
    }))

    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
    }

    const onFix = async () => {
        if (!status?.logs) {
            toast.error("No logs found to fix");
            return;
        }

        await createMessage.mutateAsync({
            projectId: projectId,
            value: `The project has issues. Please fix them based on these logs:\n\n\`\`\`\n${status.logs}\n\`\`\``,
        })

        toast.success("Fix request sent");
    }

    const handleCopy = () => {
        const secureUrl = data.sandboxUrl.replace(/^http:\/\//, 'https://');
        navigator.clipboard.writeText(secureUrl);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                <Hint text="Refresh" side="bottom" algin="start">
                    <Button size="sm" variant="outline" onClick={onRefresh}>
                        <RefreshCwIcon />
                    </Button>
                </Hint>

                <Hint text="Copy URL" side="bottom" algin="center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        className="flex-1 justify-start text-start font-normal"
                        disabled={!data.sandboxUrl || copied}
                    >
                        <span className="truncate">
                            {data.sandboxUrl}
                        </span>
                    </Button>
                </Hint>

                <Hint text="Open in new tab" side="bottom" algin="start">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!data.sandboxUrl}
                        onClick={() => {
                            if (!data.sandboxUrl) return;
                            const secureUrl = data.sandboxUrl.replace(/^http:\/\//, 'https://');
                            window.open(secureUrl, "_blank");
                        }}
                    >
                        <ExternalLinkIcon />
                    </Button>
                </Hint>

                {status && !status.isRunning && (
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onFix}
                        disabled={createMessage.isPending}
                        className="ml-auto"
                    >
                        <WrenchIcon className="size-4 mr-2" />
                        Fix Issue
                    </Button>
                )}
            </div>

            <iframe
                key={fragmentKey}
                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
                loading="lazy"
                src={data.sandboxUrl.replace(/^http:\/\//, 'https://')}
            />
        </div>
    )
}