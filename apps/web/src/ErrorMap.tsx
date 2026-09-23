import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { MapPoint } from "./experiment.js";
import styles from "./error-review.module.css";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  points: readonly MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ErrorMap(props: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | undefined>(undefined);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 52],
      zoom: 4,
      attributionControl: true,
    });
    mapRef.current = map;
    props.points.forEach((point) => {
      const marker = new maplibregl.Marker({ color: point.isError ? "#b42318" : "#027a48" })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(new maplibregl.Popup().setText(`${point.id} fold ${point.foldId}`))
        .addTo(map);
      marker.getElement().setAttribute("aria-label", `Sample ${point.id}`);
      marker.getElement().tabIndex = 0;
      marker.getElement().addEventListener("click", () => {
        props.onSelect(point.id);
      });
    });
    return () => {
      map.remove();
      mapRef.current = undefined;
    };
  }, [props]);

  return <div ref={container} className={styles.map} role="region" aria-label="Spatial error map" data-selected={props.selectedId ?? ""} />;
}
