export type TimerDurationMode = "fixed" | "random";

export type SessionStatus = "idle" | "running" | "paused" | "complete";

export interface SelectionOption {
  id: string;
  label: string;
  weight: number;
  enabled: boolean;
  audioDataUrl: string | null;
  audioFileName: string | null;
}

export interface TimerStep {
  id: string;
  label: string;
  durationMode: TimerDurationMode;
  fixedSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  enabled: boolean;
}

export interface TimerConfig {
  options: SelectionOption[];
  timers: TimerStep[];
  loopSession: boolean;
  readSelectionAloud: boolean;
}

export interface ActiveRound {
  timerId: string;
  timerIndex: number;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: number;
}

export interface SelectionResult {
  optionId: string;
  label: string;
  optionIndex: number;
}

export interface RunHistoryEntry {
  id: string;
  timerLabel: string;
  durationSeconds: number;
  selectedLabel: string;
  completedAt: string;
}
