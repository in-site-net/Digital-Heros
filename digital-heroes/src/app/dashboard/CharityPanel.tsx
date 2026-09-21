"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Charity, Profile } from "@/lib/types";
import { MIN_CHARITY_PERCENT } from "@/lib/types";

export default function CharityPanel({ profile, charities }: { profile: Profile | null; charities: Charity[] }) {
  const supabase = createClient();
  const [charityId, setCharityId] = useState(profile?.charity_id ?? "");
  const [percent, setPercent] = useState(profile?.charity_percent ?? MIN_CHARITY_PERCENT);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ charity_id: charityId, charity_percent: percent }).eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const current = charities.find((c) => c.id === charityId);

  return (
    <div className="card">
      <p className="label">Your charity</p>
      <select className="input mt-2" value={charityId} onChange={(e) => setCharityId(e.target.value)}>
        <option value="">Choose a charity…</option>
        {charities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {current && <p className="mt-2 text-sm text-muted">{current.summary}</p>}

      <div className="mt-4">
        <label className="label">Contribution: {percent}%</label>
        <input
          type="range"
          min={MIN_CHARITY_PERCENT}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-full accent-leaf"
        />
      </div>

      <button onClick={handleSave} className="btn-secondary mt-4 !py-2 text-sm">
        {saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}
