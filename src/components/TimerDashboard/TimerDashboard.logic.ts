import type {
  SelectionOption,
  SelectionResult,
  TimerConfig,
  TimerMoveDirection,
  TimerStep
} from "@/domain/timerTypes";

export class TimerDashboardLogic {
  static readonly minimumSeconds = 1;

  static createDefaultConfig(): TimerConfig {
    return {
      loopSession: true,
      readSelectionAloud: false,
      timers: [
        {
          id: "timer-warmup",
          label: "Warmup",
          durationMode: "fixed",
          fixedSeconds: 30,
          minSeconds: 20,
          maxSeconds: 45,
          enabled: true
        },
        {
          id: "timer-drill",
          label: "Drill",
          durationMode: "random",
          fixedSeconds: 60,
          minSeconds: 20,
          maxSeconds: 90,
          enabled: true
        }
      ],
      options: [
        {
          id: "option-alpha",
          label: "Alpha",
          weight: 1,
          enabled: true,
          audioDataUrl: null,
          audioFileName: null
        },
        {
          id: "option-bravo",
          label: "Bravo",
          weight: 1,
          enabled: true,
          audioDataUrl: null,
          audioFileName: null
        },
        {
          id: "option-charlie",
          label: "Charlie",
          weight: 1,
          enabled: true,
          audioDataUrl: null,
          audioFileName: null
        }
      ]
    };
  }

  static activeTimers(config: TimerConfig): TimerStep[] {
    return config.timers.filter((timer) => timer.enabled);
  }

  static activeOptions(config: TimerConfig): SelectionOption[] {
    return config.options.filter((option) => option.enabled && option.weight > 0);
  }

  static canRun(config: TimerConfig): boolean {
    return this.activeTimers(config).length > 0 && this.activeOptions(config).length > 0;
  }

  static moveTimer(timers: TimerStep[], timerId: string, direction: TimerMoveDirection): TimerStep[] {
    const currentIndex = timers.findIndex((timer) => timer.id === timerId);

    if (currentIndex === -1) {
      return timers;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= timers.length) {
      return timers;
    }

    const reorderedTimers = [...timers];
    const [movedTimer] = reorderedTimers.splice(currentIndex, 1);
    reorderedTimers.splice(targetIndex, 0, movedTimer);

    return reorderedTimers;
  }

  static normalizeSeconds(value: number): number {
    if (!Number.isFinite(value)) {
      return this.minimumSeconds;
    }

    return Math.max(this.minimumSeconds, Math.round(value));
  }

  static normalizeWeight(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.max(0, Math.round(value));
  }

  static normalizeTimer(timer: TimerStep): TimerStep {
    const minSeconds = this.normalizeSeconds(timer.minSeconds);
    const maxSeconds = Math.max(minSeconds, this.normalizeSeconds(timer.maxSeconds));

    return {
      ...timer,
      label: timer.label.trim(),
      fixedSeconds: this.normalizeSeconds(timer.fixedSeconds),
      minSeconds,
      maxSeconds
    };
  }

  static displayTimerLabel(label: string): string {
    return label.trim() || "Timer";
  }

  static normalizeOption(option: SelectionOption): SelectionOption {
    return {
      ...option,
      label: option.label.trim(),
      weight: this.normalizeWeight(option.weight),
      audioDataUrl: option.audioDataUrl ?? null,
      audioFileName: option.audioFileName ?? null
    };
  }

  static selectionLabel(label: string): string {
    return label.trim() || "Option";
  }

  static nextTimerIndex(config: TimerConfig, currentIndex: number): number | null {
    const timers = this.activeTimers(config);

    if (timers.length === 0) {
      return null;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < timers.length) {
      return nextIndex;
    }

    return config.loopSession ? 0 : null;
  }

  static formatDuration(totalSeconds: number): string {
    const seconds = this.normalizeSeconds(totalSeconds);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }

  static localTimerDuration(timer: TimerStep, randomValue: number): number {
    const normalizedTimer = this.normalizeTimer(timer);

    if (normalizedTimer.durationMode === "fixed") {
      return normalizedTimer.fixedSeconds;
    }

    const span = normalizedTimer.maxSeconds - normalizedTimer.minSeconds + 1;
    const offset = Math.floor(Math.min(Math.max(randomValue, 0), 0.999999) * span);

    return normalizedTimer.minSeconds + offset;
  }

  static localSelection(options: SelectionOption[], randomValue: number): SelectionResult {
    const activeOptions = options
      .map((option) => this.normalizeOption(option))
      .filter((option) => option.enabled && option.weight > 0);

    if (activeOptions.length === 0) {
      throw new Error("At least one enabled option with weight is required.");
    }

    const totalWeight = activeOptions.reduce((total, option) => total + option.weight, 0);
    let cursor = Math.min(Math.max(randomValue, 0), 0.999999) * totalWeight;

    for (const option of activeOptions) {
      cursor -= option.weight;

      if (cursor < 0) {
        return {
          optionId: option.id,
          label: this.selectionLabel(option.label),
          optionIndex: options.findIndex((candidate) => candidate.id === option.id)
        };
      }
    }

    const fallback = activeOptions[activeOptions.length - 1];
    return {
      optionId: fallback.id,
      label: this.selectionLabel(fallback.label),
      optionIndex: options.findIndex((candidate) => candidate.id === fallback.id)
    };
  }
}
