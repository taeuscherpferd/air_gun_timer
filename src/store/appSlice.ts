import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import type { SelectionOptionUpdate, TimerStepUpdate } from "@/domain/editPayloads";
import type {
  ActiveRound,
  RunHistoryEntry,
  SelectionResult,
  SessionStatus,
  TimerConfig,
  TimerMoveDirection,
  TimerStep
} from "@/domain/timerTypes";
import { ConfigStorage } from "@/services/configStorage";

interface SessionState {
  config: TimerConfig;
  status: SessionStatus;
  activeRound: ActiveRound | null;
  latestSelection: SelectionResult | null;
  history: RunHistoryEntry[];
  errorMessage: string | null;
}

const initialState: SessionState = {
  config: ConfigStorage.load(),
  status: "idle",
  activeRound: null,
  latestSelection: null,
  history: [],
  errorMessage: null
};

const persistConfig = (config: TimerConfig): void => {
  ConfigStorage.save(config);
};

const createId = (prefix: string): string => {
  if (typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}`;
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLoopSession(state, action: PayloadAction<boolean>) {
      state.config.loopSession = action.payload;
      persistConfig(state.config);
    },
    setReadSelectionAloud(state, action: PayloadAction<boolean>) {
      state.config.readSelectionAloud = action.payload;
      persistConfig(state.config);
    },
    addTimer(state) {
      state.config.timers.push({
        id: createId("timer"),
        label: "New step",
        durationMode: "fixed",
        fixedSeconds: 30,
        minSeconds: 15,
        maxSeconds: 60,
        enabled: true,
        selectOptionOnComplete: true
      });
      persistConfig(state.config);
    },
    updateTimer(state, action: PayloadAction<TimerStepUpdate>) {
      const timer = state.config.timers.find((candidate) => candidate.id === action.payload.id);

      if (!timer) {
        return;
      }

      Object.assign(timer, action.payload);
      Object.assign(timer, TimerDashboardLogic.normalizeTimer(timer));
      persistConfig(state.config);
    },
    removeTimer(state, action: PayloadAction<string>) {
      state.config.timers = state.config.timers.filter((timer) => timer.id !== action.payload);
      persistConfig(state.config);
    },
    moveTimer(state, action: PayloadAction<{ id: string; direction: TimerMoveDirection }>) {
      state.config.timers = TimerDashboardLogic.moveTimer(
        state.config.timers,
        action.payload.id,
        action.payload.direction
      );
      persistConfig(state.config);
    },
    addOption(state) {
      state.config.options.push({
        id: createId("option"),
        label: "New option",
        weight: 1,
        enabled: true,
        audioDataUrl: null,
        audioFileName: null
      });
      persistConfig(state.config);
    },
    updateOption(state, action: PayloadAction<SelectionOptionUpdate>) {
      const option = state.config.options.find((candidate) => candidate.id === action.payload.id);

      if (!option) {
        return;
      }

      Object.assign(option, action.payload);
      Object.assign(option, TimerDashboardLogic.normalizeOption(option));
      persistConfig(state.config);
    },
    removeOption(state, action: PayloadAction<string>) {
      state.config.options = state.config.options.filter((option) => option.id !== action.payload);
      persistConfig(state.config);
    },
    startRound(
      state,
      action: PayloadAction<{ timer: TimerStep; timerIndex: number; durationSeconds: number }>
    ) {
      state.status = "running";
      state.latestSelection = null;
      state.errorMessage = null;
      state.activeRound = {
        timerId: action.payload.timer.id,
        timerIndex: action.payload.timerIndex,
        label: TimerDashboardLogic.displayTimerLabel(action.payload.timer.label),
        selectOptionOnComplete: action.payload.timer.selectOptionOnComplete,
        durationSeconds: action.payload.durationSeconds,
        remainingSeconds: action.payload.durationSeconds,
        startedAt: Date.now()
      };
    },
    pauseRound(state) {
      if (state.status === "running") {
        state.status = "paused";
      }
    },
    resumeRound(state) {
      if (state.status === "paused") {
        state.status = "running";
      }
    },
    tickRound(state) {
      if (state.status !== "running" || !state.activeRound) {
        return;
      }

      state.activeRound.remainingSeconds = Math.max(0, state.activeRound.remainingSeconds - 1);
    },
    completeRound(state, action: PayloadAction<SelectionResult | null>) {
      if (!state.activeRound) {
        return;
      }

      state.latestSelection = action.payload;
      state.history.unshift({
        id: createId("history"),
        timerLabel: state.activeRound.label,
        durationSeconds: state.activeRound.durationSeconds,
        selectedLabel: action.payload?.label ?? "No selection",
        completedAt: new Date().toISOString()
      });
      state.history = state.history.slice(0, 12);
      state.status = "paused";
    },
    markComplete(state) {
      state.status = "complete";
      state.activeRound = null;
    },
    resetSession(state) {
      state.status = "idle";
      state.activeRound = null;
      state.latestSelection = null;
      state.errorMessage = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.errorMessage = action.payload;
      state.status = "idle";
      state.activeRound = null;
    }
  }
});

export const {
  addOption,
  addTimer,
  completeRound,
  markComplete,
  moveTimer,
  pauseRound,
  removeOption,
  removeTimer,
  resetSession,
  resumeRound,
  setError,
  setLoopSession,
  setReadSelectionAloud,
  startRound,
  tickRound,
  updateOption,
  updateTimer
} = appSlice.actions;
