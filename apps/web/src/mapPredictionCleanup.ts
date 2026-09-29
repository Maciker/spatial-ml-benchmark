export type PredictionMapCleanupTarget = {
  readonly getStyle: () => unknown;
  readonly getLayer: (layerId: string) => unknown;
  readonly off: (type: string, layerIdOrListener: unknown, listener?: unknown) => unknown;
};

type DetachPredictionMapHandlersOptions = {
  readonly layerId: string;
  readonly liveMap: unknown;
  readonly onLoad: unknown;
  readonly onPointClick: unknown;
};

export function detachPredictionMapHandlers(
  map: PredictionMapCleanupTarget,
  options: DetachPredictionMapHandlersOptions,
): void {
  map.off("load", options.onLoad);
  if (options.liveMap !== map) return;
  if (map.getStyle() == null) return;
  if (map.getLayer(options.layerId)) {
    map.off("click", options.layerId, options.onPointClick);
  }
}
