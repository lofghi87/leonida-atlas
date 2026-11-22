# Leonida Atlas — GTA VI Community Discovery Map

Starter full-stack per una mappa collaborativa fan-made. Non affiliato a Rockstar Games o Take-Two Interactive.

## Stato
Base applicativa iniziale: interfaccia mappa con Leaflet CRS.Simple, categorie, autenticazione Supabase, pubblicazione di scoperte e schema SQL con RLS. La cartografia di gioco non è inclusa: il placeholder è una griglia tecnica, non una rappresentazione di Leonida. Non sono inseriti luoghi ufficiali inventati.

## Requisiti
- Node.js 20+
- Progetto Supabase dedicato
- Account Vercel
- Mappa immagine utilizzabile con autorizzazione/licenza adeguata

## Avvio
1. `npm install`
2. Copia `.env.example` in `.env.local`
3. Inserisci URL Supabase e publishable key del progetto.
4. La migrazione SQL è in `supabase/migrations/0001_initial_schema.sql`.
5. In Supabase Auth abilita email/password e configura Site URL + Redirect URLs.
6. `npm run dev`

## Cartografia
Sostituisci `public/maps/map-placeholder.svg` con una risorsa cartografica autorizzata. Le coordinate normalizzate `x` e `y` tra 0 e 1 mantengono i marker indipendenti dalla risoluzione.

## Sicurezza
- RLS abilitata sulle tabelle pubbliche.
- Non inserire mai service-role/secret key nel browser o in variabili `NEXT_PUBLIC_`.
- La UI amministrativa, upload immagini, commenti/like in UI, follow, classifica e moderazione avanzata sono moduli successivi.
