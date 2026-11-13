import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
class Element{constructor(){this.value='';this.hidden=false;this.textContent='';this.html='';}set innerHTML(value){this.html=value;const m=/<option(?: value="([^"]*)")?>([^<]*)<\/option>/.exec(value);if(m)this.value=m[1]??m[2];}get innerHTML(){return this.html;}}
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),els=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const $=id=>{assert.ok(els.has(id),`Missing element ${id}`);return els.get(id);};globalThis.document={getElementById:$};
$('sector').value='Software Development';$('range').value='all';$('family').value='all';$('year').value='all';$('q-min').value='2';
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/'+path,import.meta.url)))});
await import('../dist/app.js');
test('full startup loads recent and historic data, scopes sample counts, and personal upload replaces prepared corpus',async()=>{
 assert.equal($('q-source').value,'Jobicy (remote)');assert.equal($('research-source').value,'Jobicy (remote)');assert.match($('quality').textContent,/Showing 2 postings/);assert.match($('jobicy-coverage').innerHTML,/11,708/);assert.match($('public-coverage').innerHTML,/43 retained LinkedIn/);assert.match($('chart').innerHTML,/<svg/);
 $('research-source').value='Kaggle LinkedIn';$('research-source').onchange();assert.match($('quality').textContent,/Showing 43 postings/);
 const csv='id,title,company,posted_date,country,source,description\n1,UX Researcher,Personal,2025-01-02,US,My dataset,Conduct surveys';
 await $('upload').onchange({target:{files:[{size:csv.length,name:'mine.csv',text:async()=>csv}],value:'mine.csv'}});
 assert.equal($('research-source').value,'all');assert.match($('quality').textContent,/Showing 1 postings/);assert.equal($('q-current').value,'2025');assert.ok(!$('q-source').innerHTML.includes('Jobicy'));
});
