import { Clock3 } from "lucide-react";

import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import { useAppSelector } from "@/store/hooks";

import styles from "./RunHistory.module.scss";

const formatCompletedAt = (value: string): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
};

export const RunHistory = () => {
  const history = useAppSelector((state) => state.app.history);

  return (
    <section className={styles.historyPanel} aria-label="Run history">
      <header className={styles.historyHeader}>
        <Clock3 size={18} />
        <h2>Recent Results</h2>
      </header>
      {history.length === 0 ? (
        <p className={styles.emptyState}>Completed timer results will appear here.</p>
      ) : (
        <ol className={styles.historyList}>
          {history.map((entry) => (
            <li className={styles.historyItem} key={entry.id}>
              <div>
                <strong>{entry.selectedLabel}</strong>
                <span>{entry.timerLabel}</span>
              </div>
              <div>
                <span>{TimerDashboardLogic.formatDuration(entry.durationSeconds)}</span>
                <time dateTime={entry.completedAt}>{formatCompletedAt(entry.completedAt)}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
