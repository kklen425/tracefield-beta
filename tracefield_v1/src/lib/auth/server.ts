import {betterAuth} from 'better-auth';
import {bearer} from 'better-auth/plugins';
import {tanstackStartCookies} from 'better-auth/tanstack-start';
import {getCookie} from '@tanstack/react-start/server';
import {randomBytes} from 'node:crypto';
import {Pool} from 'pg';
import {getPglite} from '../db';
import {pgliteDialect} from './pglite-dialect';
export {GROK_PROVIDERS} from './providers';
export const authConfigured=true;
const globalRef=globalThis as typeof globalThis & {__tracefieldSecret?:string};
const production=process.env.NODE_ENV==='production';
if(production && (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL)) throw new Error('Production requires DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL');
globalRef.__tracefieldSecret??=randomBytes(32).toString('hex');
export const SESSION_TOKEN_COOKIE=production?'__Host-tracefield.session_token':'tracefield.session_token';
export const auth=betterAuth({
 baseURL:process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
 secret:process.env.BETTER_AUTH_SECRET ?? globalRef.__tracefieldSecret,
 database:process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL}) : {dialect:pgliteDialect(()=>getPglite()),type:'postgres'},
 trustedOrigins:production?[process.env.BETTER_AUTH_URL!]:['http://localhost:8080','http://127.0.0.1:8080'],
 emailAndPassword:{enabled:true,minPasswordLength:10},
 session:{cookieCache:{enabled:true,maxAge:300}},
 advanced:{useSecureCookies:false,defaultCookieAttributes:{secure:production,sameSite:'lax',path:'/'},cookies:{session_token:{name:SESSION_TOKEN_COOKIE}}},
 plugins:[bearer(),tanstackStartCookies()]
});
export function readSessionToken(){return getCookie(SESSION_TOKEN_COOKIE)??null;}
