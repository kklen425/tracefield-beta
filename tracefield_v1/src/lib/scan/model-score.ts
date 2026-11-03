export const DETECTOR_MODEL='hbhanushali/fakespot-ai-detector-onnx';
export const DETECTOR_REVISION='e2fddfefe101446f4626061424e156c9058092e0';
export type ScoredWindow={text:string,score:number};
export function aiScore(labels:{label:string,score:number}[]) {
 const score=labels.find(item=>item.label==='AI')?.score;
 if(score===undefined||!Number.isFinite(score)||score<0||score>1)throw new Error('Detector label mapping or output is invalid. No percentage was produced.');
 return score;
}
export function summarizeWindows(windows:ScoredWindow[]) {
 const count=(text:string)=>(text.trim().match(/\S+/g)??[]).length;
 const words=windows.reduce((sum,w)=>sum+count(w.text),0);
 if(!words)throw new Error('No analyzable text.');
 return {scorePercent:windows.reduce((sum,w)=>sum+w.score*count(w.text),0)/words*100,flaggedWordPercent:windows.reduce((sum,w)=>sum+(w.score>=.8?count(w.text):0),0)/words*100,windows:windows.length,threshold:.8};
}
export function validateModelText(text:string){
 const words=text.trim().match(/\S+/g)??[];
 if(words.length<50)throw new Error('The AI percentage model needs at least 50 words. Use Quick style analysis for shorter text.');
 if(text.length>50000)throw new Error('AI percentage limit: 50,000 characters. Select a shorter passage; no text has been silently skipped.');
 const letters=text.match(/\p{L}/gu)??[];const latin=text.match(/[A-Za-z]/g)??[];
 if(!letters.length||latin.length/letters.length<.8)throw new Error('This model supports English text only. No reliable percentage is available for this language.');
}
