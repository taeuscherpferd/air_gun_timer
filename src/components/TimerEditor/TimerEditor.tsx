import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, type ChangeEvent, type FocusEvent } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection/CollapsibleSection";
import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import type { TimerDurationMode, TimerStep } from "@/domain/timerTypes";
import { addTimer, moveTimer, removeTimer, setLoopSession, updateTimer } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import styles from "./TimerEditor.module.scss";

const timerNumberFields = ["fixedSeconds", "minSeconds", "maxSeconds"] as const;

type TimerNumberField = (typeof timerNumberFields)[number];

type TimerNumberDraft = Partial<Record<TimerNumberField, string>>;

type TimerNumberDrafts = Record<string, TimerNumberDraft>;

export const TimerEditor = () => {
  const dispatch = useAppDispatch();
  const timers = useAppSelector((state) => state.app.config.timers);
  const loopSession = useAppSelector((state) => state.app.config.loopSession);
  const [numberDrafts, setNumberDrafts] = useState<TimerNumberDrafts>({});

  const handleNumberChange = (timer: TimerStep, field: TimerNumberField) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setNumberDrafts((currentDrafts) => ({
        ...currentDrafts,
        [timer.id]: {
          ...currentDrafts[timer.id],
          [field]: value
        }
      }));

      if (value === "") {
        return;
      }

      dispatch(updateTimer({ id: timer.id, [field]: Number(value) }));
    };
  };

  const handleNumberBlur = (timer: TimerStep, field: TimerNumberField) => {
    return (event: FocusEvent<HTMLInputElement>) => {
      const normalizedValue = TimerDashboardLogic.normalizeSeconds(Number(event.target.value));

      setNumberDrafts((currentDrafts) => {
        const timerDraft = currentDrafts[timer.id];

        if (!timerDraft) {
          return currentDrafts;
        }

        const nextTimerDraft: TimerNumberDraft = {};

        for (const timerNumberField of timerNumberFields) {
          if (timerNumberField !== field && timerDraft[timerNumberField] !== undefined) {
            nextTimerDraft[timerNumberField] = timerDraft[timerNumberField];
          }
        }

        const nextDrafts = { ...currentDrafts };

        if (Object.keys(nextTimerDraft).length === 0) {
          delete nextDrafts[timer.id];
        } else {
          nextDrafts[timer.id] = nextTimerDraft;
        }

        return nextDrafts;
      });

      dispatch(updateTimer({ id: timer.id, [field]: normalizedValue }));
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
        <button
          className={styles.headerButton}
          type="button"
          onClick={() => dispatch(addTimer())}
          aria-label="Add timer"
        >
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
        {timers.map((timer, timerIndex) => (
          <article className={styles.timerCard} key={timer.id}>
            <div className={styles.cardHeader}>
              <div className={styles.buttonWrapper}>
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
                <label className={styles.enabledToggle}>
                  <input
                    type="checkbox"
                    checked={timer.selectOptionOnComplete}
                    onChange={(event) =>
                      dispatch(
                        updateTimer({ id: timer.id, selectOptionOnComplete: event.target.checked })
                      )
                    }
                  />
                  <span>Pick option</span>
                </label>
              </div>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => dispatch(moveTimer({ id: timer.id, direction: "up" }))}
                  disabled={timerIndex === 0}
                  aria-label={`Move ${TimerDashboardLogic.displayTimerLabel(timer.label)} up`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(moveTimer({ id: timer.id, direction: "down" }))}
                  disabled={timerIndex === timers.length - 1}
                  aria-label={`Move ${TimerDashboardLogic.displayTimerLabel(timer.label)} down`}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(removeTimer(timer.id))}
                  aria-label={`Remove ${TimerDashboardLogic.displayTimerLabel(timer.label)}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={timer.label}
                onChange={(event) =>
                  dispatch(updateTimer({ id: timer.id, label: event.target.value }))
                }
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
                  value={numberDrafts[timer.id]?.fixedSeconds ?? timer.fixedSeconds}
                  onBlur={handleNumberBlur(timer, "fixedSeconds")}
                  onChange={handleNumberChange(timer, "fixedSeconds")}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Min sec</span>
                <input
                  type="number"
                  min="1"
                  value={numberDrafts[timer.id]?.minSeconds ?? timer.minSeconds}
                  onBlur={handleNumberBlur(timer, "minSeconds")}
                  onChange={handleNumberChange(timer, "minSeconds")}
                />
              </label>
              <label className={styles.field}>
                <span>Max sec</span>
                <input
                  type="number"
                  min="1"
                  value={numberDrafts[timer.id]?.maxSeconds ?? timer.maxSeconds}
                  onBlur={handleNumberBlur(timer, "maxSeconds")}
                  onChange={handleNumberChange(timer, "maxSeconds")}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
};
