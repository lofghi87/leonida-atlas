import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Leonida Atlas — Community Map",description:"Mappa collaborativa community-driven per GTA VI. Esplora e condividi scoperte."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>;}