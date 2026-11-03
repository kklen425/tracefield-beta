import {analyzeText} from './text.ts';
import {aiScore,DETECTOR_MODEL,DETECTOR_REVISION,summarizeWindows,validateModelText,type ScoredWindow} from './model-score.ts';

export async function analyzeWithModel(text:string,progress:(message:string)=>void){
 validateModelText(text);
 progress('Loading local AI model · about 125 MB on first use; text is not uploaded');
 const {pipeline,env}=await import('@huggingface/transformers');
 env.allowLocalModels=false;env.backends.onnx.wasm!.numThreads=1;
 const classifier=await pipeline('text-classification',DETECTOR_MODEL,{revision:DETECTOR_REVISION,dtype:'q8',device:typeof self==='undefined'?'cpu':'wasm',progress_callback:event=>{if(event.status==='progress'&&event.progress!==undefined)progress(`Downloading local model: ${Math.round(event.progress)}% · ${event.file}`);}});
 try {
  const chunks:string[]=[];let start=0;
  while(start<text.length){
   let end=Math.min(text.length,start+1200);
   if(end<text.length){const boundary=text.lastIndexOf(' ',end);if(boundary>start)end=boundary+1;}
   while(classifier.tokenizer.encode(text.slice(start,end)).length>500){end=start+Math.floor((end-start)/2);const boundary=text.lastIndexOf(' ',end);if(boundary>start)end=boundary+1;}
   if(end<=start)throw new Error('Could not split input into safe model windows.');
   chunks.push(text.slice(start,end));start=end;
   if(chunks.length>160)throw new Error('This text requires too many model windows. Choose a shorter passage.');
  }
  const scored:ScoredWindow[]=[];
  for(let i=0;i<chunks.length;i++){
   progress(`Scoring passage ${i+1} / ${chunks.length} locally`);
   const labels=await classifier(chunks[i].replace(/\s+/g,' ').trim(),{top_k:2});
   scored.push({text:chunks[i],score:aiScore(labels as {label:string,score:number}[])});
  }
  const summary=summarizeWindows(scored);const baseline=analyzeText(text);
  return {...baseline,verdict:summary.scorePercent>=80?'AI-like model signals':summary.scorePercent<=20?'Human-like model signals':'Mixed / uncertain',confidence:baseline.wordCount<300?'Very low':'Low',model:{id:DETECTOR_MODEL,revision:DETECTOR_REVISION,...summary},
   segments:scored.map(w=>({text:w.text,flagged:w.score>=.8,score:w.score})),
   evidence:[`${summary.windows} token-bounded windows scored; all selected text included`,`Word-weighted mean AI classifier score: ${summary.scorePercent.toFixed(1)}%`,`Words in windows scoring at least 80%: ${summary.flaggedWordPercent.toFixed(1)}%`],
   warning:'Experimental, uncalibrated score. Our small diagnostic check falsely flagged both historical human excerpts. Essay accuracy is unestablished. This is not a Turnitin score or a measured percentage of AI-authored words.',
   limitation:'English-only Fakespot RoBERTa (Apache-2.0), third-party int8 ONNX conversion. Short, edited, translated, non-native and unfamiliar writing can be misclassified. Do not use alone for grading or disciplinary decisions.'};
 }finally{await classifier.dispose();}
}
