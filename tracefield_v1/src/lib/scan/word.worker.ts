import mammoth from 'mammoth/mammoth.browser';
self.onmessage=async(event:MessageEvent<ArrayBuffer>)=>{
 try{const result=await mammoth.extractRawText({arrayBuffer:event.data});if(result.value.length>500000)throw new Error('Word extracted text limit: 500,000 characters.');self.postMessage({text:result.value,warnings:result.messages.map(m=>m.message)});}
 catch(e){self.postMessage({error:e instanceof Error?e.message:'Could not open DOCX.'});}
};
