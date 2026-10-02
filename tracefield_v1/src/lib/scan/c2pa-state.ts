/** Only the official reader's structured state determines cryptographic status. */
export function inferValidationState(store:unknown,present:boolean):'not-present'|'unknown'|'trusted'|'valid'|'invalid' {
 if(!present)return 'not-present';
 if(!store||typeof store!=='object')return 'unknown';
 const value=(store as Record<string,unknown>).validation_state;
 return value==='Trusted'?'trusted':value==='Valid'?'valid':value==='Invalid'?'invalid':'unknown';
}
