# Project Name

Short description of what the project does.

## Prerequisites
- Python 3.11+
- [any other tools]

## Environment
Create a `.env` file accoridng to .env.sample:

```env
API_KEY=<API_KEY>
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run locally

```bash
python -m your_app
```

## Run tests

```bash
pytest
```

## Common commands

```bash
ruff check .
ruff format .
mypy .
```