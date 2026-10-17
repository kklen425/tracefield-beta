import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {PERSONAL_CHANGED,readRecords,type LocalRecord} from '@/lib/personal/store';
import {downloadJson} from './export';

export function PersonalHistory(){
 const [records,setRecords]=useState<LocalRecord[]>([]);const [error,setError]=useState('');
 useEffect(()=>{const refresh=()=>{try{setRecords(readRecords());setError('');}catch(e){setError(String(e));}};refresh();window.addEventListener(PERSONAL_CHANGED,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(PERSONAL_CHANGED,refresh);window.removeEventListener('storage',refresh);};},[]);
 return <section className="mx-auto max-w-6xl border-t border-border px-4 py-8 sm:px-6"><h2 className="font-display text-2xl">Personal history &amp; saved reports</h2><p className="mt-2 text-sm text-muted">Saved only in this browser. Clearing site data removes these records. Export a backup to keep or share them. Reports describe local evidence, not independent certification.</p>{error&&<p role="alert">{error}</p>}<Button className="my-4" size="sm" variant="outline" disabled={!records.length} onClick={()=>downloadJson({version:1,records})}>Export history backup</Button>{!records.length&&<p className="text-sm text-muted">No saved summaries yet.</p>}<div className="space-y-3">{records.map(record=><details key={record.id} className="border border-border p-3 text-sm"><summary className="break-all">{record.fileName} · {record.kind} · {record.verdict}</summary><p className="my-2 break-all font-mono text-xs">{record.createdAt} · SHA-256 {record.fileSha256}</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-muted">{JSON.stringify(record.evidence,null,2)}</pre><Button className="mt-3" size="sm" variant="outline" onClick={()=>downloadJson(record)}>Export saved report</Button></details>)}</div></section>;
}
