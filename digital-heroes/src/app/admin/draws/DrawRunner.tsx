"use client";

import { useState } from "react";
import type { Draw } from "@/lib/types";

export default function DrawRunner({ pastDraws }: { pastDraws: Draw[] }) {
  const now = new Date();
  const defaultLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [periodLabel, setPeriodLabel] = useState(defaultLabel);
  const [mode, setMode] = useState<"random" | "algorithmic">("random");
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<any>(null);

  async function handleSimulate() {
    setLoading(true);
    setSimResult(null);
    setPublished(null);
    const res = await fetch("/api/draw/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodLabel, mode }),
    });
    setSimResult(await res.json());
    setLoading(false);
  }

  async function handlePublish() {
    if (!simResult) return;
    setPublishing(true);
    const res = await fetch("/api/draw/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodLabel: simResult.periodLabel,
        mode: simResult.mode,
        winningNumbers: simResult.winningNumbers,
        totalPoolCents: simResult.totalPoolCents,
        jackpotRolloverCents: simResult.jackpotRolloverCents,
      }),
    });
    const json = await res.json();
    setPublished(json);
    setPublishing(false);
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div className="card h-fit space-y-4">
        <p className="label">Configure draw</p>
        <div>
          <label className="label">Period label</label>
          <input className="input" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
        </div>
        <div>
          <label className="label">Draw mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="random">Random — standard lottery style</option>
            <option value="algorithmic">Algorithmic — weighted by score frequency</option>
          </select>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="btn-secondary w-full !py-2.5 text-sm">
          {loading ? "Simulating…" : "Run simulation"}
        </button>
        {simResult && !published && (
          <button onClick={handlePublish} disabled={publishing} className="btn-primary w-full !py-2.5 text-sm">
            {publishing ? "Publishing…" : "Publish this result"}
          </button>
        )}
        {published && <p className="text-sm text-leaf">Published — {published.winnerCount} winner(s) recorded.</p>}
      </div>

      <div className="card">
        <p className="label">Simulation preview</p>
        {!simResult && <p className="mt-2 text-sm text-muted">Run a simulation to preview winning numbers and payouts before publishing.</p>}
        {simResult && (
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-parchment">
              Winning numbers: <span className="text-brass">{simResult.winningNumbers.join(", ")}</span>
            </p>
            <p className="text-muted">Entrants: {simResult.entrantCount} · Total pool: ₹{(simResult.totalPoolCents / 100).toLocaleString("en-IN")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[5, 4, 3].map((tier) => (
                <div key={tier} className="rounded-sm border border-line p-3">
                  <p className="text-muted">{tier}-match</p>
                  <p className="text-parchment">{simResult.winnerCountByTier[tier]} winner(s)</p>
                  <p className="text-brass">₹{(simResult.perWinnerCents[tier] / 100).toLocaleString("en-IN")} each</p>
                </div>
              ))}
            </div>
            {simResult.newJackpotRolloverCents > 0 && (
              <p className="text-leaf">Jackpot rolls over: ₹{(simResult.newJackpotRolloverCents / 100).toLocaleString("en-IN")}</p>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <p className="label">Draw history</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2">Period</th>
              <th className="py-2">Mode</th>
              <th className="py-2">Status</th>
              <th className="py-2">Winning numbers</th>
            </tr>
          </thead>
          <tbody>
            {pastDraws.map((d) => (
              <tr key={d.id} className="border-b border-line/60">
                <td className="py-2 text-parchment">{d.period_label}</td>
                <td className="py-2 text-muted">{d.mode}</td>
                <td className="py-2 text-muted">{d.status}</td>
                <td className="py-2 text-muted">{d.winning_numbers?.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
