import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { DemoManifest } from "./types";

async function bootstrap(): Promise<void> {
  const response = await fetch("/demo-manifest.json");
  if (!response.ok) throw new Error("Failed to load demo manifest");
  const manifest = (await response.json()) as DemoManifest;
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing #root");
  createRoot(root).render(
    <StrictMode>
      <App manifest={manifest} />
    </StrictMode>,
  );
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  document.body.textContent = message;
});
