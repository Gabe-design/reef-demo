import type { Tone } from "@/components/ui";
import type { EstimateStatus, InvoiceStatus, Job, LeadStage, PlanStatus } from "./types";

export const JOB_TONE: Record<Job["status"], { label: string; tone: Tone }> = {
  ready_to_schedule: { label: "Unscheduled", tone: "warn" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  en_route: { label: "On the way", tone: "sky" },
  in_progress: { label: "In progress", tone: "navy" },
  completed: { label: "Done", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "bad" },
};

export const INVOICE_TONE: Record<InvoiceStatus | "overdue", { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  open: { label: "Open", tone: "sky" },
  overdue: { label: "Overdue", tone: "bad" },
  partially_paid: { label: "Partly paid", tone: "warn" },
  paid: { label: "Paid", tone: "ok" },
  void: { label: "Void", tone: "neutral" },
};

export const PLAN_TONE: Record<PlanStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "ok" },
  paused: { label: "Paused", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  pending_acceptance: { label: "Awaiting signature", tone: "sky" },
};

export const ESTIMATE_TONE: Record<EstimateStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "sky" },
  accepted: { label: "Accepted", tone: "ok" },
  declined: { label: "Declined", tone: "bad" },
  expired: { label: "Expired", tone: "warn" },
};

export const STAGE_TONE: Record<LeadStage, Tone> = {
  new: "sky",
  contacted: "neutral",
  qualified: "violet",
  estimate_sent: "warn",
  won: "ok",
  lost: "bad",
  nurture: "neutral",
};

export function invoiceState(i: { status: InvoiceStatus; dueOn: string }, today: string): InvoiceStatus | "overdue" {
  return i.status === "open" && i.dueOn < today ? "overdue" : i.status;
}
