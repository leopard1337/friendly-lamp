"use client";

import { useState, useCallback } from "react";
import { StepIndicator } from "./StepIndicator";

interface CommunityStatsFormState {
  telegramCount: string;
  discordCount: string;
  step: number;
  errors: Record<string, string>;
}

const TOTAL_STEPS = 3;

export function CommunityStatsWizard({
  workspaceId,
  onSubmit,
  onCancel,
  loading,
}: {
  workspaceId: string;
  onSubmit: (data: { workspaceId: string; telegramCount?: number; discordCount?: number }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CommunityStatsFormState>({
    telegramCount: "",
    discordCount: "",
    step: 1,
    errors: {},
  });

  const update = useCallback(<K extends keyof CommunityStatsFormState>(key: K, value: CommunityStatsFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value, errors: { ...prev.errors, [key]: "" } }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      const n = parseInt(form.telegramCount, 10);
      if (form.telegramCount.trim() === "") errs.telegramCount = "Please enter a number";
      else if (Number.isNaN(n) || n < 0) errs.telegramCount = "Must be 0 or greater";
    }
    if (step === 2) {
      const n = parseInt(form.discordCount, 10);
      if (form.discordCount.trim() === "") errs.discordCount = "Please enter a number";
      else if (Number.isNaN(n) || n < 0) errs.discordCount = "Must be 0 or greater";
    }
    setForm((prev) => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [form.telegramCount, form.discordCount]);

  const goNext = useCallback(() => {
    if (form.step < TOTAL_STEPS && validateStep(form.step)) {
      setForm((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  }, [form.step, validateStep]);

  const goBack = useCallback(() => {
    if (form.step > 1) setForm((prev) => ({ ...prev, step: prev.step - 1 }));
  }, [form.step]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) setForm((prev) => ({ ...prev, step }));
  }, []);

  const handleSubmit = useCallback(() => {
    const telegramCount = form.telegramCount.trim() ? parseInt(form.telegramCount, 10) : undefined;
    const discordCount = form.discordCount.trim() ? parseInt(form.discordCount, 10) : undefined;
    onSubmit({ workspaceId, telegramCount, discordCount });
  }, [form, workspaceId, onSubmit]);

  const handleCancel = useCallback(() => {
    const hasChanges = form.step > 1 || form.telegramCount || form.discordCount;
    if (hasChanges && !confirm("Discard changes?")) return;
    onCancel();
  }, [form, onCancel]);

  const inputClass =
    "w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-zinc-200 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-400";
  const errorClass = "mt-1 text-xs text-red-400";

  return (
    <div className="mb-4 flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/40 wizard-step-card">
      <StepIndicator current={form.step} total={TOTAL_STEPS} onStepClick={goToStep} />

      <div key={form.step} className="wizard-step-animate flex flex-1 flex-col">
        {/* Step 1: Telegram Members */}
        {form.step === 1 && (
          <div>
            <label className={labelClass}>Telegram Members</label>
            <input
              type="number"
              value={form.telegramCount}
              onChange={(e) => update("telegramCount", e.target.value)}
              min="0"
              placeholder="e.g. 1250"
              className={inputClass}
              aria-invalid={!!form.errors.telegramCount}
            />
            {form.errors.telegramCount && <p className={errorClass}>{form.errors.telegramCount}</p>}
          </div>
        )}

        {/* Step 2: Discord Members */}
        {form.step === 2 && (
          <div>
            <label className={labelClass}>Discord Members</label>
            <input
              type="number"
              value={form.discordCount}
              onChange={(e) => update("discordCount", e.target.value)}
              min="0"
              placeholder="e.g. 800"
              className={inputClass}
              aria-invalid={!!form.errors.discordCount}
            />
            {form.errors.discordCount && <p className={errorClass}>{form.errors.discordCount}</p>}
          </div>
        )}

        {/* Step 3: Review */}
        {form.step === 3 && (
          <div className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Telegram Members</span>
              <span className="text-zinc-200">
                {form.telegramCount ? parseInt(form.telegramCount, 10).toLocaleString() : "—"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Discord Members</span>
              <span className="text-zinc-200">
                {form.discordCount ? parseInt(form.discordCount, 10).toLocaleString() : "—"}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex justify-between gap-2">
          {form.step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-zinc-600/80 px-4 py-2.5 text-sm text-zinc-400 transition-all hover:bg-zinc-800"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {form.step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-600 active:scale-[0.98]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-600 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Add Snapshot"}
            </button>
          )}
        </div>
        <div className="flex justify-start">
          <button type="button" onClick={handleCancel} className="text-xs text-zinc-500 hover:text-zinc-400">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
