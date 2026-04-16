
# 📄 PDF Extraction for Slideshows — Methods, Findings, and Pipeline Design

## 1. Key Insight from the Paper (TL;DR)

The paper’s most important conclusion is:

> **Performance differences between PDF parsers are NOT about extracting words — they are about reconstructing structure.**

* F1 scores (word-level correctness) are similar across tools
* But **BLEU and alignment scores vary significantly**
* → meaning: **layout + ordering is the real bottleneck**

This is critical for your use case (slides, formulas, tables, images), which is **structure-heavy and multimodal**.

---

# 2. Text Extraction — What Actually Works

## 2.1 Rule-based parsers (PyMuPDF, pypdfium, etc.)

### Strengths

* High F1 across most categories (Financial, Law, Manual, Tender)
* Good word order preservation (BLEU)
* Fast and deterministic

### Best performers

* **PyMuPDF**
* **pypdfium**

They consistently:

* preserve word order
* handle layout better than others
* achieve strong alignment scores

👉 Engineering takeaway:

> **PyMuPDF or pypdfium should be your default text extractor**

---

## 2.2 Weakness: Scientific & Patent documents

These are the *hard cases*:

### Scientific PDFs

Problems:

* formulas break extraction
* inline math gets flattened or corrupted
* graphs/text get mixed

Result:

* all rule-based tools degrade significantly

### Patent PDFs

Problems:

* heavy use of diagrams/images
* non-textual content dominates

---

## 2.3 Learning-based models (Nougat)

### Key finding:

> Nougat **massively outperforms rule-based parsers** for scientific documents

Why:

* outputs structured formats (LaTeX / Markdown)
* understands equations, not just text

### But:

* can hallucinate
* requires heavier infra
* slower

👉 Engineering takeaway:

> Use **Nougat ONLY for scientific/math-heavy documents**

---

## 2.4 Core conclusion for text

| Document type         | Best approach                    |
| --------------------- | -------------------------------- |
| Clean structured text | PyMuPDF / pypdfium               |
| Legal / manuals       | PyMuPDF (structure preservation) |
| Scientific            | Nougat                           |
| Patent / image-heavy  | OCR                              |

---

# 3. Table Extraction — The Real Bottleneck

## 3.1 Rule-based tools (Camelot, pdfplumber, Tabula)

### When they work:

* clear borders
* consistent spacing
* simple tables

### When they fail:

* nested tables
* no borders
* multiple tables per page
* color-based separation
* weird separators ("...", "--")

### Observed behavior:

* **low recall**
* many missed tables
* inconsistent performance

---

## 3.2 Transformer-based model (TATR)

### Key finding:

> TATR is **dramatically better and more consistent**

* high recall across categories
* especially strong on:

  * scientific
  * financial
  * complex layouts

### Limitation:

* slightly worse in simple cases (manual/tender vs rule-based)

---

## 3.3 Core conclusion for tables

| Table complexity     | Best approach     |
| -------------------- | ----------------- |
| Simple               | Camelot / PyMuPDF |
| Complex / real-world | **TATR**          |

👉 Engineering takeaway:

> **Use ML for detection, not rule-based heuristics**

---

# 4. Why Scientific Documents Are So Hard

This is crucial for your slideshow use case.

### Problems identified:

1. **Math is not text**

   * rule-based → outputs symbols incorrectly
   * loses semantic meaning

2. **Inline equations**

   * break sentence flow
   * destroy alignment metrics

3. **Graphs get parsed as text**

   * corrupt paragraphs

4. **Mixed modalities**

   * text + math + diagrams

---

### Paper’s recommendation:

> Extract scientific content as:

* LaTeX
* Markdown
* MathML

👉 This is a **huge design insight** for your system.

---

# 5. Images & OCR (Implicit but critical)

From the discussion:

* Patent docs → mostly images → need OCR
* Graphs → wrongly parsed as text

👉 Therefore:

> **You must treat images as first-class citizens in your pipeline**

---

# 6. The Most Important Insight (Design-Level)

The paper implicitly proves:

> **There is no single “best parser” — only a best pipeline.**

---

# 7. Suggested Architecture for Your Use Case (Slides + Mixed Content)

Now translating this into something actionable.

## 7.1 Pipeline Overview

```text
PDF
 ↓
Page segmentation (layout detection)
 ↓
Branch by content type:
    → text blocks
    → tables
    → images
    → formulas
 ↓
Specialized extraction per type
 ↓
Reconstruction (ordered document)
 ↓
Output (text + structured + images)
```

---

## 7.2 Step-by-step system

### Step 1 — Layout extraction (CRITICAL)

Use:

* PyMuPDF blocks OR
* layout model (future: LayoutLM / Detectron)

Goal:

```text
Identify regions:
- text
- table
- image
- formula
```

---

### Step 2 — Text extraction

Default:

```python
PyMuPDF
```

Fallback:

```python
pdfplumber
```

Scientific fallback:

```python
Nougat
```

---

### Step 3 — Table extraction

Pipeline:

```text
Detect table → TATR
Extract content → pdfplumber / PyMuPDF
```

---

### Step 4 — Formula handling

Options:

#### Simple (MVP)

* treat as images
* store bounding box

#### Advanced

* Nougat (LaTeX output)
* future: math OCR

---

### Step 5 — Image extraction

Use:

```python
PyMuPDF → page.get_images()
```

Store:

* raw image
* position on page

---

### Step 6 — OCR fallback

If:

* low text confidence
* empty extraction

Use:

```text
pytesseract
```

---

### Step 7 — Reconstruction

This is where most systems fail.

You must:

* sort blocks spatially
* preserve reading order
* keep structure

---

# 8. Suggested Output Format

You should NOT output just plain text.

Use something like:

```json
{
  "pages": [
    {
      "blocks": [
        { "type": "text", "content": "...", "bbox": [...] },
        { "type": "table", "content": [...], "bbox": [...] },
        { "type": "image", "path": "...", "bbox": [...] },
        { "type": "formula", "latex": "...", "bbox": [...] }
      ]
    }
  ]
}
```

---

# 9. Suggested Notebook Experiments

Start simple, then layer complexity.

## Experiment 1 — Baseline comparison

* PyMuPDF vs pdfplumber vs pypdfium
* measure:

  * text length
  * ordering issues
  * visual inspection

---

## Experiment 2 — Layout blocks

* inspect `page.get_text("blocks")`
* visualize bounding boxes

---

## Experiment 3 — Table detection

* compare:

  * pdfplumber
  * Camelot
  * (if possible) TATR

---

## Experiment 4 — Scientific PDF

* PyMuPDF vs Nougat
* compare:

  * formula quality
  * structure

---

## Experiment 5 — Hybrid pipeline

* combine:

  * PyMuPDF (text)
  * pdfplumber (tables)
  * OCR fallback

---

# 10. What I Would Build (Opinionated)

If I were you:

### Phase 1 (Notebook MVP)

* PyMuPDF (core)
* pdfplumber (tables fallback)
* pytesseract (OCR fallback)

### Phase 2

* integrate TATR for tables

### Phase 3

* integrate Nougat for scientific PDFs

### Phase 4

* add layout model (true segmentation)

---

# 11. Biggest Pitfalls (from the paper + experience)

### 1. Thinking extraction = solved

→ It’s not. Structure is the hard part.

### 2. Over-relying on one tool

→ Always combine tools

### 3. Ignoring layout

→ This will destroy your results

### 4. Treating formulas as text

→ They are not

### 5. Ignoring images

→ critical in slides + patents

---

# 12. Final Takeaway

The paper’s real message:

> **Rule-based parsers are good at text extraction, but bad at understanding documents.
> Modern pipelines must be hybrid and layout-aware.**

---