"use client";

import { useState, type FormEvent } from "react";
import { useAppStore } from "@/store/app-store";
import type { LifeStage } from "@/domain/types";
import { TopBar } from "@/components/navigation/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineMessage } from "@/components/ui/states";

const lifeStages: Array<{ value: LifeStage; label: string }> = [
  { value: "student", label: "College student" },
  { value: "intern", label: "Intern" },
  { value: "freelancer", label: "Freelancer" },
  { value: "working_professional", label: "Working professional" },
  { value: "other", label: "Other" },
];

const fieldClass =
  "min-h-12 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 font-body text-body-lg text-on-surface outline-none placeholder:text-outline focus:border-primary";

export default function PersonalInfoPage() {
  const user = useAppStore((state) => state.data.user);
  const updateUser = useAppStore((state) => state.updateUser);
  const showToast = useAppStore((state) => state.showToast);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [age, setAge] = useState(user.age === null ? "" : String(user.age));
  const [lifeStage, setLifeStage] = useState<LifeStage>(user.lifeStage);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const name = displayName.trim();
    const emailValue = email.trim();
    const ageValue = age.trim();

    if (!name) nextErrors.displayName = "Enter your full name.";
    if (!emailValue) nextErrors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!ageValue) nextErrors.age = "Enter your age.";
    else if (!/^\d+$/.test(ageValue) || Number(ageValue) < 10 || Number(ageValue) > 120) {
      nextErrors.age = "Age must be a whole number between 10 and 120.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateUser({
      displayName: name,
      email: emailValue,
      phone: phone.trim() || null,
      age: Number(ageValue),
      lifeStage,
    });
    showToast("Personal information saved");
  }

  return (
    <>
      <TopBar
        title="Personal info"
        subtitle="Keep your details up to date"
        backHref="/settings"
      />

      <main className="flex flex-col gap-4 px-4">
        <InlineMessage tone="info" icon="info">
          Demo profile only. These details stay in this browser; photo and password controls are not
          part of this prototype.
        </InlineMessage>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4">
            <div className="space-y-1.5">
              <label htmlFor="personal-name" className="font-label text-label-lg text-on-surface">
                Full name
              </label>
              <input
                id="personal-name"
                value={displayName}
                maxLength={60}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                aria-invalid={Boolean(errors.displayName)}
                className={fieldClass}
              />
              {errors.displayName && (
                <p role="alert" className="font-body text-body-md text-error">
                  {errors.displayName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="personal-email" className="font-label text-label-lg text-on-surface">
                Email address
              </label>
              <input
                id="personal-email"
                type="email"
                value={email}
                maxLength={120}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                className={fieldClass}
              />
              {errors.email && (
                <p role="alert" className="font-body text-body-md text-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="personal-phone" className="font-label text-label-lg text-on-surface">
                Phone number <span className="text-on-surface-variant">(optional)</span>
              </label>
              <input
                id="personal-phone"
                type="tel"
                value={phone}
                maxLength={20}
                autoComplete="tel"
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="personal-age" className="font-label text-label-lg text-on-surface">
                Age
              </label>
              <input
                id="personal-age"
                inputMode="numeric"
                value={age}
                maxLength={3}
                onChange={(event) => setAge(event.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g. 24"
                aria-invalid={Boolean(errors.age)}
                className={fieldClass}
              />
              {errors.age && (
                <p role="alert" className="font-body text-body-md text-error">
                  {errors.age}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="personal-stage" className="font-label text-label-lg text-on-surface">
                Current life stage
              </label>
              <select
                id="personal-stage"
                value={lifeStage}
                onChange={(event) => setLifeStage(event.target.value as LifeStage)}
                className={fieldClass}
              >
                {lifeStages.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Button type="submit" size="lg" fullWidth>
            Save changes
          </Button>
          <p className="pb-2 font-body text-label-md text-on-surface-variant">
            Your name, email and phone are never sent to Coach.
          </p>
        </form>
      </main>
    </>
  );
}
