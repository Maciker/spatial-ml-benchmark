import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./App.module.css";
import type { DemoManifest } from "./types";

type Props = {
  readonly manifest: DemoManifest;
};

function errorColor(trueLabel: number, predictedLabel: number): string {
  if (!Number.isFinite(predictedLabel)) return "#64748b";
  return trueLabel === predictedLabel ? "#16a34a" : "#dc2626";
}

export function App({ manifest }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [scheme, setScheme] = useState("spatial");
  const [model, setModel] = useState("majority");

  const filtered = useMemo(
    () =>
      manifest.predictions.filter(
        (row) => row.scheme === scheme && row.model === model && row.foldIndex === 0,
      ),
    [manifest.predictions, scheme, model],
  );

  const metric = useMemo(
    () =>
      manifest.metrics.find(
        (row) => row.scheme === scheme && row.model === model && row.foldIndex === 0,
      ),
    [manifest.metrics, scheme, model],
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-122.397, 37.776],
      zoom: 12,
    });
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "predictions";
    const layerId = "prediction-points";

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filtered.map((row) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [row.lon, row.lat] },
        properties: {
          sampleId: row.sampleId,
          spatialGroup: row.spatialGroup,
          trueLabel: row.trueLabel,
          predictedLabel: row.predictedLabel,
          color: errorColor(row.trueLabel, row.predictedLabel),
        },
      })),
    };

    const render = () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 8,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0f172a",
        },
      });
    };

    if (map.isStyleLoaded()) render();
    else map.once("load", render);
  }, [filtered]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h1>Spatial ML Benchmark</h1>
        <p>{manifest.task.generalizationClaim}</p>
        <label>
          Split scheme
          <select value={scheme} onChange={(event) => setScheme(event.target.value)}>
            <option value="spatial">Spatial holdout</option>
            <option value="random">Random (may leak groups)</option>
          </select>
        </label>
        <label>
          Model
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="majority">Majority baseline</option>
            <option value="random_forest">Random forest</option>
          </select>
        </label>
        <div className={styles.metrics}>
          <p>
            Balanced accuracy:{" "}
            {metric && Number.isFinite(metric.balancedAccuracy)
              ? metric.balancedAccuracy.toFixed(3)
              : "undefined (single-class fold)"}
          </p>
          {metric?.warnings.length ? (
            <ul>
              {metric.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          <p>Showing {filtered.length} evaluation points for fold 0 preview.</p>
        </div>
      </aside>
      <div ref={mapContainer} className={styles.map} aria-label="Prediction error map" />
    </div>
  );
}
