import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Exercise the browser module's state changes without installing a browser.
class Element {
 constructor(){this.value='';this.hidden=false;this.className='';this.textContent='';this.html='';}
 set innerHTML(value){this.html=value;const first=/<option(?: value="([^"]*)")?>([^<]*)<\/option>/.exec(value);if(first)this.value=first[1]??first[2];}
 get innerHTML(){return this.html;}
}
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
elements.get('q-family').value='all';elements.get('q-min').value='2';
globalThis.document={getElementById:id=>{assert.ok(elements.has(id),`Missing DOM element: ${id}`);return elements.get(id);}};
const {setCorpus,clearCorpus}=await import('../dist/quant-ui.js');
test('synthetic walkthrough, filters, cohort comparison, safe evidence, and clear work together',()=>{
 elements.get('demo').onclick();assert.equal(elements.get('quant-body').hidden,false);assert.match(elements.get('corpus-banner').textContent,/SYNTHETIC EXAMPLE/);assert.match(elements.get('comparison').innerHTML,/AI \/ machine learning/);assert.match(elements.get('quant-annual').innerHTML,/2024/);
 elements.get('q-family').value='Research Operations';elements.get('q-family').onchange();assert.match(elements.get('quant-insight').innerHTML,/Both year cohorts need descriptions/);assert.match(elements.get('terms').innerHTML,/No terms/);
 const base={id:'x',family:'UX Research',title:'UX Researcher',company:'<img onerror=attack()>',source:'test',year:'2022',posted_date:'2022-01-01'};
 setCorpus([{...base,description:'Conduct user interviews. <script>alert(1)</script> 3 years of experience'}]);assert.equal(elements.get('q-current').value,'2022');assert.match(elements.get('quant-insight').innerHTML,/Choose two different years/);assert.match(elements.get('evidence').innerHTML,/&lt;img/);assert.ok(!elements.get('evidence').innerHTML.includes('<script>'));
 elements.get('q-search').value='nothing matches';elements.get('q-search').oninput();assert.match(elements.get('evidence').innerHTML,/No matching descriptions/);
 clearCorpus();assert.equal(elements.get('quant-body').hidden,true);assert.equal(elements.get('quant-empty').hidden,false);
});
