import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

import styles from "./CollapsibleSection.module.scss";

interface CollapsibleSectionProps {
  title: string;
  eyebrow: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  ariaLabel: string;
}

export const CollapsibleSection = ({
  title,
  eyebrow,
  actions,
  children,
  defaultExpanded = true,
  ariaLabel
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const Icon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <section className={styles.panel} aria-label={ariaLabel}>
      <header className={styles.panelHeader}>
        <button
          className={styles.toggleButton}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          <Icon size={18} aria-hidden="true" />
          <span className={styles.headingText}>
            <span>{eyebrow}</span>
            <strong>{title}</strong>
          </span>
        </button>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {isExpanded ? (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      ) : null}
    </section>
  );
};
