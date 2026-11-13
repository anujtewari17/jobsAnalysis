import fs from 'node:fs';
import {family,normalize} from '../dist/analysis.js';
import {enrich,summary,themeRates,terms,documentTerms,THEMES} from '../dist/text-analysis.js';
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const rows=read('../work/jobicy-all.json'),manifest=read('../work/jobicy/manifest.json');
const dates=rows.map(r=>r.pubDate?.slice(0,10)).filter(Boolean).sort(),audit=[],seen=new Set(),jobs=[];
for(const r of [...rows].sort((a,b)=>a.pubDate.localeCompare(b.pubDate))){
 if(!family(r.jobTitle))continue;
 let reason='';if(!/(?:^|[,;\s])(?:USA|United States|US)(?:$|[,;\s])/i.test(r.jobGeo))reason='No explicit US eligibility; worldwide/EMEA not assumed US.';
 if(!reason&&r.id===147552)reason='Insurance-policy coverage and compliance research; not digital UX research.';
 if(!reason&&seen.has(r.id))reason='Repeated Jobicy ID; earliest archive publication retained.';
 audit.push({id:String(r.id),title:r.jobTitle,company:r.companyName,geo:r.jobGeo,date:r.pubDate.slice(0,10),included:!reason,reason:reason||'UX/user research confirmed in description.'});if(reason)continue;seen.add(r.id);
 const appearances=rows.filter(x=>x.id===r.id).map(x=>x.pubDate.slice(0,10)).sort();
 jobs.push({id:String(r.id),title:r.jobTitle,company:r.companyName,posted_date:r.pubDate.slice(0,10),country:'US',source:'Jobicy (remote)',location:r.jobGeo,description:r.jobDescription||'',salary_min:r.salaryMin==null?'':String(r.salaryMin),salary_max:r.salaryMax==null?'':String(r.salaryMax),currency:r.salaryCurrency||'',salary_period:r.salaryPeriod==='yearly'?'annual':r.salaryPeriod||'',job_posting_url:r.url,last_archive_publication:appearances.at(-1),archive_appearances:appearances.length});
}
const normalized=normalize(jobs);if(normalized.jobs.length!==jobs.length)throw Error('Unexpected normalized exclusion');const enriched=enrich(normalized.jobs);
const metadata={...manifest,creator:'Jobicy',license:'Jobicy Remote Jobs Dataset Terms v1.0',license_url:'https://huggingface.co/datasets/jobicy/remote-jobs/blob/'+manifest.revision+'/LICENSE',remote_only:true,raw_records:rows.length,unique_ids:new Set(rows.map(r=>r.id)).size,raw_date_range:[dates[0],dates.at(-1)],research_records:enriched.length,first_research_publication:jobs.map(j=>j.posted_date).sort()[0]??null,last_research_archive_publication:jobs.map(j=>j.last_archive_publication).sort().at(-1)??null,audit,limitations:'Remote-only convenience feed. Two US research descriptions: insufficient for market trends. Feed pubDate can change on repost; retained date is earliest in this downloaded archive, not verified original employer publication. No inference about current vacancy status.',text_policy:'Full Jobicy descriptions are analyzed in ignored work/ and not republished. Prepared features and dictionary match phrases power the app; canonical links lead to full listings.'};
const publicJobs=enriched.map(j=>{const {description,text,...publicFields}=j;delete publicFields.mentions;delete publicFields.experience;delete publicFields.salary;delete publicFields.hasText;return {...publicFields,analysis:{version:'dictionary-v1',hasText:j.hasText,mentions:j.mentions,experience:j.experience,salary:j.salary,docTerms:documentTerms(j.text),matches:Object.fromEntries(THEMES.filter(t=>j.mentions.includes(t.name)).map(t=>[t.name,t.pattern.exec(j.text)[0]]))}};});
const analysis={metadata:{source:metadata.source_url,license:metadata.license,revision:metadata.revision,limitations:metadata.limitations},summary:summary(enriched),themes:themeRates(enriched),terms:terms(enriched,2)};
fs.writeFileSync(new URL('../dist/data/jobicy-corpus.json',import.meta.url),JSON.stringify({metadata,jobs:publicJobs},null,2));fs.writeFileSync(new URL('../dist/data/jobicy-analysis.json',import.meta.url),JSON.stringify(analysis,null,2));console.log(JSON.stringify({metadata:{records:rows.length,uniqueIds:metadata.unique_ids,dateRange:metadata.raw_date_range,audit},summary:analysis.summary},null,2));
