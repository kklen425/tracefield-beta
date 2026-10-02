import {test} from 'node:test';import assert from 'node:assert/strict';import {inferValidationState} from './c2pa-state.ts';
test('claim strings and nested statuses cannot impersonate SDK validation',()=>{
 assert.equal(inferValidationState({claim_generator:'Trusted Valid C2PA',assertions:[{validation_state:'Trusted'}]},true),'unknown');
 assert.equal(inferValidationState({validation_state:'Invalid'},true),'invalid');
 assert.equal(inferValidationState({validation_state:'Valid'},true),'valid');
 assert.equal(inferValidationState({validation_state:'Trusted'},true),'trusted');
 assert.equal(inferValidationState({validation_state:'Trusted'},false),'not-present');
});
