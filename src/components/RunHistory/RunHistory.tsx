import { useState } from "react";
import { ChevronRight, Clock3, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const resultCountLabel =
    history.length === 1 ? "1 completed timer result" : `${history.length} completed timer results`;

  return (
    <>
      <button
        className={styles.historyTrigger}
        type="button"
        aria-controls="run-history-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className={styles.triggerText}>
          <span className={styles.triggerTitle}>
            <Clock3 size={18} />
            Recent Results
          </span>
          <span className={styles.triggerHint}>
            {history.length === 0
              ? "Press here to see the recent completed timer results."
              : resultCountLabel}
          </span>
        </span>
        <ChevronRight
          className={isOpen ? styles.triggerIconOpen : styles.triggerIcon}
          size={20}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={styles.drawerBackdrop}
          role="presentation"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <aside
          className={styles.historyDrawer}
          id="run-history-sidebar"
          aria-label="Recent completed timer results"
        >
          <header className={styles.historyHeader}>
            <div>
              <Clock3 size={18} />
              <h2>Recent Results</h2>
            </div>
            <button
              className={styles.closeButton}
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Hide recent results"
            >
              <X size={18} />
            </button>
          </header>
          {history.length === 0 ? (
            <p className={styles.emptyState}>No completed timer results yet.</p>
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
        </aside>
      )}
    </>
  );
};
