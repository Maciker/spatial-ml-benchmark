type ClassNames = Readonly<Record<string, string>> | undefined;

export function formatClassLabel(label: number, classNames: ClassNames): string {
  const name = classNames?.[String(label)];
  return name === undefined ? String(label) : `${label} (${name})`;
}

/** Manifests serialize NaN as null, so both mean "no finite prediction". */
export function formatPredictedLabel(predictedLabel: number | null, classNames: ClassNames): string {
  if (predictedLabel === null || !Number.isFinite(predictedLabel)) return "undefined (non-finite prediction)";
  return formatClassLabel(predictedLabel, classNames);
}
