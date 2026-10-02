import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
for(const file of ['0001_auth.sql','0002_tracefield.sql','0003_beta.sql']) await db.exec(readFileSync(`migrations/${file}`,'utf8'));
await db.query('insert into "user" (id,name,email,"emailVerified","createdAt","updatedAt") values ($1,$2,$3,false,now(),now())',['qa','QA','qa@test.example']);
const job=crypto.randomUUID();
for(let i=0;i<5;i++) console.log(await db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',i===0?job:crypto.randomUUID()]));
console.log('retry',await db.query('select tracefield_consume_analysis($1,$2,5) as used',['qa',job]));
try{await db.query('select tracefield_consume_analysis($1,$2,5)',['qa',crypto.randomUUID()]);throw new Error('Sixth job should fail');}catch(e){if(!String(e).includes('MONTHLY_ANALYSIS_LIMIT_REACHED'))throw e;console.log('sixth correctly blocked');}
await db.close();
