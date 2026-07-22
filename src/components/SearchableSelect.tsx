"use client";

import { useEffect, useRef, useState } from "react";
import { inputCls } from "@/components/ui";

export interface Option {
  value: string;
  label: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Type to search…",
  id,
}: {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        className={inputCls}
        placeholder={placeholder}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") {
            e.preventDefault();
            if (open && filtered.length > 0) {
              onChange(filtered[0].value);
              setOpen(false);
            }
          }
        }}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-gray-400">No matches</li>
          )}
          {filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={`block w-full px-3 py-2 text-left hover:bg-blue-50 ${
                  o.value === value ? "bg-blue-50 font-medium" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
