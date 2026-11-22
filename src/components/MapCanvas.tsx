"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import type { Category, Discovery } from "@/lib/types";

type MapCanvasProps = {
  discoveries: Discovery[];
  categories: Category[];
  adding: boolean;
  onPick: (position: { x: number; y: number }) => void;
  onSelect: (discovery: Discovery) => void;
};

// Dimensioni della mappa originale caricata nel progetto.
const MAP_WIDTH = 1122;
const MAP_HEIGHT = 1536;

export default function MapCanvas({
  discoveries,
  categories,
  adding,
  onPick,
  onSelect,
}: MapCanvasProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const callbacksRef = useRef({ onPick, onSelect });
  callbacksRef.current = { onPick, onSelect };

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;

    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [MAP_HEIGHT, MAP_WIDTH],
    ];

    const map = L.map(elementRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 0,
      zoomSnap: 0.1,
      zoomDelta: 0.25,
      maxBounds: bounds,
      maxBoundsViscosity: 1,
      worldCopyJump: false,
      zoomControl: true,
      attributionControl: false,
      inertia: false,
    });

    L.imageOverlay("/maps/leonida-map.webp", bounds, {
      interactive: false,
    }).addTo(map);

    map.fitBounds(bounds);
    map.setMinZoom(map.getZoom());
    map.setMaxZoom(0);
    map.setMaxBounds(bounds);
    map.panInsideBounds(bounds, { animate: false });

    L.control.attribution({ prefix: false })
      .addAttribution("Fan-made map artwork: Avatarsd")
      .addTo(map);

    mapRef.current = map;

    map.on("click", (event) => {
      if (!map.getContainer().classList.contains("adding-marker")) return;

      callbacksRef.current.onPick({
        x: Math.min(1, Math.max(0, event.latlng.lng / MAP_WIDTH)),
        y: Math.min(1, Math.max(0, 1 - event.latlng.lat / MAP_HEIGHT)),
      });
      map.getContainer().classList.remove("adding-marker");
    });

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    });

    discoveries.forEach((discovery) => {
      const category = categories.find((item) => item.id === discovery.category_id);
      const icon = L.divIcon({
        className: "",
        html: `<div class="marker-pin" style="background:${category?.color || "#65e0cf"}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 18],
      });
      const marker = L.marker(
        [
          MAP_HEIGHT - discovery.y * MAP_HEIGHT,
          discovery.x * MAP_WIDTH,
        ],
        { icon }
      );
      marker.on("click", () => callbacksRef.current.onSelect(discovery));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [discoveries, categories]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().classList.toggle("adding-marker", adding);
    map.getContainer().style.cursor = adding ? "crosshair" : "grab";
  }, [adding]);

  return <div ref={elementRef} className="h-full w-full" />;
}
