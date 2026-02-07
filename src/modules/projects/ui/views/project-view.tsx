"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import { FileExplorer } from "@/components/file-explorer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Fragment } from "@/generated/prisma";
import { CodeIcon, EyeIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { FragmentWeb } from "../components/fragment-web";
import { MessagesContainer } from "../components/messages-container";
import { MessagesSkeleton, ProjectHeaderSkeleton } from "../components/project-skeleton";
import { ProjectHeader } from "../components/project-header";
import { UserControl } from "@/components/user-control";
import { ErrorBoundary } from "react-error-boundary";

interface props {
    projectId: string
}

export function ProjectView({ projectId }: props) {
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    const [tabState, setTabState] = useState<"preview" | "code">("preview");

    return (
        <div className="h-screen">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    <ErrorBoundary fallback={<p>Project header error</p>}>
                        <Suspense fallback={<ProjectHeaderSkeleton />}>
                            <ProjectHeader projectId={projectId} />
                        </Suspense>
                    </ErrorBoundary>

                    <ErrorBoundary fallback={<p>Messages container error</p>}>
                        <Suspense fallback={<MessagesSkeleton />}>
                            <MessagesContainer
                                projectId={projectId}
                                activeFragment={activeFragment}
                                setActiveFragment={setActiveFragment}
                            />
                        </Suspense>
                    </ErrorBoundary>
                </ResizablePanel>

                <ResizableHandle className="hover:bg-primary transition-colors" />

                <ResizablePanel
                    defaultSize={65}
                    minSize={50}
                >
                    <Tabs
                        className="h-full gap-y-0"
                        defaultValue="preview"
                        value={tabState}
                        onValueChange={(value) => setTabState(value as "preview" | "code")}
                    >
                        <div className="w-full flex items-center p-2 border-b gap-x-2">
                            <TabsList className="h-8 p-0 rounded-md border">
                                <TabsTrigger value="preview" className="rounded-md">
                                    <EyeIcon /> <span>Demo</span>
                                </TabsTrigger>

                                <TabsTrigger value="code" className="rounded-md">
                                    <CodeIcon /> <span>Code</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="ml-auto flex items-center gap-x-2">
                                <UserControl />
                            </div>
                        </div>

                        <TabsContent value="preview">
                            {!!activeFragment && (
                                <FragmentWeb
                                    data={activeFragment}
                                    projectId={projectId}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="code" className="min-h-0">
                            {!!activeFragment?.files && (
                                <FileExplorer
                                    files={activeFragment.files as { [key: string]: string }}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
} 