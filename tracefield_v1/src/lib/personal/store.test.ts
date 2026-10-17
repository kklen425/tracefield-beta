import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personalAccount,readRecords,STORAGE_KEY} from './store.ts';

test('personal workspace runs without account/network, persists summaries, and preserves unreadable storage',async()=>{
 const memory=new Map<string,string>();
 const storage={getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)};
 Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});
 Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
 const originalFetch=globalThis.fetch;globalThis.fetch=()=>{throw new Error('Personal workspace must not call the network');};
 try{
  assert.equal((await personalAccount.getEntitlement()).active,true);
  for(let n=0;n<306;n++)assert.equal((await personalAccount.consumeAnalysis({data:crypto.randomUUID()})).limit,Number.MAX_SAFE_INTEGER);
  const summary={fileName:'local.png',fileSha256:'a'.repeat(64),mime:'image/png',verdict:'Uncertain',primarySource:null,evidence:[]};
  await personalAccount.saveScanToHistory({data:summary});
  const receipt=await personalAccount.createVerifiedReport({data:summary});
  assert.equal(readRecords().length,2);assert.equal((await personalAccount.listScanHistory()).length,1);
  assert.equal(receipt.integritySha256.length,64);
  const record=readRecords()[0];const {createdAt,integritySha256,kind,...canonical}=record;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({id:canonical.id,...summary})));
  assert.equal(Buffer.from(digest).toString('hex'),integritySha256);
  memory.set(STORAGE_KEY,'corrupt');
  await assert.rejects(personalAccount.saveScanToHistory({data:summary}));
  assert.equal(memory.get(STORAGE_KEY),'corrupt');
 }finally{globalThis.fetch=originalFetch;}
});
