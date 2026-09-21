"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserRow = {
  id: string;
  full_name: string | null;
  role: "subscriber" | "admin";
  charity_percent: number;
  subscriptions: { status: string; plan: string }[] | null;
};

export default function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [openScoresFor, setOpenScoresFor] = useState<string | null>(null);
  const [scores, setScores] = useState<{ id: string; score: number; played_on: string }[]>([]);

  async function toggleRole(id: string, current: "subscriber" | "admin") {
    const next = current === "admin" ? "subscriber" : "admin";
    await supabase.from("profiles").update({ role: next }).eq("id", id);
    setUsers((u) => u.map((row) => (row.id === id ? { ...row, role: next } : row)));
  }

  async function openScores(userId: string) {
    if (openScoresFor === userId) {
      setOpenScoresFor(null);
      return;
    }
    const { data } = await supabase
      .from("scores")
      .select("id, score, played_on")
      .eq("user_id", userId)
      .order("played_on", { ascending: false });
    setScores(data ?? []);
    setOpenScoresFor(userId);
  }

  async function updateScore(id: string, value: number) {
    if (value < 1 || value > 45) return;
    await supabase.from("scores").update({ score: value }).eq("id", id);
    setScores((s) => s.map((row) => (row.id === id ? { ...row, score: value } : row)));
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-3">Name</th>
            <th className="py-3">Role</th>
            <th className="py-3">Subscription</th>
            <th className="py-3">Charity %</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <>
              <tr key={u.id} className="border-b border-line/60">
                <td className="py-3 text-parchment">{u.full_name ?? "—"}</td>
                <td className="py-3">
                  <span className={u.role === "admin" ? "text-brass" : "text-muted"}>{u.role}</span>
                </td>
                <td className="py-3 text-muted">
                  {u.subscriptions?.[0] ? `${u.subscriptions[0].plan} · ${u.subscriptions[0].status}` : "none"}
                </td>
                <td className="py-3 text-muted">{u.charity_percent}%</td>
                <td className="py-3 space-x-3">
                  <button onClick={() => toggleRole(u.id, u.role)} className="text-xs text-brass hover:underline">
                    {u.role === "admin" ? "Revoke admin" : "Make admin"}
                  </button>
                  <button onClick={() => openScores(u.id)} className="text-xs text-leaf hover:underline">
                    {openScoresFor === u.id ? "Hide scores" : "Edit scores"}
                  </button>
                </td>
              </tr>
              {openScoresFor === u.id && (
                <tr key={`${u.id}-scores`} className="border-b border-line/60 bg-surface2/40">
                  <td colSpan={5} className="py-3">
                    {scores.length === 0 ? (
                      <p className="text-xs text-muted">No scores logged.</p>
                    ) : (
                      <div className="flex flex-wrap gap-4">
                        {scores.map((s) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="text-xs text-muted">{new Date(s.played_on).toLocaleDateString()}</span>
                            <input
                              type="number"
                              min={1}
                              max={45}
                              defaultValue={s.score}
                              onBlur={(e) => updateScore(s.id, Number(e.target.value))}
                              className="input !w-16 !py-1 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
