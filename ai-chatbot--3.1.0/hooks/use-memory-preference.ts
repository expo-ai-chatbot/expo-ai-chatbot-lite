import { useLocalStorage } from "usehooks-ts";

export function useMemoryPreference() {
  const [memoryEnabled, setMemoryEnabled] = useLocalStorage(
    "memory-enabled",
    true // Default to enabled
  );

  return {
    memoryEnabled,
    setMemoryEnabled,
    toggleMemory: () => setMemoryEnabled((prev) => !prev),
  };
}
