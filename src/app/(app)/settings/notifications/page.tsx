"use client";

import { useAppStore } from "@/store/app-store";
import type { NotificationPreferences } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

type NotificationKey = keyof NotificationPreferences;

const groups: Array<{
  label: string;
  items: Array<{ key: NotificationKey; title: string; description: string }>;
}> = [
  {
    label: "Goals & milestones",
    items: [
      {
        key: "milestones",
        title: "Goal milestone reminders",
        description: "Celebrate when you hit 25%, 50%, 75% and 100%.",
      },
      {
        key: "progress",
        title: "Progress updates",
        description: "Gentle pacing alerts when a goal drifts.",
      },
      {
        key: "savingsReminders",
        title: "Savings reminders",
        description: "A nudge on your preferred transfer day.",
      },
    ],
  },
  {
    label: "Summaries & coach",
    items: [
      {
        key: "weeklySummary",
        title: "Weekly financial summaries",
        description: "A Sunday evening recap of spending and surplus.",
      },
      {
        key: "coachCheckIns",
        title: "AI companion check-ins",
        description: "Occasional friendly tips when you open Artha.",
      },
    ],
  },
];

export default function NotificationsPage() {
  const notifications = useAppStore((state) => state.data.preferences.notifications);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const showToast = useAppStore((state) => state.showToast);

  function toggle(key: NotificationKey) {
    updatePreferences({ notifications: { ...notifications, [key]: !notifications[key] } });
    showToast("Notification preferences saved");
  }

  return (
    <>
      <TopBar
        title="Notifications"
        subtitle="Every reminder is optional & under your control"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="notifications">
          These are in-app preferences only. Artha sends no email, push notification or promotional
          messages.
        </InlineMessage>

        {groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-2">
            <h2 className="px-1 font-label text-label-md text-on-surface-variant">{group.label}</h2>
            <Card className="divide-y divide-outline-variant/40">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-title text-title-md text-on-surface">{item.title}</p>
                    <p className="font-body text-body-md text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[item.key]}
                    aria-label={`Toggle ${item.title}`}
                    onClick={() => toggle(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                      notifications[item.key] ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
                        notifications[item.key]
                          ? "translate-x-5 bg-on-primary"
                          : "translate-x-0 bg-surface-lowest"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </Card>
          </section>
        ))}

        <p className="px-1 pb-2 font-body text-body-md text-on-surface-variant">
          Turning a reminder off only changes what you see here; it does not change your goals or
          plan.
        </p>
        <div className="flex items-center gap-2 px-1 font-label text-label-md text-on-surface-variant">
          <Icon name="lock" size={15} />
          Preferences are saved in this browser.
        </div>
      </main>
    </>
  );
}
