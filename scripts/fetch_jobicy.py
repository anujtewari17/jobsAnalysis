"""Download a pinned Jobicy snapshot into ignored work/. No credentials needed."""
import json,urllib.request,hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
def get(url):
    with urllib.request.urlopen(url,timeout=60) as r:return r.read()
def main():
    repo='https://huggingface.co/datasets/jobicy/remote-jobs'
    meta=json.loads(get('https://huggingface.co/api/datasets/jobicy/remote-jobs'))
    revision=meta['sha']; directory=ROOT/'work/jobicy';directory.mkdir(exist_ok=True)
    files=[r['rfilename'] for r in meta['siblings'] if r['rfilename'].startswith('data/daily/') and r['rfilename'].endswith('.jsonl') and r['rfilename'].split('/')[-1][:10]<='2026-11-12']
    def fetch(name):
        body=get(f'{repo}/resolve/{revision}/{name}');(directory/Path(name).name).write_bytes(body)
        return {'path':name,'sha256':hashlib.sha256(body).hexdigest()}
    with ThreadPoolExecutor(max_workers=8) as pool: hashes=list(pool.map(fetch,files))
    (directory/'LICENSE').write_bytes(get(f'{repo}/raw/{revision}/LICENSE'))
    (directory/'manifest.json').write_text(json.dumps({'source_url':repo,'revision':revision,'retrieved_at':datetime.now(timezone.utc).isoformat(),'cutoff':'2026-11-12','files':hashes},indent=2))
    rows=[json.loads(line) for p in [directory/Path(name).name for name in sorted(files)] for line in p.read_text().split('\n') if line.strip()]
    (ROOT/'work/jobicy-all.json').write_text(json.dumps(rows))
    print(f'Downloaded {len(files)} daily files, {len(rows)} records; revision {revision}')
if __name__=='__main__': main()
