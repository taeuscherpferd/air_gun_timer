import { OptionEditor } from "@/components/OptionEditor/OptionEditor";
import { RunHistory } from "@/components/RunHistory/RunHistory";
import { TimerDashboard } from "@/components/TimerDashboard/TimerDashboard";
import { TimerEditor } from "@/components/TimerEditor/TimerEditor";

import styles from "./App.module.scss";

export const App = () => {
  return (
    <main className={styles.appShell}>
      <section className={styles.workspace} aria-label="Gun timer workspace">
        <TimerDashboard />
        <div className={styles.configGrid}>
          <TimerEditor />
          <OptionEditor />
        </div>
        <RunHistory />
      </section>
    </main>
  );
};
