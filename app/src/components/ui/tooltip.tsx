import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  style,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  // A stacked drop-shadow traces a 1px outline around the whole silhouette —
  // bubble *and* arrow — which a ring/border can't do.
  const outline =
    "drop-shadow(0 1px 0 rgba(255,255,255,.22)) drop-shadow(0 -1px 0 rgba(255,255,255,.22)) drop-shadow(1px 0 0 rgba(255,255,255,.22)) drop-shadow(-1px 0 0 rgba(255,255,255,.22))"
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        style={{ filter: outline, ...style }}
        className={cn(
          // --tt-bg / --tt-fg can be overridden via style; fall back to popover theme
          "[--tt-bg:var(--popover)] [--tt-fg:var(--popover-foreground)] bg-(--tt-bg) text-(--tt-fg) animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 z-50 max-w-64 origin-(--radix-tooltip-content-transform-origin) rounded-lg px-3 py-2 text-sm font-semibold leading-tight text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-(--tt-bg) fill-(--tt-bg) z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
