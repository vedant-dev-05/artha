"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { getGoalProgress } from "@/domain/selectors";
import { GoalForm } from "@/components/goals/goal-form";
import { TopBar } from "@/components/navigation/top-bar";
import { EmptyState } from "@/components/ui/states";
import Link from "next/link";

export default function EditGoalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useAppStore((state) => state.data);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const showToast = useAppStore((state) => state.showToast);
  const progress = getGoalProgress(data, params.id);

  if (!progress) {
    return (
      <>
        <TopBar title="Edit goal" backHref="/goals" />
        <main className="px-4">
          <EmptyState
            icon="search_off"
            title="Goal not found"
            description="This goal may have been removed from the demo workspace."
            action={
              <Link
                href="/goals"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2.5 font-label text-label-lg text-on-primary"
              >
                Back to goals
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const { goal, savedPaise } = progress;

  return (
    <>
      <TopBar title="Edit goal" subtitle={goal.name} backHref={`/goals/${goal.id}`} />
      <main className="flex flex-col gap-4 px-4">
        <GoalForm
          mode="edit"
          lockedSavedPaise
          initial={{
            name: goal.name,
            category: goal.category,
            targetPaise: goal.targetPaise,
            savedPaise,
            targetDate: goal.targetDate,
            priority: goal.priority,
            note: goal.note,
          }}
          submitLabel="Save changes"
          onSubmit={(input) => {
            if (!updateGoal(goal.id, input)) {
              showToast("Goal could not be updated.", "error");
              return;
            }
            showToast(`${input.name.trim()} updated`);
            router.push(`/goals/${goal.id}`);
          }}
        />
      </main>
    </>
  );
}
