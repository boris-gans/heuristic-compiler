# Heuristic Layer — Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installing `ml_training_utils`](#installing-ml_training_utils)
4. [The `HeuristicLayer` Class](#the-heuristiclayer-class)
   - [Initialization and Rule Loading](#initialization-and-rule-loading)
   - [Calling `apply()`](#calling-apply)
   - [Return Values](#return-values)
5. [Rules JSON Format](#rules-json-format)
   - [Top-Level Structure](#top-level-structure)
   - [Scope](#scope)
   - [Antecedent (Conditions)](#antecedent-conditions)
   - [Consequent (Actions)](#consequent-actions)
   - [Break Flag](#break-flag)
6. [Operators In Depth](#operators-in-depth)
   - [override](#override)
   - [adjust](#adjust)
   - [ban](#ban)
   - [append](#append)
   - [Execution Order](#execution-order)
7. [Condition Operators Reference](#condition-operators-reference)
8. [The `HeuristicRulesManager` Wrapper](#the-heuristicrulesmanager-wrapper)
   - [Initialization](#initialization)
   - [Lifecycle Methods](#lifecycle-methods)
   - [A/B Testing Mode](#ab-testing-mode)
   - [S3 Loading Flow](#s3-loading-flow)
9. [Required Environment Variables](#required-environment-variables)
10. [Minimal Standalone Integration (No S3)](#minimal-standalone-integration-no-s3)
11. [Full Integration via `HeuristicRulesManager`](#full-integration-via-heuristicrulesmanager)
12. [Edge Cases and Gotchas](#edge-cases-and-gotchas)

---

## Overview

The heuristic layer is a post-processing step applied **after** the ML model produces ranked payment-method predictions. It modifies the ranked list by applying a set of business rules defined in a JSON file. Rules can:

- **Override** — force specific payment methods to the top of the list.
- **Adjust** — multiply a payment method's probability by a scaling factor.
- **Ban** — remove a payment method from the output entirely.
- **Append** — add a payment method to the end of the list (only without probabilities).

The implementation lives in the private `ml_training_utils` package as `HeuristicLayer`. In this service, `HeuristicRulesManager` wraps it to handle S3 loading, configuration, and the A/B testing split.

---

## Architecture

```
          ┌─────────────────────────────────────┐
          │         HeuristicRulesManager        │
          │  (app/core/ml/heuristic_rules_manager.py) │
          │                                     │
          │  1. Downloads rules JSON from S3    │
          │  2. Writes it to BASE_DIR/          │
          │  3. Instantiates HeuristicLayer      │
          │  4. Calls layer.load_rules(path)    │
          │  5. Exposes apply_heuristic_rules() │
          └────────────────┬────────────────────┘
                           │ wraps
          ┌────────────────▼────────────────────┐
          │          HeuristicLayer              │
          │    (from ml_training_utils package)  │
          │                                     │
          │  load_rules(path)  →  reads JSON    │
          │  apply(probs, labels, features, …)  │
          └─────────────────────────────────────┘
                           │ reads
          ┌────────────────▼────────────────────┐
          │        rules.json  (on S3)           │
          └─────────────────────────────────────┘
```

---

## Installing `ml_training_utils`

`HeuristicLayer` is part of the **private** `ml_training_utils` package hosted at:

```
github.com/fero-payment-science/ml-training-utils
```

It is installed via SSH. The pinned version in `requirements/private.txt` is:

```
git+ssh://git@github.com/fero-payment-science/ml-training-utils.git@2026.01.3#egg=ml-training-utils
```

### Local / CI installation

Your SSH agent must have a key that has access to the `fero-payment-science` GitHub organisation.

```bash
# Ensure your key is loaded
ssh-add ~/.ssh/id_ed25519   # or whichever key has GitHub access

# Install directly
pip install "git+ssh://git@github.com/fero-payment-science/ml-training-utils.git@2026.01.3#egg=ml-training-utils"
```

### Docker (BuildKit SSH mount)

The `Dockerfile` uses BuildKit's SSH forwarding so that the host key is never baked into the image layer:

```dockerfile
RUN --mount=type=ssh \
    pip install --use-deprecated=legacy-resolver -r requirements/private.txt
```

Build with:

```bash
DOCKER_BUILDKIT=1 docker build --ssh default .
```

The image also pre-trusts `github.com`:

```dockerfile
RUN mkdir -p ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
```

### Import

After installation the package exposes:

```python
from ml_training_utils import HeuristicLayer
```

---

## The `HeuristicLayer` Class

### Initialization and Rule Loading

```python
from ml_training_utils import HeuristicLayer

layer = HeuristicLayer()
layer.load_rules(rules_path="/path/to/rules.json")
```

`load_rules` reads a JSON file that is either a single rule object (`dict`) or a list of rule objects. Internally it calls `_split_rules`, which partitions the rules into four buckets — `override`, `adjust`, `ban`, `append` — keyed on each rule's `consequent.action` field.

### Calling `apply()`

```python
updated_labels, updated_probs, applied_rules = layer.apply(
    probs=probabilities,          # list[float], one value per label
    labels=payment_methods,       # list[str], model output labels
    features=transaction_features,# dict, the raw feature values for this request
    operators=None,               # optional list[str] to restrict which operators run
    probabilities_needed=True,    # False when only a ranked list is needed
    new_labels_to_add=None,       # list[str] of labels to inject before rule application
)
```

| Parameter | Type | Description |
|---|---|---|
| `probs` | `list[float]` | Probability for each label. Must be the same length as `labels` when `probabilities_needed=True`. |
| `labels` | `list[str]` | Ranked payment method labels from the model. |
| `features` | `dict` | Feature key-value pairs used to evaluate rule conditions. Must contain a `shop` key for scope matching. |
| `operators` | `list[str] \| None` | Restrict to a subset of operators. Default runs all four in priority order. |
| `probabilities_needed` | `bool` | Set to `False` for use-cases where only ordering matters (e.g. product recommendations). Disables `adjust` and changes `override`/`ban` to work without probability arithmetic. |
| `new_labels_to_add` | `list[str] \| None` | Labels injected with a tiny random probability before rules run. Useful for surfacing payment methods the model was never trained on. |

### Return Values

```python
updated_labels: list[str]   # re-ranked labels
updated_probs:  list[float] # normalized probabilities, or None when probabilities_needed=False
applied_rules:  list[str]   # names of every rule that fired
```

When **no rules fire**, the original `labels` and `probs` are returned unchanged.

---

## Rules JSON Format

### Top-Level Structure

The file must be either a single rule object or a JSON array of rule objects.

```json
[
  {
    "name": "rule_name",
    "scope": ["shop_001", "shop_002"],
    "antecedent": {
      "logic": "all",
      "conditions": [...]
    },
    "consequent": {
      "action": "override",
      "value": "card"
    },
    "break": false
  }
]
```

### Scope

Controls which shops the rule applies to. Checked against `features["shop"]` (case-insensitive substring match).

| `scope` value | Behaviour |
|---|---|
| `"all"` | Always applies to every shop |
| `"shop_001"` (string) | Applies when `scope` is a substring of the shop identifier |
| `["shop_001", "shop_002"]` (list) | Applies when any element of the list is a substring of the shop identifier |
| omitted / `[]` | Rule is skipped |

### Antecedent (Conditions)

```json
"antecedent": {
  "logic": "all",
  "conditions": [
    {
      "field": "currency",
      "operator": "==",
      "value": "EUR"
    },
    {
      "field": "amount",
      "operator": ">",
      "value": 100
    }
  ]
}
```

- `logic`: `"all"` (AND) or `"any"` (OR). Defaults to `"all"`.
- `conditions`: list of condition objects. Each has `field`, `operator`, `value`.
- `value` may be a **field reference** like `"{other_field}"` — the engine will resolve it from `features` at evaluation time.

### Consequent (Actions)

```json
"consequent": {
  "action": "override",
  "value": "card",
  "scaling_factor": 1.0
}
```

| Key | Required | Description |
|---|---|---|
| `action` | Yes | One of `override`, `adjust`, `ban`, `append` |
| `value` | Yes | The target label (string) or list of labels |
| `scaling_factor` | Only for `adjust` | Float multiplier applied to the label's probability |

`value` can be a single string or a list of strings for `override`, `ban`, and `append`.

### Break Flag

```json
"break": true
```

When `true`, no further rules in the **same operator bucket** are evaluated after this rule fires. Useful for mutually-exclusive rule groups.

---

## Operators In Depth

### `override`

Forces a payment method to the **top of the ranked list** by setting its probability to `1000` (a sentinel value that dominates all real probabilities after normalization).

- If the label already exists in the list, its probability is set to `1000` in-place.
- If the label does not exist, it is **inserted at index 0**.
- For a `value` list, items are inserted in the order they appear in the list (first item ends up first).

**With `probabilities_needed=False`**: the label is moved/inserted to index 0 without any probability arithmetic.

### `adjust`

Multiplies the probability of a specific label by `scaling_factor`.

```json
{
  "action": "adjust",
  "value": "paypal",
  "scaling_factor": 0.5
}
```

Only operates when `probabilities_needed=True`. Has no effect otherwise.

### `ban`

Removes one or more labels from the output entirely.

- Works in both probability and non-probability modes.
- If all labels are banned, returns empty lists and logs a warning.
- String comparison is done with `str()` casting so that numeric label types are handled correctly.

### `append`

Adds labels to the **end** of the output list. Only active when `probabilities_needed=False`.

- A label is appended only if it is not already present in the model output (`current_labels`) and has not been appended by a previous rule.
- If a later (higher-priority) rule tries to append the same label, the earlier append is removed and the new one takes effect.

### Execution Order

Operators always run in this fixed priority order, regardless of the order they appear in the JSON file or the `operators` parameter:

```
1. override  (priority 1 — highest)
2. adjust    (priority 2)
3. ban       (priority 4)
4. append    (priority 1 — but only without probabilities)
```

The priority numbers come from `valid_operators = {"append": 1, "adjust": 2, "override": 3, "ban": 4}`. Rules within each operator bucket run in the order they appear in the JSON file.

---

## Condition Operators Reference

| Operator | Description | Notes |
|---|---|---|
| `==` | Equality | String-cast comparison; handles list vs. scalar |
| `!=` | Inequality | Same casting rules as `==` |
| `contains` | Substring / set intersection | Case-insensitive for strings |
| `not contains` | Absence of substring / no intersection | Case-insensitive |
| `in` | Value is in a list | Scalar vs. list or list vs. list |
| `not in` | Value is not in a list | — |
| `>` | Greater than | Casts both sides to `float` |
| `>=` | Greater than or equal | Casts both sides to `float` |
| `<` | Less than | Casts both sides to `float` |
| `<=` | Less than or equal | Casts both sides to `float` |
| `between` | Inclusive range check | `value` must be a two-element list: `[low, high]` |
| `regex` | Regular expression match | Uses `re.search` against `str(actual)` |

If `actual` (the feature value) is `None`, the condition always evaluates to `False`. If a field reference in `value` cannot be resolved, the condition also returns `False`.

---

## The `HeuristicRulesManager` Wrapper

`app/core/ml/heuristic_rules_manager.py`

### Initialization

```python
from app.core.ml.heuristic_rules_manager import HeuristicRulesManager

manager = HeuristicRulesManager(
    heuristic_rules_config_params={
        "bucket_name": "my-s3-bucket",
        "heuristic_rules_dir_name": "postprocessing",
        "heuristic_rules_filename": "heuristic_rules.json",
    }
)
```

Passing `None` for `heuristic_rules_config_params` creates a no-op manager — `initialize_heuristic_layer_pipeline()` will succeed but leave the pipeline unset.

### Lifecycle Methods

| Method | Description |
|---|---|
| `initialize_heuristic_layer_pipeline()` | Downloads the JSON from S3 → writes to `BASE_DIR/` → calls `HeuristicLayer().load_rules(path)`. Idempotent: skips if rules are already loaded. |
| `apply_heuristic_rules(payment_methods, probabilities, features, new_payment_methods_to_add)` | Thin delegation to `HeuristicLayer.apply()`. Raises `KeyError` if the pipeline has not been initialized. |
| `get_heuristic_rules()` | Returns the raw rules dict loaded from JSON. |
| `get_heuristic_layer_pipeline()` | Returns the underlying `HeuristicLayer` instance. |
| `get_heuristic_rules_filename()` | Returns the filename string used during loading. |
| `clear_heuristic_rules()` | Sets `_heuristic_rules = None`. |
| `clear_heuristic_layer_pipeline()` | Sets `_heuristic_layer_pipeline = None`. |
| `clear_all()` | Calls both clear methods. Useful for hot-reloading rules. |

### A/B Testing Mode

When `AB_TESTING_MODE=true`, two singletons are created at module import time:

| Singleton | Rules file |
|---|---|
| `heuristic_rules_manager_A` | `<HEURISTIC_RULES_FILENAME stem>_even.json` |
| `heuristic_rules_manager_B` | `<HEURISTIC_RULES_FILENAME stem>_odd.json` |

When `AB_TESTING_MODE=false` (default):

| Singleton | Rules file |
|---|---|
| `heuristic_rules_manager_A` | `HEURISTIC_RULES_FILENAME` (unmodified) |
| `heuristic_rules_manager_B` | `None` |

The calling code is responsible for routing even/odd transactions (or any other split criterion) to the appropriate manager.

### S3 Loading Flow

```
initialize_heuristic_layer_pipeline()
  │
  ├─ load_heuristic_rules(config_bucket, heuristic_rules_dir_name, heuristic_rules_filename)
  │      │
  │      ├─ s3.download_object(bucket, key=<dir>/<filename>, tmp_path=BASE_DIR/<filename>)
  │      └─ json.load(file)  →  returns heuristic_rules dict
  │
  └─ HeuristicLayer().load_rules(BASE_DIR/<filename>)
         └─ reads the file from disk and builds the rule buckets
```

The file is downloaded to `BASE_DIR` (default `/tmp`) and kept there for the lifetime of the process. On reload (`clear_all()` + `initialize_heuristic_layer_pipeline()`), it is re-downloaded and re-parsed.

---

## Required Environment Variables

Only the variables relevant to the heuristic layer are listed here. The full application requires many more.

| Variable | Example | Description |
|---|---|---|
| `BASE_DIR` | `/tmp` | Local directory for temporary file storage. Rules JSON is written here. |
| `AWS_REGION` | `eu-west-1` | AWS region for the S3 client. |
| `CONFIG_S3_BUCKET_NAME` | `fero-pmo-configs` | S3 bucket that holds all config files. |
| `POSTPROCESSING_DIR_NAME` | `postprocessing` | S3 prefix (folder) where the rules JSON lives. |
| `HEURISTIC_RULES_FILENAME` | `heuristic_rules.json` | Filename of the rules JSON within the postprocessing directory. |
| `NEW_PAYMENT_METHODS` | `'["bnpl", "crypto"]'` | JSON-encoded list of labels to inject as `new_labels_to_add` before rules run. |
| `EXCLUDED_PAYMENT_METHODS` | `'["internal_wallet"]'` | JSON-encoded list of labels to exclude from the final output (handled upstream of the heuristic layer). |
| `AB_TESTING_MODE` | `false` | Enable the two-manager A/B split. Set to `true` / `false` / `1` / `0`. |

---

## Minimal Standalone Integration (No S3)

Use this pattern when you want to run the `HeuristicLayer` directly without any S3 or `HeuristicRulesManager` dependency — for example in a different application or in unit tests.

```python
from ml_training_utils import HeuristicLayer
import json, tempfile, os

# 1. Define your rules
rules = [
    {
        "name": "force_card_for_high_value",
        "scope": "all",
        "antecedent": {
            "logic": "all",
            "conditions": [
                {"field": "amount", "operator": ">=", "value": 500}
            ]
        },
        "consequent": {
            "action": "override",
            "value": "card"
        }
    }
]

# 2. Write to a temp file (or point to a real file)
with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
    json.dump(rules, f)
    rules_path = f.name

# 3. Initialize and load
layer = HeuristicLayer()
layer.load_rules(rules_path)

# 4. Apply after your model produces predictions
payment_methods = ["paypal", "card", "klarna"]
probabilities   = [0.50,     0.30,   0.20]
features        = {"shop": "myshop.com", "amount": 750, "currency": "EUR"}

updated_methods, updated_probs, applied_rules = layer.apply(
    probs=probabilities,
    labels=payment_methods,
    features=features,
)

# "card" is now first with a dominant probability
print(updated_methods)   # ['card', 'paypal', 'klarna']
print(applied_rules)     # ['force_card_for_high_value']

os.unlink(rules_path)
```

---

## Full Integration via `HeuristicRulesManager`

This mirrors how the PMO service uses it. AWS credentials must be configured (env vars, IAM role, or `~/.aws/credentials`).

```python
from app.core.ml.heuristic_rules_manager import HeuristicRulesManager

# 1. Create and initialize
manager = HeuristicRulesManager(
    heuristic_rules_config_params={
        "bucket_name": "fero-pmo-configs",
        "heuristic_rules_dir_name": "postprocessing",
        "heuristic_rules_filename": "heuristic_rules.json",
    }
)
manager.initialize_heuristic_layer_pipeline()

# 2. At inference time
payment_methods = ["paypal", "card", "klarna"]
probabilities   = [0.50,     0.30,   0.20]
features        = {"shop": "myshop.com", "amount": 750, "currency": "EUR"}
new_methods     = ["bnpl"]   # labels not in the model's training set

updated_methods, updated_probs, applied_rules = manager.apply_heuristic_rules(
    payment_methods=payment_methods,
    probabilities=probabilities,
    features=features,
    new_payment_methods_to_add=new_methods,
)

# 3. Optionally reload rules without restarting (e.g. on a webhook)
manager.clear_all()
manager.initialize_heuristic_layer_pipeline()
```

---

## Edge Cases and Gotchas

**Probability normalization after `override`**
The sentinel probability `1000` is only useful pre-normalization. After `_normalize()` runs, the overridden label will have a probability close to `1.0` (depending on how many overrides fired). Never rely on the raw `1000` value in downstream logic.

**Empty label list**
Passing an empty `labels` list is allowed. `HeuristicLayer` logs an info message and continues, allowing `override` or `append` rules to build a list from scratch.

**All labels banned**
If every label is removed by `ban` rules, the method returns `([], [], applied_rules)` and logs a warning. Callers must handle this empty-list case.

**`adjust` with `probabilities_needed=False`**
`adjust` rules are silently skipped. No error is raised.

**`append` with `probabilities_needed=True`**
`append` rules are silently skipped. Use `override` instead when you need probabilities.

**Scope substring matching**
Scope matching uses `in`, meaning `"shop"` in scope will match any shop identifier that contains the substring `"shop"`. Be specific with scope values to avoid unintended matches.

**Rule file format — `consequent` as list**
The JSON schema allows `consequent` to be either a dict or a list of dicts. However, `_parse_list_to_dict` always takes only the **first element** of a list. If you need multiple consequents per rule, split them into separate rule objects.

**`BASE_DIR` trailing slash**
`load_heuristic_rules` and `initialize_heuristic_layer_pipeline` both call `BASE_DIR.rstrip('/')` before constructing the temp path. Ensure `BASE_DIR` points to a directory that the process has write permission to.

**SSH key availability at Docker build time**
The `--mount=type=ssh` directive requires BuildKit and that `ssh-agent` is running and forwarded to the build daemon. In CI (GitHub Actions, GitLab CI), use the `webfactory/ssh-agent` action or an equivalent to load the deploy key before running `docker build`.
