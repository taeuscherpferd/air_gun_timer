import { FileAudio, Plus, Trash2, X } from "lucide-react";
import type { ChangeEvent } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection/CollapsibleSection";
import { TimerDashboardLogic } from "@/components/TimerDashboard/TimerDashboard.logic";
import {
  addOption,
  removeOption,
  setReadSelectionAloud,
  updateOption
} from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import styles from "./OptionEditor.module.scss";

const readAudioFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected audio file could not be read."));
    });

    reader.addEventListener("error", () => {
      reject(new Error("The selected audio file could not be read."));
    });

    reader.readAsDataURL(file);
  });
};

export const OptionEditor = () => {
  const dispatch = useAppDispatch();
  const options = useAppSelector((state) => state.app.config.options);
  const readSelectionAloud = useAppSelector((state) => state.app.config.readSelectionAloud);

  const handleWeightChange = (id: string) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateOption({ id, weight: Number(event.target.value) }));
    };
  };

  const handleAudioFileChange = (id: string) => {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      try {
        const audioDataUrl = await readAudioFile(file);
        dispatch(updateOption({ id, audioDataUrl, audioFileName: file.name }));
      } catch {
        dispatch(updateOption({ id, audioDataUrl: null, audioFileName: null }));
      }
    };
  };

  return (
    <CollapsibleSection
      ariaLabel="Selection options"
      eyebrow="Options"
      title="Random Picks"
      actions={
        <button className={styles.headerButton} type="button" onClick={() => dispatch(addOption())} aria-label="Add option">
          <Plus size={18} />
        </button>
      }
    >
      <label className={styles.readToggle}>
        <input
          type="checkbox"
          checked={readSelectionAloud}
          onChange={(event) => dispatch(setReadSelectionAloud(event.target.checked))}
        />
        <span>Read selected option aloud when no audio file is attached</span>
      </label>
      <div className={styles.optionList}>
        {options.map((option) => (
          <article className={styles.optionCard} key={option.id}>
            <div className={styles.optionMainRow}>
              <label className={styles.enabledToggle}>
                <input
                  type="checkbox"
                  checked={option.enabled}
                  onChange={(event) =>
                    dispatch(updateOption({ id: option.id, enabled: event.target.checked }))
                  }
                />
                <span>Enabled</span>
              </label>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  value={option.label}
                  onChange={(event) =>
                    dispatch(updateOption({ id: option.id, label: event.target.value }))
                  }
                />
              </label>
              <label className={styles.weightField}>
                <span>Weight</span>
                <input
                  type="number"
                  min="0"
                  value={option.weight}
                  onChange={handleWeightChange(option.id)}
                />
              </label>
              <button
                type="button"
                onClick={() => dispatch(removeOption(option.id))}
                aria-label={`Remove ${TimerDashboardLogic.selectionLabel(option.label)}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className={styles.audioRow}>
              <label className={styles.audioPicker}>
                <FileAudio size={16} />
                <span>{option.audioFileName ?? "Attach audio"}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => {
                    void handleAudioFileChange(option.id)(event);
                  }}
                />
              </label>
              {option.audioDataUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      updateOption({
                        id: option.id,
                        audioDataUrl: null,
                        audioFileName: null
                      })
                    )
                  }
                  aria-label={`Clear audio for ${option.label}`}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
};
