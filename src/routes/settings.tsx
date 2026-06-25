import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, useShellState, SECTION_ICONS } from "@/components/AppShell";
import { SECTIONS, STAFF, STATUSES } from "@/lib/lineCheck";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Utensils,
  Users,
  Tag,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Line Check 2026" },
      { name: "description", content: "Manage stations, items, team members and status options." },
    ],
  }),
  component: SettingsPage,
});

type Tab = "stations" | "team" | "statuses";

const ICON_OPTIONS = Object.keys(SECTION_ICONS);

type LocalStation = {
  name: string;
  icon: string;
  items: { name: string }[];
};

const STATIONS_KEY = "linecheck:settings:stations";
const STAFF_KEY = "linecheck:settings:staff";
const STATUSES_KEY = "linecheck:settings:statuses";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function SettingsPage() {
  const shell = useShellState("Settings");
  const [tab, setTab] = useState<Tab>("stations");

  return (
    <AppShell {...shell} title="Settings">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <Link
            to="/"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <SettingsIcon className="h-5 w-5 text-foreground" />
          <h2 className="text-2xl font-extrabold tracking-tight">Settings</h2>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <TabPill active={tab === "stations"} onClick={() => setTab("stations")} icon={<Utensils className="h-4 w-4" />}>
            Stations & Items
          </TabPill>
          <TabPill active={tab === "team"} onClick={() => setTab("team")} icon={<Users className="h-4 w-4" />}>
            Team Members
          </TabPill>
          <TabPill active={tab === "statuses"} onClick={() => setTab("statuses")} icon={<Tag className="h-4 w-4" />}>
            Status Options
          </TabPill>
        </div>

        {tab === "stations" && <StationsPanel />}
        {tab === "team" && <TeamPanel />}
        {tab === "statuses" && <StatusPanel />}
      </div>
    </AppShell>
  );
}

function TabPill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "border border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ============= STATIONS ============= */

function StationsPanel() {
  const initial: LocalStation[] = useMemo(
    () =>
      SECTIONS.map((s) => ({
        name: s.name,
        icon: Object.keys(SECTION_ICONS).find((k) => k === s.name) ?? "Utensils",
        items: s.items.map((i) => ({ name: i.name })),
      })),
    [],
  );
  const [stations, setStations] = useState<LocalStation[]>(() =>
    loadJSON(STATIONS_KEY, initial),
  );
  const [name, setName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STATIONS_KEY, JSON.stringify(stations));
  }, [stations]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setStations((s) => [{ name: n.toUpperCase(), icon: "Utensils", items: [] }, ...s]);
    setName("");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New station name..."
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-foreground/30"
        />
        <button
          onClick={add}
          className="flex items-center gap-1.5 rounded-full bg-muted-foreground/80 px-5 py-3 text-sm font-semibold text-background hover:bg-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <ul className="space-y-2">
        {stations.map((st, idx) => {
          const Icon = SECTION_ICONS[st.icon] ?? Utensils;
          const open = expanded === st.name;
          return (
            <li
              key={st.name + idx}
              className="rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpanded(open ? null : st.name)}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label="Expand"
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className="relative">
                  <select
                    value={st.icon}
                    onChange={(e) =>
                      setStations((s) =>
                        s.map((x, i) => (i === idx ? { ...x, icon: e.target.value } : x)),
                      )
                    }
                    className="appearance-none rounded-md border border-border bg-background py-1 pl-2 pr-7 text-xs font-medium text-warning"
                  >
                    {ICON_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>

                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold tracking-tight">{st.name}</span>

                <span className="ml-auto text-xs text-muted-foreground">
                  {st.items.length} cats
                </span>
                <button
                  onClick={() =>
                    setStations((s) => s.filter((_, i) => i !== idx))
                  }
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {open && (
                <div className="border-t border-border px-12 py-3">
                  {st.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No items yet.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-1.5 text-xs">
                      {st.items.map((it) => (
                        <li
                          key={it.name}
                          className="rounded-md bg-muted/50 px-2 py-1 text-muted-foreground"
                        >
                          {it.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============= TEAM ============= */

function TeamPanel() {
  const [members, setMembers] = useState<string[]>(() => loadJSON(STAFF_KEY, STAFF));
  const [name, setName] = useState("");

  useEffect(() => {
    localStorage.setItem(STAFF_KEY, JSON.stringify(members));
  }, [members]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setMembers((m) => [n, ...m]);
    setName("");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New team member..."
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-foreground/30"
        />
        <button
          onClick={add}
          className="flex items-center gap-1.5 rounded-full bg-muted-foreground/80 px-5 py-3 text-sm font-semibold text-background hover:bg-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <ul className="space-y-2">
        {members.map((m, i) => (
          <li
            key={m + i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold tracking-tight">{m}</span>
            <button
              onClick={() => setMembers((arr) => arr.filter((_, j) => j !== i))}
              className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============= STATUSES ============= */

function StatusPanel() {
  const [statuses, setStatuses] = useState<string[]>(() => loadJSON(STATUSES_KEY, STATUSES));
  const [name, setName] = useState("");

  useEffect(() => {
    localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
  }, [statuses]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setStatuses((s) => [n.toUpperCase(), ...s]);
    setName("");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New status..."
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-foreground/30"
        />
        <button
          onClick={add}
          className="flex items-center gap-1.5 rounded-full bg-muted-foreground/80 px-5 py-3 text-sm font-semibold text-background hover:bg-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <ul className="space-y-2">
        {statuses.map((s, i) => (
          <li
            key={s + i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold tracking-tight">{s}</span>
            <button
              onClick={() => setStatuses((arr) => arr.filter((_, j) => j !== i))}
              className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
