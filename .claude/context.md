# Project Context

## Goal
Research and prototype a hybrid PDF extraction pipeline for professor lecture slides (mixed text, formulas, tables, images). Intended output: structured per-page blocks `{type, content/path, bbox}` suitable for note generation — ideally text + LaTeX for formulas, with extracted images for future VLM alt-text.

## Repo layout
```
pdf-extraction/
  documents/          # input PDFs (3 slide decks)
  output/             # gitignored; generated images, renders, JSON outputs
  docs/
    context.md        # research notes on PDF extraction methods (from paper)
    tatr-pipeline.md  # TATR improvement notes: box padding + column fallback
  parse.ipynb         # main comparison notebook (expanded, 9+ experiments)
  tatr.ipynb          # dedicated TATR table detection notebook
pyproject.toml
.venv/                # Python 3.11 venv managed by uv
```

## Input documents
| File | Size |
|------|------|
| Session 06 - Regular Expressions.pdf | 1.35 MB |
| Session 07 - Information Retrieval.pdf | 1.71 MB |
| Session 09 - Naive Bayes.pdf | 2.56 MB — primary test document |

## Notebook experiments (`parse.ipynb`)
| # | Experiment | Status |
|---|-----------|--------|
| 0 | Setup — imports, paths, output dirs | ✓ |
| 1 | Baseline text: PyMuPDF vs pdfplumber | ✓ |
| 2 | Layout block inspection + bbox visualization | ✓ |
| 3 | Table extraction: pdfplumber + PyMuPDF `find_tables()` | ✓ (both found nothing — no bordered tables) |
| 4 | Image extraction (raster + full-page renders) | ✓ |
| 5 | Hybrid pipeline MVP → `naive_bayes_extracted.json` | ✓ |
| 6 | TATR table detection + structure recognition | ✓ (moved to `tatr.ipynb`) |
| 7 | Side-by-side table comparison | ✓ |
| 8 | Nougat formula/text extraction | **blocked** (optional dep, not installed by default) |
| 9 | Side-by-side text/formula comparison: PyMuPDF vs Nougat | blocked |

## Dependencies (pyproject.toml, Python 3.11)
Core: `pymupdf`, `pdfplumber`, `pillow`, `pytesseract`, `pydantic>=2.0`, `torch>=2.0`, `torchvision`, `transformers>=4.30`, `timm>=1.0`, `matplotlib`, `pandas`

Optional (`[nougat]`): `nougat-ocr>=0.1.17` — **not installed by default**, kept separate due to env conflicts.

## Known issues / blockers
**Nougat** remains incompatible with the current env (transformers 5.x + albumentations API changes). Isolated as optional dep to avoid breaking TATR.

## Architecture decisions
- **Rule-based parsers (PyMuPDF, pdfplumber)** work well for plain text but fail on borderless tables
- **TATR** (`tatr.ipynb`) is the primary table approach — operates on rendered page images (150 DPI)
- **Hybrid pipeline** (`extract_page_full` + `run_hybrid_pipeline` in `tatr.ipynb`): combines TATR tables + PyMuPDF text blocks + PyMuPDF image extraction per page; outputs `<stem>_hybrid.json`
- **Column fallback chain** (implemented): `"tatr"` → `"external_header"` (text above box) → `"body_text_cluster"` (x-distribution of body words) → `"generic"`
- **Box repair** (implemented): `pad_box_sides` (pad_bottom=36) + `extend_table_box_down_using_words` to capture rows TATR crops short
- **LLM postprocessing hook**: every table dict in JSON output has `needs_review: bool` and `llm_context: str` (text above/below + detected headers) for downstream LLM cleaning
- **Formulas**: garbled by all rule-based tools; Nougat (blocked) would output LaTeX
- **Images**: raster via `page.get_images()`; vector graphics via full-page render fallback
- VLM alt-text generation deferred to Phase 2

## Key output schema (hybrid JSON)
```json
{ "source": "...", "pages": [{ "page_num": N, "text_blocks": [...], "images": [...],
  "tables": [{ "headers", "rows", "column_source", "structure_quality", "needs_review", "llm_context", ... }] }] }
```

## Open questions
- Tune fallback thresholds (`pad_bottom`, `line_gap`, `up` for header band) against the slide decks
- Once Nougat env is fixed: how well does it handle slide-deck format vs academic papers?
