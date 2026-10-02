import {test} from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';import {verifyStripeSignature} from './stripe-signature.ts';
test('Stripe signature rejects tampering, wrong keys and expired deliveries',async()=>{
 const payload=JSON.stringify({id:'evt_test',livemode:false});const secret='whsec_disposable_fixture';const now=Math.floor(Date.now()/1000);const sign=(ts:number)=>createHmac('sha256',secret).update(`${ts}.${payload}`).digest('hex');
 assert.equal(await verifyStripeSignature(payload,`t=${now},v1=${sign(now)}`,secret),true);
 assert.equal(await verifyStripeSignature(payload+' ',`t=${now},v1=${sign(now)}`,secret),false);
 assert.equal(await verifyStripeSignature(payload,`t=${now},v1=${sign(now)}`,'wrong'),false);
 assert.equal(await verifyStripeSignature(payload,`t=${now-600},v1=${sign(now-600)}`,secret),false);
 assert.equal(await verifyStripeSignature(payload,`t=${now},v1=bad,v1=${sign(now)}`,secret),true);
});
