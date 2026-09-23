import { createRng } from "./folds.js";
import { DomainError } from "./domain-error.js";

type ForestOptions = {
  readonly seed: number;
  readonly treeCount: number;
  readonly maxDepth: number;
};

type Leaf = { readonly kind: "leaf"; readonly label: 0 | 1 };
type Branch = {
  readonly kind: "branch";
  readonly featureIndex: number;
  readonly threshold: number;
  readonly left: Tree;
  readonly right: Tree;
};
type Tree = Leaf | Branch;

type ForestModel = {
  readonly kind: "forest";
  readonly options: ForestOptions;
  readonly trees: readonly Tree[];
};

function majorityLabel(labels: readonly number[]): 0 | 1 {
  let zeros = 0;
  let ones = 0;
  for (const label of labels) {
    if (label === 0) zeros += 1;
    else ones += 1;
  }
  return ones > zeros ? 1 : 0;
}

function gini(labels: readonly number[]): number {
  if (labels.length === 0) return 0;
  const zeros = labels.filter((label) => label === 0).length / labels.length;
  const ones = 1 - zeros;
  return 1 - zeros * zeros - ones * ones;
}

function grow(
  features: readonly (readonly number[])[],
  labels: readonly number[],
  depth: number,
  maxDepth: number,
  rng: () => number,
): Tree {
  if (features.length === 0) {
    throw DomainError.createValidation("Forest training requires samples");
  }
  const unique = new Set(labels);
  if (unique.size === 1 || depth >= maxDepth || features.length < 2) {
    return { kind: "leaf", label: majorityLabel(labels) };
  }
  const featureCount = features[0]?.length ?? 0;
  let bestGain = -1;
  let bestIndex = 0;
  let bestThreshold = 0;
  let bestLeft: number[] = [];
  let bestRight: number[] = [];
  const attempts = Math.max(1, Math.floor(Math.sqrt(featureCount)));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const featureIndex = Math.floor(rng() * featureCount);
    const values = features.map((row) => row[featureIndex] ?? 0).sort((left, right) => left - right);
    const pivot = values[Math.floor(rng() * values.length)] ?? 0;
    const leftIdx: number[] = [];
    const rightIdx: number[] = [];
    features.forEach((row, index) => {
      if ((row[featureIndex] ?? 0) <= pivot) leftIdx.push(index);
      else rightIdx.push(index);
    });
    if (leftIdx.length === 0 || rightIdx.length === 0) continue;
    const parent = gini(labels);
    const leftLabels = leftIdx.map((index) => labels[index] ?? 0);
    const rightLabels = rightIdx.map((index) => labels[index] ?? 0);
    const gain = parent -
      (leftLabels.length / labels.length) * gini(leftLabels) -
      (rightLabels.length / labels.length) * gini(rightLabels);
    if (gain > bestGain) {
      bestGain = gain;
      bestIndex = featureIndex;
      bestThreshold = pivot;
      bestLeft = leftIdx;
      bestRight = rightIdx;
    }
  }
  if (bestGain <= 0) {
    return { kind: "leaf", label: majorityLabel(labels) };
  }
  return {
    kind: "branch",
    featureIndex: bestIndex,
    threshold: bestThreshold,
    left: grow(
      bestLeft.map((index) => features[index] ?? []),
      bestLeft.map((index) => labels[index] ?? 0),
      depth + 1,
      maxDepth,
      rng,
    ),
    right: grow(
      bestRight.map((index) => features[index] ?? []),
      bestRight.map((index) => labels[index] ?? 0),
      depth + 1,
      maxDepth,
      rng,
    ),
  };
}

function walk(tree: Tree, row: readonly number[]): 0 | 1 {
  if (tree.kind === "leaf") return tree.label;
  if ((row[tree.featureIndex] ?? 0) <= tree.threshold) return walk(tree.left, row);
  return walk(tree.right, row);
}

export function fitForest(
  features: readonly (readonly number[])[],
  labels: readonly number[],
  options: ForestOptions,
): ForestModel {
  if (features.length === 0 || features.length !== labels.length) {
    throw DomainError.createValidation("Forest training requires aligned features and labels");
  }
  const rng = createRng(options.seed);
  const trees: Tree[] = [];
  for (let tree = 0; tree < options.treeCount; tree += 1) {
    const selected: number[] = [];
    for (let index = 0; index < features.length; index += 1) {
      selected.push(Math.floor(rng() * features.length));
    }
    trees.push(
      grow(
        selected.map((index) => features[index] ?? []),
        selected.map((index) => labels[index] ?? 0),
        0,
        options.maxDepth,
        rng,
      ),
    );
  }
  return { kind: "forest", options, trees };
}

export function predictForest(model: ForestModel, features: readonly (readonly number[])[]): Array<0 | 1> {
  return features.map((row) => {
    let zeros = 0;
    let ones = 0;
    for (const tree of model.trees) {
      if (walk(tree, row) === 0) zeros += 1;
      else ones += 1;
    }
    return ones > zeros ? 1 : 0;
  });
}

export function serializeForest(model: ForestModel): ForestModel {
  return JSON.parse(JSON.stringify(model)) as ForestModel;
}
