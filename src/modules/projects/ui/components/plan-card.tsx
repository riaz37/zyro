"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, FileTextIcon, Loader2Icon } from "lucide-react";
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

    const approveMutation = useMutation(trpc.message.approvePlan.mutationOptions({
        onSuccess: () => {
            setIsApproved(true);
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

            <CardContent className="prose prose-sm dark:prose-invert max-w-none pb-4">
                <Markdown>{content}</Markdown>
            </CardContent>

            <CardFooter className="pt-2 border-t bg-muted/20 flex justify-end gap-2">
                {isApproved ? (
                    <Button disabled variant="outline" className="gap-2 text-green-600 border-green-200 bg-green-50">
                        <CheckIcon className="size-4" />
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
                                <CheckIcon className="size-4" />
                                Approve & Build
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
