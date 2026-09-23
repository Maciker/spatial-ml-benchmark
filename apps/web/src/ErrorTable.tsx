import type { MapPoint } from "./experiment.js";
import styles from "./error-review.module.css";

interface Props {
  points: readonly MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ErrorTable(props: Props) {
  return (
    <table className={styles.table}>
      <caption>Recorded spatial-forest predictions</caption>
      <thead>
        <tr>
          <th>Sample</th>
          <th>Fold</th>
          <th>Truth</th>
          <th>Prediction</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {props.points.map((point) => (
          <tr
            key={point.id}
            tabIndex={0}
            data-selected={props.selectedId === point.id ? "true" : "false"}
            onClick={() => {
              props.onSelect(point.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                props.onSelect(point.id);
              }
            }}
          >
            <td>{point.id}</td>
            <td>{point.foldId}</td>
            <td>{point.truth === 0 ? "meadow" : "woodland"}</td>
            <td>{point.prediction === 0 ? "meadow" : "woodland"}</td>
            <td>{point.isError ? "yes" : "no"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
