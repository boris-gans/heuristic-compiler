What you’re building is essentially a **client-side rule simulation and debugging environment** for a heuristic engine. It’s not just a UI — it’s a lightweight, interactive “compiler + debugger” for JSON-based rules, running entirely in the browser.

Here’s a clear, structured description of the system, both from a technical and user experience perspective.

---

## 🧠 Concept Overview

The application is a **fully client-side simulation tool** that allows users to:

* paste and edit heuristic rules written in JSON,
* configure input features dynamically,
* execute a Python-based heuristic engine directly in the browser,
* inspect outputs (labels, probabilities, applied rules),
* and visually trace which rules were triggered.

The goal is to **make rule behavior transparent and debuggable**, especially given that rule order and interactions are non-trivial.

---

## 🧱 Tech Stack

### Frontend

* **React (via Vite)**
  Provides a fast, minimal setup with excellent developer experience. Since this is a purely client-side app, Vite is preferred over heavier frameworks like Next.js.

* **Monaco Editor**
  Used as the JSON editor on the left panel. It gives:

  * syntax highlighting,
  * JSON validation,
  * line awareness (important for rule highlighting),
  * programmatic scrolling to specific rules.

### Python Execution

* **Pyodide (running in a Web Worker)**
  This is the core of the system:

  * Runs your `HeuristicLayer` Python code in the browser via WebAssembly.
  * Executes rule evaluation logic entirely client-side.
  * Isolated in a Web Worker to avoid blocking the UI.

### Communication Layer

* **PostMessage (main thread ↔ Web Worker)**
  Used to:

  * send inputs (rules, features, labels, etc.) to Python,
  * receive outputs (results, applied rules).

---

## 🧩 System Architecture

### High-Level Flow

1. User edits rules in Monaco (JSON).
2. User adjusts feature inputs via UI controls.
3. User clicks “Run Simulation.”
4. React sends:

   * rules JSON,
   * features,
   * labels/probabilities
     → to the Pyodide worker.
5. Python runs `HeuristicLayer.apply(...)`.
6. Output is returned:

   * sorted labels,
   * probabilities,
   * list of applied rule names.
7. UI updates:

   * displays results,
   * highlights applied rules in Monaco,
   * auto-scrolls to the relevant rule(s).

---

## 🖥️ UI Layout & User Experience

### Overall Layout

A **two-panel interface**:

```
+----------------------+-----------------------------+
|                      |                             |
|   JSON Rules Editor  |   Simulation Controls       |
|   (Monaco)           |   + Output                  |
|                      |                             |
+----------------------+-----------------------------+
```

---

### Left Panel: Rule Editor (Monaco)

This is the core workspace.

#### Features:

* JSON editing with syntax highlighting
* Formatting support
* Validation feedback (invalid JSON)
* Rule structure visibility

#### Advanced Behavior:

* When rules are applied:

  * Monaco **auto-scrolls to the rule(s)** that triggered
  * optionally highlights them (e.g., background color or gutter marker)

This turns the editor into a **debugging surface**, not just an input box.

---

### Right Panel: Controls + Output

Split into two vertical sections:

---

#### 1. Input Controls (Top)

A dynamic form representing your `features` dictionary.

* Sliders, dropdowns, text inputs depending on type
* Supports up to ~50 parameters
* Possibly grouped or collapsible for usability

Example:

* `risk_score` → slider (0 → 1)
* `shop` → text input
* `transaction_volume` → numeric input

Also includes:

* optional labels input
* optional probabilities input
* toggle for `probabilities_needed`

---

#### 2. Run Action

A prominent button:

**“Run Simulation”**

Triggers execution of the heuristic engine.

---

#### 3. Output Display (Bottom)

Displays results in a structured way:

##### a. Labels + Probabilities

* Sorted list
* Possibly visualized (bars or percentages)

##### b. Applied Rules

* List of rule names (in execution order)
* This is the key link to Monaco

##### c. Optional Debug Info (future)

* intermediate states
* before/after snapshots
* rule-by-rule trace

---

## 🔁 Interaction Flow

A typical user workflow:

1. Paste JSON rules into Monaco
2. Adjust feature inputs (e.g., `shop`, `risk_score`)
3. Click “Run Simulation”
4. See:

   * updated labels and probabilities
   * list of applied rules
5. Editor automatically scrolls to the rule that triggered
6. User tweaks rules → repeats

This creates a **tight feedback loop**, which is exactly what your colleagues need.

---

## 🧩 Key Product Value

This tool solves several real problems:

### 1. Rule Order Debugging

Since order matters, users can:

* immediately see which rule fired,
* visually locate it,
* understand precedence issues.

### 2. Transparency

Users move from:

> “Why did this output happen?”

to:

> “This exact rule caused it.”

### 3. Faster Iteration

No backend, no deployment:

* edit → run → inspect → repeat

### 4. Lower Cognitive Load

Instead of reading raw JSON:

* users interact with a live system
* behavior becomes observable

---

## ⚙️ Implementation Notes (Important)

### Run Pyodide in a Web Worker

Avoid freezing the UI during execution.

### Define a Clean Input/Output Contract

Frontend sends:

```json
{
  "rules": "...raw JSON string...",
  "features": {...},
  "probs": [...],
  "labels": [...],
  "probabilities_needed": true
}
```

Python returns:

```json
{
  "labels": [...],
  "probs": [...],
  "applied_rules": [...]
}
```

### Map Rule Names → Monaco Positions

To enable scrolling:

* parse rules JSON in JS
* build a mapping:

  * rule name → line number
* when a rule is applied:

  * scroll to that line

---

## 🚀 Future Extensions (Optional)

Even within client-side constraints, you could later add:

* rule validation/linting
* warnings for conflicting rules
* visualization of rule execution order
* “step-through” debugging mode
* rule templates
* guided rule builder UI

---

## 🧭 Summary

You’re building a:

> **Client-side heuristic rule simulator and debugger**

with:

* **React + Vite** for UI
* **Monaco** for rule editing
* **Pyodide** for executing Python logic in-browser

The UX is centered around:

* **fast iteration**
* **visual traceability**
* **tight feedback between rules and outcomes**

It’s a very solid, practical architecture — and importantly, your Python engine fits it almost perfectly.