"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayISO } from "@/domain/dates";
import {
  applyMilestoneProgress,
  buildMilestones,
  buildPlanProposal,
  calculateCapacity,
  projectedCompletionDate,
  savedByGoal,
  validateProposal,
} from "@/domain/planning";
import {
  defaultGoalIcon,
  rebuildMilestones,
  validateGoalInput,
  type GoalInput,
} from "@/domain/goals";
import {
  approvePlanVersion,
  nextPlanVersion,
  rejectPlanVersion,
} from "@/domain/plan-versions";
import { duplicateKey, existingDuplicateKeys } from "@/domain/csv-import";
import {
  buildWorkspaceFromDraft,
  createEmptyDraft,
  syncGoalsWithAspirations,
  type AspirationKey,
  type OnboardingDraft,
  type OnboardingGoalDraft,
} from "@/domain/onboarding";
import type {
  AppData,
  CategoryId,
  CompanionRole,
  FinancialPlan,
  FinancialPreferences,
  FinancialProfile,
  Goal,
  GoalProgressEvent,
  GoalStatus,
  ImportBatch,
  Milestone,
  PlanAllocation,
  Transaction,
  User,
} from "@/domain/types";
import { createSeedData, SCHEMA_VERSION } from "@/server/demo/seed";

const STORAGE_KEY = "artha-demo-v1";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface LogContributionInput {
  goalId: string;
  amountPaise: number;
  date: string;
  note?: string;
}

export interface AddTransactionInput {
  date: string;
  description: string;
  amountPaise: number;
  category: CategoryId;
  note?: string;
}

export interface CommitImportInput {
  filename: string;
  sourceLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  rows: Transaction[];
  totalRows: number;
  duplicateRows: number;
}

interface AppStore {
  data: AppData;
  hydrated: boolean;
  demoBannerDismissed: boolean;
  /** First-visit choice: null means the welcome/onboarding gate is still pending. */
  entryChoice: "demo" | "onboarding" | null;
  coachOpen: boolean;
  toast: { id: number; message: string; tone: "success" | "info" | "error" } | null;
  onboardingDraft: OnboardingDraft | null;
  logContribution: (input: LogContributionInput) => void;
  addTransaction: (input: AddTransactionInput) => void;
  commitImport: (input: CommitImportInput) => number;
  updateTransactionCategory: (transactionId: string, category: CategoryId) => void;
  updatePreferences: (patch: Partial<FinancialPreferences>) => void;
  updateUser: (patch: Partial<User>) => void;
  updateProfile: (patch: Partial<FinancialProfile>) => void;
  createGoal: (input: GoalInput) => string | null;
  updateGoal: (goalId: string, input: GoalInput) => boolean;
  setGoalStatus: (goalId: string, status: GoalStatus) => void;
  proposePlan: (options?: {
    source?: FinancialPlan["source"];
    allocations?: PlanAllocation[];
    summary?: string;
  }) => string | null;
  approvePlan: (planId: string) => boolean;
  rejectPlan: (planId: string) => boolean;
  addCoachMessage: (role: CompanionRole, content: string, metadata?: Record<string, unknown>) => void;
  clearCoachConversation: () => void;
  deleteImportBatch: (batchId: string) => number;
  deleteAllImported: () => number;
  startOnboarding: () => void;
  updateOnboardingDraft: (patch: Partial<OnboardingDraft>) => void;
  setOnboardingAspirations: (aspirations: AspirationKey[]) => void;
  updateOnboardingGoal: (index: number, patch: Partial<OnboardingGoalDraft>) => void;
  setOnboardingStep: (step: number) => void;
  acceptOnboardingPlan: () => void;
  completeOnboarding: () => void;
  cancelOnboarding: () => void;
  setEntryChoice: (choice: "demo" | "onboarding") => void;
  dismissDemoBanner: () => void;
  resetDemo: () => void;
  openCoach: () => void;
  closeCoach: () => void;
  showToast: (message: string, tone?: "success" | "info" | "error") => void;
  dismissToast: () => void;
}

const initialData = createSeedData();

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      data: initialData,
      hydrated: false,
      demoBannerDismissed: false,
      entryChoice: null,
      coachOpen: false,
      toast: null,
      onboardingDraft: null,

      logContribution: ({ goalId, amountPaise, date, note }) => {
        if (!Number.isInteger(amountPaise) || amountPaise <= 0) return;
        set((state) => {
          const goal = state.data.goals.find((candidate) => candidate.id === goalId);
          if (!goal) return state;

          const event: GoalProgressEvent = {
            id: createId("pe"),
            goalId,
            amountPaise,
            date,
            source: "manual",
            note: note?.trim() ? note.trim() : null,
            createdAt: new Date().toISOString(),
          };
          const progressEvents = [...state.data.progressEvents, event];
          const milestones = applyMilestoneProgress(state.data.milestones, progressEvents);
          const now = new Date().toISOString();
          const goals = state.data.goals.map((candidate) =>
            candidate.id === goalId ? { ...candidate, updatedAt: now } : candidate,
          );

          return {
            data: {
              ...state.data,
              goals,
              progressEvents,
              milestones,
            },
          };
        });
      },

      addTransaction: ({ date, description, amountPaise, category, note }) => {
        if (!Number.isInteger(amountPaise) || amountPaise <= 0) return;
        const trimmed = description.trim();
        if (!trimmed) return;

        set((state) => {
          const transaction: Transaction = {
            id: createId("tx"),
            date,
            description: trimmed.slice(0, 120),
            amountPaise,
            direction: "debit",
            category,
            source: "manual",
            importBatchId: null,
            note: note?.trim() ? note.trim() : null,
            categoryConfidence: "high",
            categoryEditedByUser: true,
            createdAt: new Date().toISOString(),
          };
          return {
            data: {
              ...state.data,
              transactions: [transaction, ...state.data.transactions],
            },
          };
        });
      },

      commitImport: ({
        filename,
        sourceLabel,
        periodStart,
        periodEnd,
        rows,
        totalRows,
        duplicateRows,
      }) => {
        const now = new Date().toISOString();
        const batchId = createId("batch");
        let imported = 0;

        set((state) => {
          const known = existingDuplicateKeys(state.data.transactions);
          const accepted: Transaction[] = [];
          for (const row of rows) {
            const key = duplicateKey({
              date: row.date,
              amountPaise: row.amountPaise,
              description: row.description,
              direction: row.direction,
            });
            if (known.has(key)) continue;
            known.add(key);
            accepted.push({
              ...row,
              id: createId("tx"),
              importBatchId: batchId,
              createdAt: now,
            });
          }
          imported = accepted.length;

          const batch: ImportBatch = {
            id: batchId,
            filename: filename.slice(0, 160),
            sourceLabel,
            periodStart,
            periodEnd,
            status: "imported",
            totalRows,
            importedRows: imported,
            skippedRows: totalRows - imported,
            duplicateRows: duplicateRows + (rows.length - imported),
            createdAt: now,
            completedAt: now,
          };

          return {
            data: {
              ...state.data,
              transactions: [...accepted, ...state.data.transactions],
              importBatches: [batch, ...state.data.importBatches],
            },
          };
        });

        return imported;
      },

      updateTransactionCategory: (transactionId, category) => {
        set((state) => ({
          data: {
            ...state.data,
            transactions: state.data.transactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    category,
                    categoryConfidence: "high",
                    categoryEditedByUser: true,
                  }
                : transaction,
            ),
          },
        }));
      },

      updatePreferences: (patch) => {
        set((state) => ({
          data: {
            ...state.data,
            preferences: {
              ...state.data.preferences,
              ...patch,
              notifications: {
                ...state.data.preferences.notifications,
                ...(patch.notifications ?? {}),
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateUser: (patch) => {
        set((state) => {
          const next = { ...state.data.user, ...patch };
          if (patch.displayName !== undefined && patch.avatarInitials === undefined) {
            next.avatarInitials = patch.displayName
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("") || "A";
          }
          return { data: { ...state.data, user: next } };
        });
      },

      updateProfile: (patch) => {
        set((state) => {
          const next = { ...state.data.profile, ...patch };
          const amounts = [
            next.incomeAmountPaise,
            next.essentialExpensesPaise,
            next.commitmentsPaise,
            next.protectedSpendingPaise,
            next.existingSavingsPaise,
          ];
          if (amounts.some((value) => !Number.isInteger(value) || value < 0)) return state;
          return {
            data: {
              ...state.data,
              profile: {
                ...next,
                sourceQuality: "user_confirmed",
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      createGoal: (input) => {
        const asOf = todayISO();
        if (Object.keys(validateGoalInput(input, asOf)).length > 0) return null;
        let createdId = "";
        set((state) => {
          const now = new Date().toISOString();
          const goal: Goal = {
            id: createId("goal"),
            name: input.name.trim().slice(0, 60),
            category: input.category,
            targetPaise: input.targetPaise,
            targetDate: input.targetDate,
            priority: input.priority,
            status: "active",
            icon: defaultGoalIcon(input.category),
            note: input.note?.trim() ? input.note.trim().slice(0, 240) : null,
            createdAt: now,
            updatedAt: now,
          };
          const progressEvents: GoalProgressEvent[] =
            input.savedPaise > 0
              ? [
                  {
                    id: createId("pe"),
                    goalId: goal.id,
                    amountPaise: input.savedPaise,
                    date: asOf,
                    source: "manual",
                    note: "Starting amount entered when the goal was created",
                    createdAt: now,
                  },
                ]
              : [];

          createdId = goal.id;
          return {
            data: {
              ...state.data,
              goals: [...state.data.goals, goal],
              progressEvents: [...state.data.progressEvents, ...progressEvents],
              milestones: [
                ...state.data.milestones,
                ...applyMilestoneProgress(buildMilestones(goal), progressEvents),
              ],
            },
          };
        });
        return createdId;
      },

      updateGoal: (goalId, input) => {
        const asOf = todayISO();
        if (Object.keys(validateGoalInput(input, asOf)).length > 0) return false;
        let updated = false;
        set((state) => {
          const goal = state.data.goals.find((candidate) => candidate.id === goalId);
          if (!goal) return state;
          const currentSaved = state.data.progressEvents
            .filter((event) => event.goalId === goalId)
            .reduce((total, event) => total + event.amountPaise, 0);
          if (input.savedPaise !== currentSaved) return state;

          const now = new Date().toISOString();
          const icon =
            goal.icon === defaultGoalIcon(goal.category)
              ? defaultGoalIcon(input.category)
              : goal.icon;
          const nextGoal: Goal = {
            ...goal,
            name: input.name.trim().slice(0, 60),
            category: input.category,
            targetPaise: input.targetPaise,
            targetDate: input.targetDate,
            priority: input.priority,
            icon,
            note: input.note?.trim() ? input.note.trim().slice(0, 240) : null,
            updatedAt: now,
          };

          updated = true;
          return {
            data: {
              ...state.data,
              goals: state.data.goals.map((candidate) =>
                candidate.id === goalId ? nextGoal : candidate,
              ),
              milestones: rebuildMilestones(nextGoal, state.data.milestones),
            },
          };
        });
        return updated;
      },

      setGoalStatus: (goalId, status) => {
        set((state) => ({
          data: {
            ...state.data,
            goals: state.data.goals.map((goal) =>
              goal.id === goalId
                ? { ...goal, status, updatedAt: new Date().toISOString() }
                : goal,
            ),
          },
        }));
      },

      proposePlan: (options) => {
        const asOf = todayISO();
        let createdId = "";
        set((state) => {
          const activeGoals = state.data.goals.filter((goal) => goal.status === "active");
          if (activeGoals.length === 0) return state;
          const capacity = calculateCapacity(state.data.profile, state.data.preferences);
          const base = buildPlanProposal({
            goals: activeGoals,
            events: state.data.progressEvents,
            capacity,
            asOf,
            source: options?.source ?? "companion_proposal",
            version: nextPlanVersion(state.data.plans),
          });
          const saved = savedByGoal(state.data.progressEvents);
          const allocations: PlanAllocation[] | null = options?.allocations
            ? activeGoals.map((goal) => {
                const supplied = options.allocations?.find((item) => item.goalId === goal.id);
                const amount = Number.isInteger(supplied?.contributionPaise)
                  ? Math.max(0, supplied!.contributionPaise)
                  : 0;
                return {
                  goalId: goal.id,
                  contributionPaise: amount,
                  frequency: "monthly" as const,
                  projectedCompletionDate: projectedCompletionDate(
                    goal,
                    saved[goal.id] ?? 0,
                    amount,
                    asOf,
                  ),
                  rationale: supplied?.rationale?.trim()
                    ? supplied.rationale.trim().slice(0, 200)
                    : "Adjusted in Artha",
                };
              })
            : null;

          const candidate: FinancialPlan = allocations
            ? {
                ...base,
                allocations,
                totalContributionPaise: allocations.reduce(
                  (total, allocation) => total + allocation.contributionPaise,
                  0,
                ),
                unallocatedPaise: 0,
              }
            : base;
          candidate.unallocatedPaise = Math.max(
            0,
            capacity.capacityPaise - candidate.totalContributionPaise,
          );
          if (options?.summary?.trim()) candidate.summary = options.summary.trim().slice(0, 300);
          if (!validateProposal(candidate, activeGoals, state.data.progressEvents, capacity, asOf).ok) {
            return state;
          }

          createdId = candidate.id;
          return {
            data: { ...state.data, plans: [...state.data.plans, candidate] },
          };
        });
        return createdId;
      },

      approvePlan: (planId) => {
        let changed = false;
        const now = new Date().toISOString();
        set((state) => {
          const target = state.data.plans.find((plan) => plan.id === planId);
          if (!target || target.status !== "proposed") return state;
          changed = true;
          return {
            data: {
              ...state.data,
              plans: approvePlanVersion(state.data.plans, planId, now),
            },
          };
        });
        return changed;
      },

      rejectPlan: (planId) => {
        let changed = false;
        set((state) => {
          const target = state.data.plans.find((plan) => plan.id === planId);
          if (!target || target.status !== "proposed") return state;
          changed = true;
          return {
            data: { ...state.data, plans: rejectPlanVersion(state.data.plans, planId) },
          };
        });
        return changed;
      },

      addCoachMessage: (role, content, metadata) => {
        const trimmed = content.trim();
        if (!trimmed) return;
        set((state) => {
          const now = new Date().toISOString();
          const message = {
            id: createId("msg"),
            role,
            content: trimmed.slice(0, 4000),
            createdAt: now,
            metadata: metadata ?? null,
          };
          const [first, ...rest] = state.data.conversations;
          const conversation = first
            ? {
                ...first,
                messages: [...first.messages, message],
                updatedAt: now,
              }
            : {
                id: createId("conv"),
                title: "Coach conversation",
                contextScreen: "coach",
                messages: [message],
                createdAt: now,
                updatedAt: now,
              };
          return {
            data: {
              ...state.data,
              conversations: [conversation, ...rest],
            },
          };
        });
      },

      clearCoachConversation: () => {
        set((state) => {
          const [first, ...rest] = state.data.conversations;
          if (!first) return state;
          const now = new Date().toISOString();
          return {
            data: {
              ...state.data,
              conversations: [
                { ...first, messages: [], updatedAt: now },
                ...rest,
              ],
            },
          };
        });
      },

      deleteImportBatch: (batchId) => {
        let removed = 0;
        set((state) => {
          const matching = state.data.transactions.filter(
            (transaction) => transaction.importBatchId === batchId,
          );
          removed = matching.length;
          const ids = new Set(matching.map((transaction) => transaction.id));
          return {
            data: {
              ...state.data,
              transactions: state.data.transactions.filter(
                (transaction) => !ids.has(transaction.id),
              ),
              importBatches: state.data.importBatches.filter((batch) => batch.id !== batchId),
            },
          };
        });
        return removed;
      },

      deleteAllImported: () => {
        let removed = 0;
        set((state) => {
          const imported = state.data.transactions.filter(
            (transaction) => transaction.source === "csv_import",
          );
          removed = imported.length;
          const ids = new Set(imported.map((transaction) => transaction.id));
          return {
            data: {
              ...state.data,
              transactions: state.data.transactions.filter(
                (transaction) => !ids.has(transaction.id),
              ),
              importBatches: [],
            },
          };
        });
        return removed;
      },

      // Replaying setup must not destroy the current workspace. The draft is kept
      // separate and only swapped into `data` after explicit plan approval.
      startOnboarding: () => set({ onboardingDraft: createEmptyDraft() }),

      updateOnboardingDraft: (patch) =>
        set((state) =>
          state.onboardingDraft
            ? { onboardingDraft: { ...state.onboardingDraft, ...patch } }
            : state,
        ),

      setOnboardingAspirations: (aspirations) =>
        set((state) =>
          state.onboardingDraft
            ? {
                onboardingDraft: syncGoalsWithAspirations(
                  { ...state.onboardingDraft, aspirations },
                ),
              }
            : state,
        ),

      updateOnboardingGoal: (index, patch) =>
        set((state) => {
          if (!state.onboardingDraft) return state;
          const goals = state.onboardingDraft.goals.map((goal, position) =>
            position === index ? { ...goal, ...patch } : goal,
          );
          return { onboardingDraft: { ...state.onboardingDraft, goals, planAccepted: false } };
        }),

      setOnboardingStep: (step) =>
        set((state) => ({
          data: {
            ...state.data,
            onboarding: {
              ...state.data.onboarding,
              currentStep: step,
              completedSteps: Array.from(
                new Set([...state.data.onboarding.completedSteps, ...Array.from({ length: Math.max(0, step - 1) }, (_, index) => index + 1)]),
              ).sort((a, b) => a - b),
            },
          },
        })),

      acceptOnboardingPlan: () =>
        set((state) =>
          state.onboardingDraft
            ? { onboardingDraft: { ...state.onboardingDraft, planAccepted: true } }
            : state,
        ),

      completeOnboarding: () =>
        set((state) => {
          const draft = state.onboardingDraft;
          // Never swap workspaces without explicit approval of the proposed plan.
          if (!draft || !draft.planAccepted || draft.goals.length === 0) return state;
          return {
            data: buildWorkspaceFromDraft(draft, { approved: true }),
            onboardingDraft: null,
            demoBannerDismissed: false,
            entryChoice: "demo",
          };
        }),

      cancelOnboarding: () => set({ onboardingDraft: null }),

      setEntryChoice: (choice) => set({ entryChoice: choice }),

      dismissDemoBanner: () => set({ demoBannerDismissed: true }),

      openCoach: () => set({ coachOpen: true }),
      closeCoach: () => set({ coachOpen: false }),

      showToast: (message, tone = "success") =>
        set({ toast: { id: Date.now(), message, tone } }),

      dismissToast: () => set({ toast: null }),

      resetDemo: () => {
        const seeded = createSeedData();
        set({
          data: {
            ...seeded,
            meta: { ...seeded.meta, lastResetAt: new Date().toISOString() },
          },
          demoBannerDismissed: false,
          onboardingDraft: null,
          entryChoice: "demo",
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        data: state.data,
        demoBannerDismissed: state.demoBannerDismissed,
        entryChoice: state.entryChoice,
        onboardingDraft: state.onboardingDraft,
      }),
      migrate: (persistedState, version) => {
        if (version !== SCHEMA_VERSION) {
          return {
            data: createSeedData(),
            demoBannerDismissed: false,
            entryChoice: null,
            onboardingDraft: null,
          } as unknown as AppStore;
        }
        return persistedState as AppStore;
      },
    },
  ),
);
