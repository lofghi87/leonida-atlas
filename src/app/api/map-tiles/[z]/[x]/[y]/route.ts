import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TILE_SIZE = 256;
const MAP_WIDTH = 1122;
const MAP_HEIGHT = 1536;
const MIN_ZOOM = -2;
const MAX_ZOOM = 2;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zParam, x: xParam, y: yParam } = await params;
  const z = Number(zParam);
  const x = Number(xParam);
  const tileY = Number(yParam);

  if (
    !Number.isInteger(z) || z < MIN_ZOOM || z > MAX_ZOOM ||
    !Number.isInteger(x) || !Number.isInteger(tileY)
  ) {
    return new NextResponse("Tassello non valido", { status: 400 });
  }

  // In CRS.Simple i valori Y dei tasselli Leaflet sono negativi.
  const row = -tileY - 1;
  const scale = 2 ** z;
  const scaledWidth = Math.ceil(MAP_WIDTH * scale);
  const scaledHeight = Math.ceil(MAP_HEIGHT * scale);
  const left = x * TILE_SIZE;
  const top = row * TILE_SIZE;

  if (x < 0 || row < 0 || left >= scaledWidth || top >= scaledHeight) {
    return new NextResponse("Tassello fuori mappa", { status: 404 });
  }

  const width = Math.min(TILE_SIZE, scaledWidth - left);
  const height = Math.min(TILE_SIZE, scaledHeight - top);

  // Ritaglia prima la porzione necessaria: evita di ridimensionare tutta
  // l'immagine per ogni tassello richiesto dal browser.
  const sourceLeft = Math.floor(left / scale);
  const sourceTop = Math.floor(top / scale);
  const sourceRight = Math.min(MAP_WIDTH, Math.ceil((left + width) / scale));
  const sourceBottom = Math.min(MAP_HEIGHT, Math.ceil((top + height) / scale));
  const sourceWidth = Math.max(1, sourceRight - sourceLeft);
  const sourceHeight = Math.max(1, sourceBottom - sourceTop);
  const imagePath = path.join(process.cwd(), "public", "maps", "leonida-map.webp");

  try {
    const source = await readFile(imagePath);
    const tile = await sharp(source)
      .extract({
        left: sourceLeft,
        top: sourceTop,
        width: sourceWidth,
        height: sourceHeight,
      })
      .resize(width, height, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .extend({
        top: 0,
        left: 0,
        right: TILE_SIZE - width,
        bottom: TILE_SIZE - height,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(tile), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Impossibile generare il tassello", { status: 500 });
  }
}
