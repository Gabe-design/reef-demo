"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  Camera,
  ChatText,
  CheckCircle,
  Circle,
  Eye,
  EyeSlash,
  NavigationArrow,
  NoteBlank,
  Phone,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import { directionsUrl } from "@/components/map";
import { Badge, Button, Card, Field, Select, Sheet, Textarea } from "@/components/ui";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { JOB_TONE } from "@/lib/demo/labels";
import { shrinkPhoto } from "@/lib/demo/photo";
import { fmtTime, fmtWindow, firstName, newId, businessNow } from "@/lib/demo/util";
import type { JobIssue, Photo } from "@/lib/demo/types";

export default function CrewJobPage() {
  return (
    <Suspense fallback={null}>
      <CrewJob />
    </Suspense>
  );
}

function CrewJob() {
  const id = useSearchParams().get("id") ?? "";
  const data = useData();
  const me = useMe();
  const dispatch = useDispatch();
  const [showCode, setShowCode] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<"before" | "after">("before");

  if (!data || me?.kind !== "staff") return null;
  const { d, ix } = data;
  const job = ix.job.get(id);
  if (!job || !job.assigneeIds.includes(me.employee.id)) {
    return (
      <div className="p-6 text-center text-[14px] text-muted">
        This job isn&apos;t on your route.{" "}
        <Link href="/crew/" className="font-medium text-sky-700">
          Back to today
        </Link>
      </div>
    );
  }
  const cust = ix.customer.get(job.customerId)!;
  const prop = ix.property.get(job.propertyId)!;
  const st = JOB_TONE[job.status];
  const before = job.photos.filter((p) => p.kind === "before");
  const after = job.photos.filter((p) => p.kind === "after");
  const crewNotes = job.notes.filter((n) => n.visibility !== "internal");
  const doneCount = job.checklist.filter((c) => c.done).length;
  const by = me.employee.id;

  const advance = () => {
    setErrors([]);
    if (job.status === "scheduled") dispatch({ t: "job.status", jobId: job.id, status: "en_route", by });
    else if (job.status === "en_route") dispatch({ t: "job.status", jobId: job.id, status: "in_progress", by }, { silent: true });
    else if (job.status === "in_progress") {
      // spec 9: completion needs required checklist items and uploaded before/after photos
      const problems: string[] = [];
      job.checklist.forEach((c) => c.required && !c.done && problems.push(`Check off "${c.label}"`));
      if (!before.length) problems.push("Add at least one before photo");
      if (!after.length) problems.push("Add at least one after photo");
      if (job.issues.some((i) => !i.resolved && i.kind === "safety")) problems.push("Resolve the open safety issue with your manager");
      if (problems.length) {
        setErrors(problems);
        return;
      }
      dispatch({ t: "job.status", jobId: job.id, status: "completed", by });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(kindRef.current);
    try {
      const src = await shrinkPhoto(file);
      const photo: Photo = { id: newId("ph"), kind: kindRef.current, src, takenAt: businessNow(), byId: by, local: true };
      dispatch({ t: "job.photo", jobId: job.id, photo }, { silent: true });
    } finally {
      setUploading(null);
    }
  };
  const pick = (k: "before" | "after") => {
    kindRef.current = k;
    fileRef.current?.click();
  };

  const action =
    job.status === "scheduled"
      ? { label: "Start travel", sub: `Texts ${firstName(cust.contactName)} that you're on the way` }
      : job.status === "en_route"
        ? { label: "Arrived, start job", sub: "Starts the job clock" }
        : job.status === "in_progress"
          ? { label: "Complete job", sub: `${doneCount}/${job.checklist.length} checklist · ${before.length + after.length} photos` }
          : null;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/crew/" className="inline-flex items-center gap-1 text-[14px] text-muted">
          <ArrowLeft size={16} /> Route
        </Link>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      <div>
        <p className="text-[12.5px] text-muted">
          {job.number} · Arrive {fmtWindow(job.arrivalStart, job.arrivalEnd)} · ~{Math.round(job.durationMin / 15) * 15} min
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{prop.street}</h1>
        <p className="text-[14px] text-muted">
          {prop.neighborhood}, {prop.zip}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a href={directionsUrl(prop.lat, prop.lng)} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-2xl bg-navy-900 py-3 text-[12.5px] font-medium text-white">
          <NavigationArrow size={20} weight="fill" /> Navigate
        </a>
        <a href={`tel:${cust.phone.replace(/\D/g, "")}`} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-white py-3 text-[12.5px] font-medium text-ink">
          <Phone size={20} /> Call
        </a>
        <a href={`sms:${cust.phone.replace(/\D/g, "")}`} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-white py-3 text-[12.5px] font-medium text-ink">
          <ChatText size={20} /> Text
        </a>
      </div>

      <Card className="p-4">
        <p className="text-[12.5px] text-muted">Customer</p>
        <p className="font-medium text-ink">{cust.kind === "commercial" ? `${cust.name} (${cust.contactName})` : cust.contactName}</p>
        {(prop.accessNotes || prop.gateCode) && (
          <div className="mt-3 rounded-xl bg-warn-bg p-3 text-[13.5px] text-ink">
            {prop.accessNotes && <p>{prop.accessNotes}</p>}
            {prop.gateCode && (
              <button onClick={() => setShowCode((s) => !s)} className="mt-1 inline-flex items-center gap-1.5 font-medium text-warn">
                {showCode ? <EyeSlash size={15} /> : <Eye size={15} />} Gate code: <span className="num font-mono">{showCode ? prop.gateCode : "••••"}</span>
              </button>
            )}
          </div>
        )}
        {crewNotes.map((n) => (
          <p key={n.id} className="mt-3 flex gap-2 text-[13.5px] text-ink">
            <NoteBlank size={16} className="mt-0.5 shrink-0 text-muted" /> {n.body}
          </p>
        ))}
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-[12.5px] text-muted">Scope</p>
        <ul className="grid grid-cols-2 gap-2">
          {job.lines
            .filter((l) => l.serviceId !== "callout")
            .map((l) => (
              <li key={l.serviceId} className="rounded-xl bg-canvas px-3 py-2">
                <p className="num font-display text-xl font-semibold text-ink">{l.qty}</p>
                <p className="text-[12.5px] text-muted">{d.services.find((s) => s.id === l.serviceId)?.name}</p>
              </li>
            ))}
        </ul>
        <p className="mt-2 text-[12px] text-subtle">{prop.stories}-story {prop.kind}</p>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] text-muted">Checklist</p>
          <span className="num text-[12.5px] text-muted">
            {doneCount}/{job.checklist.length}
          </span>
        </div>
        <ul className="flex flex-col">
          {job.checklist.map((c, i) => (
            <li key={i}>
              <button
                disabled={job.status === "completed" || job.status === "scheduled"}
                onClick={() => dispatch({ t: "job.check", jobId: job.id, index: i, done: !c.done }, { silent: true })}
                className="flex w-full items-center gap-3 py-2.5 text-left text-[14.5px] disabled:opacity-60"
              >
                {c.done ? <CheckCircle size={24} weight="fill" className="shrink-0 text-ok" /> : <Circle size={24} className="shrink-0 text-subtle" />}
                <span className={clsx(c.done ? "text-muted line-through" : "text-ink")}>{c.label}</span>
                {!c.required && <span className="ml-auto text-[11px] text-subtle">optional</span>}
              </button>
            </li>
          ))}
        </ul>
        {job.status === "scheduled" && <p className="mt-1 text-[12px] text-subtle">Unlocks when you arrive.</p>}
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-[12.5px] text-muted">Photos</p>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        {(["before", "after"] as const).map((k) => {
          const list = k === "before" ? before : after;
          return (
            <div key={k} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[13px] font-medium text-ink capitalize">{k}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {list.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.src} alt={`${k} photo`} className={clsx("size-20 shrink-0 rounded-xl object-cover", p.kind === "before" && !p.local && "photo-before")} />
                ))}
                <button
                  onClick={() => pick(k)}
                  disabled={job.status === "scheduled" || job.status === "completed"}
                  className="grid size-20 shrink-0 place-items-center rounded-xl border-2 border-dashed border-line text-muted disabled:opacity-40"
                  aria-label={`Add ${k} photo`}
                >
                  {uploading === k ? <span className="text-[11px]">Saving…</span> : <Camera size={22} />}
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setNoteOpen(true)}>
          <NoteBlank size={16} /> Add note
        </Button>
        <Button variant="outline" onClick={() => setIssueOpen(true)}>
          <Warning size={16} /> Report problem
        </Button>
      </div>

      {job.issues.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-[12.5px] text-muted">Reported problems</p>
          {job.issues.map((i) => (
            <p key={i.id} className="flex gap-2 py-1 text-[13.5px] text-ink">
              <WarningCircle size={17} className="mt-0.5 shrink-0 text-warn" /> <span className="capitalize">{i.kind}:</span> {i.body}
            </p>
          ))}
        </Card>
      )}

      {errors.length > 0 && (
        <div className="rounded-2xl border border-bad/30 bg-bad-bg p-4 text-[13.5px] text-bad" role="alert">
          <p className="font-medium">Before you can complete this job:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {job.status === "completed" && (
        <div className="flex items-center gap-3 rounded-2xl bg-ok-bg p-4 text-ok">
          <CheckCircle size={22} weight="fill" />
          <p className="text-[14px] font-medium">Completed at {fmtTime(job.completedAt!.slice(11, 16))}. The customer got their photos and invoice.</p>
        </div>
      )}

      {action && (
        <div className="fixed inset-x-0 bottom-[68px] z-20 mx-auto max-w-md px-4 md:bottom-[92px]">
          <button onClick={advance} className="flex w-full flex-col items-center rounded-2xl bg-navy-900 py-3 text-white shadow-lift transition active:scale-[0.99]">
            <span className="text-[15px] font-semibold">{action.label}</span>
            <span className="text-[12px] text-white/65">{action.sub}</span>
          </button>
        </div>
      )}

      <NoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} onSave={(body) => dispatch({ t: "job.note", jobId: job.id, note: { id: newId("n"), at: businessNow(), byId: by, visibility: "crew", body } }, { silent: true })} />
      <IssueSheet open={issueOpen} onClose={() => setIssueOpen(false)} onSave={(kind, body) => dispatch({ t: "job.issue", jobId: job.id, issue: { id: newId("is"), at: businessNow(), byId: by, kind, body, resolved: false } }, { silent: true })} />
    </div>
  );
}

function NoteSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (b: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Add a note">
      <Field label="Note for the crew and office" hint="Customers don't see crew notes.">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g. Back slider has a cracked pane, showed the customer" />
      </Field>
      <Button
        className="mt-4"
        full
        disabled={!body.trim()}
        onClick={() => {
          onSave(body.trim());
          setBody("");
          onClose();
        }}
      >
        Save note
      </Button>
    </Sheet>
  );
}

function IssueSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (k: JobIssue["kind"], b: string) => void }) {
  const [kind, setKind] = useState<JobIssue["kind"]>("access");
  const [body, setBody] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Report a problem">
      <div className="flex flex-col gap-4">
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as JobIssue["kind"])}>
            <option value="access">Can&apos;t get in / locked gate</option>
            <option value="safety">Safety concern</option>
            <option value="damage">Existing damage</option>
            <option value="customer">Customer request</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="What happened?" hint="The office sees this right away.">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Button
          full
          disabled={!body.trim()}
          onClick={() => {
            onSave(kind, body.trim());
            setBody("");
            onClose();
          }}
        >
          Send to office
        </Button>
      </div>
    </Sheet>
  );
}
