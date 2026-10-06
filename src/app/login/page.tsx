"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChatCircleText, LockSimple } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { useData } from "@/lib/demo/hooks";
import { useSession } from "@/lib/demo/session";
import { useDemo } from "@/lib/demo/store";
import { showcaseCustomer } from "@/lib/demo/select";

const digits = (s: string) => s.replace(/\D/g, "");
const fmtPhone = (s: string) => {
  const x = digits(s).slice(0, 10);
  if (x.length < 4) return x;
  if (x.length < 7) return `(${x.slice(0, 3)}) ${x.slice(3)}`;
  return `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}`;
};

export default function CustomerLogin() {
  const data = useData();
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const toast = useDemo((s) => s.toast);
  const [typed, setTyped] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const showcase = useMemo(() => (data ? showcaseCustomer(data.d) : null), [data]);
  // pre-filled with the sample account so the walkthrough needs no typing
  const phone = typed ?? showcase?.phone ?? "";
  const setPhone = setTyped;

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (digits(phone).length !== 10) {
      setError("Enter a 10-digit US mobile number.");
      return;
    }
    setBusy(true);
    const c = String(100000 + Math.floor(Math.random() * 900000));
    setTimeout(() => {
      setSent(c);
      setStep("code");
      setBusy(false);
      toast({ kind: "sms", title: "Messages · Reef", body: `Your Reef login code is ${c}. It expires in 10 minutes. Don't share it.` });
      setTimeout(() => codeRef.current?.focus(), 50);
    }, 700);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code !== sent) {
      setError("That code doesn't match. Check the text and try again.");
      return;
    }
    const match = data?.d.customers.find((c) => digits(c.phone) === digits(phone));
    if (!match) {
      setError("We couldn't find a Reef account for this number. Book a cleaning or call us and we'll link it.");
      return;
    }
    signIn({ kind: "customer", id: match.id });
    router.push("/account/");
  };

  return (
    <AuthShell>
      <h1 className="font-display text-4xl font-light text-navy-900">Your Reef account</h1>
      <p className="mt-3 text-[15px] text-muted">See upcoming visits, photos, invoices and your Reef Credit. No password needed.</p>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-8 flex flex-col gap-5">
          <Field label="Mobile number" error={error} hint="We'll text you a 6-digit code.">
            <Input inputMode="tel" autoComplete="tel" value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value)} placeholder="(619) 555-0123" />
          </Field>
          <Button size="lg" full disabled={busy}>
            {busy ? "Sending…" : "Text me a code"} {!busy && <ArrowRight size={16} />}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-[14px] text-navy-900">
            <ChatCircleText size={20} weight="duotone" className="mt-0.5 shrink-0 text-sky-700" />
            <p>
              If {fmtPhone(phone)} has a Reef account, a code is on its way.{" "}
              <button type="button" className="font-medium text-sky-700 underline underline-offset-2" onClick={() => setStep("phone")}>
                Change number
              </button>
            </p>
          </div>
          <Field label="6-digit code" error={error}>
            <Input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(digits(e.target.value))}
              className="text-center font-mono text-2xl tracking-[0.5em]"
            />
          </Field>
          <Button size="lg" full disabled={code.length !== 6}>
            Sign in
          </Button>
          <button type="button" onClick={() => setCode(sent)} className="text-[13px] text-muted underline underline-offset-2 hover:text-navy-900">
            Paste code from Messages
          </button>
        </form>
      )}

      <p className="mt-10 flex items-center gap-2 text-[12.5px] text-subtle">
        <LockSimple size={14} /> Codes are sent by text and expire after 10 minutes.
      </p>
      <p className="mt-6 text-[14px] text-muted">
        Reef team member?{" "}
        <Link href="/team/" className="font-medium text-sky-700 hover:text-navy-900">
          Team sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
