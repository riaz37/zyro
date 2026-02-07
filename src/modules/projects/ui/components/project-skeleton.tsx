import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeIcon, EyeIcon } from "lucide-react";

export function ProjectHeaderSkeleton() {
    return (
        <header className="p-2 flex justify-between items-center border-b h-[53px]">
            <div className="flex items-center gap-2 pl-2">
                <Skeleton className="size-[18px] rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="size-4" />
            </div>
        </header>
    )
}

export function MessagesSkeleton() {
    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
                {/* User Message Skeleton */}
                <div className="flex justify-end pl-10">
                    <Skeleton className="h-16 w-2/3 rounded-2xl rounded-tr-sm" />
                </div>

                {/* Assistant Message Skeleton */}
                <div className="flex gap-4 pr-10">
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-24 w-full rounded-2xl rounded-tl-sm" />
                    </div>
                </div>

                {/* User Message Skeleton */}
                <div className="flex justify-end pl-10">
                    <Skeleton className="h-12 w-1/2 rounded-2xl rounded-tr-sm" />
                </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="p-3 pt-1">
                <Skeleton className="h-[50px] w-full rounded-xl" />
            </div>
        </div>
    )
}

export function ProjectViewSkeleton() {
    return (
        <div className="h-screen">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    <ProjectHeaderSkeleton />
                    <MessagesSkeleton />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel
                    defaultSize={65}
                    minSize={50}
                >
                    <Tabs className="h-full gap-y-0" defaultValue="preview">
                        <div className="w-full flex items-center p-2 border-b gap-x-2">
                            <TabsList className="h-8 p-0 rounded-md border">
                                <TabsTrigger value="preview" className="rounded-md" disabled>
                                    <EyeIcon /> <span>Demo</span>
                                </TabsTrigger>

                                <TabsTrigger value="code" className="rounded-md" disabled>
                                    <CodeIcon /> <span>Code</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="ml-auto flex items-center gap-x-2">
                                <Skeleton className="size-8 rounded-full" />
                            </div>
                        </div>

                        <div className="flex-1 h-full bg-muted/20 animate-pulse" />
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
