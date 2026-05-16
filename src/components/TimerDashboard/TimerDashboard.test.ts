import { describe, expect, it } from "vitest";

import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";

describe("TimerDashboardLogic", () => {
  it("creates a runnable default configuration", () => {
    const config = TimerDashboardLogic.createDefaultConfig();

    expect(TimerDashboardLogic.canRun(config)).toBe(true);
    expect(TimerDashboardLogic.activeTimers(config)).toHaveLength(2);
    expect(TimerDashboardLogic.activeOptions(config)).toHaveLength(3);
  });

  it("normalizes invalid timers into a safe shape", () => {
    const timer = TimerDashboardLogic.normalizeTimer({
      id: "bad",
      label: " ",
      durationMode: "random",
      fixedSeconds: -3,
      minSeconds: 25,
      maxSeconds: 10,
      enabled: true
    });

    expect(timer.label).toBe("Timer");
    expect(timer.fixedSeconds).toBe(1);
    expect(timer.minSeconds).toBe(25);
    expect(timer.maxSeconds).toBe(25);
  });

  it("selects the next enabled timer and respects looping", () => {
    const config = TimerDashboardLogic.createDefaultConfig();

    expect(TimerDashboardLogic.nextTimerIndex(config, 0)).toBe(1);
    expect(TimerDashboardLogic.nextTimerIndex(config, 1)).toBe(0);
    expect(TimerDashboardLogic.nextTimerIndex({ ...config, loopSession: false }, 1)).toBeNull();
  });

  it("formats durations as minutes and padded seconds", () => {
    expect(TimerDashboardLogic.formatDuration(65)).toBe("1:05");
  });

  it("resolves random durations inside the configured range", () => {
    const config = TimerDashboardLogic.createDefaultConfig();
    const duration = TimerDashboardLogic.localTimerDuration(config.timers[1], 0.5);

    expect(duration).toBeGreaterThanOrEqual(config.timers[1].minSeconds);
    expect(duration).toBeLessThanOrEqual(config.timers[1].maxSeconds);
  });

  it("uses option weights for local selection", () => {
    const config = TimerDashboardLogic.createDefaultConfig();

    const selection = TimerDashboardLogic.localSelection(
      [
        { ...config.options[0], weight: 1 },
        { ...config.options[1], weight: 9 },
        { ...config.options[2], weight: 0 }
      ],
      0.95
    );

    expect(selection.optionId).toBe(config.options[1].id);
  });
});
