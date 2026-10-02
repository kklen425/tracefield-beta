import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {scanArtifact} from '@/lib/scan/artifact';
import {readMetadata} from '@/lib/scan/metadata';
import type {ScanReport} from '@/lib/scan/types';
import {downloadBlob,downloadJson} from './export';
export function CleanWorkspace({file,report}:{file:File,report:ScanReport}) {
 const [format,setFormat]=useState('image/png');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 const [after,setAfter]=useState<{file:File,report:ScanReport,beforeMetadata:string,afterMetadata:string,url:string}|null>(null);
 useEffect(()=>()=>{if(after)URL.revokeObjectURL(after.url);},[after]);
 async function clean(){setBusy(true);setMessage('Re-encoding ordinary raster pixels locally');try{
  const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40_000_000){bitmap.close();throw new Error('Clean limit: 40 megapixels.');}
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(bitmap,0,0);bitmap.close();
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Export failed')),format,.92));
  const copy=new File([blob],`clean-${file.name.replace(/\.[^.]+$/,'')}.${blob.type.split('/')[1]}`,{type:blob.type});
  const [next,beforeMeta,afterMeta]=await Promise.all([scanArtifact(copy,p=>setMessage(p.step)),readMetadata(file),readMetadata(copy)]);
  setAfter({file:copy,report:next,beforeMetadata:beforeMeta.rawText,afterMetadata:afterMeta.rawText,url:URL.createObjectURL(copy)});setMessage('Ordinary metadata cleaned. Hidden provenance signals may remain. Review the re-scan below.');
 }catch(e){setMessage(e instanceof Error?e.message:'Clean failed');}finally{setBusy(false);}}
 return <section className="space-y-3"><h2 className="font-display text-2xl"><span className="mr-3 font-mono text-xs text-subtle">03</span>Clean / Export</h2><p className="text-xs text-muted">Re-encode a sharing copy without ordinary EXIF/XMP/comments. Colour profile, animation and transparency may change; JPEG flattens transparency to white. No targeted hidden watermark removal.</p><div className="flex flex-wrap gap-2"><select aria-label="Export format" value={format} onChange={e=>setFormat(e.target.value)} className="border border-border bg-bg-elevated text-sm"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select><Button size="sm" disabled={busy} onClick={()=>void clean()}>{busy?'Cleaning / re-scanning…':'Clean and re-scan'}</Button><Button size="sm" variant="outline" onClick={()=>downloadJson({analysisType:'IMAGE',...report,spectrum:report.spectrum?{...report.spectrum,heatmap:undefined}:null,limitation:'Evidence scores are not probabilities. Missing provenance does not prove human origin.'})}>Export JSON</Button></div><p role="status" className="text-xs text-muted">{message}</p>{after&&<><img src={after.url} alt="Cleaned copy" className="max-h-48 w-full object-contain"/><div className="break-all font-mono text-xs text-muted">Before: {file.size} bytes · {report.facts.sha256}<br/>After: {after.file.size} bytes · {after.report.facts.sha256}</div><details className="text-xs"><summary>Observable metadata before → after</summary><pre className="whitespace-pre-wrap break-all">{after.beforeMetadata||'No parsed ordinary metadata'}{'\n→\n'}{after.afterMetadata||'No parsed ordinary metadata'}</pre></details><p className="text-xs text-muted">Re-scan: {after.report.summary} C2PA: {after.report.c2pa?.validationState ?? 'unknown'}</p><Button size="sm" onClick={()=>downloadBlob(after.file,after.file.name)}>Download cleaned copy</Button></>}</section>;
}
