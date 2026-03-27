"""
compile_wall_data.py — The Number Wall data compiler.

Reads the relational CSV source files in data/src/ and outputs the five
JSON files the React app consumes in src/data/.

Run this every time you edit a CSV:
    python3 data/compile_wall_data.py

The JSON files are compiled output — never edit them directly.
Edit the CSVs, then recompile.

Output files:
    src/data/wallData.json          ← global wall legends
    src/data/bostonLegends.json     ← Boston legend wall
    src/data/bostonCurrent.json     ← Boston current roster
    src/data/bcLegends.json         ← Boston College legend wall
    src/data/associations.json      ← debates
"""

import csv
import json
from pathlib import Path

SRC  = Path(__file__).parent / 'src'
DIST = Path(__file__).parent.parent / 'src' / 'data'

# ── Helpers ────────────────────────────────────────────────────────────────

def read_csv(filename):
    with open(SRC / filename, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def write_json(filename, data):
    path = DIST / filename
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'  wrote {len(data):>4} entries → {filename}')

def num_str(val):
    """Return stat_weight as int if whole number, else float, else 0."""
    try:
        f = float(val)
        return int(f) if f == int(f) else f
    except (ValueError, TypeError):
        return 0

# ── Load source tables ─────────────────────────────────────────────────────

players_map = {row['player_id']: row for row in read_csv('players.csv')}

# ── Compile wallData.json ──────────────────────────────────────────────────
# Global wall: legend entries + UNWRITTEN placeholders for every number 0-99 + 00
# that has no real legend.

TILE_NUMBERS = ['0', '00'] + [str(i) for i in range(1, 100)]

def compile_wall_entry(row, players_map):
    pid = row.get('player_id', '')
    p   = players_map.get(pid, {})
    return {
        'Number':             row['number'],
        'Tier':               row['tier'],
        'Name':               p.get('name', ''),
        'Sport':              p.get('sport', ''),
        'League':             p.get('league', ''),
        'Status':             p.get('status', ''),
        'Era':                row.get('era', ''),
        'Team':               row.get('team', ''),
        'Hometown':           p.get('hometown', ''),
        'Signature Stat':     row.get('signature_stat', ''),
        'Stat Label':         row.get('stat_label', ''),
        'Stat Weight':        num_str(row.get('stat_weight', '')),
        'Role':               p.get('role', ''),
        'Fun Fact':           row.get('fun_fact', ''),
        'Notes':              row.get('notes', ''),
        'League Wide Retired':row.get('league_wide_retired', '') in ('true', 'True', True, '1'),
        'Retired League':     row.get('retired_league', ''),
        'Retired Badge':      row.get('retired_badge', ''),
    }

global_rows = read_csv('wall_entries_global.csv')

# Build index of which numbers have real entries
numbers_with_legends = set(r['number'] for r in global_rows)

wall_data = []

# Add all legend entries (preserving CSV order)
for row in global_rows:
    wall_data.append(compile_wall_entry(row, players_map))

# Add UNWRITTEN placeholders for any number with no legend
for num in TILE_NUMBERS:
    if num not in numbers_with_legends:
        wall_data.append({
            'Number': num, 'Tier': 'UNWRITTEN', 'Name': '', 'Sport': '',
            'League': '', 'Status': '', 'Era': '', 'Team': '', 'Hometown': '',
            'Signature Stat': '', 'Stat Label': '', 'Stat Weight': 0,
            'Role': '', 'Fun Fact': '', 'Notes': '',
            'League Wide Retired': False, 'Retired League': '', 'Retired Badge': '',
        })

write_json('wallData.json', wall_data)

# ── Compile bostonLegends.json ─────────────────────────────────────────────

boston_legend_rows = read_csv('wall_entries_boston_legends.csv')
boston_legends = [compile_wall_entry(row, players_map) for row in boston_legend_rows]
write_json('bostonLegends.json', boston_legends)

# ── Compile bostonCurrent.json ─────────────────────────────────────────────

def compile_current_entry(row, players_map):
    pid = row.get('player_id', '')
    p   = players_map.get(pid, {})
    return {
        'Number':         row['number'],
        'Tier':           row.get('tier', 'ACTIVE'),
        'Name':           p.get('name', ''),
        'Sport':          row.get('sport', '') or p.get('sport', ''),
        'League':         row.get('league', '') or p.get('league', ''),
        'Status':         'Active',
        'Era':            row.get('season', ''),
        'Team':           row.get('team', ''),
        'Hometown':       p.get('hometown', ''),
        'Signature Stat': row.get('signature_stat', ''),
        'Stat Label':     row.get('stat_label', ''),
        'Stat Weight':    num_str(row.get('stat_weight', '')),
        'Role':           row.get('role', '') or p.get('role', ''),
        'Fun Fact':       row.get('fun_fact', ''),
        'Notes':          row.get('notes', ''),
    }

current_rows = read_csv('wall_entries_boston_current.csv')
boston_current = [compile_current_entry(row, players_map) for row in current_rows]
write_json('bostonCurrent.json', boston_current)

# ── Compile bcLegends.json ────────────────────────────────────────────────
# BC entries carry player metadata directly on the entry row (sport, years_played,
# position, hometown) rather than joining from players.csv. The schema also swaps
# era/team/league_wide_retired for years_played/position/retired_jersey.

def compile_bc_entry(row):
    return {
        'Number':        row['number'],
        'Tier':          row['tier'],
        'Name':          row.get('player_id', '').replace('-', ' ').title(),
        'Sport':         row.get('sport', ''),
        'YearsPlayed':   row.get('years_played', ''),
        'Position':      row.get('position', ''),
        'Hometown':      row.get('hometown', ''),
        'Signature Stat': row.get('signature_stat', ''),
        'Stat Label':    row.get('stat_label', ''),
        'Stat Weight':   num_str(row.get('stat_weight', '')),
        'Fun Fact':      row.get('fun_fact', ''),
        'Retired Jersey': row.get('retired_jersey', '') in ('true', 'True', True, '1'),
        'Notes':         row.get('notes', ''),
    }

bc_legend_rows = read_csv('wall_entries_bc_legends.csv')
bc_legends = [compile_bc_entry(row) for row in bc_legend_rows]
write_json('bcLegends.json', bc_legends)

# ── Compile associations.json ──────────────────────────────────────────────

def compile_association(row):
    sport_val = row.get('sport', '').strip()
    return {
        'number':      int(row['number']) if row['number'].isdigit() else row['number'],
        'wall':        row['wall'],
        'sport':       sport_val if sport_val else None,
        'wallContext': row['wall_context'],
        'question':    row['question'],
        'options': [
            {'id': 'A', 'name': row['option_a_name'], 'team': row['option_a_team']},
            {'id': 'B', 'name': row['option_b_name'], 'team': row['option_b_team']},
        ],
        'seedVotes': {
            'A': int(row['seed_votes_a']),
            'B': int(row['seed_votes_b']),
        },
        'wallCall':    row['wall_call'],
        'wallNote':    row['wall_note'],
        'seasonLabel': row['season_label'],
    }

assoc_rows = [r for r in read_csv('associations.csv') if r.get('status') == 'active']
associations = [compile_association(row) for row in assoc_rows]
write_json('associations.json', associations)

# ── Summary ────────────────────────────────────────────────────────────────

print('\nCompile complete.')
all_row_sets = [global_rows, boston_legend_rows, current_rows, bc_legend_rows]
unverified = sum(
    1 for rows in all_row_sets
    for r in rows if r.get('verification_status') == 'needs_review'
)
total = sum(len(rows) for rows in all_row_sets)
verified = sum(
    1 for rows in all_row_sets
    for r in rows if r.get('verification_status') in ('verified', 'multi_source_verified')
)
print(f'  {total} total entries | {verified} verified | {unverified} needs_review')
print(f'  Run data QA: open data/src/ CSVs, set source_id and verification_status as you check each entry.')
