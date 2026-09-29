import type { StyleSpecification } from "maplibre-gl";

/** Self-contained MapLibre style: background only, no remote glyphs/sprites/tiles. */
export const offlineMapStyle: StyleSpecification = {
  version: 8,
  name: "offline-coordinate-map",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#e2e8f0",
      },
    },
  ],
};
