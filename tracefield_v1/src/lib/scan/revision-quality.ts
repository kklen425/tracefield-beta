export function validateRevisionInput(text:string){
 if(!text.trim())throw new Error('Add some text first.');
 if(text.length>20000)throw new Error('Local revision limit: 20,000 characters. Select a shorter passage; no text has been skipped.');
}

export function clearerEnglish(text:string){
 validateRevisionInput(text);
 return text.replace(/\b(?:it is important to note that|it should be noted that|it is worth noting that)\s+([a-z])/gi,(_match:string,letter:string,offset:number)=>{
   const before=text.slice(0,offset);return !before.trim()||/[.!?]\s*$|\n\s*$/.test(before)?letter.toUpperCase():letter;
  })
  .replace(/\bdue to the fact that\b/gi,'because').replace(/\bin order to\b/gi,'to')
  .replace(/\bat this point in time\b/gi,'now').replace(/\bin the event that\b/gi,'if')
  .replace(/\bfor the purpose of\b/gi,'for').replace(/\butili[sz]e\b/gi,'use').replace(/\butili[sz]ed\b/gi,'used').replace(/\butili[sz]ing\b/gi,'using')
  .replace(/(^|[.!?]\s+|\n)(?:furthermore|moreover|in conclusion|in summary),\s*([a-z])/gi,(_,before:string,letter:string)=>before+letter.toUpperCase());
}

export function revisionQuality(source:string,draft:string){
 const warnings:string[]=[];
 const numbers=(text:string):string[]=>Array.from(text.match(/\b\d+(?:[.,]\d+)*(?:%|\b)/g)??[]);
 const missing=numbers(source).filter(value=>!numbers(draft).includes(value));
 const added=numbers(draft).filter(value=>!numbers(source).includes(value));
 if(missing.length)warnings.push(`Numbers missing or changed: ${[...new Set(missing)].join(', ')}`);
 if(added.length)warnings.push(`New or changed numbers: ${[...new Set(added)].join(', ')}`);
 const references=source.match(/https?:\/\/\S+|\[[^\]\n]{1,80}\]|\([^()\n]{0,60}\b(?:19|20)\d{2}[a-z]?\)/g)??[];
 if(references.some(value=>!draft.includes(value)))warnings.push('A citation, reference or URL changed. Compare it with the original.');
 const negatives=(text:string)=>(text.replace(/’/g,"'").match(/\b(?:no|not|never|without|cannot)\b|n't\b/gi)??[]).length;
 if(negatives(source)!==negatives(draft))warnings.push('Negation changed. Check words such as not, never and without.');
 const ordinaryStarts=new Set('A An The This That These Those It Its I We Our You Your They Their There Here In On At As For From To By If When While However Moreover Furthermore Therefore Thus Additionally Instead Overall Finally First Second Also No Not Without Because All Both Each Every Some One Two Three Four'.toLowerCase().split(' '));
 const sourceWords=new Set((source.match(/[A-Za-z]+/g)??[]).map(word=>word.toLowerCase()));
 const newTerms=[...new Set((draft.match(/\b[A-Z][a-z]{2,}\b/g)??[]).filter(word=>!ordinaryStarts.has(word.toLowerCase())&&!sourceWords.has(word.toLowerCase())))];
 if(newTerms.length)warnings.push(`Check new capitalised words or names: ${newTerms.join(', ')}. These may also be ordinary sentence starts.`);
 const draftWords=new Set((draft.match(/[A-Za-z]+/g)??[]).map(word=>word.toLowerCase()));
 const lostTerms=[...new Set((source.match(/\b[A-Z][a-z]{2,}\b/g)??[]).filter(word=>!ordinaryStarts.has(word.toLowerCase())&&!draftWords.has(word.toLowerCase())))];
 if(lostTerms.length)warnings.push(`Check missing capitalised words or names: ${lostTerms.join(', ')}.`);
 if(/\b(?:starts|begins|will start|will begin|is scheduled)\b/i.test(source)&&/\b(?:started|began|had started|was scheduled)\b/i.test(draft))warnings.push('A planned or present event may have shifted into the past. Check the timeline.');
 const words=(text:string)=>(text.match(/\S+/g)??[]).length;
 const ratio=words(draft)/Math.max(words(source),1);
 if(ratio<.55||ratio>1.8)warnings.push('The English length changed substantially; check for omissions or added claims.');
 if(/\b(\w+)(?:\s+\1){2,}\b/i.test(draft))warnings.push('Repeated words detected. Edit the draft before using it.');
 const letters=draft.match(/\p{L}/gu)??[];
 if(letters.length&&(draft.match(/[a-z]/gi)??[]).length/letters.length<.9)warnings.push('The revised English still contains substantial non-English text.');
 if(draft.trim()===source.trim())warnings.push('The draft is unchanged. No rewriting benefit has been demonstrated.');
 return {warnings,sourceWords:words(source),draftWords:words(draft),changed:source!==draft};
}

export function selectEnglishDraft(source:string,translated:string,protectMeaning=true){
 const warnings=source.trim()?revisionQuality(source,translated).warnings:[];
 const usedFallback=protectMeaning&&!!source.trim()&&warnings.some(w=>!w.startsWith('The draft is unchanged'));
 return {english:usedFallback?clearerEnglish(source):translated,rawEnglish:translated,warnings,usedFallback};
}
