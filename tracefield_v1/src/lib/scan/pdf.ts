export async function extractPdf(file: File, progress: (message: string) => void, signal: AbortSignal) {
 if(file.size > 30*1024*1024) throw new Error('PDF limit: 30 MB.');
 const pdfjs = await import('pdfjs-dist');
 const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
 pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
 const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer()), useWorkerFetch:false});
 const cancel = () => { void task.destroy(); };
 signal.addEventListener('abort',cancel,{once:true});
 try {
 if(signal.aborted) throw new Error('Cancelled');
 const doc = await task.promise;
 if(doc.numPages > 300) throw new Error('PDF limit: 300 pages.');
 const metadata = await doc.getMetadata();
 const pages: string[] = [];
 for(let n=1;n<=doc.numPages;n++) {
  if(signal.aborted) throw new Error('Cancelled');
  progress(`Extracting page ${n} / ${doc.numPages}`);
  const page = await doc.getPage(n);
  const content = await page.getTextContent();
  pages.push(content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join(''));
  if(pages.reduce((count,text)=>count+text.length,0)>500000)throw new Error('PDF extracted text limit: 500,000 characters.');
  page.cleanup();
 }
 return {pages, info: metadata.info, xmp: metadata.metadata?.getRaw() ?? null};
 } finally { signal.removeEventListener('abort',cancel); await task.destroy(); }
}
