import {test} from 'node:test';import assert from 'node:assert/strict';
import {aiScore,summarizeWindows,validateModelText} from './model-score.ts';
import {parseTurnitinReport} from './turnitin-report.ts';
test('model scores use the AI label and a word-weighted denominator',()=>{
 assert.equal(aiScore([{label:'Human',score:.9},{label:'AI',score:.1}]),.1);
 assert.throws(()=>aiScore([{label:'LABEL_1',score:.9}]));assert.throws(()=>aiScore([{label:'AI',score:NaN}]));
 const result=summarizeWindows([{text:'one two three',score:.9},{text:'four',score:.1}]);
 assert.equal(Math.round(result.scorePercent),70);assert.equal(result.flaggedWordPercent,75);
 assert.throws(()=>validateModelText('Short paragraph.'));assert.throws(()=>validateModelText('中文测试 '.repeat(100)));assert.throws(()=>validateModelText('word '.repeat(11000)));
});
test('Turnitin import never substitutes similarity, suppressed or ambiguous percentages',()=>{
 assert.equal(parseTurnitinReport('Turnitin AI Writing Report 47% detected as AI Similarity 12%').percent,47);
 assert.equal(parseTurnitinReport('Turnitin AI Writing Report *% detected as AI').percent,null);
 assert.equal(parseTurnitinReport('Turnitin AI Writing Report 0% detected as AI').percent,0);
 assert.throws(()=>parseTurnitinReport('Turnitin Similarity Report 47% similarity'));
 assert.throws(()=>parseTurnitinReport('Turnitin AI Writing Report 47% similarity'));
 assert.throws(()=>parseTurnitinReport('Turnitin AI Writing 47% detected as AI 65% detected as AI'));
 assert.throws(()=>parseTurnitinReport('Turnitin AI writing score: 101%'));
 assert.throws(()=>parseTurnitinReport('Turnitin AI writing 101% detected as AI'));
});
