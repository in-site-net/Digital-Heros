"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Charity } from "@/lib/types";

const empty = { name: "", summary: "", description: "", category: "", is_featured: false };

export default function CharityManager({ initialCharities }: { initialCharities: Charity[] }) {
  const supabase = createClient();
  const [charities, setCharities] = useState(initialCharities);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase.from("charities").select("*").order("name");
    setCharities(data ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("charities").insert(form);
    setForm(empty);
    await refresh();
    setSaving(false);
  }

  async function toggleFeatured(c: Charity) {
    await supabase.from("charities").update({ is_featured: !c.is_featured }).eq("id", c.id);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this charity? Subscribers who chose it will be unassigned.")) return;
    await supabase.from("charities").delete().eq("id", id);
    await refresh();
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-3">Name</th>
              <th className="py-3">Category</th>
              <th className="py-3">Featured</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {charities.map((c) => (
              <tr key={c.id} className="border-b border-line/60">
                <td className="py-3 text-parchment">{c.name}</td>
                <td className="py-3 text-muted">{c.category ?? "—"}</td>
                <td className="py-3">
                  <button onClick={() => toggleFeatured(c)} className={c.is_featured ? "text-leaf" : "text-muted"}>
                    {c.is_featured ? "Yes" : "No"}
                  </button>
                </td>
                <td className="py-3">
                  <button onClick={() => remove(c.id)} className="text-xs text-clay hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="card h-fit space-y-3">
        <p className="label">Add a charity</p>
        <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Short summary" required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea className="input" placeholder="Full description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 text-sm">
          {saving ? "Adding…" : "Add charity"}
        </button>
      </form>
    </div>
  );
}
