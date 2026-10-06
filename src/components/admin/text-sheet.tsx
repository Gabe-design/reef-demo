"use client";

import { useState } from "react";
import { Button, Field, Sheet, Textarea } from "@/components/ui";

export function TextSheet({ open, onClose, name, onSend }: { open: boolean; onClose: () => void; name: string; onSend: (b: string) => void }) {
  const [body, setBody] = useState(`Hi ${name}, this is Reef Window Cleaning. `);
  return (
    <Sheet open={open} onClose={onClose} title={`Text ${name}`}>
      <Field label="Message" hint="Sent from Reef's business number. Replies land in Messages.">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Button
        className="mt-4"
        full
        disabled={body.trim().length < 5}
        onClick={() => {
          onSend(body.trim());
          onClose();
        }}
      >
        Send text
      </Button>
    </Sheet>
  );
}

