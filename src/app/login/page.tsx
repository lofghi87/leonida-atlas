"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        setMessage(
          data.session
            ? "Account creato."
            : "Controlla la tua email per confermare l'account."
        );
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Errore durante l'autenticazione.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-7">
        <Link href="/" className="text-xs tracking-widest text-aqua">← TORNA ALLA MAPPA</Link>
        <div className="mt-6 text-[10px] tracking-[.2em] text-aqua">LEONIDA ATLAS</div>
        <h1 className="mt-2 text-2xl font-black">
          {mode === "login" ? "Bentornato" : "Entra nella community"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Condividi scoperte e aiuta a costruire l&apos;atlante.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required minLength={3} maxLength={24}
              placeholder="Username"
              className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm"
            />
          )}
          <input
            type="email" value={email}
            onChange={(event) => setEmail(event.target.value)}
            required placeholder="Email"
            className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm"
          />
          <input
            type="password" value={password}
            onChange={(event) => setPassword(event.target.value)}
            required minLength={8} placeholder="Password (almeno 8 caratteri)"
            className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm"
          />
          <button disabled={busy} className="w-full rounded-lg bg-aqua py-3 text-sm font-bold text-ink disabled:opacity-50">
            {busy ? "Attendi…" : mode === "login" ? "Accedi" : "Crea account"}
          </button>
        </form>
        {message && <p className="mt-4 text-xs text-aqua">{message}</p>}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 w-full text-sm text-slate-400 hover:text-white"
        >
          {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
        <button
          onClick={async () => {
            if (!email) {
              setMessage("Inserisci prima la tua email.");
              return;
            }
            const { error } = await createClient().auth.resetPasswordForEmail(email, {
              redirectTo: location.origin + "/reset-password",
            });
            setMessage(
              error?.message ||
                "Se l'indirizzo esiste, riceverai un'email per reimpostare la password."
            );
          }}
          className="mt-3 w-full text-xs text-slate-500 hover:text-aqua"
        >
          Password dimenticata?
        </button>
      </div>
    </main>
  );
}
