import fs from 'node:fs';
import {normalize} from '../dist/analysis.js';
import {enrich,cleanText,summary,yearly,themeRates,compare,terms} from '../dist/text-analysis.js';
const payload=JSON.parse(fs.readFileSync(new URL('../work/research-candidates.json',import.meta.url)));
const excludes=JSON.parse(fs.readFileSync(new URL('./corpus-exclusions.json',import.meta.url)));
const audit=[],seenIds=new Set(),seenText=new Map(),included=[];
for(const j of payload.jobs){
 let reason=excludes[j.id];
 const text=cleanText(j.description).toLowerCase();
 if(!reason&&seenIds.has(j.id))reason='Duplicate LinkedIn posting ID.';
 if(!reason&&text&&seenText.has(text))reason=`Exact duplicate cleaned description of retained posting ${seenText.get(text)}; locations may differ.`;
 audit.push({id:j.id,title:j.title,company:j.company,version:j.source_version,included:!reason,reason:reason||'Explicit UX/user-research title, or UX Research Operations described in posting; hybrid titles and internships retained.'});
 if(reason)continue;
 seenIds.add(j.id);if(text)seenText.set(text,j.id);included.push(j);
}
const normalized=normalize(included);if(normalized.quality.accepted!==included.length)throw Error('Unexpected rejected prepared record');
const jobs=enrich(normalized.jobs),years=[...new Set(jobs.map(j=>j.year))].sort();
const metadata={...payload.metadata,candidates:payload.jobs.length,reviewed_subset_n:jobs.length,audit,dedup_rule:'First record retained per LinkedIn ID; then per lowercased whitespace-normalized HTML-cleaned description. Distinct location variants with identical descriptions are collapsed. Near duplicates remain possible.',scope:'Digital UX/user research including internships, management, hybrid researcher/design roles and UX Research Operations. Non-UX laboratory/clinical operations and physical-product/editorial research excluded after description review.'};
fs.writeFileSync(new URL('../dist/data/research-corpus.json',import.meta.url),JSON.stringify({metadata,jobs:included}));
const analysis={metadata:{source:metadata.source_url,license:metadata.license,versions:metadata.versions.map(v=>v.version),analysis_version:'dictionary-v1',scope:metadata.scope,limitations:metadata.limitations},summary:summary(jobs),annual:yearly(jobs),themes:themeRates(jobs),comparison:{baseline:years[0],comparison:years.at(-1),themes:compare(jobs.filter(j=>j.year===years[0]),jobs.filter(j=>j.year===years.at(-1)))},terms:terms(jobs,2)};
fs.writeFileSync(new URL('../dist/data/research-analysis.json',import.meta.url),JSON.stringify(analysis,null,2));
console.log(JSON.stringify({summary:analysis.summary,annual:analysis.annual,topThemes:analysis.themes.slice(0,5),excluded:audit.filter(j=>!j.included)},null,2));
