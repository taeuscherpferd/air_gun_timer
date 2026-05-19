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
      enabled: true,
      selectOptionOnComplete: false
    });

    expect(timer.label).toBe("");
    expect(timer.fixedSeconds).toBe(1);
    expect(timer.minSeconds).toBe(25);
    expect(timer.maxSeconds).toBe(25);
    expect(timer.selectOptionOnComplete).toBe(false);
  });

  it("keeps existing timer configs selecting options after normalization", () => {
    const timer = TimerDashboardLogic.normalizeTimer({
      id: "legacy",
      label: "Legacy",
      durationMode: "fixed",
      fixedSeconds: 15,
      minSeconds: 10,
      maxSeconds: 20,
      enabled: true
    });

    expect(timer.selectOptionOnComplete).toBe(true);
  });

  it("only requires options when an active timer selects options", () => {
    const config = TimerDashboardLogic.createDefaultConfig();
    const disabledOptions = config.options.map((option) => ({ ...option, enabled: false }));

    expect(
      TimerDashboardLogic.canRun({
        ...config,
        options: disabledOptions
      })
    ).toBe(false);

    expect(
      TimerDashboardLogic.canRun({
        ...config,
        options: disabledOptions,
        timers: config.timers.map((timer) => ({ ...timer, selectOptionOnComplete: false }))
      })
    ).toBe(true);
  });

  it("uses a default display label for blank timers", () => {
    expect(TimerDashboardLogic.displayTimerLabel(" ")).toBe("Timer");
  });

  it("moves timers up and down", () => {
    const config = TimerDashboardLogic.createDefaultConfig();

    const movedDown = TimerDashboardLogic.moveTimer(config.timers, config.timers[0].id, "down");
    const movedUp = TimerDashboardLogic.moveTimer(movedDown, config.timers[0].id, "up");

    expect(movedDown.map((timer) => timer.id)).toEqual([config.timers[1].id, config.timers[0].id]);
    expect(movedUp.map((timer) => timer.id)).toEqual(config.timers.map((timer) => timer.id));
  });

  it("keeps timer order unchanged for invalid moves", () => {
    const config = TimerDashboardLogic.createDefaultConfig();

    expect(TimerDashboardLogic.moveTimer(config.timers, config.timers[0].id, "up")).toBe(
      config.timers
    );
    expect(TimerDashboardLogic.moveTimer(config.timers, "missing", "down")).toBe(config.timers);
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

  it("keeps blank option labels editable", () => {
    const config = TimerDashboardLogic.createDefaultConfig();
    const option = TimerDashboardLogic.normalizeOption({ ...config.options[0], label: " " });

    expect(option.label).toBe("");
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

  it("uses a default result label for blank options", () => {
    const config = TimerDashboardLogic.createDefaultConfig();
    const selection = TimerDashboardLogic.localSelection([{ ...config.options[0], label: "" }], 0);

    expect(selection.label).toBe("Option");
  });
});
