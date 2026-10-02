export function downloadBlob(blob:Blob,name:string) {
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},30000);
}
export function downloadJson(data:unknown){downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'tracefield-report.json');}
