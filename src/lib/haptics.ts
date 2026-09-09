import * as Haptics from 'expo-haptics'

// Espelha o use-haptic do PWA (que usa navigator.vibrate). Cada chamada é
// silenciosa em erro — no simulador iOS não vibra, e falha de módulo não pode
// derrubar a ação.
function safe(fn: () => Promise<unknown>): void {
  try {
    fn().catch(() => {})
  } catch {
    /* noop */
  }
}

export function useHaptic() {
  return {
    tap: () => safe(() => Haptics.selectionAsync()),
    success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  }
}
