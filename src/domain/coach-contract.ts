import { z } from "zod";

const boundedText = (max: number) => z.string().min(0).max(max);

export const coachContextSchema = z.object({
  demo: z.literal(true),
  screen: boundedText(40),
  capacity: z.object({
    incomePaise: z.number().int().nonnegative(),
    essentialsPaise: z.number().int().nonnegative(),
    commitmentsPaise: z.number().int().nonnegative(),
    protectedPaise: z.number().int().nonnegative(),
    bufferPaise: z.number().int().nonnegative(),
    bufferPercent: z.number().min(0).max(100),
    capacityPaise: z.number().int().nonnegative(),
  }),
  preferences: z.object({
    tone: boundedText(40),
    savingsFlexibility: boundedText(40),
    proactiveSuggestions: z.boolean(),
    personalisedInsights: z.boolean(),
  }),
  goals: z
    .array(
      z.object({
        id: boundedText(80),
        name: boundedText(60),
        category: boundedText(40),
        priority: boundedText(20),
        status: boundedText(20),
        targetPaise: z.number().int().nonnegative(),
        savedPaise: z.number().int().nonnegative(),
        targetDate: z.string().nullable(),
        monthlyPaise: z.number().int().nonnegative().nullable(),
        projectedDate: z.string().nullable(),
        percent: z.number().min(0).max(100),
      }),
    )
    .max(30),
  activePlan: z.object({
    version: z.number().int().nullable(),
    totalPaise: z.number().int().nonnegative(),
    unallocatedPaise: z.number().int().nonnegative(),
    summary: z.string().nullable(),
    allocations: z
      .array(
        z.object({
          goalId: boundedText(80),
          contributionPaise: z.number().int().nonnegative(),
        }),
      )
      .max(30),
  }),
  spending: z.object({
    monthKey: boundedText(20),
    totalPaise: z.number().int().nonnegative(),
    transactionCount: z.number().int().nonnegative(),
    categoryTotals: z
      .array(
        z.object({
          label: boundedText(30),
          totalPaise: z.number().int().nonnegative(),
          count: z.number().int().nonnegative(),
        }),
      )
      .max(12),
    provenance: boundedText(80),
  }),
  display: z.object({
    income: boundedText(30),
    essentials: boundedText(30),
    buffer: boundedText(30),
    capacity: boundedText(30),
    planTotal: boundedText(30),
    unallocated: boundedText(30),
    spending: boundedText(30),
    goals: z
      .array(
        z.object({
          id: boundedText(80),
          target: boundedText(30),
          saved: boundedText(30),
          monthly: boundedText(30),
        }),
      )
      .max(30),
  }),
});

export const coachMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

export const coachRequestSchema = z.object({
  messages: z.array(coachMessageSchema).min(1).max(16),
  context: coachContextSchema,
});

export const geminiProposalSchema = z.object({
  type: z.literal("financial_plan_proposal"),
  summary: z.string().min(1).max(300),
  assumptions: z.array(z.string().min(1).max(240)).max(8).default([]),
  goalAllocations: z
    .array(
      z.object({
        goalId: z.string().min(1).max(80),
        contributionAmount: z.number().int().nonnegative(),
        frequency: z.literal("monthly"),
        projectedCompletionDate: z.string().max(20).optional(),
        rationale: z.string().max(240).optional(),
      }),
    )
    .max(30),
  totalContribution: z.number().int().nonnegative(),
  warnings: z.array(z.string().min(1).max(240)).max(8).default([]),
  requiresUserApproval: z.literal(true),
});

export const geminiReplySchema = z.object({
  reply: z.string().min(1).max(2000),
  proposal: geminiProposalSchema.nullable().optional(),
});

export type CoachRequest = z.infer<typeof coachRequestSchema>;
export type CoachContextPayload = z.infer<typeof coachContextSchema>;
export type GeminiProposal = z.infer<typeof geminiProposalSchema>;

export interface CoachProposal {
  summary: string;
  assumptions: string[];
  warnings: string[];
  allocations: Array<{
    goalId: string;
    contributionPaise: number;
    rationale: string;
  }>;
  totalContributionPaise: number;
}

export interface CoachResponse {
  ok: boolean;
  reply: string;
  mode: "live" | "fallback";
  aiAvailable: boolean;
  proposal: CoachProposal | null;
  notice?: string;
}
