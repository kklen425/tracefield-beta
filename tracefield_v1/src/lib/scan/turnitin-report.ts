export function parseTurnitinReport(text:string){
 if(!/turnitin/i.test(text)||!/AI\s+writing|AI[-\s]generated|detected\s+as\s+AI/i.test(text))throw new Error('No recognizable Turnitin AI writing report header. A Similarity Report percentage is not an AI score.');
 const header=text.slice(0,12000);
 const patterns=[/(?<![\d.\-])((?:100|[1-9]?\d)(?:\.\d+)?)\s*%\s*(?:detected\s+as\s+AI|AI[-\s]generated|AI\s+writing)/gi,/(?:overall\s+)?AI\s+(?:writing\s+)?(?:score|percentage)\s*[:\-]?\s*((?:100|[1-9]?\d)(?:\.\d+)?)\s*%/gi];
 const matches=patterns.flatMap(pattern=>Array.from(header.matchAll(pattern)).map(m=>({percent:Number(m[1]),excerpt:m[0]})));const values=[...new Set(matches.map(m=>m.percent))];
 const hidden=/(?:\*\s*%?\s*(?:detected\s+as\s+AI|AI[-\s]generated)|(?:AI\s+writing|detected\s+as\s+AI)[^\n]{0,40}\*)/i.test(header);
 if(hidden)return {percent:null,display:'Suppressed / below reporting threshold',excerpt:'The imported report uses an asterisk; no exact percentage is inferred.',source:'User-imported report; authenticity and document match not verified'};
 if(values.length!==1||values[0]>100)throw new Error('Could not identify one unambiguous overall AI score. View the original report; no percentage has been guessed.');
 return {percent:values[0],display:`${values[0]}% reported as AI`,excerpt:matches.find(m=>m.percent===values[0])!.excerpt,source:'User-imported report; authenticity and document match not verified'};
}
