"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ChatsCircle, Door, HandWaving, X } from "@phosphor-icons/react";
import { ReefMap, type MapPoint } from "@/components/map";
import { Button, Field, Input, Sheet, Textarea } from "@/components/ui";
import { PriceSummary, ServicePicker, SlotPicker, buildBooking, quoteLines, type BookingInput } from "@/components/booking-form";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { DOORS, territoryOfDoor, type Door as DoorT } from "@/lib/demo/seed";
import { DOOR_OUTCOMES, type DoorOutcome, type DoorVisit } from "@/lib/demo/types";
import { fmtAgo, fmtDate, money, newId, businessNow } from "@/lib/demo/util";
import { useDemo } from "@/lib/demo/store";

const UNKNOCKED = "#cbd5e1";

export default function SalesMapPage() {
  return (
    <Suspense fallback={null}>
      <SalesMap />
    </Suspense>
  );
}

function SalesMap() {
  const data = useData();
  const me = useMe();
  const dispatch = useDispatch();
  const params = useSearchParams();
  const [selected, setSelected] = useState<number | null>(() => (params.get("door") ? Number(params.get("door")) : null));
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [booking, setBooking] = useState<DoorT | null>(null);
  const meId = me?.kind === "staff" ? me.employee.id : "";

  const visitsByDoor = useMemo(() => {
    const m = new Map<number, DoorVisit[]>();
    data?.d.doorVisits.forEach((v) => m.set(v.doorId, [...(m.get(v.doorId) ?? []), v]));
    m.forEach((list) => list.sort((a, b) => (a.at < b.at ? 1 : -1)));
    return m;
  }, [data]);

  const myTerritories = useMemo(() => new Set(data?.d.territories.filter((t) => t.salespersonId === meId).map((t) => t.id) ?? []), [data, meId]);
  // Spec 8: a salesperson only sees doors in their assigned territories.
  const points: MapPoint[] = useMemo(
    () =>
      DOORS.filter((door) => myTerritories.has(territoryOfDoor(door).id)).map((door) => {
        const last = visitsByDoor.get(door.id)?.[0];
        const key = last?.outcome ?? "unknocked";
        return { door, key };
      })
        .filter(({ key }) => !hidden.has(key))
        .map(({ door, key }) => ({ id: door.id, lng: door.lng, lat: door.lat, color: key === "unknocked" ? UNKNOCKED : DOOR_OUTCOMES[key as DoorOutcome].color })),
    [visitsByDoor, hidden, myTerritories],
  );

  if (!data || me?.kind !== "staff") return null;
  const { d } = data;
  const mine = d.territories.filter((t) => t.salespersonId === meId);
  const today = d.doorVisits.filter((v) => v.salespersonId === meId && v.at.startsWith(d.today));
  const door = selected !== null ? DOORS[selected] : null;

  const counts = new Map<string, number>();
  DOORS.forEach((dr) => {
    if (!mine.some((t) => t.id === territoryOfDoor(dr).id)) return;
    const k = visitsByDoor.get(dr.id)?.[0]?.outcome ?? "unknocked";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });

  const toggle = (k: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <div className="relative h-[calc(100dvh-56px-64px)] md:h-[calc(100dvh-3rem-56px-64px)]">
      <ReefMap
        className="absolute inset-0"
        points={points}
        polygons={d.territories.map((t) => ({ id: t.id, ring: t.polygon, color: t.color, dim: t.salespersonId !== meId }))}
        fitTo={mine.flatMap((t) => t.polygon)}
        onPointClick={(id) => setSelected(Number(id))}
        selectedId={selected}
        locate
      />
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col gap-2">
        <div className="pointer-events-auto flex items-center justify-between rounded-2xl bg-white/95 px-4 py-2.5 shadow-soft backdrop-blur">
          <div>
            <p className="text-[12px] text-muted">{mine.map((t) => t.name).join(", ")}</p>
            <p className="num text-[14px] font-medium text-ink">
              Today: {today.length} doors · {today.filter((v) => v.conversation).length} talks · {today.filter((v) => v.outcome === "booked").length} booked
            </p>
          </div>
          <Door size={22} className="text-navy-900" />
        </div>
        <div className="pointer-events-auto -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
          {[["unknocked", "Not knocked", UNKNOCKED] as const, ...Object.entries(DOOR_OUTCOMES).map(([k, v]) => [k, v.label, v.color] as const)].map(([k, label, color]) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              aria-pressed={!hidden.has(k)}
              className={clsx("flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] shadow-soft backdrop-blur", hidden.has(k) ? "text-subtle line-through" : "text-ink")}
            >
              <span className="size-2.5 rounded-full ring-1 ring-white" style={{ background: color }} />
              {label}
              <span className="num text-muted">{counts.get(k) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {door && (
        <DoorPanel
          door={door}
          visits={visitsByDoor.get(door.id) ?? []}
          inMyTerritory={mine.some((t) => t.id === territoryOfDoor(door).id)}
          names={(id) => d.employees.find((e) => e.id === id)?.name ?? ""}
          onClose={() => setSelected(null)}
          onLog={(outcome, conversation, note) => {
            if (outcome === "booked") {
              setBooking(door);
              return;
            }
            dispatch({ t: "door.visit", visit: { id: newId("dv"), doorId: door.id, at: businessNow(), salespersonId: meId, outcome, conversation, note: note || undefined } }, { silent: true });
            notify(`${DOOR_OUTCOMES[outcome].label} logged at ${door.number} ${door.street}`);
          }}
        />
      )}

      {booking && (
        <BookDoorSheet
          door={booking}
          onClose={() => setBooking(null)}
          onBooked={(value, jobDate) => {
            notify(`Booked ${money(value, { whole: true })} for ${fmtDate(jobDate, "EEE MMM d")}. Commission pending.`);
            setBooking(null);
          }}
        />
      )}
    </div>
  );
}

function notify(body: string) {
  useDemo.getState().toast({ kind: "success", title: "Saved", body });
}

function DoorPanel({
  door,
  visits,
  inMyTerritory,
  names,
  onClose,
  onLog,
}: {
  door: DoorT;
  visits: DoorVisit[];
  inMyTerritory: boolean;
  names: (id: string) => string;
  onClose: () => void;
  onLog: (o: DoorOutcome, conversation: boolean, note: string) => void;
}) {
  const [conversation, setConversation] = useState(true);
  const [note, setNote] = useState("");
  const last = visits[0];
  const dnk = last?.outcome === "do_not_knock";
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[70%] animate-rise overflow-y-auto rounded-t-3xl bg-white p-4 shadow-lift">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            {door.number} {door.street}
          </p>
          <p className="text-[13px] text-muted">
            {last ? (
              <>
                <span className="font-medium" style={{ color: DOOR_OUTCOMES[last.outcome].color }}>
                  {DOOR_OUTCOMES[last.outcome].label}
                </span>{" "}
                · {fmtAgo(last.at, businessNow())} by {names(last.salespersonId).split(" ")[0]}
              </>
            ) : (
              "Not knocked yet"
            )}
          </p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-navy-50" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {!inMyTerritory ? (
        <p className="rounded-xl bg-canvas p-3 text-[13.5px] text-muted">This door is in another rep&apos;s territory.</p>
      ) : dnk ? (
        <p className="rounded-xl bg-bad-bg p-3 text-[13.5px] text-bad">Marked do-not-knock. Skip this door.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DOOR_OUTCOMES) as DoorOutcome[]).map((o) => (
              <button
                key={o}
                onClick={() => onLog(o, o === "no_answer" ? false : conversation, note)}
                className={clsx("flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-left text-[13.5px] font-medium text-ink active:scale-[0.98]", o === "booked" && "col-span-2 justify-center border-transparent bg-[#008300] text-white")}
              >
                {o !== "booked" && <span className="size-3 shrink-0 rounded-full" style={{ background: DOOR_OUTCOMES[o].color }} />}
                {o === "booked" ? "Booked: schedule it" : DOOR_OUTCOMES[o].label}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13.5px] text-ink">
            <input type="checkbox" checked={conversation} onChange={(e) => setConversation(e.target.checked)} className="size-4 accent-[#032541]" />
            <ChatsCircle size={16} className="text-muted" /> Had a conversation
          </label>
          <Textarea className="mt-2 !min-h-16" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </>
      )}

      {visits.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[12.5px] text-muted">History</p>
          <ul className="divide-y divide-line">
            {visits.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-3 py-2 text-[13px]">
                <span>
                  <span className="font-medium text-ink">{DOOR_OUTCOMES[v.outcome].label}</span>
                  {v.conversation && <HandWaving size={13} className="ml-1 inline text-muted" aria-label="conversation" />}
                  {v.note && <span className="block text-muted">{v.note}</span>}
                </span>
                <span className="shrink-0 text-[12px] text-subtle">
                  {fmtDate(v.at, "MMM d, h:mm a")} · {names(v.salespersonId).split(" ")[0]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BookDoorSheet({ door, onClose, onBooked }: { door: DoorT; onClose: () => void; onBooked: (value: number, date: string) => void }) {
  const data = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [input, setInput] = useState<BookingInput>({ windows: 22, stories: 1, services: ["ext", "int", "screen"], skylights: 1 });
  const [when, setWhen] = useState<{ date: string; slot: [string, string] | null }>({ date: "", slot: null });
  const lines = quoteLines(input);
  const ok = name.trim().length > 1 && phone.replace(/\D/g, "").length === 10 && when.date && when.slot && lines.length > 0;
  const repId = me?.kind === "staff" ? me.employee.id : "";
  return (
    <Sheet open onClose={onClose} title={`Book ${door.number} ${door.street}`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Mobile">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(858) 555-0142" />
          </Field>
        </div>
        <ServicePicker value={input} onChange={setInput} />
        <PriceSummary lines={lines} />
        <SlotPicker d={data.d} crewId="c_kelp" value={when.date ? when : { date: data.d.today, slot: null }} onChange={setWhen} />
        <Button
          size="lg"
          full
          disabled={!ok}
          onClick={() => {
            const { customer, property, job } = buildBooking({
              d: data.d,
              name: name.trim(),
              phone,
              street: `${door.number} ${door.street}`,
              neighborhood: "Clairemont",
              city: "San Diego",
              zip: "92117",
              lat: door.lat,
              lng: door.lng,
              stories: input.stories,
              windows: input.windows,
              lines,
              date: when.date,
              slot: when.slot!,
              crewId: "c_kelp",
              source: "door_to_door",
              soldById: repId,
            });
            dispatch({ t: "booking.create", customer, property, job });
            dispatch({ t: "door.visit", visit: { id: newId("dv"), doorId: door.id, at: businessNow(), salespersonId: repId, outcome: "booked", conversation: true, bookedValue: job.total } }, { silent: true });
            onBooked(job.total, when.date);
          }}
        >
          Book it
        </Button>
        <p className="text-center text-[12px] text-muted">They get a confirmation text right away.</p>
      </div>
    </Sheet>
  );
}
