import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { SessionControls } from "@/components/SessionControls/SessionControls";
import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import {
  completeRound,
  markComplete,
  pauseRound,
  resetSession,
  resumeRound,
  setError,
  startRound,
  tickRound
} from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ResultAudio } from "@/services/resultAudio";
import { SessionEngine } from "@/services/sessionEngine";

import styles from "./TimerDashboard.module.scss";

export const TimerDashboard = () => {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.app.config);
  const status = useAppSelector((state) => state.app.status);
  const activeRound = useAppSelector((state) => state.app.activeRound);
  const latestSelection = useAppSelector((state) => state.app.latestSelection);
  const errorMessage = useAppSelector((state) => state.app.errorMessage);
  const isResolvingRef = useRef(false);
  const nextRoundTimeoutRef = useRef<number | null>(null);

  const activeTimers = useMemo(() => TimerDashboardLogic.activeTimers(config), [config]);
  const canRun = useMemo(() => TimerDashboardLogic.canRun(config), [config]);
  const isCompletedRound = status === "paused" && activeRound?.remainingSeconds === 0;
  const progress = activeRound ? 1 - activeRound.remainingSeconds / activeRound.durationSeconds : 0;

  const startNextRound = useCallback(
    async (timerIndex: number) => {
      nextRoundTimeoutRef.current = null;
      const timer = activeTimers[timerIndex];

      if (!timer || isResolvingRef.current) {
        return;
      }

      isResolvingRef.current = true;

      try {
        const durationSeconds = await SessionEngine.resolveTimerDuration(timer);
        dispatch(startRound({ timer, timerIndex, durationSeconds }));
      } catch {
        dispatch(setError("The next timer could not be started."));
      } finally {
        isResolvingRef.current = false;
      }
    },
    [activeTimers, dispatch]
  );

  const completeCurrentRound = useCallback(async () => {
    if (!activeRound || isResolvingRef.current) {
      return;
    }

    isResolvingRef.current = true;

    try {
      if (activeRound.selectOptionOnComplete) {
        const selection = await SessionEngine.chooseOption(config.options);
        dispatch(completeRound(selection));
        const selectedOption = config.options.find((option) => option.id === selection.optionId);

        try {
          await ResultAudio.play(selectedOption, config.readSelectionAloud);
        } catch {
          if (config.readSelectionAloud) {
            await ResultAudio.play(
              selectedOption
                ? { ...selectedOption, audioDataUrl: null, audioFileName: null }
                : undefined,
              true
            );
          }
        }
      } else {
        dispatch(completeRound(null));
      }

      const nextIndex = TimerDashboardLogic.nextTimerIndex(config, activeRound.timerIndex);
      if (nextIndex === null) {
        dispatch(markComplete());
        return;
      }

      nextRoundTimeoutRef.current = window.setTimeout(() => {
        void startNextRound(nextIndex);
      }, 1200);
    } catch {
      dispatch(setError("The random option could not be selected."));
    } finally {
      isResolvingRef.current = false;
    }
  }, [activeRound, config, dispatch, startNextRound]);

  const clearQueuedRound = useCallback(() => {
    if (nextRoundTimeoutRef.current !== null) {
      window.clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch(tickRound());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, status]);

  useEffect(() => {
    if (status === "running" && activeRound?.remainingSeconds === 0) {
      void completeCurrentRound();
    }
  }, [activeRound?.remainingSeconds, completeCurrentRound, status]);

  useEffect(() => {
    return () => clearQueuedRound();
  }, [clearQueuedRound]);

  const handlePrimaryAction = () => {
    if (status === "running") {
      ResultAudio.stop();
      dispatch(pauseRound());
      return;
    }

    void ResultAudio.prepare();

    if (status === "paused") {
      clearQueuedRound();

      if (isCompletedRound && activeRound) {
        const nextIndex = TimerDashboardLogic.nextTimerIndex(config, activeRound.timerIndex);

        if (nextIndex === null) {
          dispatch(markComplete());
          return;
        }

        void startNextRound(nextIndex);
        return;
      }

      dispatch(resumeRound());
      return;
    }

    clearQueuedRound();
    void startNextRound(0);
  };

  const handleSkip = () => {
    void ResultAudio.prepare();
    void completeCurrentRound();
  };

  const handleReset = () => {
    clearQueuedRound();
    ResultAudio.stop();
    dispatch(resetSession());
  };

  const primaryIcon = status === "running" ? <Pause size={18} /> : <Play size={18} />;
  const primaryLabel =
    status === "running"
      ? "Pause"
      : isCompletedRound
        ? "Next"
        : status === "paused"
          ? "Resume"
          : "Start";
  const displayTime = activeRound
    ? TimerDashboardLogic.formatDuration(activeRound.remainingSeconds)
    : "0:00";

  return (
    <section className={styles.dashboard} aria-label="Timer">
      <div className={styles.statusStrip}>
        <span>{status}</span>
        <span>{activeTimers.length} steps</span>
      </div>
      <div className={styles.timerFace}>
        <svg viewBox="0 0 120 120" className={styles.progressRing} aria-hidden="true">
          <circle className={styles.progressTrack} cx="60" cy="60" r="52" />
          <circle
            className={styles.progressValue}
            cx="60"
            cy="60"
            r="52"
            strokeDasharray={`${Math.max(0, progress) * 326.73} 326.73`}
          />
        </svg>
        <div className={styles.timerReadout}>
          <span className={styles.timerLabel}>{activeRound?.label ?? "Ready"}</span>
          <strong>{displayTime}</strong>
        </div>
      </div>
      {latestSelection ? (
        <div className={styles.selectionResult}>
          <span>Selected</span>
          <strong>{latestSelection.label}</strong>
        </div>
      ) : null}
      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      <SessionControls
        primaryIcon={primaryIcon}
        primaryLabel={primaryLabel}
        canRun={canRun}
        status={status}
        onPrimaryAction={handlePrimaryAction}
        onReset={handleReset}
        onSkip={handleSkip}
        resetIcon={<RotateCcw size={18} />}
        skipIcon={<SkipForward size={18} />}
      />
    </section>
  );
};
