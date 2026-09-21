"use client";

import { useMemo, useState } from "react";
import type { Charity } from "@/lib/types";

export default function CharityDirectory({ charities }: { charities: Charity[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(charities.map((c) => c.category).filter(Boolean) as string[]))],
    [charities]
  );

  const filtered = charities.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.summary.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || c.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search charities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[200px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div key={c.id} className="card flex flex-col">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl text-parchment">{c.name}</h3>
              {c.is_featured && <span className="rounded-full bg-leaf-dim px-2.5 py-1 text-xs text-leaf">Featured</span>}
            </div>
            <p className="mt-2 text-sm text-muted">{c.summary}</p>
            {c.upcoming_event_name && (
              <p className="mt-3 text-xs text-leaf">
                Upcoming: {c.upcoming_event_name}
                {c.upcoming_event_date ? ` · ${new Date(c.upcoming_event_date).toLocaleDateString()}` : ""}
              </p>
            )}
            {c.category && <p className="mt-auto pt-4 text-xs text-muted">{c.category}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted">No charities match that search.</p>
        )}
      </div>
    </div>
  );
}
