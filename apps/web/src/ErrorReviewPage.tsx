import { useEffect, useState } from "react";
import { ErrorMap } from "./ErrorMap.js";
import { ErrorTable } from "./ErrorTable.js";
import { selectPoint, type ExperimentView } from "./experiment.js";
import styles from "./error-review.module.css";

interface Props {
  fixture?: ExperimentView;
}

export function ErrorReviewPage(props: Props) {
  const [experiment, setExperiment] = useState<ExperimentView | undefined>(props.fixture);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (props.fixture) return;
    const load = async () => {
      const response = await fetch("/experiment.json");
      if (!response.ok) {
        setLoadError("The recorded experiment fixture is unavailable.");
        return;
      }
      const view = (await response.json()) as ExperimentView;
      setExperiment(view);
      setSelectedId(selectPoint(view.points, view.points[0]?.id ?? "")?.id ?? null);
    };
    void load();
  }, [props.fixture]);

  if (loadError) {
    return <main className={styles.page}><p role="alert">{loadError}</p></main>;
  }
  if (!experiment) {
    return <main className={styles.page}><p>Loading recorded experiment.</p></main>;
  }

  return (
    <main className={styles.page}>
      <h1>Spatial error review</h1>
      <p>{experiment.limitations}</p>
      <section aria-label="Comparison">
        <p>Spatial majority: {experiment.schemes.spatial.majority.meanBalancedAccuracy.toFixed(3)}</p>
        <p>Spatial forest: {experiment.schemes.spatial.forest.meanBalancedAccuracy.toFixed(3)}</p>
        <p>Random forest (comparison only): {experiment.schemes.random.forest.meanBalancedAccuracy.toFixed(3)}</p>
      </section>
      <ErrorMap
        points={experiment.points}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
        }}
      />
      <ErrorTable
        points={experiment.points}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
        }}
      />
      <article>
        <pre className={styles.caseStudy}>{experiment.caseStudy}</pre>
      </article>
    </main>
  );
}
