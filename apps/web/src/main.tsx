import "./css.d.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorReviewPage } from "./ErrorReviewPage.js";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing root");
}
createRoot(root).render(
  <StrictMode>
    <ErrorReviewPage />
  </StrictMode>,
);
