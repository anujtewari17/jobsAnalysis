"""Refresh the public Indeed context series; stdlib only. Never a UXR proxy."""
import csv, io, json, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/'
SELECTED = {'Software Development', 'Marketing', 'Data & Analytics', 'Scientific Research & Development'}
def fetch(name):
    with urllib.request.urlopen(BASE + name) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode())))
def build():
    groups = defaultdict(list)
    aggregate = fetch('aggregate_job_postings_US.csv')
    sectors = fetch('job_postings_by_sector_US.csv')
    for rows, key in [(aggregate, 'indeed_job_postings_index_SA'), (sectors, 'indeed_job_postings_index')]:
        for r in rows:
            label = r.get('display_name', 'All US jobs')
            if r['variable'] != 'total postings' or (label != 'All US jobs' and label not in SELECTED): continue
            groups[(label, r['date'][:7])].append((r['date'], float(r[key])))
    series = defaultdict(list)
    for (label, month), points in sorted(groups.items()):
        series[label].append({'month': month, 'value': round(sum(v for _, v in points)/len(points), 2), 'days': len(points), 'through': max(d for d, _ in points)})
    output = {'retrieved_at': datetime.now(timezone.utc).isoformat(), 'source': 'Indeed Hiring Lab', 'source_url': 'https://github.com/hiring-lab/job_postings_tracker', 'license': 'CC BY 4.0', 'method': 'Monthly mean of daily seasonally adjusted total-postings indices. Feb 1, 2020 = 100. Final month may be partial. Sectors are context, not UX Research.', 'series': dict(series)}
    (ROOT/'dist/data/context.json').write_text(json.dumps(output))
    print({k: (v[0]['month'], v[-1]['through'], len(v)) for k, v in series.items()})
if __name__ == '__main__': build()
