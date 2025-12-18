"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDownIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Provider = "GEMINI" | "OPENAI" | "ANTHROPIC"

const PROVIDERS: Array<{
  id: Provider
  label: string
  placeholder: string
}> = [
  { id: "GEMINI", label: "Google Gemini", placeholder: "Paste your Gemini API key" },
  { id: "OPENAI", label: "OpenAI", placeholder: "Paste your OpenAI API key" },
  { id: "ANTHROPIC", label: "Anthropic", placeholder: "Paste your Anthropic API key" },
]

export default function ApiKeysSettingsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(trpc.apiKeys.getStatus.queryOptions())

  const [draftKeys, setDraftKeys] = useState<Record<Provider, string>>({
    GEMINI: "",
    OPENAI: "",
    ANTHROPIC: "",
  })

  const setKey = useMutation(
    trpc.apiKeys.setKey.mutationOptions({
      onSuccess: async () => {
        toast.success("API key saved")
        await queryClient.invalidateQueries(trpc.apiKeys.getStatus.queryOptions())
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const clearKey = useMutation(
    trpc.apiKeys.clearKey.mutationOptions({
      onSuccess: async () => {
        toast.success("API key cleared")
        await queryClient.invalidateQueries(trpc.apiKeys.getStatus.queryOptions())
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const setDefaultProvider = useMutation(
    trpc.apiKeys.setDefaultProvider.mutationOptions({
      onSuccess: async () => {
        toast.success("Default provider updated")
        await queryClient.invalidateQueries(trpc.apiKeys.getStatus.queryOptions())
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const defaultProvider = (data?.defaultProvider ?? "GEMINI") as Provider

  const providerStatus = useMemo(() => {
    return data?.providers ?? {
      GEMINI: { configured: false, last4: null, updatedAt: null },
      OPENAI: { configured: false, last4: null, updatedAt: null },
      ANTHROPIC: { configured: false, last4: null, updatedAt: null },
    }
  }, [data])

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pt-24">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Bring your own API keys. Keys are stored encrypted and are never shown
            again after saving.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-provider">Default provider</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  id="default-provider"
                  disabled={setDefaultProvider.isPending || isLoading}
                  className={cn(
                    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <span>
                    {PROVIDERS.find((p) => p.id === defaultProvider)?.label ??
                      defaultProvider}
                  </span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="start"
                sideOffset={6}
                avoidCollisions={false}
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                <DropdownMenuRadioGroup
                  value={defaultProvider}
                  onValueChange={(value) =>
                    setDefaultProvider.mutate({ provider: value as Provider })
                  }
                >
                  {PROVIDERS.map((p) => (
                    <DropdownMenuRadioItem key={p.id} value={p.id}>
                      {p.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-6">
            {PROVIDERS.map((p) => {
              const status = providerStatus[p.id]
              const configured = status?.configured ?? false
              const last4 = status?.last4 ?? null

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {configured
                          ? `Configured (••••${last4})`
                          : "Not configured yet"}
                      </p>
                    </div>

                    {configured && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={clearKey.isPending}
                        onClick={() => clearKey.mutate({ provider: p.id })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={draftKeys[p.id]}
                      onChange={(e) =>
                        setDraftKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder={p.placeholder}
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                    />

                    <Button
                      disabled={setKey.isPending || !draftKeys[p.id].trim()}
                      onClick={async () => {
                        const apiKey = draftKeys[p.id].trim()
                        await setKey.mutateAsync({ provider: p.id, apiKey })
                        setDraftKeys((prev) => ({ ...prev, [p.id]: "" }))
                      }}
                    >
                      {configured ? "Replace" : "Save"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

