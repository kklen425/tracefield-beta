import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
const db=new PGlite();
for(const file of ['0001_auth.sql','0002_tracefield.sql','0003_beta.sql']) await db.exec(readFileSync(`migrations/${file}`,'utf8'));
await db.query('insert into "user" (id,name,email,"emailVerified","createdAt","updatedAt") values ($1,$2,$3,false,now(),now())',['qa','QA','qa@test.example']);
const job=crypto.randomUUID();
for(let i=0;i<5;i++) assert.equal((await db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',i===0?job:crypto.randomUUID()])).rows[0].used,i+1);
assert.equal((await db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',job])).rows[0].used,5);
try{await db.query('select tracefield_consume_analysis($1,$2,5)',['qa',crypto.randomUUID()]);throw new Error('Sixth job should fail');}catch(e){if(!String(e).includes('MONTHLY_ANALYSIS_LIMIT_REACHED'))throw e;console.log('sixth correctly blocked');}
await db.query("update tracefield_monthly_usage set period_start=(period_start-interval '1 month')::date where user_id='qa'");
assert.equal((await db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',crypto.randomUUID()])).rows[0].used,1);
const concurrent=await Promise.allSettled(Array.from({length:8},()=>db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',crypto.randomUUID()])));
assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,4);assert.equal(concurrent.filter(r=>r.status==='rejected').length,4);
await db.query('insert into "user" (id,name,email,"emailVerified","createdAt","updatedAt") values ($1,$2,$3,false,now(),now())',['plus','Plus QA','plus@test.example']);
for(let i=0;i<300;i++)assert.equal((await db.query('select tracefield_consume_analysis($1,$2,300) as used',['plus',crypto.randomUUID()])).rows[0].used,i+1);
await assert.rejects(db.query('select tracefield_consume_analysis($1,$2,300)',['plus',crypto.randomUUID()]),/MONTHLY_ANALYSIS_LIMIT_REACHED/);
console.log('PASS: five Free jobs, retry idempotency, sixth rejection, UTC-month reset, concurrent cap, 300 Plus jobs and 301st rejection.');await db.close();
