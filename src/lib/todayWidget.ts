import { Platform } from 'react-native';

type TodayWidgetModule = { update: (payload: string) => void };

let native: TodayWidgetModule | null | undefined;

function load(): TodayWidgetModule | null {
  if (native !== undefined) return native;
  native = null;
  if (Platform.OS !== 'android') return native;
  try {
    // Loaded on first use. A build without the widget (or a test) simply has no module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require('expo') as typeof import('expo');
    native = requireNativeModule<TodayWidgetModule>('TodayWidget');
  } catch {
    native = null;
  }
  return native;
}

/** Gives the home-screen widget new text. Does nothing where there is no widget. Never throws. */
export function updateTodayWidget(payload: object): boolean {
  try {
    const module = load();
    if (!module) return false;
    module.update(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
