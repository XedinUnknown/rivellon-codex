// The bundled game data (tools/codex-data-plugin.ts): extracted from the user's spreadsheets, or the sample.
declare module 'virtual:codex-data' {
  export const usesSample: boolean;
  export const loadNexus: () => Promise<unknown>;
  export const loadIcons: () => Promise<unknown>;
  export const refLoaders: Record<string, () => Promise<unknown>>;
}
