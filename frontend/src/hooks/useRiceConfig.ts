import { useRiceStore } from "@/store/useRiceStore";
import { useRiceConfigContext } from "@/contexts/RiceConfigContext";

// Unified API: store mutations + persistence layer
export function useRiceConfig() {
  const store = useRiceStore();
  const persistence = useRiceConfigContext();

  return {
    // State
    config: store.config,
    activeSection: store.activeSection,
    riceId: persistence.riceId,
    isLoading: persistence.isLoading,
    isSaving: persistence.isSaving,
    isDirty: persistence.isDirty,
    error: persistence.error,

    // Mutations
    setActiveSection: store.setActiveSection,
    setName: store.setName,
    setColors: store.setColors,
    setFont: store.setFont,
    setWM: store.setWM,
    setBar: store.setBar,
    setTerminal: store.setTerminal,
    setLauncher: store.setLauncher,
    setLockScreen: store.setLockScreen,
    resetConfig: store.resetConfig,

    // Persistence
    loadConfig: persistence.loadConfig,
    saveConfig: persistence.saveConfig,
  };
}
