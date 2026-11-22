"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { buildCoachContext } from "@/domain/coach-context";
import type { CoachProposal, CoachResponse } from "@/domain/coach-contract";
import { formatINR } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

interface CoachChatProps {
  screen?: string;
  compact?: boolean;
  onNavigate?: () => void;
}

const suggestions = [
  "What does my plan leave flexible?",
  "Can I afford a bigger purchase?",
  "How would a lower income affect my goals?",
];

interface ProposalMetadata {
  proposal?: CoachProposal;
  mode?: "live" | "fallback";
  notice?: string;
}

function getProposalMetadata(value: unknown): ProposalMetadata {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return {
    proposal: record.proposal as CoachProposal | undefined,
    mode: record.mode as "live" | "fallback" | undefined,
    notice: typeof record.notice === "string" ? record.notice : undefined,
  };
}

export function CoachChat({ screen = "coach", compact = false, onNavigate }: CoachChatProps) {
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const addCoachMessage = useAppStore((state) => state.addCoachMessage);
  const clearCoachConversation = useAppStore((state) => state.clearCoachConversation);
  const proposePlan = useAppStore((state) => state.proposePlan);
  const approvePlan = useAppStore((state) => state.approvePlan);
  const showToast = useAppStore((state) => state.showToast);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = data.conversations[0];
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    addCoachMessage("user", trimmed);

    try {
      const context = buildCoachContext(data, screen);
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: [...messages, { role: "user", content: trimmed }]
            .filter((message) => message.role !== "system")
            .slice(-10)
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const result = (await response.json()) as CoachResponse & { ok: boolean };
      if (!response.ok || !result.ok) {
        throw new Error(result.notice ?? "Coach could not reply right now.");
      }
      addCoachMessage("assistant", result.reply, {
        proposal: result.proposal ?? undefined,
        mode: result.mode,
        notice: result.notice ?? undefined,
        aiAvailable: result.aiAvailable,
      });
    } catch (caught) {
      const description =
        caught instanceof Error ? caught.message : "Coach could not be reached. Please try again.";
      setError(description);
      addCoachMessage(
        "assistant",
        "I could not reach the Coach service. Your workspace has not changed. Please try again.",
        { mode: "fallback" },
      );
    } finally {
      setSending(false);
    }
  }

  function persistProposal(proposal: CoachProposal): string | null {
    return proposePlan({
      source: "companion_proposal",
      allocations: proposal.allocations.map((allocation) => ({
        goalId: allocation.goalId,
        contributionPaise: allocation.contributionPaise,
        frequency: "monthly" as const,
        projectedCompletionDate: null,
        rationale: allocation.rationale,
      })),
      summary: proposal.summary,
    });
  }

  function reviewProposal(proposal: CoachProposal) {
    const id = persistProposal(proposal);
    if (!id) {
      showToast("This proposal could not be saved. Check your active goals.", "error");
      return;
    }
    showToast("Draft saved. Review the assumptions before approving.");
    onNavigate?.();
    router.push("/plan/proposal");
  }

  function approveProposal(proposal: CoachProposal) {
    const id = persistProposal(proposal);
    if (!id || !approvePlan(id)) {
      showToast("This proposal could not be activated.", "error");
      return;
    }
    showToast("Plan approved and reflected across Home, Goals and Coach.");
    onNavigate?.();
    router.push("/plan");
  }

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "min-h-[60vh] gap-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="accent" dot={false}>
            AI companion
          </Badge>
          <span className="font-body text-label-md text-on-surface-variant">
            Context: {screen}
          </span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCoachConversation();
              showToast("Coach conversation cleared", "info");
            }}
            className="font-label text-label-md text-on-surface-variant hover:underline"
          >
            Clear chat
          </button>
        )}
      </div>

      <div
        className={`flex flex-col gap-3 overflow-y-auto pr-1 ${
          compact ? "max-h-[46vh]" : "max-h-[58vh]"
        }`}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <InlineMessage tone="info" icon="info">
            Ask about goals, timelines or spending categories. Coach uses aggregated context only and
            cannot change your plan without a separate approval.
          </InlineMessage>
        )}
        {messages.map((message) => {
          const isUser = message.role === "user";
          const meta = isUser ? {} : getProposalMetadata(message.metadata);
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[88%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`rounded-xl px-3.5 py-2.5 font-body text-body-md ${
                    isUser
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface"
                  }`}
                >
                  {message.content}
                </div>
                {!isUser && meta.mode === "fallback" && (
                  <span className="font-body text-label-md text-on-surface-variant">
                    Local demo reply
                  </span>
                )}
                {!isUser && meta.notice && (
                  <p className="font-body text-label-md text-warning">{meta.notice}</p>
                )}
                {!isUser && meta.proposal && (
                  <div className="w-full rounded-xl border border-primary/30 bg-secondary-container/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-label text-label-md text-primary">Plan proposal</p>
                      <Badge tone="accent" dot={false}>
                        Approval needed
                      </Badge>
                    </div>
                    <p className="font-body text-body-md text-on-surface">{meta.proposal.summary}</p>
                    <p className="mt-1 font-title text-title-md tabular-nums text-on-surface">
                      {formatINR(meta.proposal.totalContributionPaise)}/month
                    </p>
                    <ul className="mt-2 space-y-1">
                      {meta.proposal.allocations.map((allocation) => (
                        <li
                          key={allocation.goalId}
                          className="flex items-center justify-between gap-2 font-body text-body-md text-on-surface-variant"
                        >
                          <span className="truncate">{allocation.rationale}</span>
                          <span className="shrink-0 tabular-nums">
                            {formatINR(allocation.contributionPaise)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button fullWidth size="sm" onClick={() => approveProposal(meta.proposal!)}>
                        Approve &amp; activate
                      </Button>
                      <Button
                        fullWidth
                        size="sm"
                        variant="outline"
                        onClick={() => reviewProposal(meta.proposal!)}
                      >
                        Review before approving
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3.5 py-2.5 font-body text-body-md text-on-surface-variant">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Coach is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <InlineMessage tone="error" icon="error">
          {error}
        </InlineMessage>
      )}

      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border border-outline-variant bg-surface-lowest px-3 py-1.5 font-body text-label-md text-on-surface-variant hover:bg-surface-low"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor={`coach-input-${screen}`} className="sr-only">
          Message Artha Coach
        </label>
        <textarea
          id={`coach-input-${screen}`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          rows={compact ? 1 : 2}
          maxLength={1000}
          placeholder="Ask about a goal, plan or spending category"
          className="min-h-11 flex-1 resize-none rounded-xl border border-outline-variant bg-surface-lowest px-3 py-2.5 font-body text-body-md outline-none placeholder:text-outline focus:border-primary"
        />
        <Button type="submit" variant="icon" aria-label="Send message" disabled={sending || !input.trim()}>
          {sending ? <Icon name="hourglass_top" size={20} /> : <Icon name="send" size={20} />}
        </Button>
      </form>
      <p className="font-body text-label-md text-on-surface-variant">
        Coach never sees raw transaction descriptions, email or phone. It cannot move money or change
        a plan unless you explicitly approve a proposal.
      </p>
    </div>
  );
}
