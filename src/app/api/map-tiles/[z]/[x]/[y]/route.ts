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

  // Con CRS.Simple l'asse verticale delle coordinate Leaflet è invertito.
  const row = -tileY - 1;
  const scale = 2 ** z;
  const scaledWidth = Math.ceil(MAP_WIDTH * scale);
  const scaledHeight = Math.ceil(MAP_HEIGHT * scale);
  const left = x * TILE_SIZE;
  const top = row * TILE_SIZE;

  if (
    x < 0 || row < 0 ||
    left >= scaledWidth || top >= scaledHeight
  ) {
    return new NextResponse("Tassello fuori mappa", { status: 404 });
  }

  const width = Math.min(TILE_SIZE, scaledWidth - left);
  const height = Math.min(TILE_SIZE, scaledHeight - top);
  const imagePath = path.join(process.cwd(), "public", "maps", "leonida-map.webp");

  try {
    const source = await readFile(imagePath);
    const tile = await sharp(source)
      .resize(scaledWidth, scaledHeight, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .extract({ left, top, width, height })
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
