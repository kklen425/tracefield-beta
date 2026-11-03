import {roundTrip,translateLocally,type TranslationAction} from './local-translation';
import {analyzeWithModel} from './text-model';
self.onmessage=async(event:MessageEvent<{action:TranslationAction|'compare',text:string,draft?:string}>)=>{
 try{
  const {action,text,draft}=event.data;const progress=(message:string)=>self.postMessage({progress:message});
  if(action==='compare'){
   const before=await analyzeWithModel(text,progress);const after=await analyzeWithModel(draft??'',progress);
   self.postMessage({result:{comparison:{before:before.model.scorePercent,after:after.model.scorePercent,model:before.model.id}}});
  }else if(action==='roundtrip')self.postMessage({result:await roundTrip(text,progress)});
  else{const result=await translateLocally(text,action,progress);self.postMessage({result:action==='toChinese'?{chinese:result}:{english:result}});}
 }catch(e){self.postMessage({error:e instanceof Error?e.message:'Local revision failed. The original has been kept.'});}
};
