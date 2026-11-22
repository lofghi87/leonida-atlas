"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Compass, Search, Plus, UserRound, Layers3, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Discovery } from "@/lib/types";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-slate-400">
      Caricamento mappa…
    </div>
  ),
});

export default function MapShell() {
  const [items, setItems] = useState<Discovery[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const [
      { data: categoryData },
      { data: discoveryData },
      { data: authData },
    ] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("discoveries")
        .select("*, profiles(username,avatar_url), categories(*)")
        .eq("moderation_status", "published")
        .order("created_at", { ascending: false })
        .limit(1500),
      supabase.auth.getUser(),
    ]);

    const categoryRows = (categoryData || []) as Category[];
    setCategories(categoryRows);
    setEnabled(categoryRows.map((category) => category.id));
    setItems((discoveryData || []) as Discovery[]);
    setUser(authData.user);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const visible = items.filter((item) =>
    enabled.includes(item.category_id) &&
    (!query || `${item.title} ${item.description} ${(item.tags || []).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()))
  );

  function toggleCategory(id: string) {
    setEnabled((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  async function publish(form: FormData) {
    if (!supabase || !user || !position) return;
    setError("");

    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const categoryId = String(form.get("category_id") || "");
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const externalUrl = String(form.get("external_url") || "").trim() || null;

    if (title.length < 3 || description.length < 10 || !categoryId) {
      setError("Inserisci titolo, descrizione (almeno 10 caratteri) e categoria.");
      return;
    }

    const { error: insertError } = await supabase.from("discoveries").insert({
      title,
      description,
      category_id: categoryId,
      x: position.x,
      y: position.y,
      user_id: user.id,
      tags,
      external_url: externalUrl,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setShowForm(false);
    setAdding(false);
    setPosition(null);
    await load();
  }

  return (
    <main className="h-[100dvh] min-h-[560px] overflow-hidden bg-ink">
      <header className="relative z-[1000] flex h-[66px] items-center justify-between border-b border-line bg-[#0b1118]/95 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-aqua/30 bg-aqua/10 text-aqua">
            <Compass size={20} />
          </div>
          <div>
            <div className="text-sm font-black tracking-[.17em]">LEONIDA <span className="text-aqua">ATLAS</span></div>
            <div className="text-[9px] tracking-[.22em] text-slate-500">COMMUNITY DISCOVERY MAP</div>
          </div>
        </div>

        <div className="mx-4 hidden max-w-[520px] flex-1 items-center rounded-xl border border-line bg-panel px-3 md:flex">
          <Search size={16} className="text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca luoghi, scoperte, tag…"
            className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-aqua/50 sm:flex">
                <UserRound size={15} /> Profilo
              </Link>
              <button
                onClick={async () => { await supabase?.auth.signOut(); setUser(null); }}
                className="rounded-lg border border-line p-2 text-slate-300 hover:text-white"
                title="Esci"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-aqua px-4 py-2 text-sm font-bold text-[#07110f] hover:bg-[#8af0e2]">
              Accedi
            </Link>
          )}
          <button
            onClick={() => setMobilePanel((current) => !current)}
            className="rounded-lg border border-line p-2 md:hidden"
          >
            {mobilePanel ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-66px)]">
        <aside className={`${mobilePanel ? "absolute inset-x-0 top-[66px] z-[900] block max-h-[75dvh] overflow-auto" : "hidden"} w-[285px] shrink-0 border-r border-line bg-[#0c131b] p-4 md:block`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-[.16em] text-slate-400">ESPLORA LA MAPPA</div>
            <Layers3 size={16} className="text-aqua" />
          </div>

          <div className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-panel px-3 md:hidden">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca…"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (!user) { window.location.href = "/login"; return; }
              setAdding(true);
              setSelected(null);
            }}
            className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${adding ? "bg-coral text-[#180b09]" : "bg-aqua text-[#07110f] hover:bg-[#8af0e2]"}`}
          >
            <Plus size={17} /> {adding ? "Clicca sulla mappa…" : "Aggiungi scoperta"}
          </button>

          <div className="mb-3 text-[10px] font-bold tracking-[.16em] text-slate-500">
            CATEGORIE <span className="ml-1 text-slate-600">({visible.length})</span>
          </div>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${enabled.includes(category.id) ? "bg-white/[.045] text-slate-200" : "text-slate-600 opacity-60"}`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: enabled.includes(category.id) ? category.color : "#475569" }}
                />
                <span className="flex-1">{category.name}</span>
                <span className="text-xs text-slate-500">
                  {items.filter((item) => item.category_id === category.id).length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-aqua">
              <ShieldCheck size={14} /> CARTOGRAFIA
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Area pronta per una mappa di gioco autorizzata. Non sono inseriti luoghi o percorsi non verificati.
            </p>
          </div>
          <div className="mt-5 text-[10px] leading-4 text-slate-600">
            Leonida Atlas è un progetto fan-made non affiliato a Rockstar Games o Take-Two Interactive.
          </div>
        </aside>

        <section className="relative min-w-0 flex-1">
          <MapCanvas
            discoveries={visible}
            categories={categories}
            adding={adding}
            onPick={(pickedPosition) => {
              setPosition(pickedPosition);
              setShowForm(true);
              setAdding(false);
            }}
            onSelect={setSelected}
          />

          <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-lg border border-line bg-[#0b1118]/90 px-3 py-2 text-[10px] text-slate-400 backdrop-blur">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-aqua" />
            {loading ? "Caricamento…" : `${visible.length} scoperte visibili`}
          </div>

          {adding && (
            <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-xl border border-coral/40 bg-[#1b1717]/95 px-4 py-2 text-xs text-coral shadow-glow">
              Seleziona un punto sulla mappa per posizionare la scoperta
            </div>
          )}

          {selected && (
            <div className="absolute right-4 top-4 z-[700] w-[min(340px,calc(100%-32px))] rounded-2xl border border-line bg-[#0c131b]/95 p-4 shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-aqua">
                    {selected.categories?.name || "Scoperta community"}
                  </div>
                  <h2 className="mt-1 text-lg font-bold">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm leading-6 text-slate-300">{selected.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-slate-500">
                <span>@{selected.profiles?.username || "utente"}</span>
                <span>{new Date(selected.created_at).toLocaleDateString("it-IT")}</span>
              </div>
              <div className="mt-3 text-[10px] text-amber-300">
                ● {selected.verification_status === "admin_confirmed" ? "Confermato da admin" : "Non verificato"}
              </div>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <form action={publish} className="w-full max-w-lg rounded-2xl border border-line bg-[#101720] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-widest text-aqua">CONTRIBUTO COMMUNITY</div>
                <h2 className="mt-1 text-xl font-bold">Nuova scoperta</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}><X size={19} /></button>
            </div>
            <label className="mb-1 block text-xs text-slate-400">Titolo</label>
            <input name="title" required minLength={3} maxLength={100} className="mb-3 w-full rounded-lg border border-line bg-[#080d13] px-3 py-2.5 text-sm outline-none focus:border-aqua" />
            <label className="mb-1 block text-xs text-slate-400">Descrizione</label>
            <textarea name="description" required minLength={10} maxLength={2000} rows={4} className="mb-3 w-full resize-none rounded-lg border border-line bg-[#080d13] px-3 py-2.5 text-sm outline-none focus:border-aqua" />
            <label className="mb-1 block text-xs text-slate-400">Categoria</label>
            <select name="category_id" required className="mb-3 w-full rounded-lg border border-line bg-[#080d13] px-3 py-2.5 text-sm">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <label className="mb-1 block text-xs text-slate-400">Tag (separati da virgola)</label>
            <input name="tags" placeholder="es. segreto, interno, missione" className="mb-3 w-full rounded-lg border border-line bg-[#080d13] px-3 py-2.5 text-sm outline-none focus:border-aqua" />
            <label className="mb-1 block text-xs text-slate-400">Link esterno facoltativo</label>
            <input name="external_url" type="url" placeholder="https://" className="mb-4 w-full rounded-lg border border-line bg-[#080d13] px-3 py-2.5 text-sm outline-none focus:border-aqua" />
            {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm">Annulla</button>
              <button className="rounded-lg bg-aqua px-4 py-2 text-sm font-bold text-[#07110f]">Pubblica scoperta</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
