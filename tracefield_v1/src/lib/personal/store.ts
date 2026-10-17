import type {ScanSummaryInput, VerifiedReport} from '../account/entitlements';

export type LocalRecord = VerifiedReport & {kind:'history'|'report'};
export const STORAGE_KEY = 'tracefield.personal.records.v1';
export const PERSONAL_CHANGED = 'tracefield-personal-changed';

export function readRecords(): LocalRecord[] {
 const value=localStorage.getItem(STORAGE_KEY);
 if(!value)return [];
 const parsed:unknown=JSON.parse(value);
 if(!Array.isArray(parsed))throw new Error('Personal history could not be read. Existing data has been preserved.');
 return parsed as LocalRecord[];
}
export async function saveLocal(data:ScanSummaryInput,kind:LocalRecord['kind']) {
 const id=crypto.randomUUID();const createdAt=new Date().toISOString();
 const canonical=JSON.stringify({id,...data});
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
 const integritySha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const record:LocalRecord={...data,id,createdAt,integritySha256,kind};
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify([record,...readRecords()]));}
 catch{throw new Error('Could not save personal history. Browser storage may be full or disabled. Export the current JSON report instead.');}
 window.dispatchEvent(new Event(PERSONAL_CHANGED));
 return {id,integritySha256};
}

export const personalAccount = {
 getEntitlement:async()=>({plan:'plus' as const,status:'personal',active:true,currentPeriodEnd:null}),
 getAnalysisUsage:async()=>({used:0,limit:Number.MAX_SAFE_INTEGER,period:'Unlimited personal use'}),
 consumeAnalysis:async(_input:{data:string})=>({used:0,limit:Number.MAX_SAFE_INTEGER,period:'Unlimited personal use'}),
 listScanHistory:async()=>readRecords().filter(r=>r.kind==='history'),
 saveScanToHistory:async({data}:{data:ScanSummaryInput})=>saveLocal(data,'history'),
 createVerifiedReport:async({data}:{data:ScanSummaryInput})=>saveLocal(data,'report'),
};
