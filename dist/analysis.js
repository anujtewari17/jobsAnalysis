export function parseCSV(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') { cell += '"'; i++; } else if (quoted || cell === '') quoted = !quoted; else throw Error('Unexpected quote in CSV.'); }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if(c === '\r' && text[i+1] === '\n') i++; row.push(cell); if(row.some(x=>x.trim())) rows.push(row); row=[]; cell=''; }
    else cell += c;
  }
  if (quoted) throw Error('Unclosed quoted field.');
  row.push(cell); if(row.some(x=>x.trim())) rows.push(row);
  if (rows.length < 2) throw Error('CSV needs a header and at least one posting.');
  const headers=rows.shift().map(x=>x.trim().toLowerCase());
  if(new Set(headers).size!==headers.length) throw Error('Duplicate CSV headers.');
  for(const h of ['id','title','company','posted_date','country','source']) if(!headers.includes(h)) throw Error(`Missing column: ${h}`);
  return rows.map((r,i)=>{if(r.length!==headers.length) throw Error(`Row ${i+2} has ${r.length} fields; expected ${headers.length}.`); return Object.fromEntries(headers.map((h,j)=>[h,r[j].trim()]));});
}
export function family(title) {
  const t=title.toLowerCase().replace(/[-_]/g,' ');
  if (/\b(?:research operations|research ops|researchops)\b/.test(t)) return 'Research Operations';
  if (/\b(?:ux|user experience|user)\s+research(?:er|ers|ing)?\b/.test(t) || /\buxr\b/.test(t)) return 'UX Research';
  if (/\b(?:design|product)\s+research(?:er|ers)?\b/.test(t)) return 'Adjacent research';
  return null;
}
export function normalize(rows) {
  const seen=new Set(), jobs=[]; let invalid=0, duplicates=0, outsideUS=0, unmatched=0;
  for(const r of rows) {
    const d=r.posted_date;
    if (!r.id || !r.title || !r.company || !r.source || !/^\d{4}-\d{2}-\d{2}$/.test(d||'') || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0,10)!==d || d>new Date().toISOString().slice(0,10)) {invalid++;continue;}
    if(!['us','usa','united states','united states of america'].includes((r.country||'').toLowerCase())) {outsideUS++;continue;}
    const f=family(r.title); if(!f){unmatched++;continue;}
    const k=JSON.stringify([r.source.toLowerCase(),r.id]); if(seen.has(k)){duplicates++;continue;} seen.add(k);
    jobs.push({...r,family:f,month:d.slice(0,7),year:d.slice(0,4)});
  }
  return {jobs,quality:{input:rows.length,invalid,duplicates,outsideUS,unmatched,accepted:jobs.length}};
}
export function aggregate(jobs, group='year') {
  const counts=new Map(); for(const j of jobs) counts.set(j[group],(counts.get(j[group])||0)+1);
  return [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([period,value])=>({period,value}));
}
export function csvEscape(s) { return '"'+String(s).replaceAll('"','""')+'"'; }
