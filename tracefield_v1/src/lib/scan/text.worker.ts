import { analyzeText } from './text';
self.onmessage = async (event: MessageEvent<{text:string,engine:'style'|'model'}>) => {
 try { const {text,engine}=event.data;self.postMessage({result:engine==='model'?await (await import('./text-model')).analyzeWithModel(text,message=>self.postMessage({progress:message})):analyzeText(text)}); }
 catch(error) { self.postMessage({error:error instanceof Error ? error.message : 'Analysis failed'}); }
};
