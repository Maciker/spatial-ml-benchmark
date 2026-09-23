import { RandomForestClassifier } from "ml-random-forest";
import type { ClassifierModel, RandomForestAdapter } from "../../../../packages/domain/src/models/modelPort.js";

export const mlRandomForestAdapter: RandomForestAdapter = {
  library: "ml-random-forest",
  libraryVersion: "2.1.0",
  create(options) {
    const classifier = new RandomForestClassifier({
      seed: options.seed,
      nEstimators: options.nEstimators,
      maxFeatures: 1,
      replacement: true,
      useSampleBagging: true,
      noOOB: true,
    });

    const model: ClassifierModel = {
      kind: "random_forest",
      fit(features, labels) {
        classifier.train(features.map((row) => [...row]), [...labels]);
      },
      predict(features) {
        return classifier.predict(features.map((row) => [...row]));
      },
      serialize() {
        return classifier.toJSON();
      },
    };

    return model;
  },
};
