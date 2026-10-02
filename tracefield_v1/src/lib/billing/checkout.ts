import {createServerFn} from '@tanstack/react-start';
import {authMiddleware} from '@/lib/auth/middleware';
import {getSql} from '@/lib/db';
export type PaidPlan = 'plus';
function testSecret() {
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key?.startsWith('sk_test_')) throw new Error('Stripe test billing is not configured. Live payments are disabled.');
 return key;
}
async function stripePost(path:string,form:URLSearchParams) {
 const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${testSecret()}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
 const result=await response.json() as {url?:string,error?:{message?:string}};
 if(!response.ok || !result.url) throw new Error(result.error?.message ?? 'Stripe request failed');
 return {url:result.url};
}
export const createCheckoutSession=createServerFn({method:'POST'}).validator((plan:PaidPlan)=>{if(plan!=='plus') throw new Error('Invalid plan');return plan;}).middleware([authMiddleware]).handler(async ({context})=>{
 testSecret();
 const origin=process.env.TRACEFIELD_APP_URL ?? 'http://localhost:8080';
 const form=new URLSearchParams({mode:'subscription',client_reference_id:context.userId,success_url:`${origin}/?checkout=success`,cancel_url:`${origin}/?checkout=cancelled`});
 const price=process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;
 if(price) form.set('line_items[0][price]',price);
 else {
  form.set('line_items[0][price_data][currency]','hkd');
  form.set('line_items[0][price_data][unit_amount]','1000');
  form.set('line_items[0][price_data][recurring][interval]','month');
  form.set('line_items[0][price_data][product_data][name]','TRACEFIELD Plus');
 }
 form.set('line_items[0][quantity]','1');
 for(const prefix of ['metadata','subscription_data[metadata]']) {
  form.set(`${prefix}[user_id]`,context.userId);form.set(`${prefix}[plan]`,'plus');form.set(`${prefix}[app]`,'TRACEFIELD');
 }
 return stripePost('checkout/sessions',form);
});
export const createBillingPortal=createServerFn({method:'POST'}).middleware([authMiddleware]).handler(async ({context})=>{
 const sql=await getSql();
 const rows=await sql<{stripe_customer_id:string}>`select stripe_customer_id from tracefield_subscriptions where user_id=${context.userId}`;
 if(!rows[0]?.stripe_customer_id) throw new Error('No billing account yet');
 return stripePost('billing_portal/sessions',new URLSearchParams({customer:rows[0].stripe_customer_id,return_url:process.env.TRACEFIELD_APP_URL ?? 'http://localhost:8080'}));
});
