import {test} from 'node:test';import assert from 'node:assert/strict';import {clearerEnglish,revisionQuality,validateRevisionInput} from './revision-quality.ts';
test('plain English edits preserve numbers, negation, references and paragraph structure',()=>{
 const source='It is important to note that the trial will not collect personal data in 2026 [7].\n\nFurthermore, the team will utilize 24 sensors in order to measure energy use.';
 const result=clearerEnglish(source);assert.equal(result,'The trial will not collect personal data in 2026 [7].\n\nThe team will use 24 sensors to measure energy use.');assert.deepEqual(revisionQuality(source,result).warnings,[]);
 assert.equal(clearerEnglish('Use small samples, e.g. the first row.'),'Use small samples, e.g. the first row.');
});
test('revision checks flag changed facts and refuse silent over-limit processing',()=>{
 const source='In 2026, we will not use 24 sensors [7].';const warnings=revisionQuality(source,'We will use 25 sensors.').warnings.join(' ');
 assert.match(warnings,/Numbers missing/);assert.match(warnings,/New or changed/);assert.match(warnings,/citation/);assert.match(warnings,/Negation/);
 assert.match(revisionQuality('Normal English text.','測試中文').warnings.join(' '),/non-English/);
 assert.throws(()=>validateRevisionInput(' '));assert.throws(()=>validateRevisionInput('x'.repeat(20001)));
 assert.equal(revisionQuality(source,source).changed,false);
 const drift=revisionQuality('The trial starts in 2026. The team will report the findings.','The trial began in 2026. The Panel will report the findings.').warnings.join(' ');
 assert.match(drift,/Panel/);assert.match(drift,/timeline/);
});
