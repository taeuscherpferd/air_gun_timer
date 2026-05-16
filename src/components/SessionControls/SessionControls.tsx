import type { ReactNode } from "react";

import type { SessionStatus } from "@/domain/timerTypes";

import styles from "./SessionControls.module.scss";

interface SessionControlsProps {
  primaryIcon: ReactNode;
  primaryLabel: string;
  resetIcon: ReactNode;
  skipIcon: ReactNode;
  canRun: boolean;
  status: SessionStatus;
  onPrimaryAction: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const SessionControls = ({
  primaryIcon,
  primaryLabel,
  resetIcon,
  skipIcon,
  canRun,
  status,
  onPrimaryAction,
  onReset,
  onSkip
}: SessionControlsProps) => {
  const hasActiveRound = status === "running" || status === "paused";

  return (
    <div className={styles.controls} aria-label="Session controls">
      <button className={styles.iconButton} type="button" onClick={onReset} aria-label="Reset">
        {resetIcon}
      </button>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onPrimaryAction}
        disabled={!canRun}
      >
        {primaryIcon}
        <span>{primaryLabel}</span>
      </button>
      <button
        className={styles.iconButton}
        type="button"
        onClick={onSkip}
        disabled={!hasActiveRound}
        aria-label="Skip timer"
      >
        {skipIcon}
      </button>
    </div>
  );
};
