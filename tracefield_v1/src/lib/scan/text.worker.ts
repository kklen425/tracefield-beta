import { analyzeText } from './text';
self.onmessage = (event: MessageEvent<string>) => {
 try { self.postMessage({result:analyzeText(event.data)}); }
 catch(error) { self.postMessage({error:error instanceof Error ? error.message : 'Analysis failed'}); }
};
