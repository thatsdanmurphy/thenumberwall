# The Number Wall — Data Layer

## Source of truth

The CSV files in `data/src/` are the source of truth.
The JSON files in `src/data/` are compiled output — never edit them directly.

**Workflow:**
1. Edit a CSV in `data/src/`
2. Run `python3 data/compile_wall_data.py`
3. Commit both the CSV change and the regenerated JSON

---

## Files

### Source CSVs (`data/src/`)

| File | Purpose | Update cadence |
|------|---------|---------------|
| `sources.csv` | Trusted source registry | Rare |
| `players.csv` | Player identity (one row per person) | On new additions |
| `wall_entries_global.csv` | Global wall legend entries + editorial | On legend additions/edits |
| `wall_entries_boston_legends.csv` | Boston legend wall entries | On legend additions/edits |
| `wall_entries_boston_current.csv` | Boston current roster | Each season |
| `associations.csv` | Debates (one row per debate) | On season rotation |
| `disputes.csv` | Disputed or uncertain facts | As issues are found |

### Compiled JSON (`src/data/`)

| File | Compiled from |
|------|--------------|
| `wallData.json` | `wall_entries_global.csv` + `players.csv` |
| `bostonLegends.json` | `wall_entries_boston_legends.csv` + `players.csv` |
| `bostonCurrent.json` | `wall_entries_boston_current.csv` + `players.csv` |
| `associations.json` | `associations.csv` |

---

## Verification workflow

Every entry in the wall_entries CSVs has a `verification_status` field:

- `needs_review` — default for all entries, not yet checked
- `verified` — confirmed against one reliable source (set `source_id`)
- `multi_source_verified` — confirmed against two independent sources
- `disputed` — sources conflict; log in `disputes.csv`

When verifying an entry:
1. Open the relevant wall_entries CSV
2. Check the stat and fun_fact against a source in `sources.csv`
3. Set `source_id` to the source used (e.g. `bbref`, `bkref`)
4. Set `verification_status` to `verified` or `multi_source_verified`
5. Run `compile_wall_data.py` to regenerate JSON

---

## Scripts

### `compile_wall_data.py`
The main compile script. Run after any CSV edit.
```
python3 data/compile_wall_data.py
```

### `extract_to_csv.py`
One-time bootstrap script used to extract the initial CSV layer from production JSON.
Do not run again — it will overwrite any manual CSV edits.

---

## Adding a new legend

1. Check if the player exists in `players.csv` — add if not
2. Add a row to the appropriate `wall_entries_*.csv`
3. Set `verification_status: needs_review`
4. Run `compile_wall_data.py`
5. Commit CSVs + generated JSON together

## Retiring a debate

1. Open `associations.csv`
2. Set `status` to `retired` on the relevant row
3. Add a new row for the replacement debate with `status: active`
4. Run `compile_wall_data.py`
5. The old debate is preserved in the CSV history; only `active` rows compile to JSON
