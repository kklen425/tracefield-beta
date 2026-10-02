import assert from 'node:assert/strict';
import {test} from 'node:test';
import {analyzeText} from './text.ts';
test('short passages do not receive confident authorship verdicts',()=>{for(const count of [1,40,83]){const r=analyzeText(Array(count).fill('word').join(' '));assert.equal(r.wordCount,count);assert.equal(r.verdict,'Mixed / uncertain');assert.ok(/low/i.test(r.confidence));assert.ok(r.limitation.includes('not a calibrated'));}});
test('limits, blank input and sentence highlighting',()=>{assert.throws(()=>analyzeText('   '));assert.throws(()=>analyzeText('a'.repeat(500001)));const r=analyzeText('Furthermore, evidence matters. I had toast.');assert.equal(r.segments[0].flagged,true);assert.equal(r.segments[1].flagged,false);assert.ok(!('aiProbability' in r));});
