import React, { useEffect, useMemo, useRef, useState } from "react";

// QuarterCade UI — Lightweight, Controller-First, Modular, Arch-ready
// - Plain JS React + Tailwind classes (no TS) for preview + easy build on Arch
// - Minimal effects for VM friendliness; keeps 60fps on low cores/RAM
// - Gamepad-first navigation with keyboard fallback
// - Modular "tiles" so you can plug in Steam/Heroic/Retro/Apps easily
// - Drop-in integration points: onOpenModule(id), onOpenLibrary(), etc.

// ────────────────────────────────────────────────────────────────────────────────
// Config / Registry (Edit here to add/remove modules)
// ────────────────────────────────────────────────────────────────────────────────
const MODULES = [
  { id: "steam",    label: "Steam",    caption: "PC library",        icon: "steam" },
  { id: "heroic",   label: "Heroic",   caption: "Epic/GOG",          icon: "heroic" },
  { id: "retro",    label: "Retro",    caption: "Emulation",         icon: "retro" },
  { id: "apps",     label: "Apps",     caption: "Utilities",         icon: "apps" },
  { id: "settings", label: "Settings", caption: "System settings",    icon: "settings" },
];

const LIBRARY = [
  { id: 1, name: "Tales of the Elements", platform: "Steam", hours: 12.3 },
  { id: 2, name: "Astraverse Demo", platform: "Native", hours: 2.1 },
  { id: 3, name: "PSO Blue Burst", platform: "Lutris", hours: 54.7 },
  { id: 4, name: "Celeste", platform: "Steam", hours: 6.4 },
  { id: 5, name: "Hades", platform: "Steam", hours: 33.9 },
  { id: 6, name: "Stardew Valley", platform: "GOG", hours: 107.5 },
];

const TABS = ["Home", "Library", "Store", "Settings"];

// ────────────────────────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const indexToRC = (index, cols) => ({ r: Math.floor(index / cols), c: index % cols });
const rcToIndex = (r, c, cols, total) => clamp(r * cols + c, 0, Math.max(0, total - 1));

function safeAxes(gp) {
  const a = Array.isArray(gp?.axes) ? gp.axes : [];
  const lx = Number.isFinite(a?.[0]) ? a[0] : 0;
  const ly = Number.isFinite(a?.[1]) ? a[1] : 0;
  return [lx, ly];
}
function safeButtonsPressed(gp) {
  const raw = Array.isArray(gp?.buttons) ? gp.buttons : [];
  return raw.map((b) => !!b?.pressed);
}

// ────────────────────────────────────────────────────────────────────────────────
// Gamepad polling (every frame) and activation guard
// ────────────────────────────────────────────────────────────────────────────────
function useGamepad(onInput, onDebug, enabled = true) {
  const rafRef = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const loop = () => {
      const pads = Array.from(navigator.getGamepads?.() || []).filter(Boolean);
      const gp = pads[0] || null;
      if (onDebug) onDebug(gp);
      if (gp) onInput(gp);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onInput, onDebug, enabled]);
}

// ────────────────────────────────────────────────────────────────────────────────
// Tiny Icon Set (inline SVGs; lightweight)
// ────────────────────────────────────────────────────────────────────────────────
function Icon({ name, className = "w-6 h-6" }) {
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "steam") return (
    <svg viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="8" stroke={stroke} fill="none"/><circle cx="16" cy="10" r="2.5" stroke={stroke} fill="none"/><circle cx="7.5" cy="14.5" r="1.8" stroke={stroke} fill="none"/><path d="M9 13l3 2" {...common}/></svg>
  );
  if (name === "heroic") return (
    <svg viewBox="0 0 24 24" className={className}><path d="M4 7h16v10H4z" {...common}/><path d="M4 10h16" {...common}/><path d="M8 7V4h8v3" {...common}/></svg>
  );
  if (name === "retro") return (
    <svg viewBox="0 0 24 24" className={className}><rect x="5" y="7" width="14" height="10" rx="2" {...common}/><path d="M8 12h2M14 12h2" {...common}/></svg>
  );
  if (name === "apps") return (
    <svg viewBox="0 0 24 24" className={className}><rect x="4" y="4" width="7" height="7" rx="1.5" {...common}/><rect x="13" y="4" width="7" height="7" rx="1.5" {...common}/><rect x="4" y="13" width="7" height="7" rx="1.5" {...common}/><rect x="13" y="13" width="7" height="7" rx="1.5" {...common}/></svg>
  );
  if (name === "settings") return (
    <svg viewBox="0 0 24 24" className={className}><path d="M12 8a4 4 0 100 8 4 4 0 000-8z" {...common}/><path d="M3 12h2M19 12h2M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M5 19l1.5-1.5" {...common}/></svg>
  );
  return <svg viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="8" stroke={stroke} fill="none"/></svg>;
}

// ────────────────────────────────────────────────────────────────────────────────
// Presentational building blocks (lightweight)
// ────────────────────────────────────────────────────────────────────────────────
function Tile({ label, caption, icon, focused, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "group relative rounded-2xl border p-4 text-left transition-transform select-none " +
        (focused ? "border-white shadow-[0_0_0_3px_rgba(255,255,255,0.6)] scale-[1.02]" : "border-white/10 hover:border-white/30")
      }
    >
      <div className="mb-3 flex items-center gap-3 text-white/90">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Icon name={icon} />
        </div>
        <div>
          <div className="text-base font-semibold">{label}</div>
          <div className="text-xs text-white/60">{caption}</div>
        </div>
      </div>
      <div className="text-xs text-white/50">Press A to open</div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function Card({ title, meta, focused, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "relative rounded-2xl border p-3 text-left transition-transform select-none " +
        (focused ? "border-white shadow-[0_0_0_3px_rgba(255,255,255,0.6)] scale-[1.02]" : "border-white/10 hover:border-white/30")
      }
    >
      <div className="text-sm text-white/60">{meta}</div>
      <div className="text-lg font-semibold">{title}</div>
    </button>
  );
}

function Topbar({ tab, setTab }) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-zinc-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-2xl bg-white text-zinc-900 font-black">Q</div>
          <div className="text-lg font-bold">QuarterCade</div>
          <div className="ml-4 flex gap-2 rounded-full border border-white/10 p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={"rounded-full px-3 py-1 text-sm " + (t === tab ? "bg-white text-zinc-900" : "text-white/80 hover:bg-white/10")}>{t}</button>
            ))}
          </div>
        </div>
        <div className="hidden text-xs text-white/70 md:block">LB/RB: Tabs • A: Select • B: Back • Start: Menu</div>
      </div>
    </div>
  );
}

function Gate({ active, onActivate }) {
  if (active) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75">
      <div className="w-[min(560px,92vw)] rounded-3xl border border-white/10 bg-zinc-900/85 p-6 text-center shadow-2xl">
        <div className="mb-2 text-xl font-bold">Enable Controller</div>
        <p className="mx-auto max-w-md text-sm text-white/75">Press any button on your gamepad, or click below to enable controller input.</p>
        <button onClick={onActivate} className="mt-4 rounded-xl bg-white px-4 py-2 text-zinc-900">Activate Controller</button>
        <div className="mt-3 text-xs text-white/60">Tip: wiggle the stick or tap A/B after activating.</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────────
export default function QuarterCadeUI() {
  const [tab, setTab] = useState("Home");
  const [view, setView] = useState("grid");
  const [focus, setFocus] = useState(0);
  const [controllerActive, setControllerActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [moduleFocus, setModuleFocus] = useState(0); // focus for Home tiles

  // Arch integration hooks (replace with real launchers)
  const onOpenModule = (id) => { console.log("OPEN MODULE:", id); };
  const onOpenLibrary = () => { console.log("OPEN LIBRARY ITEM:", selected); };

  // Gamepad helpers
  const lastButtonsRef = useRef([]);
  const nextNavTimeRef = useRef(0);

  function deriveNav(gp) {
    const b = safeButtonsPressed(gp);
    const [lx, ly] = safeAxes(gp);
    const hat = Number.isFinite(gp?.axes?.[9]) ? gp.axes[9] : NaN;
    const hatUp = !Number.isNaN(hat) && (hat < -0.75 || hat > 0.75);
    const hatRight = !Number.isNaN(hat) && (hat > -0.75 && hat < -0.25);
    const hatDown = !Number.isNaN(hat) && (hat > -0.25 && hat < 0.25);
    const hatLeft = !Number.isNaN(hat) && (hat > 0.25 && hat < 0.75);
    const left = !!(b[14] || lx < -0.5 || hatLeft);
    const right = !!(b[15] || lx > 0.5 || hatRight);
    const up = !!(b[12] || ly < -0.5 || hatUp);
    const down = !!(b[13] || ly > 0.5 || hatDown);
    return { b, left, right, up, down };
  }

  const handlePad = (gp) => {
    const { b, left, right, up, down } = deriveNav(gp);
    const last = lastButtonsRef.current;
    const now = performance.now();
    const edge = (i) => !!b[i] && !last[i];

    const doNav = (fn) => {
      if (now >= nextNavTimeRef.current) {
        fn();
        nextNavTimeRef.current = now + (b[12] || b[13] || b[14] || b[15] ? 140 : 180);
      }
    };

    if (tab === "Home") {
      if (left) doNav(() => setModuleFocus((i) => clamp(i - 1, 0, MODULES.length - 1)));
      if (right) doNav(() => setModuleFocus((i) => clamp(i + 1, 0, MODULES.length - 1)));
      if (up) {/* optional rows later */}
      if (down) {/* optional rows later */}
      if (edge(0)) onOpenModule(MODULES[moduleFocus]?.id);
    } else if (tab === "Library") {
      const cols = view === "grid" ? 3 : 1;
      const total = LIBRARY.length;
      const { r, c } = indexToRC(focus, cols);
      if (left) doNav(() => setFocus(rcToIndex(r, c - 1, cols, total)));
      if (right) doNav(() => setFocus(rcToIndex(r, c + 1, cols, total)));
      if (up) doNav(() => setFocus(rcToIndex(r - 1, c, cols, total)));
      if (down) doNav(() => setFocus(rcToIndex(r + 1, c, cols, total)));
      if (edge(0)) setSelected(LIBRARY[focus]?.id ?? null);
    }

    // Back
    if (edge(1)) {
      if (menuOpen) setMenuOpen(false);
      else if (selected !== null) setSelected(null);
      else if (tab !== "Home") setTab("Home");
    }

    // Tabs LB/RB
    if (edge(4)) setTab((t) => TABS[clamp(TABS.indexOf(t) - 1, 0, TABS.length - 1)]);
    if (edge(5)) setTab((t) => TABS[clamp(TABS.indexOf(t) + 1, 0, TABS.length - 1)]);

    // Start menu
    if (edge(9)) setMenuOpen((m) => !m);

    // Y toggles view (in Library)
    if (edge(3) && tab === "Library") setView((v) => (v === "grid" ? "list" : "grid"));

    lastButtonsRef.current = b;
  };

  useGamepad(handlePad, null, controllerActive);

  // Activate by input gesture or connection
  useEffect(() => {
    const activate = () => setControllerActive(true);
    window.addEventListener("gamepadconnected", activate);
    window.addEventListener("pointerdown", activate, { once: true });
    return () => {
      window.removeEventListener("gamepadconnected", activate);
      window.removeEventListener("pointerdown", activate);
    };
  }, []);

  // Keyboard fallback
  useEffect(() => {
    const onKey = (e) => {
      if (tab === "Home") {
        if (["ArrowLeft", "a", "A"].includes(e.key)) setModuleFocus((i) => clamp(i - 1, 0, MODULES.length - 1));
        if (["ArrowRight", "d", "D"].includes(e.key)) setModuleFocus((i) => clamp(i + 1, 0, MODULES.length - 1));
        if (e.key === "Enter") onOpenModule(MODULES[moduleFocus]?.id);
      } else if (tab === "Library") {
        const cols = view === "grid" ? 3 : 1;
        const total = LIBRARY.length;
        const { r, c } = indexToRC(focus, cols);
        if (["ArrowLeft", "a", "A"].includes(e.key)) setFocus(rcToIndex(r, c - 1, cols, total));
        if (["ArrowRight", "d", "D"].includes(e.key)) setFocus(rcToIndex(r, c + 1, cols, total));
        if (["ArrowUp", "w", "W"].includes(e.key)) setFocus(rcToIndex(r - 1, c, cols, total));
        if (["ArrowDown", "s", "S"].includes(e.key)) setFocus(rcToIndex(r + 1, c, cols, total));
        if (e.key === "Enter") setSelected(LIBRARY[focus]?.id ?? null);
      }
      if (e.key === "Escape") { if (menuOpen) setMenuOpen(false); else if (selected !== null) setSelected(null); else if (tab !== "Home") setTab("Home"); }
      if (e.key === "[") setTab((t) => TABS[clamp(TABS.indexOf(t) - 1, 0, TABS.length - 1)]);
      if (e.key === "]") setTab((t) => TABS[clamp(TABS.indexOf(t) + 1, 0, TABS.length - 1)]);
      if (e.key.toLowerCase() === "m") setMenuOpen((m) => !m);
      if (e.key.toLowerCase() === "v" && tab === "Library") setView((v) => (v === "grid" ? "list" : "grid"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, moduleFocus, focus, view, menuOpen, selected]);

  // Derived
  const cols = view === "grid" ? 3 : 1;
  const selectedTitle = useMemo(() => LIBRARY.find((t) => t.id === selected) || null, [selected]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <Topbar tab={tab} setTab={setTab} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {tab === "Home" && (
          <section>
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold">Welcome to QuarterCade</div>
                  <div className="text-sm text-white/70">Pick a module to get started. You can re-skin this later.</div>
                </div>
                <div className="hidden md:block text-xs text-white/60">Y: Toggle view in Library • Start: Quick Menu</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((m, i) => (
                <Tile key={m.id} label={m.label} caption={m.caption} icon={m.icon} focused={i === moduleFocus} onClick={() => onOpenModule(m.id)} />
              ))}
            </div>
          </section>
        )}

        {tab === "Library" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Library</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">View</span>
                <button onClick={() => setView("grid")} className={"rounded-full px-3 py-1 text-sm " + (view === "grid" ? "bg-white text-zinc-900" : "border border-white/20")}>Grid</button>
                <button onClick={() => setView("list")} className={"rounded-full px-3 py-1 text-sm " + (view === "list" ? "bg-white text-zinc-900" : "border border-white/20")}>List</button>
              </div>
            </div>

            <div className={view === "grid" ? "grid gap-4" : "grid gap-2"} style={{ gridTemplateColumns: view === "grid" ? `repeat(${cols}, minmax(0, 1fr))` : undefined }}>
              {LIBRARY.map((t, i) => (
                <Card key={t.id} title={t.name} meta={`${t.platform} • ${t.hours.toFixed(1)} hrs`} focused={i === focus} onClick={() => setSelected(t.id)} />
              ))}
            </div>

            {selectedTitle && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="text-xl font-bold">{selectedTitle.name}</div>
                    <div className="text-sm text-white/60">{selectedTitle.platform} • {selectedTitle.hours.toFixed(1)} hrs</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl bg-white px-4 py-2 text-zinc-900" onClick={onOpenLibrary}>Play</button>
                    <button className="rounded-xl border border-white/20 px-4 py-2">Details</button>
                    <button className="rounded-xl border border-red-400/40 px-4 py-2 text-red-300">Remove</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "Store" && (
          <section>
            <h2 className="mb-2 text-2xl font-bold">Store</h2>
            <p className="text-white/70">Hook this into Heroic or Steam web — placeholder for now.</p>
          </section>
        )}

        {tab === "Settings" && (
          <section className="grid gap-4 md:grid-cols-2">
            {["Display", "Audio", "Controllers", "Network", "Storage", "Updates"].map((s) => (
              <div key={s} className="rounded-2xl border border-white/10 p-4">
                <div className="text-lg font-semibold">{s}</div>
                <div className="text-sm text-white/60">Configure {s.toLowerCase()}.</div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Quick Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">Quick Menu (Press Start to close)</div>
        </div>
      )}

      {/* Activation Overlay */}
      <Gate active={controllerActive} onActivate={() => setControllerActive(true)} />

      {/* Footer */}
      <div className="sticky bottom-0 z-30 mt-8 border-t border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>Left Stick / D-Pad: Navigate • A: Select • B: Back</div>
          <div>LB/RB: Tabs • Start: Quick Menu</div>
        </div>
      </div>
    </div>
  );
}
