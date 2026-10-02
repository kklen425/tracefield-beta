import {useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {getEntitlement,getAnalysisUsage,consumeAnalysis} from '@/lib/account/entitlements';
import {scanArtifact} from '@/lib/scan/artifact';
import type {ScanReport} from '@/lib/scan/types';
import {downloadJson} from './export';
export function BatchWorkspace({onUsage}:{onUsage:(value:{used:number,limit:number})=>void}) {
 const [files,setFiles]=useState<File[]>([]);const [results,setResults]=useState<ScanReport[]>([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const stopped=useRef(false);
 async function run(){setBusy(true);setResults([]);stopped.current=false;try{
  const entitlement=await getEntitlement();if(!entitlement.active)throw new Error('Plus is required for small batch workflows.');
  const current=await getAnalysisUsage();if(current.limit-current.used<files.length)throw new Error('Insufficient remaining jobs for this batch.');
  for(const file of files){if(stopped.current)break;const result=await scanArtifact(file,p=>setMessage(`${file.name}: ${p.step}`));if(stopped.current)break;onUsage(await consumeAnalysis({data:crypto.randomUUID()}));setResults(previous=>[...previous,result]);}
  setMessage(stopped.current?'Batch stopped. Completed jobs remain available.':'Batch complete. Originals remained local.');
 }catch(e){setMessage(e instanceof Error?e.message:'Batch failed');}finally{setBusy(false);}}
 return <details className="border border-border p-3 text-xs text-muted"><summary>Plus · small image batch (up to 5)</summary><input aria-label="Batch images" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} className="my-3 block w-full" onChange={e=>{const next=Array.from(e.target.files??[]);if(next.length>5){setMessage('Choose at most 5 images.');setFiles([]);}else{setFiles(next);setMessage(`${next.length} images selected`);}}}/><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy||!files.length} onClick={()=>void run()}>Run batch</Button>{busy&&<Button size="sm" variant="outline" onClick={()=>{stopped.current=true;}}>Stop after current scan</Button>}{results.length>0&&<Button size="sm" variant="outline" onClick={()=>downloadJson(results.map(r=>({...r,spectrum:r.spectrum?{...r.spectrum,heatmap:undefined}:null,limitation:'Observed local evidence, not proof of authorship.'})))}>Export batch reports</Button>}</div><p role="status" className="mt-2">{message}</p>{results.map(r=><p key={r.facts.sha256} className="mt-2 break-all">{r.facts.name}: {r.summary}</p>)}</details>;
}
