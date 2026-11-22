"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { GoalForm } from "@/components/goals/goal-form";
import { TopBar } from "@/components/navigation/top-bar";
import { InlineMessage } from "@/components/ui/states";

export default function NewGoalPage() {
  const router = useRouter();
  const createGoal = useAppStore((state) => state.createGoal);
  const showToast = useAppStore((state) => state.showToast);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <TopBar
        title="Create a goal"
        subtitle="Tell us what you are saving toward"
        backHref="/goals"
      />
      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="info">
          Artha checks the goal against your existing goals and monthly capacity. Saving a goal never
          changes your active plan without a separate approval.
        </InlineMessage>
        <GoalForm
          key={formKey}
          mode="create"
          submitLabel="Check feasibility & plan"
          secondaryLabel="Save & add another goal"
          onSubmit={(input) => {
            const id = createGoal(input);
            if (!id) {
              showToast("Goal could not be saved. Check the highlighted fields.", "error");
              return;
            }
            showToast(`${input.name.trim()} saved`);
            router.push(`/goals/${id}/feasibility`);
          }}
          onSecondary={(input) => {
            const id = createGoal(input);
            if (!id) {
              showToast("Goal could not be saved. Check the highlighted fields.", "error");
              return;
            }
            showToast(`${input.name.trim()} saved`);
            setFormKey((value) => value + 1);
          }}
        />
      </main>
    </>
  );
}
