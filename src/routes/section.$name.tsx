import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, useShellState } from "@/components/AppShell";
import {
  SECTIONS,
  STATUSES,
  emptyEntry,
  loadSection,
  storageKey,
  FLAG_STATUSES,
  type Entry,
  type SectionState,
  type Slot,
} from "@/lib/lineCheck";
import { Check, Edit3, Filter, MoreHorizontal, Save, Thermometer } from "lucide-react";

export const Route = createFileRoute("/section/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — Line Check` },
      { name: "description", content: `Line check for ${params.name} section.` },
    ],
  }),
  component: SectionPage,
  notFoundComponent: () => <div className="p-10">Section not found.</div>,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-10">
        <p className="text-destructive">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  },
});

const STATUS_STYLES: Record<string, string> = {
  OK: "bg-emerald-500 text-white border-emerald-500",
  "N/A": "bg-muted text-muted-foreground border-border",
  "F/O": "bg-amber-100 text-amber-900 border-amber-300",
  PREPPING: "bg-sky-100 text-sky-900 border-sky-300",
  "NEED TO CLEAN": "bg-sky-100 text-sky-900 border-sky-300",
  "WRONG LABEL": "bg-violet-100 text-violet-900 border-violet-300",
  "ABOUT TO EXPIRE": "bg-amber-100 text-amber-900 border-amber-300",
  EXPIRED: "bg-rose-100 text-rose-900 border-rose-300",
};

function SectionPage() {
  const { name } = Route.useParams();
  const section = SECTIONS.find((s) => s.name === name);
  const shell = useShellState(name);

  const key = useMemo(() => storageKey(name, shell.date), [name, shell.date]);
  const [state, setState] = useState<SectionState>(() => loadSection(name, shell.date));
  const [editMode, setEditMode] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => {
    setState(loadSection(name, shell.date));
  }, [name, shell.date]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      window.dispatchEvent(new Event("linecheck:update"));
    } catch {}
  }, [key, state]);

  if (!section) return <div className="p-10">Section not found.</div>;

  const slot: Slot = shell.shift;
  const groups = section.items.reduce<Record<string, typeof section.items>>((acc, it) => {
    const k = it.group || "Items";
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  const total = section.items.length;
  const done = section.items.filter((i) => state.entries[i.name]?.[slot]?.status).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const setEntry = (item: string, patch: Partial<Entry>) => {
    setState((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [item]: {
          op: prev.entries[item]?.op ?? emptyEntry(),
          mid: prev.entries[item]?.mid ?? emptyEntry(),
          cl: prev.entries[item]?.cl ?? emptyEntry(),
          [slot]: { ...(prev.entries[item]?.[slot] ?? emptyEntry()), ...patch },
        },
      },
    }));
  };

  const toggleCheck = (item: string) => {
    const cur = state.entries[item]?.[slot]?.status;
    setEntry(item, { status: cur === "OK" ? "" : "OK" });
  };

  const markAllOK = () => {
    setState((prev) => {
      const entries = { ...prev.entries };
      for (const it of section.items) {
        entries[it.name] = {
          op: entries[it.name]?.op ?? emptyEntry(),
          mid: entries[it.name]?.mid ?? emptyEntry(),
          cl: entries[it.name]?.cl ?? emptyEntry(),
          [slot]: { status: "OK", note: entries[it.name]?.[slot]?.note ?? "" },
        };
      }
      return { ...prev, entries };
    });
  };

  const saveCheck = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      window.dispatchEvent(new Event("linecheck:update"));
    } catch {}
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  };

  const shiftLabel = slot === "op" ? "Opening" : slot === "mid" ? "Mid" : "Closing";
  // ring color stops
  const ringStyle = {
    background: `conic-gradient(var(--ring-color, hsl(258 90% 66%)) ${pct * 3.6}deg, hsl(var(--muted)) 0deg)`,
  } as React.CSSProperties;

  return (
    <AppShell {...shell}>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-bold tracking-tight">{section.name}</h1>
      </div>

      {/* Hero card */}
      <section className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight">{section.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {done} of {total} items checked · {shiftLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="grid h-14 w-14 place-items-center rounded-full"
              style={ringStyle}
              aria-label={`${pct} percent complete`}
            >
              <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-card text-sm font-bold tabular-nums">
                {pct}
              </div>
            </div>
            <button
              onClick={() => setFlaggedOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                flaggedOnly
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <Filter className="h-3.5 w-3.5" /> {flaggedOnly ? "Flagged Only" : "All Items"}
            </button>
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                editMode
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> {editMode ? "Done" : "Edit"}
            </button>
            <button
              onClick={markAllOK}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-accent"
            >
              <Check className="h-3.5 w-3.5" /> Mark All OK
            </button>
            <button
              onClick={saveCheck}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5" /> {savedFlash ? "Saved!" : "Save Check"}
            </button>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: "var(--gradient-readiness)" }}
          />
        </div>
      </section>

      {/* Groups */}
      {Object.entries(groups)
        .map(([group, items]) => {
          const visible = items.filter((item) => {
            if (!flaggedOnly) return true;
            const s = state.entries[item.name]?.[slot]?.status;
            return !!s && FLAG_STATUSES.has(s);
          });
          return [group, visible] as const;
        })
        .filter(([, visible]) => visible.length > 0)
        .map(([group, items]) => (
          <section key={group} className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {group}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Thermometer className="h-3 w-3 text-sky-500" /> Temp
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
              const e = state.entries[item.name]?.[slot];
              const status = e?.status ?? "";
              const checked = !!status;
              const flagged = status && FLAG_STATUSES.has(status);
              const itemPct = checked ? 100 : 0;

              return (
                <div
                  key={item.name}
                  className={`flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 transition ${
                    flagged ? "border-rose-200" : "border-border"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(item.name)}
                    aria-label={checked ? "Uncheck item" : "Mark item OK"}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition ${
                      checked
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {checked && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>

                  {/* Name + spec */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        checked ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.shelf || item.quality || "—"}
                      {item.container ? ` · ${item.container}` : ""}
                    </p>
                  </div>

                  {editMode && (
                    <input
                      type="text"
                      value={e?.note ?? ""}
                      onChange={(ev) => setEntry(item.name, { note: ev.target.value })}
                      placeholder="note / temp"
                      className="hidden w-32 rounded-md border border-input bg-background px-2 py-1 text-[11px] md:block"
                    />
                  )}

                  {/* Mini progress */}
                  <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${itemPct}%`,
                        background: "var(--gradient-readiness)",
                      }}
                    />
                  </div>

                  {/* Status select */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(ev) => setEntry(item.name, { status: ev.target.value })}
                      className={`appearance-none rounded-md border px-2.5 py-1 pr-6 text-[11px] font-semibold uppercase tracking-wide ${
                        status
                          ? STATUS_STYLES[status] ?? "border-border bg-card"
                          : "border-input bg-background text-muted-foreground"
                      }`}
                      aria-label={`${item.name} status`}
                    >
                      <option value="">Unchecked</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-70"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <button
                    className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                    aria-label="More options"
                    onClick={() => setEntry(item.name, { note: prompt("Note for this item:", e?.note ?? "") ?? e?.note ?? "" })}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
