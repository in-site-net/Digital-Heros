"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Score } from "@/lib/types";

export default function ScorePanel({ initialScores }: { initialScores: Score[] }) {
  const supabase = createClient();
  const [scores, setScores] = useState<Score[]>(initialScores);
  const [score, setScore] = useState("");
  const [playedOn, setPlayedOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false });
    setScores(data ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number(score);
    if (n < 1 || n > 45) {
      setError("Stableford score must be between 1 and 45.");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // upsert handles "edit if the date already exists" per §05's note that
    // duplicate dates aren't allowed — you edit the existing entry instead.
    const { error: upsertError } = await supabase
      .from("scores")
      .upsert({ user_id: user.id, score: n, played_on: playedOn }, { onConflict: "user_id,played_on" });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setScore("");
      await refresh();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("scores").delete().eq("id", id);
    await refresh();
  }

  return (
    <div className="card">
      <p className="label">Your last 5 scores</p>
      <form onSubmit={handleAdd} className="mt-2 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" max={new Date().toISOString().slice(0, 10)} value={playedOn} onChange={(e) => setPlayedOn(e.target.value)} />
        </div>
        <div>
          <label className="label">Score (1–45)</label>
          <input type="number" min={1} max={45} className="input w-28" required value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary !py-2.5 text-sm">
          {saving ? "Saving…" : "Add / update"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      <ul className="mt-5 space-y-2">
        {scores.map((s) => (
          <li key={s.id} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm">
            <span className="text-muted">{new Date(s.played_on).toLocaleDateString()}</span>
            <span className="text-parchment">{s.score} pts</span>
            <button onClick={() => handleDelete(s.id)} className="text-xs text-clay hover:underline">
              Delete
            </button>
          </li>
        ))}
        {scores.length === 0 && <p className="text-sm text-muted">No scores logged yet.</p>}
      </ul>
    </div>
  );
}
