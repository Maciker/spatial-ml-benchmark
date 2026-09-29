import { describe, expect, it, vi } from "vitest";
import { detachPredictionMapHandlers } from "../apps/web/src/mapPredictionCleanup.js";

describe("The prediction map handler detach", () => {
  it("removes the pending load listener without touching layers when style is gone", () => {
    const getLayer = vi.fn(() => ({ id: "prediction-points" }));
    const off = vi.fn();
    const map = {
      getStyle: () => undefined,
      getLayer,
      off,
    };
    const onLoad = vi.fn();
    const onPointClick = vi.fn();

    detachPredictionMapHandlers(map, {
      layerId: "prediction-points",
      liveMap: map,
      onLoad,
      onPointClick,
    });

    expect(off).toHaveBeenCalledWith("load", onLoad);
    expect(getLayer).not.toHaveBeenCalled();
    expect(off).not.toHaveBeenCalledWith("click", "prediction-points", onPointClick);
  });

  it("skips layer teardown when the map is no longer the live instance", () => {
    const getLayer = vi.fn(() => ({ id: "prediction-points" }));
    const off = vi.fn();
    const map = {
      getStyle: () => ({ version: 8, sources: {}, layers: [] }),
      getLayer,
      off,
    };

    detachPredictionMapHandlers(map, {
      layerId: "prediction-points",
      liveMap: null,
      onLoad: vi.fn(),
      onPointClick: vi.fn(),
    });

    expect(off).toHaveBeenCalledWith("load", expect.any(Function));
    expect(getLayer).not.toHaveBeenCalled();
  });

  it("detaches the click handler when the map is live and still has a style and layer", () => {
    const onLoad = vi.fn();
    const onPointClick = vi.fn();
    const off = vi.fn();
    const map = {
      getStyle: () => ({ version: 8, sources: {}, layers: [] }),
      getLayer: (layerId: string) => (layerId === "prediction-points" ? { id: layerId } : undefined),
      off,
    };

    detachPredictionMapHandlers(map, {
      layerId: "prediction-points",
      liveMap: map,
      onLoad,
      onPointClick,
    });

    expect(off).toHaveBeenCalledWith("load", onLoad);
    expect(off).toHaveBeenCalledWith("click", "prediction-points", onPointClick);
  });
});
