"use client";

import { useState, useCallback } from "react";
import { StepIndicator } from "./StepIndicator";

interface KolDealFormState {
  walletOfKol: string;
  paidAmount: string;
  date: string;
  campaignId: string;
  txid: string;
  platform: string;
  notes: string;
  step: number;
  errors: Record<string, string>;
}

const TOTAL_STEPS = 7;

export function KolDealWizard({
  workspaceId,
  dealId,
  initialData,
  campaigns,
  onSubmit,
  onUpdate,
  onCancel,
  loading,
}: {
  workspaceId: string;
  dealId?: string;
  initialData?: {
    walletOfKol: string;
    paidAmount: number;
    date: Date | string;
    txid?: string | null;
    platform?: string | null;
    notes?: string | null;
    campaignId?: string | null;
  };
  campaigns?: { id: string; type: string; startedAt: Date }[];
  onSubmit?: (data: {
    workspaceId: string;
    walletOfKol: string;
    paidAmount: number;
    date: Date;
    txid?: string;
    platform?: string;
    notes?: string;
    campaignId?: string | null;
  }) => void;
  onUpdate?: (data: {
    id: string;
    walletOfKol: string;
    paidAmount: number;
    date: Date;
    txid: string | null;
    platform: string | null;
    notes: string | null;
    campaignId?: string | null;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isEdit = !!dealId && !!onUpdate;
  const dateStr = initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : "";

  const [form, setForm] = useState<KolDealFormState>({
    walletOfKol: initialData?.walletOfKol ?? "",
    paidAmount: initialData?.paidAmount?.toString() ?? "",
    date: dateStr,
    campaignId: initialData?.campaignId ?? "",
    txid: initialData?.txid ?? "",
    platform: initialData?.platform ?? "",
    notes: initialData?.notes ?? "",
    step: 1,
    errors: {},
  });

  const update = useCallback(<K extends keyof KolDealFormState>(key: K, value: KolDealFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value, errors: { ...prev.errors, [key]: "" } }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.walletOfKol.trim()) errs.walletOfKol = "Wallet address is required";
    }
    if (step === 2) {
      const n = parseFloat(form.paidAmount);
      if (!form.paidAmount.trim()) errs.paidAmount = "Amount is required";
      else if (Number.isNaN(n) || n <= 0) errs.paidAmount = "Amount must be greater than 0";
    }
    if (step === 3) {
      if (!form.date) errs.date = "Please pick a date";
    }
    setForm((prev) => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [form.walletOfKol, form.paidAmount, form.date]);

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
    if (form.step === 5) goNext();
  }, [form.step, goNext]);

  const handleSubmit = useCallback(() => {
    const paidAmount = parseFloat(form.paidAmount);
    const date = new Date(form.date);
    const campaignIdVal = form.campaignId || null;
    if (isEdit && dealId) {
      onUpdate!({
        id: dealId,
        walletOfKol: form.walletOfKol.trim(),
        paidAmount,
        date,
        txid: form.txid.trim() || null,
        platform: form.platform.trim() || null,
        notes: form.notes.trim() || null,
        campaignId: campaignIdVal,
      });
    } else if (onSubmit) {
      onSubmit({
        workspaceId,
        walletOfKol: form.walletOfKol.trim(),
        paidAmount,
        date,
        txid: form.txid.trim() || undefined,
        platform: form.platform.trim() || undefined,
        notes: form.notes.trim() || undefined,
        campaignId: campaignIdVal,
      });
    }
  }, [form, workspaceId, dealId, isEdit, onSubmit, onUpdate]);

  const handleCancel = useCallback(() => {
    const hasChanges =
      form.step > 1 ||
      form.walletOfKol ||
      form.paidAmount ||
      form.date ||
      form.txid ||
      form.platform ||
      form.notes;
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
        {form.step === 1 && (
          <div>
            <label className={labelClass}>KOL Wallet Address</label>
            <input
              type="text"
              value={form.walletOfKol}
              onChange={(e) => update("walletOfKol", e.target.value)}
              placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className={`${inputClass} font-mono text-sm`}
              aria-invalid={!!form.errors.walletOfKol}
            />
            {form.errors.walletOfKol && <p className={errorClass}>{form.errors.walletOfKol}</p>}
          </div>
        )}

        {form.step === 2 && (
          <div>
            <label className={labelClass}>Paid Amount in USD</label>
            <input
              type="number"
              value={form.paidAmount}
              onChange={(e) => update("paidAmount", e.target.value)}
              min="0"
              step="0.01"
              placeholder="500"
              className={inputClass}
              aria-invalid={!!form.errors.paidAmount}
            />
            {form.errors.paidAmount && <p className={errorClass}>{form.errors.paidAmount}</p>}
          </div>
        )}

        {form.step === 3 && (
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputClass}
              aria-invalid={!!form.errors.date}
            />
            {form.errors.date && <p className={errorClass}>{form.errors.date}</p>}
          </div>
        )}

        {form.step === 4 && (
          <div>
            <label className={labelClass}>Campaign (optional)</label>
            <select
              value={form.campaignId}
              onChange={(e) => update("campaignId", e.target.value)}
              className={inputClass}
            >
              <option value="">No campaign</option>
              {(campaigns ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type} · {new Date(c.startedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.step === 5 && (
          <div>
            <label className={labelClass}>Transaction ID (optional)</label>
            <input
              type="text"
              value={form.txid}
              onChange={(e) => update("txid", e.target.value)}
              placeholder="Solscan txid"
              className={`${inputClass} font-mono text-sm`}
            />
          </div>
        )}

        {form.step === 6 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Platform (optional)</label>
              <input
                type="text"
                value={form.platform}
                onChange={(e) => update("platform", e.target.value)}
                placeholder="e.g. telegram, twitter, discord"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                placeholder="e.g. Promo post"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        )}

        {form.step === 7 && (
          <div className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Wallet</span>
              <span className="max-w-[55%] truncate font-mono text-zinc-200">{form.walletOfKol || "—"}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Amount (USD)</span>
              <span className="text-zinc-200">${form.paidAmount || "—"}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Date</span>
              <span className="text-zinc-200">{form.date ? new Date(form.date).toLocaleDateString() : "—"}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Campaign</span>
              <span className="text-zinc-200">
                {form.campaignId
                  ? campaigns?.find((c) => c.id === form.campaignId)?.type ?? "—"
                  : "No campaign"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(5)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Transaction ID</span>
              <span className="max-w-[55%] truncate font-mono text-zinc-200">{form.txid || "—"}</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(6)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-700/50"
            >
              <span className="text-zinc-500">Platform / Notes</span>
              <span className="max-w-[55%] truncate text-zinc-200">
                {[form.platform, form.notes].filter(Boolean).join(" · ") || "—"}
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
              {loading ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add KOL Deal"}
            </button>
          )}
        </div>
        {form.step === 5 && (
          <p className="text-center text-xs text-zinc-500">
            <button type="button" onClick={handleSkip} className="hover:text-zinc-400">
              Skip
            </button>
          </p>
        )}
        <div className="flex justify-start">
          <button type="button" onClick={handleCancel} className="text-xs text-zinc-500 hover:text-zinc-400">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
