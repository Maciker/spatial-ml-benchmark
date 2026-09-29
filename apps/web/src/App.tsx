import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./App.module.css";
import { offlineMapStyle } from "./offlineMapStyle";
import { formatPredictedLabel } from "./predictionDetail";
import type { DemoManifest } from "./types";

type Props = {
  readonly manifest: DemoManifest;
};

type PredictionRow = DemoManifest["predictions"][number];

function errorColor(trueLabel: number, predictedLabel: number): string {
  if (!Number.isFinite(predictedLabel)) return "#64748b";
  return trueLabel === predictedLabel ? "#16a34a" : "#dc2626";
}

function formatAccuracy(value: number): string {
  if (!Number.isFinite(value)) return "undefined (single-class fold)";
  return value.toFixed(3);
}

function formatSupport(support: Readonly<Record<string, number>> | undefined): string {
  if (!support) return "—";
  return Object.entries(support)
    .map(([label, count]) => `${label}:${count}`)
    .join(", ");
}

function heldOutGroups(
  assignments: DemoManifest["foldAssignments"],
  scheme: string,
  foldIndex: number,
): string {
  const match = assignments?.find(
    (row) => row.scheme === scheme && row.foldIndex === foldIndex,
  );
  if (!match || match.spatialGroupsInTest.length === 0) return "—";
  return match.spatialGroupsInTest.join(", ");
}

export function App(props: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [scheme, setScheme] = useState("spatial");
  const [model, setModel] = useState("majority");
  const [foldIndex, setFoldIndex] = useState(0);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const foldIndexes = useMemo(() => {
    const indexes = new Set(
      props.manifest.metrics
        .filter((row) => row.scheme === scheme && row.model === model)
        .map((row) => row.foldIndex),
    );
    return [...indexes].sort((left, right) => left - right);
  }, [props.manifest.metrics, scheme, model]);

  useEffect(() => {
    if (foldIndexes.length === 0) return;
    if (!foldIndexes.includes(foldIndex)) setFoldIndex(foldIndexes[0]);
  }, [foldIndexes, foldIndex]);

  const filteredMetrics = useMemo(
    () =>
      props.manifest.metrics
        .filter((row) => row.scheme === scheme && row.model === model)
        .sort((left, right) => left.foldIndex - right.foldIndex),
    [props.manifest.metrics, scheme, model],
  );

  const filtered = useMemo(
    () =>
      props.manifest.predictions.filter(
        (row) =>
          row.scheme === scheme && row.model === model && row.foldIndex === foldIndex,
      ),
    [props.manifest.predictions, scheme, model, foldIndex],
  );

  const selectedPoint = useMemo(
    () => filtered.find((row) => row.sampleId === selectedSampleId) ?? null,
    [filtered, selectedSampleId],
  );

  useEffect(() => {
    if (selectedSampleId && !filtered.some((row) => row.sampleId === selectedSampleId)) {
      setSelectedSampleId(null);
    }
  }, [filtered, selectedSampleId]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: offlineMapStyle,
      center: [-5.5, 40],
      zoom: 5,
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

    const fitToPoints = () => {
      if (filtered.length === 0) return;
      const bounds = new maplibregl.LngLatBounds(
        [filtered[0].lon, filtered[0].lat],
        [filtered[0].lon, filtered[0].lat],
      );
      for (const row of filtered) bounds.extend([row.lon, row.lat]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 8, duration: 0 });
    };

    const onPointClick = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const sampleId = event.features?.[0]?.properties?.sampleId;
      if (typeof sampleId === "string") setSelectedSampleId(sampleId);
    };

    const render = () => {
      if (map.getLayer(layerId)) {
        map.off("click", layerId, onPointClick);
        map.removeLayer(layerId);
      }
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
      map.on("click", layerId, onPointClick);
      map.getCanvas().style.cursor = "pointer";
      fitToPoints();
    };

    if (map.isStyleLoaded()) render();
    else map.once("load", render);

    return () => {
      if (map.getLayer(layerId)) map.off("click", layerId, onPointClick);
    };
  }, [filtered]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h1>Spatial ML Benchmark</h1>
        <p>{props.manifest.task.generalizationClaim}</p>
        {props.manifest.task.source ? (
          <p className={styles.attribution}>
            Source: {props.manifest.task.source.name}. {props.manifest.task.source.license}.{" "}
            <a href={props.manifest.task.source.reference} rel="noreferrer" target="_blank">
              Reference
            </a>
          </p>
        ) : null}
        <label>
          Split scheme
          <select
            aria-label="Split scheme"
            value={scheme}
            onChange={(event) => setScheme(event.target.value)}
          >
            <option value="spatial">Spatial holdout</option>
            <option value="random">Random (may leak groups)</option>
          </select>
        </label>
        <label>
          Model
          <select
            aria-label="Model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="majority">Majority baseline</option>
            <option value="random_forest">Random forest</option>
          </select>
        </label>
        <label>
          Map fold
          <select
            aria-label="Map fold"
            value={String(foldIndex)}
            onChange={(event) => setFoldIndex(Number(event.target.value))}
          >
            {foldIndexes.map((index) => (
              <option key={index} value={index}>
                Fold {index}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.metrics}>
          <table className={styles.metricsTable}>
            <caption>Metrics for all folds</caption>
            <thead>
              <tr>
                <th scope="col">Fold</th>
                <th scope="col">Balanced accuracy</th>
                <th scope="col">Test support</th>
                <th scope="col">Held-out groups</th>
                <th scope="col">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric) => (
                <tr key={`${metric.scheme}-${metric.model}-${metric.foldIndex}`}>
                  <th scope="row">Fold {metric.foldIndex}</th>
                  <td>{formatAccuracy(metric.balancedAccuracy)}</td>
                  <td>{formatSupport(metric.testClassSupport)}</td>
                  <td>
                    {heldOutGroups(props.manifest.foldAssignments, scheme, metric.foldIndex)}
                  </td>
                  <td>
                    {metric.warnings.length ? (
                      <ul>
                        {metric.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Showing {filtered.length} evaluation points for fold {foldIndex}.
          </p>
          <ul className={styles.pointList} aria-label="Evaluation points">
            {filtered.map((row) => (
              <li key={row.sampleId}>
                <button
                  type="button"
                  className={
                    row.sampleId === selectedSampleId
                      ? styles.pointButtonSelected
                      : styles.pointButton
                  }
                  onClick={() => setSelectedSampleId(row.sampleId)}
                >
                  Sample {row.sampleId}
                </button>
              </li>
            ))}
          </ul>
          {selectedPoint ? <PointDetail point={selectedPoint} /> : null}
        </div>
      </aside>
      <div className={styles.mapPane}>
        <p className={styles.basemapNotice}>Coordinate/group map (no basemap)</p>
        <div ref={mapContainer} className={styles.map} aria-label="Prediction error map" />
      </div>
    </div>
  );
}

type PointDetailProps = {
  readonly point: PredictionRow;
};

function PointDetail(props: PointDetailProps) {
  return (
    <section className={styles.detail} aria-label="Selected point detail">
      <h2>Selected point</h2>
      <p>Sample ID: {props.point.sampleId}</p>
      <p>Spatial group: {props.point.spatialGroup}</p>
      <p>True label: {props.point.trueLabel}</p>
      <p>Predicted label: {formatPredictedLabel(props.point.predictedLabel)}</p>
      <p>Model: {props.point.model}</p>
      <p>Scheme: {props.point.scheme}</p>
      <p>Fold: {props.point.foldIndex}</p>
    </section>
  );
}
