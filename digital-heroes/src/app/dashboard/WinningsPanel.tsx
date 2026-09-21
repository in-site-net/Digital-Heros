"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Winner } from "@/lib/types";

export default function WinningsPanel({ initialWinners }: { initialWinners: Winner[] }) {
  const supabase = createClient();
  const [winners, setWinners] = useState(initialWinners);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const totalWon = winners.reduce((sum, w) => sum + w.amount_cents, 0);

  async function handleUpload(winnerId: string, file: File) {
    setUploadingId(winnerId);
    const path = `${winnerId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("winner-proofs").upload(path, file);
    if (!uploadError) {
      const { data: pub } = supabase.storage.from("winner-proofs").getPublicUrl(path);
      await supabase
        .from("winners")
        .update({ proof_url: pub.publicUrl, verification: "submitted" })
        .eq("id", winnerId);
      setWinners((w) =>
        w.map((row) => (row.id === winnerId ? { ...row, proof_url: pub.publicUrl, verification: "submitted" } : row))
      );
    }
    setUploadingId(null);
  }

  return (
    <div className="card">
      <p className="label">Winnings</p>
      <p className="mt-1 font-display text-3xl text-brass">₹{(totalWon / 100).toLocaleString("en-IN")}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {winners.map((w) => (
          <li key={w.id} className="border-b border-line/60 pb-3">
            <div className="flex justify-between">
              <span className="text-muted">{w.match_tier}-number match</span>
              <span className={w.payment === "paid" ? "text-leaf" : "text-brass"}>
                ₹{(w.amount_cents / 100).toLocaleString("en-IN")} · {w.payment}
              </span>
            </div>
            {w.verification === "awaiting_proof" && (
              <label className="mt-2 inline-block cursor-pointer text-xs text-brass hover:underline">
                {uploadingId === w.id ? "Uploading…" : "Upload score screenshot as proof"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(w.id, e.target.files[0])}
                />
              </label>
            )}
            {w.verification !== "awaiting_proof" && (
              <p className="mt-1 text-xs text-muted">Verification: {w.verification}</p>
            )}
          </li>
        ))}
        {winners.length === 0 && <p className="text-muted">No wins yet — good luck next draw.</p>}
      </ul>
    </div>
  );
}
