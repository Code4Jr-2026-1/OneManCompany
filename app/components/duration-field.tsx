"use client"
import { useState } from "react"

const PRESETS = [30, 45, 60, 90, 120]

export function DurationField({ defaultValue = 60, label = "Duration (min)" }: { defaultValue?: number; label?: string }) {
  const isPreset = PRESETS.includes(defaultValue)
  const [selected, setSelected] = useState<string>(isPreset ? String(defaultValue) : "other")

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1">{label}</label>
      <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        {PRESETS.map(p => <option key={p} value={p}>{p} min</option>)}
        <option value="other">Other…</option>
      </select>
      {selected === "other" ? (
        <input key="custom" name="duration" type="number" min={1} step={1} defaultValue={defaultValue} required
          placeholder="Enter minutes" className="w-full border rounded-lg px-3 py-2 text-sm mt-2" />
      ) : (
        <input key="preset" type="hidden" name="duration" value={selected} />
      )}
    </div>
  )
}
