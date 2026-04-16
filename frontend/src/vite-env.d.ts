/// <reference types="vite/client" />

// Type declaration for the Pyodide CDN bundle loaded at runtime.
// The package is not installed locally; we declare the shape we use.
declare module 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function loadPyodide(options?: Record<string, unknown>): Promise<any>
}
