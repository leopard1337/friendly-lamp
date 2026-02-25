"use client";

import { useState, useCallback } from "react";
import { StepIndicator } from "./StepIndicator";

type CampaignType = "launch" | "kol" | "community" | "other";

interface CampaignFormState {
  type: CampaignType;
  startedAt: string;
  notes: string;
  step: number;
  errors: Record<string, string>;
}

const TOTAL_STEPS = 5;
const TYPE_OPTIONS: { value: CampaignType; label: string }[] = [
  { value: "launch", label: "Launch" },
  { value: "kol", label: "KOL" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export function CampaignWizard({
  workspaceId,
  campaignId,
  initialData,
  onSubmit,
  onUpdate,
  onCancel,
  loading,
}: {
  workspaceId: string;
  campaignId?: string;
  initialData?: { type: string; startedAt: Date | string; notes?: string | null };
  onSubmit?: (data: { workspaceId: string; type: CampaignType; startedAt: Date; notes?: string }) => void;
  onUpdate?: (data: { id: string; type: CampaignType; startedAt: Date; notes?: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isEdit = !!campaignId && !!onUpdate;
  const startedAtStr = initialData?.startedAt
    ? new Date(initialData.startedAt).toISOString().slice(0, 16)
    : "";

  const [form, setForm] = useState<CampaignFormState>({
    type: (initialData?.type as CampaignType) ?? "launch",
    startedAt: startedAtStr,
    notes: initialData?.notes ?? "",
    step: 1,
    errors: {},
  });

  const update = useCallback(<K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value, errors: { ...prev.errors, [key]: "" } }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.type) errs.type = "Please select a type";
    }
    if (step === 2) {
      if (!form.startedAt) errs.startedAt = "Please pick a date and time";
    }
    setForm((prev) => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [form.type, form.startedAt]);

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

  const handleSkip = useCallback(() => {
    if (form.step === 3) goNext();
  }, [form.step, goNext]);

  const handleSubmit = useCallback(() => {
    const startedAt = new Date(form.startedAt);
    if (isEdit && campaignId) {
      onUpdate!({ id: campaignId, type: form.type, startedAt, notes: form.notes || undefined });
    } else if (onSubmit) {
      onSubmit({ workspaceId, type: form.type, startedAt, notes: form.notes || undefined });
    }
  }, [form, workspaceId, campaignId, isEdit, onSubmit, onUpdate]);

  const handleCancel = useCallback(() => {
    if (form.step > 1 || form.type || form.startedAt || form.notes) {
      if (confirm("Discard changes?")) {
        setForm({ type: "launch", startedAt: "", notes: "", step: 1, errors: {} });
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [form, onCancel]);

  const inputClass =
    "w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-zinc-200 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-400";
  const errorClass = "mt-1 text-xs text-red-400";

  return (
    <div className="mb-4 flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/40 wizard-step-card">
      <StepIndicator current={form.step} total={TOTAL_STEPS} onStepClick={goToStep} />

      <div key={form.step} className="wizard-step-animate flex flex-1 flex-col">
        {/* Step 1: Type */}
        {form.step === 1 && (
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value as CampaignType)}
              className={inputClass}
              aria-invalid={!!form.errors.type}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {form.errors.type && <p className={errorClass}>{form.errors.type}</p>}
          </div>
        )}

        {/* Step 2: Started At */}
        {form.step === 2 && (
          <div>
            <label className={labelClass}>Started At</label>
            <input
              type="datetime-local"
              value={form.startedAt}
              onChange={(e) => update("startedAt", e.target.value)}
              className={inputClass}
              aria-invalid={!!form.errors.startedAt}
            />
            {form.errors.startedAt && <p className={errorClass}>{form.errors.startedAt}</p>}
          </div>
        )}

        {/* Step 3: Notes (optional) */}
        {form.step === 3 && (
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="e.g. Twitter campaign"
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        {/* Step 4: Review */}
        {form.step === 4 && (
          <div className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Type</span>
              <span className="font-medium capitalize text-zinc-200">{form.type}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Started At</span>
              <span className="text-zinc-200">{form.startedAt ? new Date(form.startedAt).toLocaleString() : "—"}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Notes</span>
              <span className="max-w-[60%] truncate text-zinc-200">{form.notes || "—"}</span>
            </button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {form.step === 5 && (
          <p className="text-sm text-zinc-400">Click Confirm to {isEdit ? "save" : "add"} this campaign.</p>
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
              {loading ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add Campaign"}
            </button>
          )}
        </div>
        {form.step === 3 && (
          <p className="text-center text-xs text-zinc-500">
            <button type="button" onClick={handleSkip} className="hover:text-zinc-400">
              Skip
            </button>
          </p>
        )}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-zinc-500 hover:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
