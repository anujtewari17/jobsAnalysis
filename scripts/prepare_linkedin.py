"""Prepare a US research subset from Kaggle arshkon/linkedin-job-postings v13.
Raw archive stays ignored in work/. Run after downloading the pinned version.
"""
import csv,io,json,re,zipfile,hashlib
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://www.kaggle.com/datasets/arshkon/linkedin-job-postings'
STATES=set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split())
def is_us(r):
    loc=r.get('location','').strip()
    return loc in ('United States','US','USA') or bool(re.search(r',\s*('+'|'.join(STATES)+r')(?:,?\s+(?:United States|USA))?$',loc))
def candidate(title):
    t=title.lower().replace('-',' ').replace('_',' ')
    return bool(re.search(r'\b(?:research operations|research ops|researchops)\b|\b(?:ux|user experience|user)\s+research(?:er|ers|ing)?\b|\buxr\b|\b(?:design|product)\s+research(?:er|ers)?\b',t))
def main():
    rows=[];info={'source_url':SOURCE,'creator':'Arsh Koneru; additional scraping credited to @zoeyyuzou by source','versions':[],'license':'CC BY-SA 4.0','license_url':'https://creativecommons.org/licenses/by-sa/4.0/','retrieved_at':datetime.now(timezone.utc).isoformat(),'date_field':'original_listed_time, falling back to listed_time; epoch milliseconds converted to UTC','us_rule':'Posting location explicitly United States / US / USA, or ending in a US state/DC abbreviation. Company headquarters never used. Unknown geography excluded.','limitations':'Convenience snapshots, not continuous national coverage. Yearly volume changes are not annual hiring growth. Exact cleaned-text deduplication and reviewed exclusions applied downstream; near-duplicate reposts may remain.'}
    for version in [9,13]:
        archive=ROOT/f'work/linkedin-v{version}.zip'
        total=Counter();us=Counter();unknown=0;candidate_n=0
        with zipfile.ZipFile(archive) as z:
            name=next(n for n in z.namelist() if n.endswith(('postings.csv','job_postings.csv')))
            companies={}
            for n in z.namelist():
                if n.endswith('companies.csv'):
                    with z.open(n) as f:
                        for c in csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig')):companies[c['company_id']]=c.get('name','')
            with z.open(name) as f:
                reader=csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig'))
                for r in reader:
                    try: date=datetime.fromtimestamp(float(r.get('original_listed_time') or r.get('listed_time'))/1000,timezone.utc).date().isoformat()
                    except (TypeError,ValueError,OverflowError): unknown+=1;continue
                    total[date[:7]]+=1
                    if not is_us(r):continue
                    us[date[:7]]+=1
                    if not candidate(r['title']):continue
                    candidate_n+=1
                    rows.append({'id':r['job_id'],'title':r['title'],'company':r.get('company_name') or companies.get(r.get('company_id','')) or ('Company ID '+r.get('company_id','unknown')),'posted_date':date,'country':'US','source':'Kaggle LinkedIn','source_version':version,'location':r['location'],'description':r.get('description',''),'salary_min':r.get('min_salary',''),'salary_max':r.get('max_salary',''),'currency':r.get('currency',''),'salary_period':'annual' if r.get('pay_period','').upper()=='YEARLY' else r.get('pay_period',''),'job_posting_url':r.get('job_posting_url','')})
        info['versions'].append({'version':version,'sha256':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),'total_rows_with_dates':sum(total.values()),'invalid_dates':unknown,'all_postings_by_month':dict(sorted(total.items())),'explicit_us_postings_by_month':dict(sorted(us.items())),'candidate_research_rows':candidate_n})
    (ROOT/'work/research-candidates.json').write_text(json.dumps({'metadata':info,'jobs':rows}))
    print(json.dumps(info,indent=2));print('Research titles:',Counter(r['title'] for r in rows))
if __name__=='__main__':main()
