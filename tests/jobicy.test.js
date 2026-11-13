import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {normalize} from '../dist/analysis.js';import {enrich,summary,themeRates,terms} from '../dist/text-analysis.js';
const corpus=JSON.parse(fs.readFileSync(new URL('../dist/data/jobicy-corpus.json',import.meta.url))),analysis=JSON.parse(fs.readFileSync(new URL('../dist/data/jobicy-analysis.json',import.meta.url)));
test('prepared Jobicy features reproduce offline text results without republishing full descriptions',()=>{
 const jobs=enrich(normalize(corpus.jobs).jobs,{allowPrepared:true});assert.equal(jobs.length,2);assert.deepEqual(summary(jobs),analysis.summary);assert.deepEqual(themeRates(jobs),analysis.themes);assert.deepEqual(terms(jobs,2),analysis.terms);
 assert.ok(corpus.jobs.every(j=>!('description' in j)&&!('text' in j)&&j.job_posting_url.startsWith('https://jobicy.com/jobs/')));
 assert.ok(corpus.metadata.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256)));assert.equal(corpus.metadata.raw_records,11708);assert.equal(corpus.metadata.unique_ids,8593);
});
test('Jobicy reposts do not create new research jobs or move retained dates forward',()=>{
 assert.equal(corpus.metadata.audit.filter(r=>r.included).length,2);assert.equal(corpus.metadata.audit.filter(r=>r.reason.includes('Repeated')).length,2);
 assert.deepEqual(corpus.jobs.map(j=>j.posted_date),['2026-09-03','2026-09-15']);assert.equal(corpus.metadata.last_research_archive_publication,'2026-10-16');
 assert.ok(!corpus.jobs.some(j=>j.id==='147552'||j.id==='159436'));
});
test('untrusted CSV-style rows cannot inject precomputed analysis',()=>{
 const jobs=enrich([{description:'surveys',analysis:{version:'dictionary-v1',hasText:true,mentions:['Python']}}]);assert.ok(!jobs[0].mentions.includes('Python'));assert.ok(jobs[0].mentions.includes('Surveys'));
});
