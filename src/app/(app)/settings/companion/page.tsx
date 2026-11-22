"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import type { CompanionTone } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineMessage } from "@/components/ui/states";

type ToggleKey = "proactiveSuggestions" | "contextualBubbles" | "personalisedInsights";

const toneOptions: Array<{ value: CompanionTone; title: string; description: string }> = [
  {
    value: "warm",
    title: "Warm & encouraging",
    description: "Friendly check-ins, gentle nudges and small wins.",
  },
  {
    value: "concise",
    title: "Concise & direct",
    description: "Numbers-first summaries with clear action steps.",
  },
  {
    value: "on_demand",
    title: "On-demand only",
    description: "Coach stays quiet unless you tap to ask.",
  },
];

const toggles: Array<{ key: ToggleKey; title: string; description: string }> = [
  {
    key: "proactiveSuggestions",
    title: "Proactive suggestions",
    description: "Spot surplus funds and milestone opportunities.",
  },
  {
    key: "contextualBubbles",
    title: "Contextual screen bubbles",
    description: "Small dismissible tips near the Coach icon.",
  },
  {
    key: "personalisedInsights",
    title: "Personalised spending insights",
    description: "Use imported CSV patterns in Coach advice.",
  },
];

export default function CompanionPreferencesPage() {
  const preferences = useAppStore((state) => state.data.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const showToast = useAppStore((state) => state.showToast);

  function selectTone(value: CompanionTone) {
    updatePreferences({ companionTone: value });
    showToast("Companion preferences saved");
  }

  function toggle(key: ToggleKey) {
    updatePreferences({ [key]: !preferences[key] });
    showToast("Companion preferences saved");
  }

  return (
    <>
      <TopBar
        title="Companion preferences"
        subtitle="Shape how Coach supports you"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <Card className="flex items-center gap-3 bg-secondary-container/60 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-lowest text-primary">
            <Icon name="auto_awesome" size={24} />
          </span>
          <div className="min-w-0">
            <h2 className="font-title text-title-md text-on-surface">Artha Coach</h2>
            <p className="font-body text-body-md text-on-surface-variant">
              Supportive, clear-headed guidance tailored to your goals and cashflow.
            </p>
          </div>
        </Card>

        <InlineMessage tone="info" icon="lock">
          Coach is optional. No API key is stored in the browser; a Gemini key, if configured, stays
          on the server. Raw transaction descriptions, email and phone are never sent to Coach.
        </InlineMessage>

        <section aria-label="Guidance controls" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">
            Guidance &amp; prompts
          </h2>
          <Card className="divide-y divide-outline-variant/40">
            {toggles.map((item) => (
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
                  aria-checked={preferences[item.key]}
                  aria-label={`Toggle ${item.title}`}
                  onClick={() => toggle(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    preferences[item.key] ? "bg-primary" : "bg-surface-container-high"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
                      preferences[item.key]
                        ? "translate-x-5 bg-on-primary"
                        : "translate-x-0 bg-surface-lowest"
                    }`}
                  />
                </button>
              </div>
            ))}
          </Card>
        </section>

        <section aria-label="Communication style" className="flex flex-col gap-2">
          <h2 className="px-1 font-label text-label-md text-on-surface-variant">
            Communication style
          </h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Communication style">
            {toneOptions.map((option) => {
              const selected = preferences.companionTone === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectTone(option.value)}
                  className={`flex items-start justify-between gap-3 rounded-lg p-4 text-left transition-colors ${
                    selected
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant/70 bg-surface-lowest text-on-surface"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-title text-title-md">{option.title}</span>
                    <span
                      className={`block font-body text-body-md ${
                        selected ? "text-on-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      {option.description}
                    </span>
                  </span>
                  <Icon
                    name={selected ? "check_circle" : "radio_button_unchecked"}
                    size={20}
                    className="shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </section>

        <p className="px-1 pb-2 font-body text-body-md text-on-surface-variant">
          Changes apply immediately in this browser. Coach is never required to plan, track or
          adjust your goals. See also{" "}
          <Link href="/settings/notifications" className="text-primary hover:underline">
            notification preferences
          </Link>
          .
        </p>
      </main>
    </>
  );
}
