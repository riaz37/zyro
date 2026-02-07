"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, FileTextIcon, Loader2Icon, Rocket } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";

interface PlanCardProps {
    content: string;
    messageId: string;
    projectId: string;
}

export function PlanCard({ content, messageId, projectId }: PlanCardProps) {
    const [isApproved, setIsApproved] = useState(false);
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const approveMutation = useMutation(trpc.message.approvePlan.mutationOptions({
        onSuccess: () => {
            setIsApproved(true);
            // Invalidate messages query to trigger refetch
            queryClient.invalidateQueries({ queryKey: trpc.message.getMany.queryKey({ projectId }) });
        },
        onError: (error) => {
            console.error("Failed to approve plan:", error);
        }
    }));

    const handleApprove = () => {
        approveMutation.mutate({
            projectId,
            messageId
        });
    };

    return (
        <Card className="w-full max-w-3xl border-2 border-primary/20 bg-muted/30">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <FileTextIcon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Implementation Plan</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="pb-4 max-h-[60vh] overflow-y-auto">
                <div className="plan-markdown">
                    <Markdown
                        components={{
                            h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 text-foreground border-b pb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-base font-medium mt-3 mb-1 text-foreground">{children}</h4>,
                            p: ({ children }) => <p className="my-2 leading-relaxed text-muted-foreground">{children}</p>,
                            ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                            code: ({ children, className }) => {
                                const isBlock = className?.includes('language-');
                                if (isBlock) {
                                    return (
                                        <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto my-2 font-mono">
                                            {children}
                                        </code>
                                    );
                                }
                                return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>;
                            },
                            pre: ({ children }) => <pre className="my-3">{children}</pre>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary/50 pl-4 my-3 italic text-muted-foreground">
                                    {children}
                                </blockquote>
                            ),
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            hr: () => <hr className="my-4 border-border" />,
                            a: ({ children, href }) => (
                                <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {content}
                    </Markdown>
                </div>
            </CardContent>

            <CardFooter className="pt-2 border-t bg-muted/20 flex justify-end gap-2">
                {isApproved ? (
                    <Button disabled variant="outline" className="gap-2 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                        Approved
                    </Button>
                ) : (
                    <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="gap-2 min-w-[140px]"
                    >
                        {approveMutation.isPending ? (
                            <>
                                <Loader2Icon className="size-4 animate-spin" />
                                Approving...
                            </>
                        ) : (
                            <>

                                Approve & Build
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
