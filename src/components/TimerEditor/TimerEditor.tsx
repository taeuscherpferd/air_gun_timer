import { Plus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection/CollapsibleSection";
import type { TimerDurationMode } from "@/domain/timerTypes";
import { addTimer, removeTimer, setLoopSession, updateTimer } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import styles from "./TimerEditor.module.scss";

export const TimerEditor = () => {
  const dispatch = useAppDispatch();
  const timers = useAppSelector((state) => state.app.config.timers);
  const loopSession = useAppSelector((state) => state.app.config.loopSession);

  const handleNumberChange = (id: string, field: "fixedSeconds" | "minSeconds" | "maxSeconds") => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateTimer({ id, [field]: Number(event.target.value) }));
    };
  };

  const handleModeChange = (id: string) => {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      dispatch(updateTimer({ id, durationMode: event.target.value as TimerDurationMode }));
    };
  };

  return (
    <CollapsibleSection
      ariaLabel="Timer steps"
      eyebrow="Timers"
      title="Step Intervals"
      actions={
        <button className={styles.headerButton} type="button" onClick={() => dispatch(addTimer())} aria-label="Add timer">
          <Plus size={18} />
        </button>
      }
    >
      <label className={styles.loopToggle}>
        <input
          type="checkbox"
          checked={loopSession}
          onChange={(event) => dispatch(setLoopSession(event.target.checked))}
        />
        <span>Loop sequence</span>
      </label>
      <div className={styles.timerList}>
        {timers.map((timer) => (
          <article className={styles.timerCard} key={timer.id}>
            <div className={styles.cardHeader}>
              <label className={styles.enabledToggle}>
                <input
                  type="checkbox"
                  checked={timer.enabled}
                  onChange={(event) =>
                    dispatch(updateTimer({ id: timer.id, enabled: event.target.checked }))
                  }
                />
                <span>Enabled</span>
              </label>
              <button
                type="button"
                onClick={() => dispatch(removeTimer(timer.id))}
                aria-label={`Remove ${timer.label}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={timer.label}
                onChange={(event) => dispatch(updateTimer({ id: timer.id, label: event.target.value }))}
              />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Mode</span>
                <select value={timer.durationMode} onChange={handleModeChange(timer.id)}>
                  <option value="fixed">Fixed</option>
                  <option value="random">Random</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Fixed sec</span>
                <input
                  type="number"
                  min="1"
                  value={timer.fixedSeconds}
                  onChange={handleNumberChange(timer.id, "fixedSeconds")}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Min sec</span>
                <input
                  type="number"
                  min="1"
                  value={timer.minSeconds}
                  onChange={handleNumberChange(timer.id, "minSeconds")}
                />
              </label>
              <label className={styles.field}>
                <span>Max sec</span>
                <input
                  type="number"
                  min="1"
                  value={timer.maxSeconds}
                  onChange={handleNumberChange(timer.id, "maxSeconds")}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
};
