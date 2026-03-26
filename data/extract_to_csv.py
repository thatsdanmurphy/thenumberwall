"""
extract_to_csv.py — One-time reverse-compile.
Reads the existing JSON source files and writes the full relational CSV layer.
Run once to bootstrap the data/src/ directory from production JSON.
After this, data/src/ is the source of truth — edit CSVs, run compile_wall_data.py.
"""

import json
import csv
import re
import os
from pathlib import Path

SRC   = Path(__file__).parent / 'src'
JSON  = Path(__file__).parent.parent / 'src' / 'data'

# ── Helpers ────────────────────────────────────────────────────────────────

def slugify(name):
    """willie-mays, kobe-bryant, etc."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def write_csv(path, fieldnames, rows):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)
    print(f'  wrote {len(rows):>4} rows → {path.name}')

# ── Load JSON ──────────────────────────────────────────────────────────────

with open(JSON / 'wallData.json')      as f: wall    = json.load(f)
with open(JSON / 'bostonLegends.json') as f: bleg    = json.load(f)
with open(JSON / 'bostonCurrent.json') as f: bcur    = json.load(f)
with open(JSON / 'associations.json')  as f: assocs  = json.load(f)

print('Extracting relational CSV layer from production JSON...\n')

# ── 1. sources.csv ─────────────────────────────────────────────────────────
# Pre-populated with the canonical sports reference sources.
# Extend as you verify individual entries.

sources = [
    {'source_id': 'bbref',    'source_name': 'Baseball Reference',     'url': 'https://www.baseball-reference.com',  'trust_level': 'primary',   'category': 'stats_database'},
    {'source_id': 'bkref',    'source_name': 'Basketball Reference',   'url': 'https://www.basketball-reference.com','trust_level': 'primary',   'category': 'stats_database'},
    {'source_id': 'pfref',    'source_name': 'Pro Football Reference', 'url': 'https://www.pro-football-reference.com','trust_level': 'primary', 'category': 'stats_database'},
    {'source_id': 'hkref',    'source_name': 'Hockey Reference',       'url': 'https://www.hockey-reference.com',    'trust_level': 'primary',   'category': 'stats_database'},
    {'source_id': 'fbref',    'source_name': 'FBref (Soccer)',         'url': 'https://fbref.com',                   'trust_level': 'primary',   'category': 'stats_database'},
    {'source_id': 'nba',      'source_name': 'NBA.com',                'url': 'https://www.nba.com',                 'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'mlb',      'source_name': 'MLB.com',                'url': 'https://www.mlb.com',                 'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'nfl',      'source_name': 'NFL.com',                'url': 'https://www.nfl.com',                 'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'nhl',      'source_name': 'NHL.com',                'url': 'https://www.nhl.com',                 'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'wnba',     'source_name': 'WNBA.com',               'url': 'https://www.wnba.com',                'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'fifa',     'source_name': 'FIFA.com',               'url': 'https://www.fifa.com',                'trust_level': 'primary',   'category': 'league_official'},
    {'source_id': 'hof_bb',   'source_name': 'Baseball Hall of Fame',  'url': 'https://baseballhall.org',            'trust_level': 'primary',   'category': 'historical_archive'},
    {'source_id': 'hof_bk',   'source_name': 'Basketball Hall of Fame','url': 'https://www.hoophall.com',            'trust_level': 'primary',   'category': 'historical_archive'},
    {'source_id': 'hof_fb',   'source_name': 'Pro Football Hall of Fame','url': 'https://www.profootballhof.com',    'trust_level': 'primary',   'category': 'historical_archive'},
    {'source_id': 'hof_hk',   'source_name': 'Hockey Hall of Fame',   'url': 'https://www.hhof.com',                'trust_level': 'primary',   'category': 'historical_archive'},
]

write_csv(SRC / 'sources.csv',
    ['source_id','source_name','url','trust_level','category'],
    sources)

# ── 2. players.csv ─────────────────────────────────────────────────────────
# Unique players across all datasets. Player is the identity — one row per person.

seen_ids = {}
players  = []

def add_player(entry, dataset):
    name = entry.get('Name', '').strip()
    if not name:
        return
    pid = slugify(name)
    # Handle name collisions (e.g. two "Reggie Jackson" entries — same person)
    if pid in seen_ids:
        return
    seen_ids[pid] = True
    players.append({
        'player_id':  pid,
        'name':       name,
        'sport':      entry.get('Sport', ''),
        'league':     entry.get('League', ''),
        'role':       entry.get('Role', ''),
        'status':     entry.get('Status', ''),
        'hometown':   entry.get('Hometown', ''),
        'notes':      entry.get('Notes', ''),
    })

for e in wall: add_player(e, 'global')
for e in bleg: add_player(e, 'boston_legends')
for e in bcur: add_player(e, 'boston_current')

write_csv(SRC / 'players.csv',
    ['player_id','name','sport','league','role','status','hometown','notes'],
    players)

# ── 3. wall_entries_global.csv ────────────────────────────────────────────
# One row per legend entry on the global wall.
# UNWRITTEN placeholder rows are excluded — they're generated at compile time.

FIELDS_GLOBAL = [
    'entry_id','player_id','number','tier','era','team',
    'signature_stat','stat_label','stat_weight',
    'fun_fact',
    'league_wide_retired','retired_league','retired_badge',
    'verification_status','source_id','notes',
]

global_entries = []
for i, e in enumerate(wall):
    name = e.get('Name','').strip()
    tier = e.get('Tier','')
    if tier == 'UNWRITTEN' or not name:
        continue
    global_entries.append({
        'entry_id':           f'g-{str(i).zfill(4)}',
        'player_id':          slugify(name),
        'number':             e.get('Number',''),
        'tier':               tier,
        'era':                e.get('Era',''),
        'team':               e.get('Team',''),
        'signature_stat':     e.get('Signature Stat',''),
        'stat_label':         e.get('Stat Label',''),
        'stat_weight':        e.get('Stat Weight',''),
        'fun_fact':           e.get('Fun Fact',''),
        'league_wide_retired':e.get('League Wide Retired',''),
        'retired_league':     e.get('Retired League',''),
        'retired_badge':      e.get('Retired Badge',''),
        'verification_status':'needs_review',
        'source_id':          '',
        'notes':              e.get('Notes',''),
    })

write_csv(SRC / 'wall_entries_global.csv', FIELDS_GLOBAL, global_entries)

# ── 4. wall_entries_boston_legends.csv ───────────────────────────────────

boston_legend_entries = []
for i, e in enumerate(bleg):
    name = e.get('Name','').strip()
    if not name:
        continue
    boston_legend_entries.append({
        'entry_id':           f'bl-{str(i).zfill(4)}',
        'player_id':          slugify(name),
        'number':             e.get('Number',''),
        'tier':               e.get('Tier',''),
        'era':                e.get('Era',''),
        'team':               e.get('Team',''),
        'signature_stat':     e.get('Signature Stat',''),
        'stat_label':         e.get('Stat Label',''),
        'stat_weight':        e.get('Stat Weight',''),
        'fun_fact':           e.get('Fun Fact',''),
        'league_wide_retired':e.get('League Wide Retired',''),
        'retired_league':     e.get('Retired League',''),
        'retired_badge':      e.get('Retired Badge',''),
        'verification_status':'needs_review',
        'source_id':          '',
        'notes':              e.get('Notes',''),
    })

write_csv(SRC / 'wall_entries_boston_legends.csv', FIELDS_GLOBAL, boston_legend_entries)

# ── 5. wall_entries_boston_current.csv ───────────────────────────────────
# Current roster — fast-moving, season-tagged.

FIELDS_CURRENT = [
    'entry_id','player_id','number','tier','season','team','sport','league',
    'role','signature_stat','stat_label','stat_weight','fun_fact',
    'verification_status','source_id','notes',
]

current_entries = []
for i, e in enumerate(bcur):
    name = e.get('Name','').strip()
    if not name:
        continue
    current_entries.append({
        'entry_id':           f'bc-{str(i).zfill(4)}',
        'player_id':          slugify(name),
        'number':             e.get('Number',''),
        'tier':               e.get('Tier','ACTIVE'),
        'season':             '2025-26',
        'team':               e.get('Team',''),
        'sport':              e.get('Sport',''),
        'league':             e.get('League',''),
        'role':               e.get('Role',''),
        'signature_stat':     e.get('Signature Stat',''),
        'stat_label':         e.get('Stat Label',''),
        'stat_weight':        e.get('Stat Weight',''),
        'fun_fact':           e.get('Fun Fact',''),
        'verification_status':'needs_review',
        'source_id':          '',
        'notes':              e.get('Notes',''),
    })

write_csv(SRC / 'wall_entries_boston_current.csv', FIELDS_CURRENT, current_entries)

# ── 6. associations.csv ───────────────────────────────────────────────────
# One row per debate entry.

FIELDS_ASSOC = [
    'debate_id','number','wall','sport','wall_context','question',
    'option_a_name','option_a_team',
    'option_b_name','option_b_team',
    'seed_votes_a','seed_votes_b',
    'wall_call','wall_note','season_label','status',
]

assoc_rows = []
for i, a in enumerate(assocs):
    opts = a.get('options', [{},{}])
    a_opt = opts[0] if len(opts) > 0 else {}
    b_opt = opts[1] if len(opts) > 1 else {}
    votes = a.get('seedVotes', {})
    assoc_rows.append({
        'debate_id':    f'debate-{str(i+1).zfill(3)}',
        'number':       str(a.get('number','')),
        'wall':         a.get('wall','global'),
        'sport':        a.get('sport','') or '',
        'wall_context': a.get('wallContext',''),
        'question':     a.get('question',''),
        'option_a_name':a_opt.get('name',''),
        'option_a_team':a_opt.get('team',''),
        'option_b_name':b_opt.get('name',''),
        'option_b_team':b_opt.get('team',''),
        'seed_votes_a': votes.get(a_opt.get('id','A'), 0),
        'seed_votes_b': votes.get(b_opt.get('id','B'), 0),
        'wall_call':    a.get('wallCall',''),
        'wall_note':    a.get('wallNote',''),
        'season_label': a.get('seasonLabel',''),
        'status':       'active',
    })

write_csv(SRC / 'associations.csv', FIELDS_ASSOC, assoc_rows)

# ── 7. disputes.csv ───────────────────────────────────────────────────────
# Empty to start — populated as issues are discovered during QA.

write_csv(SRC / 'disputes.csv',
    ['dispute_id','record_type','record_id','issue','status','opened_date','resolution','notes'],
    [])

print('\nDone. All CSVs written to data/src/')
print('Next: run compile_wall_data.py to regenerate JSON from CSVs.')
