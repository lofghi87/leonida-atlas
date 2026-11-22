# Leonida Atlas — GTA VI Community Discovery Map

Starter full-stack per una mappa collaborativa fan-made. Non affiliato a Rockstar Games o Take-Two Interactive.

## Stato
Base applicativa con Leaflet CRS.Simple, categorie, autenticazione Supabase, pubblicazione di scoperte e schema SQL con RLS. La cartografia fornita dalla community viene attribuita al suo autore. Non sono inseriti luoghi ufficiali inventati.

## Requisiti
- Node.js 20+
- Progetto Supabase dedicato
- Account Vercel
- Permesso/licenza per la risorsa cartografica utilizzata

## Avvio
1. `npm install`
2. Copia `.env.example` in `.env.local`
3. Inserisci URL Supabase e publishable key del progetto.
4. Applica le migrazioni in `supabase/migrations/`.
5. In Supabase Auth abilita email/password e configura Site URL + Redirect URLs.
6. `npm run dev`

## Cartografia
La mappa Leaflet usa un sistema di coordinate normalizzate `x` e `y` tra 0 e 1. L'immagine attesa è:
`public/maps/leonida-map.webp`

Dimensioni attuali previste: 1364 × 2048 px. Lo zoom massimo è limitato alla scala dei pixel originali per evitare un ingrandimento eccessivamente sgranato. Il trascinamento è vincolato ai bordi dell'immagine. Per una qualità superiore serve un file originale più grande o una cartografia a più livelli fornita dall'autore.

Attribuzione mostrata sulla mappa: **Fan-made map artwork: Avatarsd**.

## Sicurezza
- RLS abilitata sulle tabelle pubbliche.
- Non inserire mai service-role/secret key nel browser o in variabili `NEXT_PUBLIC_`.
- La UI amministrativa, upload immagini, commenti/like in UI, follow, classifica e moderazione avanzata sono moduli successivi.
