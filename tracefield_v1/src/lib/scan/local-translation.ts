import {validateRevisionInput} from './revision-quality.ts';
export const TRANSLATION_MODELS={
 toChinese:{id:'Xenova/opus-mt-en-zh',revision:'046f55aec303cdee3e0318604406d4df20f1e8ea'},
 toEnglish:{id:'Xenova/opus-mt-zh-en',revision:'39d480d52a9ea3065a1f117adfe4dbc55de10e6f'},
} as const;
export type TranslationAction=keyof typeof TRANSLATION_MODELS|'roundtrip';

export async function translateLocally(text:string,direction:keyof typeof TRANSLATION_MODELS,progress:(message:string)=>void){
 validateRevisionInput(text);
 const {pipeline,env}=await import('@huggingface/transformers');const {Converter}=await import('opencc-js');
 env.allowLocalModels=false;env.backends.onnx.wasm!.numThreads=1;
 const spec=TRANSLATION_MODELS[direction];
 progress(`Loading ${direction==='toChinese'?'English → 繁體中文':'繁體中文 → English'} · about 115 MB on first use`);
 const translator=await pipeline('translation',spec.id,{revision:spec.revision,dtype:'q8',device:typeof self==='undefined'?'cpu':'wasm',progress_callback:event=>{if(event.status==='progress'&&event.progress!==undefined)progress(`Translation model ${Math.round(event.progress)}% · ${event.file}`);}});
 const convert=Converter(direction==='toChinese'?{from:'cn',to:'hk'}:{from:'hk',to:'cn'});
 try{
  const input=direction==='toEnglish'?convert(text):text;
  const parts=input.split(/(\r?\n+)/);const translated:string[]=[];
  for(let partIndex=0;partIndex<parts.length;partIndex++){
   const part=parts[partIndex];if(!part.trim()){translated.push(part);continue;}
   let start=0;const output:string[]=[];
   while(start<part.length){
    let end=Math.min(part.length,start+(direction==='toChinese'?900:350));
    if(end<part.length){const segment=part.slice(start,end);const boundaries=Array.from(segment.matchAll(/[.!?](?:\s+|$)|[。！？]/g));if(boundaries.length&&boundaries.at(-1)!.index!>30)end=start+boundaries.at(-1)!.index!+boundaries.at(-1)![0].length;}
    while(translator.tokenizer.encode(part.slice(start,end)).length>180){end=start+Math.floor((end-start)/2);if(direction==='toChinese'){const boundary=part.lastIndexOf(' ',end);if(boundary>start)end=boundary+1;}}
    if(end<=start)throw new Error('Could not split a translation passage safely.');
    progress(`Translating ${direction==='toChinese'?'to Traditional Chinese':'back to English'} · section ${Math.floor(partIndex/2)+1}, ${Math.round(start/part.length*100)}%`);
    // The JS pipeline accepts partial generation options; its v3 declaration requires the full config shape.
    const options={max_new_tokens:512,do_sample:false} as NonNullable<Parameters<typeof translator>[1]>;
    const result=await translator(part.slice(start,end),options);
    const value=(result as {translation_text:string}[])[0]?.translation_text?.trim();
    if(!value)throw new Error('Translation returned no text. The original has been kept.');
    if(translator.tokenizer.encode(value).length>=500)throw new Error('A translated passage reached the output limit. Select a shorter passage; the original has been kept.');
    output.push(value);start=end;
   }
   translated.push(output.join(direction==='toChinese'?'':' '));
  }
  const joined=translated.join('');return direction==='toChinese'?convert(joined):joined;
 }finally{await translator.dispose();}
}

export async function roundTrip(text:string,progress:(message:string)=>void){
 const chinese=await translateLocally(text,'toChinese',progress);
 const english=await translateLocally(chinese,'toEnglish',progress);
 return {chinese,english};
}
