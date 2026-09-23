// Sustituto del módulo virtual de vite-plugin-pwa en las pruebas: nunca hay actualización.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async () => {},
  }
}
