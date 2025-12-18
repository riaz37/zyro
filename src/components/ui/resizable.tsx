"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import {
  Group as ResizableGroup,
  Panel as ResizablePanelPrimitive,
  Separator as ResizableSeparator,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

type GroupOrientation = React.ComponentProps<typeof ResizableGroup>["orientation"]

function ResizablePanelGroup({
  className,
  direction,
  orientation,
  ...props
}: Omit<React.ComponentProps<typeof ResizableGroup>, "orientation"> & {
  /**
   * Back-compat for react-resizable-panels v3 API (`direction`).
   * v4 renamed this prop to `orientation`.
   */
  direction?: GroupOrientation
  orientation?: GroupOrientation
}) {
  return (
    <ResizableGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col data-[panel-group-orientation=vertical]:flex-col data-[orientation=vertical]:flex-col",
        className
      )}
      orientation={orientation ?? direction}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePanelPrimitive>) {
  return <ResizablePanelPrimitive data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableSeparator> & {
  withHandle?: boolean
}) {
  return (
    <ResizableSeparator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-orientation=vertical]:h-px data-[panel-group-orientation=vertical]:w-full data-[panel-group-orientation=vertical]:after:left-0 data-[panel-group-orientation=vertical]:after:h-1 data-[panel-group-orientation=vertical]:after:w-full data-[panel-group-orientation=vertical]:after:translate-x-0 data-[panel-group-orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90 [&[data-panel-group-orientation=vertical]>div]:rotate-90 [&[data-orientation=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizableSeparator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
