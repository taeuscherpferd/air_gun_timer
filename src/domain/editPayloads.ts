import type { SelectionOption, TimerStep } from "@/domain/timerTypes";

export type SelectionOptionUpdate = Partial<
  Pick<SelectionOption, "label" | "weight" | "enabled" | "audioDataUrl" | "audioFileName">
> & {
  id: string;
};

export type TimerStepUpdate = Partial<
  Pick<
    TimerStep,
    | "label"
    | "durationMode"
    | "fixedSeconds"
    | "minSeconds"
    | "maxSeconds"
    | "enabled"
    | "selectOptionOnComplete"
  >
> & {
  id: string;
};
