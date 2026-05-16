import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import type { TimerConfig } from "@/domain/timerTypes";

const storageKey = "gun-timer-config";

export class ConfigStorage {
  static load(): TimerConfig {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return TimerDashboardLogic.createDefaultConfig();
    }

    try {
      const parsedValue = JSON.parse(rawValue) as TimerConfig;

      return {
        loopSession: Boolean(parsedValue.loopSession),
        readSelectionAloud: Boolean(parsedValue.readSelectionAloud),
        timers: parsedValue.timers.map((timer) => TimerDashboardLogic.normalizeTimer(timer)),
        options: parsedValue.options.map((option) => TimerDashboardLogic.normalizeOption(option))
      };
    } catch {
      return TimerDashboardLogic.createDefaultConfig();
    }
  }

  static save(config: TimerConfig): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(config));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }
}
