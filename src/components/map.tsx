"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapPoint {
  id: string | number;
  lng: number;
  lat: number;
  color: string;
  label?: string;
  ring?: boolean;
}

export interface MapPolygon {
  id: string;
  ring: [number, number][];
  color: string;
  name?: string;
  dim?: boolean;
}

/**
 * Thin MapLibre wrapper. Tiles come from OpenFreeMap (no key needed for the
 * demo); production would use Mapbox per spec 2. Points render as a single
 * GeoJSON circle layer so 1,500 door pins stay fast. Numbered stops (routes)
 * render as labelled circles.
 */
export function ReefMap({
  points = [],
  polygons = [],
  route,
  numbered,
  onPointClick,
  center,
  zoom = 12,
  fit = true,
  className,
  selectedId,
  locate,
  fitTo,
}: {
  points?: MapPoint[];
  polygons?: MapPolygon[];
  route?: [number, number][];
  numbered?: boolean;
  onPointClick?: (id: string | number) => void;
  center?: [number, number];
  zoom?: number;
  fit?: boolean;
  className?: string;
  selectedId?: string | number | null;
  locate?: boolean;
  /** coordinates to frame on first render; defaults to all points and polygons */
  fitTo?: [number, number][];
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const clickRef = useRef(onPointClick);
  useEffect(() => {
    clickRef.current = onPointClick;
  });
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ml = await import("maplibre-gl");
      if (cancelled || !el.current) return;
      // Bundlers can't resolve MapLibre's module worker; serve a copy from /public.
      if (!ml.getWorkerUrl().includes("/vendor/")) ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const m = new ml.Map({
        container: el.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: center ?? [-117.2, 32.82],
        zoom,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      });
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      if (locate) m.addControl(new ml.GeolocateControl({ trackUserLocation: false }), "top-right");
      m.on("load", () => {
        m.addSource("polys", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "poly-fill", type: "fill", source: "polys", paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["get", "dim"], 0.03, 0.08] } });
        m.addLayer({ id: "poly-line", type: "line", source: "polys", paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [2, 1.5], "line-opacity": ["case", ["get", "dim"], 0.35, 0.9] } });
        m.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#032541", "line-width": 3, "line-opacity": 0.55, "line-dasharray": [1, 1.6] } });
        m.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({
          id: "pts",
          type: "circle",
          source: "pts",
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, ["case", ["has", "num"], 11, 2.5], 15, ["case", ["has", "num"], 13, 5], 17, ["case", ["has", "num"], 15, 9], 19, ["case", ["has", "num"], 16, 13]],
            "circle-stroke-color": ["case", ["get", "sel"], "#032541", "#ffffff"],
            "circle-stroke-width": ["case", ["get", "sel"], 3, ["has", "num"], 2.5, 1.5],
          },
        });
        m.addLayer({
          id: "pts-num",
          type: "symbol",
          source: "pts",
          filter: ["has", "num"],
          layout: { "text-field": ["get", "num"], "text-size": 12, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true },
          paint: { "text-color": "#ffffff" },
        });
        m.on("click", "pts", (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) clickRef.current?.(f.properties?.id);
        });
        m.on("mouseenter", "pts", () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mouseleave", "pts", () => (m.getCanvas().style.cursor = ""));
        setLoaded(true);
      });
      map.current = m;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // map is created once; data updates flow through the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    (m.getSource("pts") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: points.map((p, i) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { id: p.id, color: p.color, sel: p.id === selectedId, ...(numbered ? { num: p.label ?? String(i + 1) } : {}) },
      })),
    });
    (m.getSource("polys") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: polygons.map((p) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [p.ring] }, properties: { color: p.color, dim: !!p.dim } })),
    });
    (m.getSource("route") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: route && route.length > 1 ? [{ type: "Feature", geometry: { type: "LineString", coordinates: route }, properties: {} }] : [],
    });
    if (fit && !fitted.current && (points.length || polygons.length)) {
      const coords = fitTo?.length ? fitTo : [...points.map((p) => [p.lng, p.lat] as [number, number]), ...polygons.flatMap((p) => p.ring)];
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      m.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 48, duration: 0, maxZoom: 15 },
      );
      fitted.current = true;
    }
  }, [points, polygons, route, loaded, numbered, selectedId, fit, fitTo]);

  return (
    <div className={className?.includes("absolute") ? className : `relative ${className ?? ""}`}>
      {/* inline style: maplibre's .maplibregl-map sets position:relative, which would collapse a class-based absolute */}
      <div ref={el} style={{ position: "absolute", inset: 0 }} />
      {!loaded && <div className="absolute inset-0 animate-pulse bg-navy-50" />}
    </div>
  );
}

export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
