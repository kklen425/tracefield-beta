import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {extractPdf} from '@/lib/scan/pdf';
import type {analyzeText} from '@/lib/scan/text';
import {sha256Hex} from '@/lib/scan/hash';
import {consumeAnalysis,getAnalysisUsage,saveScanToHistory,type ScanSummaryInput} from '@/lib/account/entitlements';
import {useCurrentUserState} from '@/lib/auth/use-current-user';
import {downloadJson} from './export';

export function DocumentWorkspace({mode,onUsage}:{mode:'TEXT'|'PDF',onUsage:(value:{used:number,limit:number})=>void}) {
 const [text,setText]=useState('');
 const [pdf,setPdf]=useState<Awaited<ReturnType<typeof extractPdf>>|null>(null);
 const [facts,setFacts]=useState<{name:string,size:number,sha256:string}|null>(null);
 const [result,setResult]=useState<ReturnType<typeof analyzeText>|null>(null);
 const [analysisId,setAnalysisId]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [pages,setPages]=useState<number[]>([]);
 const cancel=useRef<AbortController|null>(null);
 const worker=useRef<Worker|null>(null);
 const operation=useRef(0);const rejectWorker=useRef<((reason:Error)=>void)|null>(null);const selection=useRef('');const committing=useRef(false);
 const {user}=useCurrentUserState();
 useEffect(()=>()=>{operation.current++;cancel.current?.abort();worker.current?.terminate();rejectWorker.current?.(new Error('Cancelled'));},[]);
 const stop=()=>{if(committing.current)return;operation.current++;cancel.current?.abort();worker.current?.terminate();rejectWorker.current?.(new Error('Cancelled'));setBusy(false);setMessage('Cancelled. No completed job charged.');};
 async function load(file:File) {
  const id=++operation.current;selection.current='';setFacts(null);setText('');setBusy(true);setResult(null);setMessage('Opening PDF');setPdf(null);cancel.current=new AbortController();
  try {const parsed=await extractPdf(file,setMessage,cancel.current.signal);if(id!==operation.current)return;setPdf(parsed);setPages(parsed.pages.map((_,i)=>i));setText(parsed.pages.join('\n\n'));setFacts({name:file.name,size:file.size,sha256:await sha256Hex(await file.arrayBuffer())});setMessage(parsed.pages.every(p=>!p.trim())?'No selectable text. Scanned PDF OCR is planned for Phase 2.':'Text extracted locally. Select pages or edit the passage below.');}
  catch(e){setMessage(e instanceof Error?e.message:'PDF could not be opened');} finally{setBusy(false);}
 }
 async function run() {
  if(!user){setMessage('Sign in for your 5 monthly analyses.');return;}
  const id=++operation.current;setBusy(true);setResult(null);setMessage('Checking monthly allowance');
  try {
   const usage=await getAnalysisUsage();if(id!==operation.current)return;if(usage.used>=usage.limit) throw new Error('Monthly analysis limit reached.');
   setMessage('Analyzing locally');
   const job=crypto.randomUUID();
   const output=await new Promise<ReturnType<typeof analyzeText>>((resolve,reject)=>{
    rejectWorker.current=reject;const w=new Worker(new URL('../../lib/scan/text.worker.ts',import.meta.url),{type:'module'});worker.current=w;
    w.onmessage=e=>{w.terminate();e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};w.onerror=()=>{w.terminate();reject(new Error('Text worker failed'));};w.postMessage(text);
   });
   const digest=await sha256Hex(new TextEncoder().encode(text).buffer);if(id!==operation.current)return;rejectWorker.current=null;committing.current=true;setMessage('Recording completed job');const next=await consumeAnalysis({data:job});onUsage(next);setAnalysisId(digest);setResult(output);setMessage(`${next.used} / ${next.limit} jobs used this UTC calendar month.`);
  }catch(e){setMessage(e instanceof Error?e.message:'Analysis failed');}finally{committing.current=false;setBusy(false);}
 }
 async function save(){
  if(!result)return;
  try{const fileSha256=facts?.sha256??analysisId;
   const summary:ScanSummaryInput={fileName:facts?.name??'Pasted text',fileSha256,mime:mode==='PDF'?'application/pdf':'text/plain',verdict:result.verdict,primarySource:null,evidence:result.evidence.map(e=>({source:'Experimental local style analysis',family:'Linguistic heuristic',confidence:'low',evidence:e}))};
   await saveScanToHistory({data:summary});setMessage('Saved summary and identifier to your private Plus history. Original text was not uploaded.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not save');}
 }
 return <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
  <section className="min-w-0 space-y-4">
   {mode==='PDF'&&<label className="block border border-border bg-bg-elevated p-4 text-sm">Open PDF · selectable text · up to 30 MB<input aria-label="Open PDF" type="file" accept="application/pdf" disabled={busy} className="mt-3 block w-full" onChange={e=>{const f=e.target.files?.[0];if(f)void load(f);}}/></label>}
   {pdf&&<div className="flex flex-wrap gap-2">{pdf.pages.map((_,i)=><label key={i} className="text-xs"><input type="checkbox" checked={pages.includes(i)} disabled={busy} onChange={e=>{const next=e.target.checked?[...pages,i].sort((a,b)=>a-b):pages.filter(n=>n!==i);selection.current='';setResult(null);setPages(next);setText(next.map(n=>pdf.pages[n]).join('\n\n'));}}/> Page {i+1}</label>)}</div>}
   <label className="block text-sm text-muted" htmlFor="document-text">{mode==='PDF'?'Extracted text / selected passage':'Paste a paragraph, essay or article'}</label>
   <textarea id="document-text" className="min-h-80 w-full resize-y rounded-md border border-border bg-bg-elevated p-4 text-sm leading-7" maxLength={500000} value={text} disabled={busy} onChange={e=>{selection.current='';setResult(null);setText(e.target.value);}} onSelect={e=>{const t=e.currentTarget;selection.current=t.value.slice(t.selectionStart,t.selectionEnd);}} />
   <p className="font-mono text-xs text-muted">{text.trim().match(/\S+/g)?.length??0} words · {text.length} characters</p>
   <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy||!text.trim()} onClick={()=>void run()}>Analyze {mode==='PDF'?'passage':'text'}</Button>{mode==='PDF'&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>{const value=selection.current;if(value){setResult(null);setText(value);selection.current='';}}}>Use selected paragraph</Button>}<Button size="sm" variant="ghost" disabled={busy} onClick={()=>{setText('');setResult(null);}}>Clear</Button>{busy&&<Button size="sm" variant="outline" disabled={committing.current} onClick={stop}>Cancel</Button>}</div>
   <p role="status" className="text-sm text-muted">{message}</p><p className="text-xs text-subtle">Text and PDF bytes stay in your browser. The server receives only a random job ID for quota accounting.</p>
   {facts&&<dl className="space-y-2 break-all font-mono text-xs text-muted"><div>{facts.name} · application/pdf · {facts.size} bytes · {pdf?.pages.length} pages</div><div>SHA-256 {facts.sha256}</div></dl>}
  </section>
  <section className="min-w-0 space-y-5"><h2 className="font-display text-2xl"><span className="mr-3 font-mono text-xs text-subtle">01</span>Identify · writing evidence</h2>
   {result?<><p className="font-display text-3xl">{result.verdict}</p><p className="text-sm text-warn">{result.wordCount} words · {result.confidence} confidence. {result.warning}</p><ul className="space-y-2 text-sm text-muted">{result.evidence.map(e=><li key={e}>{e}</li>)}</ul><p className="text-xs text-muted">{result.limitation}</p><div className="max-h-96 overflow-auto border border-border p-4 text-sm leading-7">{result.segments.map((s,i)=><span key={i} className={s.flagged?'bg-warn/20':''}>{s.text} </span>)}</div><p className="text-xs text-subtle">Highlighted segments contain formulaic style matches; highlighting does not identify authorship.</p><Button size="sm" variant="outline" onClick={()=>downloadJson({analysisType:mode,identifier:facts??{name:'Pasted text',sha256:analysisId},analyzedTextSha256:analysisId,result,pdfMetadata:pdf?.info,xmp:pdf?.xmp,scope:mode==='PDF'?pages.map(n=>n+1):null})}>Export JSON report</Button></>:<p className="text-sm text-muted">Experimental linguistic evidence with explicit uncertainty. Short passages provide very little evidence.</p>}
   {result&&<Button size="sm" variant="outline" onClick={()=>void save()}>Save summary to Plus history</Button>}
   {pdf&&<details className="break-all border border-border p-4 text-xs text-muted"><summary>02 PDF provenance metadata · separate from writing analysis</summary><pre className="mt-3 whitespace-pre-wrap">{JSON.stringify(pdf.info,null,2)}</pre>{pdf.xmp&&<pre className="whitespace-pre-wrap">{pdf.xmp}</pre>}<p>Creator/producer metadata is editable. It does not establish AI authorship. PDF signature validation is not implemented.</p></details>}
  </section>
 </main>;
}
