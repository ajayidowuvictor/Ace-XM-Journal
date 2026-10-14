export type Autosaver = {
  /** Call after every edit. Saves once the user pauses typing. */
  schedule: () => void;
  /** Saves right now if an edit is waiting (use when leaving the screen or closing the app). */
  flush: () => void;
  /** Drops a waiting save without running it. */
  cancel: () => void;
};

/** Waits for a pause in typing, then calls `save` once. */
export function createAutosaver(save: () => void, delayMs = 800): Autosaver {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    schedule: () => {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        save();
      }, delayMs);
    },
    flush: () => {
      if (timer !== null) {
        cancel();
        save();
      }
    },
    cancel,
  };
}
