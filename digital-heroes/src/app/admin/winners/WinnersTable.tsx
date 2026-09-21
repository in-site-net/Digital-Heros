"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WinnerRow = {
  id: string;
  match_tier: number;
  amount_cents: number;
  proof_url: string | null;
  verification: string;
  payment: string;
  profiles: { full_name: string | null } | null;
  draws: { period_label: string } | null;
};

export default function WinnersTable({ initialWinners }: { initialWinners: WinnerRow[] }) {
  const supabase = createClient();
  const [winners, setWinners] = useState(initialWinners);

  async function updateVerification(id: string, verification: string) {
    await supabase.from("winners").update({ verification }).eq("id", id);
    setWinners((w) => w.map((row) => (row.id === id ? { ...row, verification } : row)));
  }

  async function markPaid(id: string) {
    await supabase.from("winners").update({ payment: "paid" }).eq("id", id);
    setWinners((w) => w.map((row) => (row.id === id ? { ...row, payment: "paid" } : row)));
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-3">Winner</th>
            <th className="py-3">Draw</th>
            <th className="py-3">Tier</th>
            <th className="py-3">Amount</th>
            <th className="py-3">Proof</th>
            <th className="py-3">Verification</th>
            <th className="py-3">Payment</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((w) => (
            <tr key={w.id} className="border-b border-line/60">
              <td className="py-3 text-parchment">{w.profiles?.full_name ?? "—"}</td>
              <td className="py-3 text-muted">{w.draws?.period_label}</td>
              <td className="py-3 text-muted">{w.match_tier}-match</td>
              <td className="py-3 text-brass">₹{(w.amount_cents / 100).toLocaleString("en-IN")}</td>
              <td className="py-3">
                {w.proof_url ? (
                  <a href={w.proof_url} target="_blank" className="text-brass hover:underline">View</a>
                ) : (
                  <span className="text-muted">None yet</span>
                )}
              </td>
              <td className="py-3">
                <select
                  className="input !w-auto !py-1 text-xs"
                  value={w.verification}
                  onChange={(e) => updateVerification(w.id, e.target.value)}
                >
                  <option value="awaiting_proof">Awaiting proof</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="py-3">
                {w.payment === "paid" ? (
                  <span className="text-leaf">Paid</span>
                ) : (
                  <button
                    onClick={() => markPaid(w.id)}
                    disabled={w.verification !== "approved"}
                    className="text-xs text-brass hover:underline disabled:cursor-not-allowed disabled:text-muted"
                  >
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
