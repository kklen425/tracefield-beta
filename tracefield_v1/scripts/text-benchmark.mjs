import fs from 'node:fs';
import {analyzeText} from '../src/lib/scan/text.ts';
const input=process.argv[2];
if(!input){console.log('No provenance-labelled evaluation corpus supplied. Smoke cases only; no accuracy claim.');for(const words of [40,100,550]){const text=Array.from({length:words},(_,i)=>['Evidence','must','remain','uncertain','without','provenance'][i%6]).join(' ');const r=analyzeText(text);console.log(JSON.stringify({type:'synthetic smoke',words,verdict:r.verdict,confidence:r.confidence}));}process.exit(0);}
const groups={};
for(const line of fs.readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean)){
 const sample=JSON.parse(line);if(!sample.category||!sample.provenance||!['human','ai','mixed'].includes(sample.label))throw new Error('Every sample needs category, verified provenance, label (human/ai/mixed), text');
 const r=analyzeText(sample.text);const predicted=r.verdict==='Likely AI-assisted'?'ai':r.verdict==='Likely human-written'?'human':'mixed';
 const g=groups[sample.category]??={n:0,matches:0,uncertain:0,aiFalsePositives:0};g.n++;if(predicted===sample.label)g.matches++;if(predicted==='mixed')g.uncertain++;if(sample.label==='human'&&predicted==='ai')g.aiFalsePositives++;
}
console.log(JSON.stringify({method:'experimental style heuristic; no probability calibration',groups},null,2));
