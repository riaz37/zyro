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
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "lucide-react"
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

  const [reveal, setReveal] = useState<Record<Provider, boolean>>({
    GEMINI: false,
    OPENAI: false,
    ANTHROPIC: false,
  })

  const [editing, setEditing] = useState<Record<Provider, boolean>>({
    GEMINI: false,
    OPENAI: false,
    ANTHROPIC: false,
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
      GEMINI: { configured: false, updatedAt: null },
      OPENAI: { configured: false, updatedAt: null },
      ANTHROPIC: { configured: false, updatedAt: null },
    }
  }, [data])

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pt-24">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Bring your own API keys. Keys are stored encrypted.
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

              const showMaskedValue =
                configured && !reveal[p.id] && !editing[p.id] && !draftKeys[p.id].trim()

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {configured && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={clearKey.isPending}
                          onClick={() => {
                            clearKey.mutate({ provider: p.id })
                            setDraftKeys((prev) => ({ ...prev, [p.id]: "" }))
                            setReveal((prev) => ({ ...prev, [p.id]: false }))
                            setEditing((prev) => ({ ...prev, [p.id]: false }))
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={showMaskedValue ? "••••••••••••••••" : draftKeys[p.id]}
                        onChange={(e) =>
                          setDraftKeys((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder={p.placeholder}
                        type={showMaskedValue ? "text" : reveal[p.id] ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        className="pr-10"
                        readOnly={showMaskedValue}
                        onFocus={() => {
                          if (showMaskedValue) {
                            setEditing((prev) => ({ ...prev, [p.id]: true }))
                          }
                        }}
                        onBlur={() => {
                          if (!draftKeys[p.id].trim()) {
                            setEditing((prev) => ({ ...prev, [p.id]: false }))
                          }
                        }}
                      />

                      <button
                        type="button"
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        disabled={
                          !configured && !draftKeys[p.id].trim() && !reveal[p.id]
                        }
                        onClick={async () => {
                          // If user wants to reveal but input is empty, fetch saved key first.
                          if (!reveal[p.id] && !draftKeys[p.id].trim() && configured) {
                            const { apiKey } = await queryClient.fetchQuery(
                              trpc.apiKeys.getKey.queryOptions({ provider: p.id })
                            )
                            setDraftKeys((prev) => ({ ...prev, [p.id]: apiKey }))
                            setEditing((prev) => ({ ...prev, [p.id]: true }))
                          }

                          setReveal((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                        }}
                        aria-label={reveal[p.id] ? "Hide API key" : "Show API key"}
                        title={reveal[p.id] ? "Hide" : "Show"}
                      >
                        {reveal[p.id] ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>

                    <Button
                      disabled={setKey.isPending || !draftKeys[p.id].trim()}
                      onClick={async () => {
                        const apiKey = draftKeys[p.id].trim()
                        await setKey.mutateAsync({ provider: p.id, apiKey })
                        setDraftKeys((prev) => ({ ...prev, [p.id]: "" }))
                        setReveal((prev) => ({ ...prev, [p.id]: false }))
                        setEditing((prev) => ({ ...prev, [p.id]: false }))
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

