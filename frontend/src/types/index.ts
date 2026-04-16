// ─── Simulation I/O ────────────────────────────────────────────────────────

/** Input sent to the Pyodide worker to run a simulation. */
export interface SimulationInput {
  /** Raw JSON string containing the rules array. */
  rulesJson: string
  /** Feature values keyed by feature name (e.g. { shop: "myshop", amount: 500 }). */
  features: Record<string, string | number | boolean>
  /** Model output labels (e.g. ["card", "paypal", "klarna"]). */
  labels: string[]
  /** Model output probabilities, parallel to labels. Empty when probabilities_needed=false. */
  probs: number[]
  /** Whether to use probability arithmetic. When false, only ordering is considered. */
  probabilitiesNeeded: boolean
}

/** Output returned from the Pyodide worker after a simulation run. */
export interface SimulationOutput {
  /** Re-ranked labels after rule application. */
  labels: string[]
  /** Normalised probabilities parallel to labels, or null when probabilities_needed=false. */
  probs: number[] | null
  /** Names of every rule that fired, in execution order. */
  appliedRules: string[]
}

// ─── Worker message protocol ───────────────────────────────────────────────

export type WorkerMessage =
  | { type: 'run'; payload: SimulationInput }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; payload: SimulationOutput }
  | { type: 'error'; message: string }

// ─── Feature metadata (derived from rules JSON) ───────────────────────────

export type FeatureInputType = 'number' | 'text'

export interface FeatureMeta {
  name: string
  /** Inferred from the operators used against this field in rule conditions. */
  inputType: FeatureInputType
  /** All operators seen for this field across all conditions. */
  operators: string[]
}
