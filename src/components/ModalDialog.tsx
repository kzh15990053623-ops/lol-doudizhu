/* Backdrop clicks are a native dialog dismissal affordance; keyboard dismissal is handled by onCancel. */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
import { type PropsWithChildren, useEffect, useId, useRef } from "react";
import styles from "./Dialogs.module.css";

interface ModalDialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose(): void;
  size?: "medium" | "wide";
  closeLabel?: string;
  dismissible?: boolean;
}

export function ModalDialog({
  open,
  title,
  eyebrow,
  onClose,
  children,
  size = "medium",
  closeLabel = "关闭",
  dismissible = true,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreTargetRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      restoreTargetRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      window.requestAnimationFrame(() => {
        const initial = dialog.querySelector<HTMLElement>("[data-dialog-initial]") ?? dialog.querySelector<HTMLElement>("button, [href], input, select, textarea");
        initial?.focus({ preventScroll: true });
      });
      return;
    }
    if (!open && dialog.open) {
      dialog.close();
      const target = restoreTargetRef.current;
      restoreTargetRef.current = null;
      window.requestAnimationFrame(() => {
        if (target && document.contains(target) && !document.querySelector("dialog[open]")) target.focus({ preventScroll: true });
      });
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div>
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          {dismissible ? (
            <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose} data-dialog-initial>
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </header>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users need to focus and scroll text-only dialog content. */}
        <div className={styles.body} role="region" aria-labelledby={titleId} tabIndex={0}>{children}</div>
      </section>
    </dialog>
  );
}
