import {setCorpus,clearCorpus} from './quant-ui.js';
import {parseCSV,normalize,aggregate,csvEscape} from './analysis.js';
const $=id=>document.getElementById(id), fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:1}), pct=n=>(n>=0?'+':'')+fmt(n)+'%';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let context, imported, chartRows=[], annualRows=[], userImported=false;
function download(name,text,type='text/csv'){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function contextRender(){
 const label=$('sector').value, n=$('range').value;
 const a=context.series['All US jobs'], b=context.series[label], bm=new Map(b.map(x=>[x.month,x]));
 let points=a.filter(x=>bm.has(x.month)); if(n!=='all') points=points.slice(-Number(n));
 chartRows=points.map(x=>({...x,sector:bm.get(x.month).value}));
 if(!points.length) throw Error('No overlapping observations.');
 const last=chartRows.at(-1), prev=chartRows.find(x=>x.month===`${Number(last.month.slice(0,4))-1}${last.month.slice(4)}`);
 $('sector-label').textContent=label;
 $('stats').innerHTML=[['All US jobs',fmt(last.value),'Latest monthly mean · index'],[label,fmt(last.sector),'Latest monthly mean · index'],['Change from baseline',pct(last.sector-100),`${esc(label)} · Feb 2020 = 100`]].map(([l,v,s])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong><small>${s}</small></div>`).join('');
 const W=1000,H=285,L=48,R=22,T=20,B=35, vals=chartRows.flatMap(x=>[x.value,x.sector,100]);
 const lo=Math.max(0,Math.floor(Math.min(...vals)/25)*25-25),hi=Math.ceil(Math.max(...vals)/25)*25+25;
 const x=i=>L+i*(W-L-R)/Math.max(1,chartRows.length-1),y=v=>T+(hi-v)*(H-T-B)/(hi-lo);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">US postings indices compared with ${esc(label)}</title><desc id="chart-desc">Monthly indices from ${points[0].month} to ${last.month}. All US jobs latest: ${last.value}; selected sector: ${last.sector}. The data table below contains every value.</desc>`;
 for(let v=lo;v<=hi;v+=25)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${v===100?'#b0bdab':'#edf0e9'}" ${v===100?'stroke-dasharray="4 5"':''}/><text x="${L-12}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
 const step=Math.max(1,Math.ceil(chartRows.length/7));chartRows.forEach((p,i)=>{if(i%step===0||i===chartRows.length-1)svg+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${p.month}</text>`;});
 for(const [key,color] of [['value','#2e6b51'],['sector','#cf8250']]){svg+=`<polyline fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round" points="${chartRows.map((p,i)=>`${x(i)},${y(p[key])}`).join(' ')}"/>`;chartRows.forEach((p,i)=>{svg+=`<circle cx="${x(i)}" cy="${y(p[key])}" r="5" fill="${color}" opacity="0.01"><title>${p.month}: ${key==='value'?'All US jobs':esc(label)} ${p[key]}</title></circle>`;});}svg+='</svg>';$('chart').innerHTML=svg;
 const partial=last.days<new Date(Number(last.month.slice(0,4)),Number(last.month.slice(5)),0).getDate();
 $('coverage').textContent=`Through ${last.through}${partial?' · Latest month partial':''} · Retrieved ${context.retrieved_at.slice(0,10)} · Monthly means`;
 $('market-insight').textContent=`${label} postings averaged ${fmt(last.sector)} in ${last.month}, ${fmt(Math.abs(last.sector-100))}% ${last.sector>=100?'above':'below'} the pre-pandemic baseline. All US jobs averaged ${fmt(last.value)}.${prev?` The sector index changed ${pct((last.sector/prev.sector-1)*100)} versus the same month a year earlier.`:''}${partial?' The latest month is incomplete, so comparisons are provisional.':''} This is sector context, not a UX Research estimate.`;
 $('chart-table').innerHTML=`<table><caption>Monthly means of daily indices</caption><thead><tr><th scope="col">Month</th><th scope="col">All US jobs</th><th scope="col">${esc(label)}</th><th scope="col">Observed days</th></tr></thead><tbody>${chartRows.map(p=>`<tr><td>${p.month}</td><td>${p.value}</td><td>${p.sector}</td><td>${p.days}</td></tr>`).join('')}</tbody></table>`;
}
$('sector').onchange=contextRender;$('range').onchange=contextRender;
$('export-context').onclick=()=>{if(!chartRows.length)return;download('indeed-context.csv',['month,all_us_jobs,sector,sector_index,observed_days',...chartRows.map(p=>[p.month,p.value,csvEscape($('sector').value),p.sector,p.days].join(','))].join('\n'));};
$('template').onclick=()=>download('posting-template.csv','id,title,company,posted_date,country,source,location,description,salary_min,salary_max,currency,salary_period\n');
function bars(rows){const max=Math.max(1,...rows.map(x=>x.value));return rows.length?rows.map(x=>`<div class="bar-row"><span>${esc(x.period)}</span><div class="bar-track"><div class="bar-fill" style="width:${x.value/max*100}%"></div></div><strong>${fmt(x.value)}</strong></div>`).join(''):'<p>No matching postings in this selection.</p>';}
function researchRender(){const jobs=imported.jobs.filter(j=>($('family').value==='all'||j.family===$('family').value)&&($('year').value==='all'||j.year===$('year').value));annualRows=aggregate(jobs);$('annual').innerHTML=bars(annualRows);const employers=aggregate(jobs,'company').sort((a,b)=>b.value-a.value).slice(0,8);$('employers').innerHTML=bars(employers);const q=imported.quality;$('quality').textContent=`${q.input} input rows → ${q.accepted} accepted · ${q.duplicates} duplicate IDs · ${q.invalid} invalid rows · ${q.outsideUS} outside US · ${q.unmatched} unmatched titles. Showing ${jobs.length} postings. Counts describe this sample only; source coverage has not been validated.`;}
$('upload').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Use a CSV smaller than 10 MB.');const result=normalize(parseCSV(await file.text()));if(!result.jobs.length)throw Error(`No valid US research postings found. ${result.quality.invalid} invalid rows, ${result.quality.outsideUS} outside US, ${result.quality.unmatched} unmatched titles. Check the template and title definitions.`);userImported=true;imported=result;setCorpus(result.jobs,false);$('year').innerHTML='<option value="all">All years</option>'+[...new Set(imported.jobs.map(j=>j.year))].sort().map(y=>`<option>${y}</option>`).join('');$('family').value='all';$('research-status').textContent='IMPORTED SAMPLE · UNVERIFIED COVERAGE';$('research-results').hidden=false;$('import-message').textContent=`Imported ${file.name}. Explore the sample below.`;researchRender();}catch(err){$('import-message').textContent=err.message;}finally{e.target.value='';}};
$('family').onchange=researchRender;$('year').onchange=researchRender;
$('export-research').onclick=()=>download('ux-research-observed-postings.csv',['year,observed_postings,role_family',...annualRows.map(r=>[r.period,r.value,csvEscape($('family').value)].join(','))].join('\n'));
$('clear').onclick=()=>{imported=null;clearCorpus();$('research-results').hidden=true;$('research-status').textContent='AWAITING POSTING DATA';$('import-message').textContent='Dataset cleared.';};
try{const r=await fetch('data/context.json');if(!r.ok)throw Error(`Data request failed (${r.status})`);context=await r.json();contextRender();}catch(e){$('coverage').textContent='Market data could not be loaded.';$('market-insight').textContent='Refresh the page to retry. '+e.message;}
// Bundled public corpus is reproducible and attributed; personal uploads can replace it.
try {
 const response=await fetch('data/research-corpus.json');if(!response.ok)throw Error(`Corpus request failed (${response.status})`);
 const payload=await response.json(),result=normalize(payload.jobs);
 if(userImported) throw Error("Personal upload active; bundled corpus not applied.");
 imported=result;setCorpus(result.jobs,false,payload.metadata);
 $('year').innerHTML='<option value="all">All years</option>'+[...new Set(result.jobs.map(j=>j.year))].sort().map(y=>`<option>${y}</option>`).join('');
 $('family').value='all';$('research-status').textContent='PUBLIC CORPUS · SNAPSHOT SAMPLE';$('research-results').hidden=false;researchRender();
 const m=payload.metadata;
 const coverageRows=m.versions.flatMap(v=>Object.entries(v.all_postings_by_month).map(([month,n])=>`<tr><td>${v.version}</td><td>${month}</td><td>${n.toLocaleString('en-US')}</td><td>${(v.explicit_us_postings_by_month[month]||0).toLocaleString('en-US')}</td></tr>`));
 $('public-coverage').innerHTML=`<p>${m.versions.reduce((n,v)=>n+v.total_rows_with_dates,0).toLocaleString('en-US')} raw records across two versions → ${m.candidates} explicit-US title candidates → ${result.jobs.length} retained research descriptions. Title screening recall has not been validated. The 2023 cohort has 9 descriptions; the 2024 cohort has 34. These are different collection windows.</p><div class="table-wrap"><table><thead><tr><th>Version</th><th>Original posting month</th><th>All raw postings</th><th>Explicit US location</th></tr></thead><tbody>${coverageRows.join('')}</tbody></table></div><p>${esc(m.dedup_rule)}</p><details><summary>Review excluded candidates (${m.audit.filter(r=>!r.included).length})</summary>${m.audit.filter(r=>!r.included).map(r=>`<p><strong>${esc(r.title)}</strong> · ${esc(r.company)} · ${esc(r.id)}<br>${esc(r.reason)}</p>`).join('')}</details>`;
} catch(error){$('public-coverage').textContent='Public corpus could not load. You can import a CSV or use the synthetic example. '+error.message;}
