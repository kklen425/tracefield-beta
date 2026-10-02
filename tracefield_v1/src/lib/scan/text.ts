export const TEXT_LIMITATION = "Experimental English style analysis, not a calibrated AI probability. Human, edited, translated and non-native writing can be misclassified. Do not use for disciplinary decisions.";
export function analyzeText(text: string) {
 const words = text.trim().match(/\S+/g) ?? [];
 if (!words.length) throw new Error("Paste some text first.");
 if (text.length > 500_000) throw new Error("Analyze at most 500,000 characters at once.");
 const sentences = text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
 const lengths = sentences.map(s => s.split(/\s+/).length);
 const mean = words.length / sentences.length;
 const variation = Math.sqrt(lengths.reduce((n,x) => n + (x-mean)**2,0) / lengths.length) / Math.max(mean,1);
 const repeated = 1 - new Set(words.map(w => w.toLowerCase().replace(/\W/g,""))).size / words.length;
 const patterns = /\b(in conclusion|furthermore|moreover|it is important to note|in today's|in summary|delve|multifaceted|tapestry)\b/gi;
 const markers = (text.match(patterns) ?? []).length;
 const score = Math.min(80, Math.max(20, 35 + (variation > .8 && sentences.length > 4 ? -10 : 0) + (variation < .3 && sentences.length > 4 ? 15 : 0) + Math.min(25, markers * 5) + (repeated > .55 ? 5 : 0)));
 const confidence = words.length < 50 ? "Very low" : "Low";
 return { verdict: words.length < 100 ? "Mixed / uncertain" : score >= 65 ? "Likely AI-assisted" : score <= 30 ? "Likely human-written" : "Mixed / uncertain", confidence, wordCount: words.length, characters: text.length, styleScore: score,
 evidence: [`Sentence length variation: ${variation.toFixed(2)} (style feature, not proof)`, `${markers} formulaic transition/style matches`, `Repeated vocabulary fraction: ${repeated.toFixed(2)}`],
 segments: sentences.map(sentence => ({text:sentence, flagged: new RegExp(patterns.source,"i").test(sentence)})),
 warning: words.length < 100 ? "Short samples are harder to classify. Low evidence." : "No validated classifier is enabled; confidence remains low.", limitation: TEXT_LIMITATION, scannedAt: new Date().toISOString() };
}
