"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type UserDiscovery = {
  id: string;
  title: string;
  created_at: string;
  verification_status: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [items, setItems] = useState<UserDiscovery[]>([]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: discoveriesData }] = await Promise.all([
        supabase.from("profiles").select("username,avatar_url,bio").eq("id", user.id).single(),
        supabase
          .from("discoveries")
          .select("id,title,created_at,verification_status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;
      setProfile(profileData);
      setItems(discoveriesData || []);
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-aqua">← Mappa</Link>
      <h1 className="mt-6 text-3xl font-bold">Il tuo profilo</h1>
      {profile ? (
        <>
          <p className="mt-2 text-slate-400">@{profile.username}</p>
          <h2 className="mt-8 font-semibold">Le tue scoperte</h2>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-panel p-4">
                <div className="font-medium">{item.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleDateString("it-IT")} · {item.verification_status}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-slate-400">Accedi per visualizzare il tuo profilo.</p>
      )}
    </main>
  );
}
