type Listener = (show: boolean) => void;

let showBanner = false;
const listeners = new Set<Listener>();

export const reminderStore = {
  getShowMissingTaskBanner(): boolean {
    return showBanner;
  },
  setShowMissingTaskBanner(v: boolean): void {
    showBanner = v;
    listeners.forEach((l) => l(v));
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  }
};
