"use client";

import { useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { SlotPicker } from "@/components/booking-form";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { daysBetween, fmtDate, fmtWindow } from "@/lib/demo/util";

/**
 * Customer reschedule (spec 4): only eligible slots, and the old booking stays
 * intact until the new one is confirmed. Inside the 24-hour cutoff it becomes
 * a request for the office instead.
 */
export function RescheduleSheet({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const data = useData()!;
  const dispatch = useDispatch();
  const job = data.ix.job.get(jobId)!;
  const [when, setWhen] = useState<{ date: string; slot: [string, string] | null }>({ date: "", slot: null });
  const [done, setDone] = useState(false);
  const insideCutoff = daysBetween(data.d.today, job.date) < 1;

  return (
    <Sheet open onClose={onClose} title="Reschedule visit">
      {done ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ink">
            You&apos;re moved to <strong>{fmtDate(when.date, "EEEE, MMMM d")}</strong>, arriving {fmtWindow(when.slot![0], when.slot![1])}. We texted you a confirmation.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : insideCutoff ? (
        <p className="text-[15px] text-ink">This visit is less than 24 hours away, so changes go to the office. Text or call Reef and we&apos;ll sort it out.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted">
            Currently {fmtDate(job.date, "EEE, MMM d")}, {fmtWindow(job.arrivalStart, job.arrivalEnd)}. Your current time stays booked until you confirm a new one.
          </p>
          <SlotPicker d={data.d} crewId={job.crewId ?? "c_kelp"} value={when.date ? when : { date: data.d.today, slot: null }} onChange={setWhen} />
          <Button
            size="lg"
            full
            disabled={!when.date || !when.slot}
            onClick={() => {
              dispatch({ t: "job.schedule", jobId, date: when.date, crewId: job.crewId ?? "c_kelp", arrivalStart: when.slot![0], arrivalEnd: when.slot![1] });
              setDone(true);
            }}
          >
            Confirm new time
          </Button>
        </div>
      )}
    </Sheet>
  );
}
