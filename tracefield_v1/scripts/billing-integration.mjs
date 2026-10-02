import {Pool} from 'pg';import {createHmac} from 'node:crypto';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
const secret=process.env.STRIPE_SECRET_KEY;if(!secret?.startsWith('sk_test_'))throw new Error('Test key required');
const db=new Pool({connectionString:process.env.DATABASE_URL});
const api=async(path,values,method='POST')=>{const response=await fetch('https://api.stripe.com/v1/'+path,{method:values?method:'GET',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded'},body:values?new URLSearchParams(values):undefined});const data=await response.json();if(!response.ok)throw new Error(data.error?.message??String(response.status));assert.equal(data.livemode??false,false);return data;};
const rows=(await db.query(`select u.id,s.plan,s.status,s.stripe_subscription_id,s.stripe_customer_id from "user" u left join tracefield_subscriptions s on s.user_id=u.id where u.email=$1`,['qa-beta-20261002@tracefield.test'])).rows;
const row=rows[0];if(!row)throw new Error('Disposable QA account missing');console.log({plan:row.plan,status:row.status,hasSubscription:!!row.stripe_subscription_id});
const mode=process.argv[2]??'inspect';
if(mode==='replay'){
 const events=await api('events?limit=100');const event=events.data.find(e=>e.type.startsWith('customer.subscription.')&&e.data.object.id===row.stripe_subscription_id);if(!event)throw new Error('No subscription event found');
 const body=JSON.stringify(event);const t=Math.floor(Date.now()/1000);const signature=createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${body}`).digest('hex');
 for(let i=0;i<2;i++){const response=await fetch('https://tracefield-beta.onrender.com/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${signature}`},body});assert.equal(response.status,200);}
 assert.equal((await db.query('select count(*)::int as n from tracefield_stripe_events where id=$1',[event.id])).rows[0].n,1);console.log('PASS: same signed test event delivered twice, exactly one stored event.');
 const invalid=await fetch('https://tracefield-beta.onrender.com/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=bad`},body});assert.equal(invalid.status,400);console.log('PASS: tampered signature rejected by public webhook.');
}
if(mode==='fail'){
 if(!row.stripe_subscription_id?.startsWith('sub_'))throw new Error('QA subscription missing');
 const pm=await api('payment_methods/pm_card_chargeCustomerFail/attach',{customer:row.stripe_customer_id});
 await api(`subscriptions/${row.stripe_subscription_id}`,{default_payment_method:pm.id,cancel_at_period_end:'false',trial_end:String(Math.floor(Date.now()/1000)+120),proration_behavior:'none'});
 const subscription=await api(`subscriptions/${row.stripe_subscription_id}`,{trial_end:'now'});console.log({testSubscriptionStatus:subscription.status});
}
if(mode==='cancel'){
 if(!row.stripe_subscription_id?.startsWith('sub_'))throw new Error('QA subscription missing');const subscription=await api(`subscriptions/${row.stripe_subscription_id}`,{},'DELETE');console.log({cancelledTestSubscription:subscription.status});
}
if(row.stripe_subscription_id){const subscription=await api(`subscriptions/${row.stripe_subscription_id}`);console.log({stripeStatus:subscription.status,cancelAtPeriodEnd:subscription.cancel_at_period_end,amount:subscription.items.data[0].price.unit_amount,currency:subscription.items.data[0].price.currency});}
await db.end();
