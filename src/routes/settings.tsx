import { lsStore } from "@/lib/lsStore";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, useShellState, SECTION_ICONS } from "@/components/AppShell";
import { SECTIONS, STAFF, STATUSES } from "@/lib/lineCheck";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Utensils,
  Users,
  Tag,
  Clock,
  Package,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Upload,
  GripVertical,
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

type Tab = "branding" | "stations" | "team" | "statuses" | "shelves" | "containers";

const ICON_OPTIONS = Object.keys(SECTION_ICONS);

type LocalStation = {
  name: string;
  icon: string;
  items: { name: string }[];
};

const STATIONS_KEY = "linecheck:settings:stations";
const STAFF_KEY = "linecheck:settings:staff";
const STATUSES_KEY = "linecheck:settings:statuses";
const SHELVES_KEY = "linecheck:settings:shelves";
const CONTAINERS_KEY = "linecheck:settings:containers";

const DEFAULT_SHELVES = [
  "By Expiration",
  "1 Day",
  "2 Days",
  "3 Days",
  "5 Days",
  "7 Days",
  "30 Days",
  "60 Days",
];
const DEFAULT_CONTAINERS = [
  "Can",
  "Bottle",
  "Jar",
  "Container",
  "1/9 Pan",
  "1/6 Pan",
  "1/4 Pan",
  "1/3 Pan",
  "1/2 Pan",
  "Full Pan",
  "Squeeze Bottle",
  "Drizzle Bottle",
  "Shaker",
  "Piping Bag",
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = lsStore.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function SettingsPage() {
  const shell = useShellState("Settings");
  const [tab, setTab] = useState<Tab>("branding");

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
          <TabPill active={tab === "branding"} onClick={() => setTab("branding")} icon={<ImageIcon className="h-4 w-4" />}>
            Branding
          </TabPill>
          <TabPill active={tab === "stations"} onClick={() => setTab("stations")} icon={<Utensils className="h-4 w-4" />}>
            Stations & Items
          </TabPill>
          <TabPill active={tab === "team"} onClick={() => setTab("team")} icon={<Users className="h-4 w-4" />}>
            Team Members
          </TabPill>
          <TabPill active={tab === "statuses"} onClick={() => setTab("statuses")} icon={<Tag className="h-4 w-4" />}>
            Status Options
          </TabPill>
          <TabPill active={tab === "shelves"} onClick={() => setTab("shelves")} icon={<Clock className="h-4 w-4" />}>
            Shelf Life
          </TabPill>
          <TabPill active={tab === "containers"} onClick={() => setTab("containers")} icon={<Package className="h-4 w-4" />}>
            Container
          </TabPill>
        </div>

        {tab === "branding" && <BrandingPanel />}
        {tab === "stations" && <StationsPanel />}
        {tab === "team" && <TeamPanel />}
        {tab === "statuses" && <StatusPanel />}
        {tab === "shelves" && (
          <SimpleListPanel
            storageKey={SHELVES_KEY}
            defaults={DEFAULT_SHELVES}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            placeholder="New shelf life (e.g. 3 Days)..."
            eventName="linecheck:shelves-update"
          />
        )}
        {tab === "containers" && (
          <SimpleListPanel
            storageKey={CONTAINERS_KEY}
            defaults={DEFAULT_CONTAINERS}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            placeholder="New container (e.g. 1/6 Pan)..."
            eventName="linecheck:containers-update"
          />
        )}
      </div>
    </AppShell>
  );
}

/* ============= BRANDING ============= */

const BRAND_NAME_KEY = "linecheck:settings:brand:name";
const BRAND_LOGO_KEY = "linecheck:settings:brand:logo";

function BrandingPanel() {
  const [name, setName] = useState("LUMA");
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setName(lsStore.getItem(BRAND_NAME_KEY) || "LUMA");
      setLogo(lsStore.getItem(BRAND_LOGO_KEY));
    } catch {}
  }, []);

  const saveName = (v: string) => {
    setName(v);
    try {
      lsStore.setItem(BRAND_NAME_KEY, v);
      window.dispatchEvent(new Event("linecheck:brand-update"));
    } catch {}
  };

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setLogo(dataUrl);
      try {
        lsStore.setItem(BRAND_LOGO_KEY, dataUrl);
        window.dispatchEvent(new Event("linecheck:brand-update"));
      } catch {
        alert("Image too large to store locally.");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    try {
      lsStore.removeItem(BRAND_LOGO_KEY);
      window.dispatchEvent(new Event("linecheck:brand-update"));
    } catch {}
  };

  const initial = (name || "L").trim().charAt(0).toUpperCase() || "L";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-3">
          {logo ? (
            <img src={logo} alt={name} className="h-24 w-24 rounded-2xl object-cover border border-border" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-2xl bg-foreground text-background text-3xl font-bold">
              {initial}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
            {logo && (
              <button
                onClick={removeLogo}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-danger hover:bg-danger-soft"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Brand name
          </label>
          <input
            value={name}
            onChange={(e) => saveName(e.target.value)}
            placeholder="LUMA"
            className="mt-2 w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-foreground/30"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Your branding and all settings are stored on this device only —
            each account stays independent and your customizations are kept
            across app updates.
          </p>
        </div>
      </div>
    </div>
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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [grabbedIdx, setGrabbedIdx] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const gripRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (from: number, to: number, announce?: (name: string, pos: number, total: number) => string) => {
    setStations((s) => {
      if (to < 0 || to >= s.length || from === to) return s;
      const next = s.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      if (announce) setAnnouncement(announce(it.name, to + 1, next.length));
      // refocus the moved grip after the DOM updates
      queueMicrotask(() => gripRefs.current[to]?.focus());
      return next;
    });
  };

  useEffect(() => {
    lsStore.setItem(STATIONS_KEY, JSON.stringify(stations));
  }, [stations]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const used = new Set(stations.map((s) => s.icon));
    const nextIcon =
      ICON_OPTIONS.find((k) => !used.has(k)) ??
      ICON_OPTIONS[stations.length % ICON_OPTIONS.length] ??
      "Utensils";
    setStations((s) => [{ name: n.toUpperCase(), icon: nextIcon, items: [] }, ...s]);
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

      <p className="mb-2 text-xs text-muted-foreground">
        Reorder stations by dragging the handle, using the up/down buttons, or
        pressing Space on the handle then using the arrow keys (Escape to cancel).
      </p>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ul className="space-y-2" aria-label="Stations, reorderable">
        {stations.map((st, idx) => {
          const Icon = SECTION_ICONS[st.icon] ?? Utensils;
          const open = expanded === st.name;
          const grabbed = grabbedIdx === idx;
          return (
            <li
              key={st.name + idx}
              aria-label={`${st.name}, position ${idx + 1} of ${stations.length}`}
              className={`rounded-2xl border bg-card shadow-sm transition-opacity ${
                dragIdx === idx ? "opacity-50" : ""
              } ${grabbed ? "border-foreground ring-2 ring-foreground/30" : "border-border"}`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  ref={(el) => {
                    gripRefs.current[idx] = el;
                  }}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDragIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                    try {
                      e.dataTransfer.setData("text/plain", String(idx));
                    } catch {}
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      if (grabbed) {
                        setGrabbedIdx(null);
                        setAnnouncement(`${st.name} dropped at position ${idx + 1}`);
                      } else {
                        setGrabbedIdx(idx);
                        setAnnouncement(
                          `${st.name} grabbed. Use arrow keys to move, Space or Enter to drop, Escape to cancel.`,
                        );
                      }
                    } else if (e.key === "Escape" && grabbed) {
                      e.preventDefault();
                      setGrabbedIdx(null);
                      setAnnouncement(`Reorder cancelled. ${st.name} at position ${idx + 1}.`);
                    } else if (grabbed && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                      e.preventDefault();
                      const to = idx + (e.key === "ArrowUp" ? -1 : 1);
                      if (to >= 0 && to < stations.length) {
                        move(idx, to, (n, pos, total) => `${n} moved to position ${pos} of ${total}`);
                        setGrabbedIdx(to);
                      }
                    }
                  }}
                  onBlur={() => grabbed && setGrabbedIdx(null)}
                  aria-label={`Reorder ${st.name}. Press Space to grab, arrow keys to move, Space or Enter to drop.`}
                  aria-pressed={grabbed}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/40 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
                <div
                  className="contents"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null) move(dragIdx, idx);
                    setDragIdx(null);
                  }}
                >
                <button
                  onClick={() => setExpanded(open ? null : st.name)}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label={`${open ? "Collapse" : "Expand"} ${st.name}`}
                  aria-expanded={open}
                >
                  {open ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                </button>

                <IconPicker
                  value={st.icon}
                  onChange={(v) =>
                    setStations((s) =>
                      s.map((x, i) => (i === idx ? { ...x, icon: v } : x)),
                    )
                  }
                />

                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-bold tracking-tight">{st.name}</span>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() =>
                      move(idx, idx - 1, (n, pos, total) => `${n} moved up to position ${pos} of ${total}`)
                    }
                    disabled={idx === 0}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/40"
                    aria-label={`Move ${st.name} up`}
                  >
                    <span aria-hidden="true">↑</span>
                  </button>
                  <button
                    onClick={() =>
                      move(idx, idx + 1, (n, pos, total) => `${n} moved down to position ${pos} of ${total}`)
                    }
                    disabled={idx === stations.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/40"
                    aria-label={`Move ${st.name} down`}
                  >
                    <span aria-hidden="true">↓</span>
                  </button>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {st.items.length} cats
                  </span>
                </div>


                <button
                  onClick={() =>
                    setStations((s) => s.filter((_, i) => i !== idx))
                  }
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger focus:outline-none focus:ring-2 focus:ring-foreground/40"
                  aria-label={`Delete ${st.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
                </div>
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

/* ============= ICON PICKER ============= */

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Current = SECTION_ICONS[value] ?? Utensils;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose icon"
        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-warning hover:bg-muted"
      >
        <Current className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-30 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Pick an icon
          </p>
          <div className="grid grid-cols-6 gap-1">
            {ICON_OPTIONS.map((k) => {
              const Ico = SECTION_ICONS[k] ?? Utensils;
              const active = k === value;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                  title={k}
                  className={`relative grid h-8 w-8 place-items-center rounded-md border transition ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Ico className="h-4 w-4" />
                  {active && (
                    <Check className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 p-0.5 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



/* ============= TEAM ============= */

function TeamPanel() {
  const [members, setMembers] = useState<string[]>(() => loadJSON(STAFF_KEY, STAFF));
  const [name, setName] = useState("");

  useEffect(() => {
    lsStore.setItem(STAFF_KEY, JSON.stringify(members));
    window.dispatchEvent(new Event("linecheck:staff-update"));
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
    lsStore.setItem(STATUSES_KEY, JSON.stringify(statuses));
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

/* ============= SIMPLE LIST (SHELVES / CONTAINERS) ============= */

function SimpleListPanel({
  storageKey,
  defaults,
  icon,
  placeholder,
  eventName,
}: {
  storageKey: string;
  defaults: string[];
  icon: React.ReactNode;
  placeholder: string;
  eventName: string;
}) {
  const [items, setItems] = useState<string[]>(() => loadJSON(storageKey, defaults));
  const [name, setName] = useState("");

  useEffect(() => {
    lsStore.setItem(storageKey, JSON.stringify(items));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(eventName));
    }
  }, [items, storageKey, eventName]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (items.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setName("");
      return;
    }
    setItems((s) => [n, ...s]);
    setName("");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
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
        {items.map((v, i) => (
          <li
            key={v + i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            {icon}
            <span className="font-semibold tracking-tight">{v}</span>
            <button
              onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}
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
