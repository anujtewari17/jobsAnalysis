// Dictionary v1: explicit, auditable mention matching. Not a requirement classifier.
export const THEMES = [
 ['User interviews','Methods',/\b(?:user interviews?|in[ -]depth interviews?|interviewing users)\b/i],
 ['Usability testing','Methods',/\b(?:usability (?:test(?:ing|s)?|studies)|user testing)\b/i],
 ['Surveys','Methods',/\bsurveys?\b/i],
 ['Experimentation','Methods',/\b(?:a\s*\/\s*b test(?:ing|s)?|experimentation|randomized (?:trials?|experiments?))\b/i],
 ['Ethnography','Methods',/\b(?:ethnograph\w*|contextual inquir\w*|field stud(?:y|ies))\b/i],
 ['Mixed methods','Methods',/\bmixed[ -]methods?\b/i],
 ['Quantitative research','Methods',/\b(?:quantitative (?:research|methods?|analysis)|statistical (?:analysis|modeling|modelling))\b/i],
 ['SQL','Tools',/\bsql\b/i], ['Python','Tools',/\bpython\b/i], ['R','Tools',/\b(?:r programming|programming in r|r language|r studio|rstudio)\b/i],
 ['Figma','Tools',/\bfigma\b/i], ['Qualtrics','Tools',/\bqualtrics\b/i], ['Dovetail','Tools',/\bdovetail\b/i],
 ['AI / machine learning','Topics',/\b(?:ai|artificial intelligence|machine learning|generative ai|llms?|large language models?)\b/i],
 ['Accessibility','Topics',/\b(?:accessibility|wcag|assistive technolog\w*)\b/i],
 ['Stakeholder collaboration','Responsibilities',/\b(?:stakeholders?|cross[ -]functional|cross functional)\b/i],
 ['Research strategy','Responsibilities',/\b(?:research strateg\w*|research roadmap\w*|research agenda\w*)\b/i]
].map(([name,category,pattern])=>({name,category,pattern}));
export function cleanText(s='') {
 return String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g,' ').replace(/\s+/g,' ').trim();
}
export function extractExperience(text) {
 // Only numeric years explicitly linked to experience; no inferred seniority or degree substitutions.
 const pattern=/\b(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?\s*\+?\s*years?(?:\s+of)?\s+(?:(?:relevant|professional|industry|research|ux|user experience|work|hands[ -]on)\s+){0,3}experience\b/gi;
 const found=[];for(const m of text.matchAll(pattern)){const n=Number(m[1]), max=m[2]?Number(m[2]):n;if(n<=40&&max>=n&&max<=40)found.push({years:n,evidence:m[0]});}
 // Several different experience requirements in a posting are ambiguous.
 const unique=[...new Set(found.map(x=>x.years))];return unique.length===1?{value:unique[0],evidence:found.map(x=>x.evidence).join('; ')}:{value:null,evidence:found.length?'Ambiguous: '+found.map(x=>x.evidence).join('; '):''};
}
export function enrich(jobs){return jobs.map(j=>{const text=cleanText(j.description),mentions=THEMES.filter(t=>t.pattern.test(text)).map(t=>t.name);const lo=Number(j.salary_min),hi=Number(j.salary_max);const salary=(j.currency||'').toUpperCase()==='USD'&&(j.salary_period||'').toLowerCase()==='annual'&&j.salary_min?.trim()&&j.salary_max?.trim()&&Number.isFinite(lo)&&Number.isFinite(hi)&&lo>0&&hi>=lo?(lo+hi)/2:null;return {...j,text,mentions,experience:extractExperience(text),salary};});}
export function quantile(values,p){if(!values.length)return null;const s=[...values].sort((a,b)=>a-b), i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.ceil(i)]-s[l])*(i-l);}
export function summary(jobs){const text=jobs.filter(j=>j.text.length),experiences=jobs.map(j=>j.experience.value).filter(x=>x!==null),salaries=jobs.map(j=>j.salary).filter(x=>x!==null);return {n:jobs.length,textN:text.length,experienceN:experiences.length,experienceMedian:quantile(experiences,.5),salaryN:salaries.length,salaryMedian:quantile(salaries,.5),salaryQ1:quantile(salaries,.25),salaryQ3:quantile(salaries,.75)};}
export function themeRates(jobs){const docs=jobs.filter(j=>j.text);return THEMES.map(t=>{const count=docs.filter(j=>j.mentions.includes(t.name)).length;return {name:t.name,category:t.category,count,n:docs.length,share:docs.length?count/docs.length:null};}).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));}
export function compare(a,b){const am=new Map(themeRates(a).map(t=>[t.name,t]));return themeRates(b).map(t=>{const old=am.get(t.name);return {...t,baseCount:old.count,baseN:old.n,baseShare:old.share,delta:old.share===null||t.share===null?null:100*(t.share-old.share)};}).sort((a,b)=>Math.abs(b.delta??0)-Math.abs(a.delta??0));}
const STOP=new Set('a about above across after again all also am an and any are as at be because been before being below between both but by can could did do does doing during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just may me more most must my myself no nor not of off on once only or other our ours ourselves out over own same shall she should so some such than that the their theirs them themselves then there these they this those through to too under until up us use used using very was we were what when where which while who whom why will with within would you your yours yourself yourselves company employer employment equal opportunity apply applicants application job jobs role position team candidate candidates work working including include required requirements preferred responsibilities skills experience years year description benefits'.split(' '));
export function terms(jobs,minDocs=2){const docs=jobs.filter(j=>j.text),counts=new Map();for(const j of docs){const words=j.text.toLowerCase().match(/\b[a-z][a-z0-9]{2,}\b/g)||[];const terms=new Set();for(let i=0;i<words.length;i++){if(!STOP.has(words[i]))terms.add(words[i]);if(i&& !STOP.has(words[i-1])&&!STOP.has(words[i]))terms.add(words[i-1]+' '+words[i]);}for(const t of terms)counts.set(t,(counts.get(t)||0)+1);}return [...counts].filter(([,c])=>c>=minDocs).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,30).map(([term,count])=>({term,count,n:docs.length,share:count/docs.length}));}
export function yearly(jobs){return [...new Set(jobs.map(j=>j.year))].sort().map(year=>({year,...summary(jobs.filter(j=>j.year===year))}));}
