"use client";
'use client';

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { globalSearchResults } from "@/lib/data";
import { Search } from "lucide-react";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const results = useMemo(() => {
    return globalSearchResults.filter((result) => {
      const matchesQuery = `${result.label} ${result.meta}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || result.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="text-xs uppercase text-slate-400">Global search</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patients, doctors, or records"
              className="border-0 bg-transparent px-0 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase text-slate-400">Filter</label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-2 h-11 rounded-2xl border border-slate-200 px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="record">Records</option>
          </select>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {results.map((result) => (
          <li key={result.id} className="rounded-2xl border border-slate-100 px-3 py-2">
            <p className="font-semibold text-slate-900">{result.label}</p>
            <p className="text-xs uppercase text-slate-400">{result.type}</p>
            <p>{result.meta}</p>
          </li>
        ))}
        {results.length === 0 ? <p className="text-center text-sm text-slate-400">No results</p> : null}
      </ul>
    </div>
  );
}
