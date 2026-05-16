import { invoke } from "@tauri-apps/api/core";

import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import type { SelectionOption, SelectionResult, TimerStep } from "@/domain/timerTypes";

export class SessionEngine {
  static async resolveTimerDuration(timer: TimerStep): Promise<number> {
    if (!this.isTauriRuntime()) {
      return TimerDashboardLogic.localTimerDuration(timer, Math.random());
    }

    try {
      return await invoke<number>("resolve_timer_duration", { timer });
    } catch {
      throw new Error("Unable to resolve the next timer duration.");
    }
  }

  static async chooseOption(options: SelectionOption[]): Promise<SelectionResult> {
    if (!this.isTauriRuntime()) {
      return TimerDashboardLogic.localSelection(options, Math.random());
    }

    try {
      return await invoke<SelectionResult>("choose_option", { options });
    } catch {
      throw new Error("Unable to choose an option.");
    }
  }

  private static isTauriRuntime(): boolean {
    return Boolean(window.__TAURI_INTERNALS__);
  }
}
