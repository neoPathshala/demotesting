import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from '../src/lib/crypto.mjs';
import * as nodeCrypto from 'node:crypto';
const source=fs.readFileSync(new URL('../src/app/auth-actions.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(){
 const account={id:'owner',email:'owner@example.com',passwordHash:crypto.hashPassword('a unique password for tests'),active:true,failedAttempts:0,lockedUntil:null,totpSecretEncrypted:'email-otp'};
 const quotas=new Map(),codes=new Map(),jar=new Map(),sent=[],sessions=[],audits=[];let origin=true,deliver=true;
 const client={
  $executeRaw:async()=>1,
  adminAccount:{findUnique:async({where})=>where.email===account.email?account:null,update:async({data})=>Object.assign(account,data)},
  academicRateLimit:{findUnique:async({where})=>quotas.get(where.key),upsert:async({where,create,update})=>{const previous=quotas.get(where.key);const row=previous?{...previous,...update,count:typeof update.count==='object'?previous.count+update.count.increment:update.count}:create;quotas.set(where.key,row);return row;}},
  academicOtp:{findUnique:async({where})=>codes.get(where.email),upsert:async({where,create,update})=>{const row=codes.has(where.email)?{...codes.get(where.email),...update}:create;codes.set(where.email,row);return row;},update:async({where,data})=>Object.assign(codes.get(where.email),data),delete:async({where})=>codes.delete(where.email),deleteMany:async({where})=>{if(codes.get(where.email)?.challengeHash===where.challengeHash)codes.delete(where.email);}},
  adminSession:{deleteMany:async()=>sessions.splice(0),create:async({data})=>sessions.push(data)},
  adminAuditLog:{create:async({data})=>audits.push(data)}
 };
 const db={...client,$transaction:async fn=>fn(client)};
 const modules={
  'node:crypto':nodeCrypto,
  'next/headers':{headers:async()=>new Headers({'x-forwarded-for':'127.0.0.1'}),cookies:async()=>({get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key,value)=>jar.set(key,value),delete:key=>jar.delete(key)})},
  'next/navigation':{redirect:()=>{throw new Error('REDIRECT');}},
  '@/lib/db':{db},
  '@/lib/auth':{sameOrigin:async()=>{if(!origin)throw new Error('Origin');},cookieName:'admin_session',cookieOptions:{httpOnly:true},currentAdmin:async()=>null},
  '@/lib/crypto.mjs':crypto,
  '@/lib/admin-mail':{sendAdminCode:async(email,code)=>{if(!deliver)throw new Error('Mail unavailable');sent.push({email,code});}}
 };
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>{if(!(name in modules))throw new Error(name);return modules[name];},process:{env:{NODE_ENV:'test',AUTH_SECRET:'x'.repeat(32)}},Date,Headers,console});
 const request=(password='a unique password for tests')=>{const form=new FormData();form.set('email',account.email);form.set('password',password);return exports.loginAction({error:''},form);};
 const verify=code=>{const form=new FormData();form.set('email',account.email);form.set('step','verify');form.set('code',code);return exports.loginAction({error:''},form);};
 return {account,codes,jar,sent,sessions,audits,request,verify,setOrigin:value=>origin=value,setDelivery:value=>deliver=value};
}
test('password alone never creates a session; emailed code is browser-bound and single-use',async()=>{
 const app=setup();const first=await app.request();assert.equal(first.needsCode,true);assert.equal(app.sent.length,1);assert.equal(app.sessions.length,0);
 const challenge=app.jar.get('neocsit_admin_challenge');app.jar.delete('neocsit_admin_challenge');assert.match((await app.verify(app.sent[0].code)).error,/browser/);assert.equal(app.sessions.length,0);
 app.jar.set('neocsit_admin_challenge',challenge);await assert.rejects(app.verify(app.sent[0].code),/REDIRECT/);assert.equal(app.sessions.length,1);assert.equal(app.codes.size,0);assert.notEqual(app.sessions[0].tokenHash,app.jar.get('admin_session'));
 await app.verify(app.sent[0].code);assert.equal(app.sessions.length,1);
});
test('five wrong email codes lock the account and cannot be bypassed with a correct code',async()=>{
 const app=setup();await app.request();const wrong=app.sent[0].code==='111111'?'222222':'111111';for(let n=0;n<5;n++)await app.verify(wrong);assert(app.account.lockedUntil>Date.now());await app.verify(app.sent[0].code);assert.equal(app.sessions.length,0);
});
test('failed password and cross-origin attempts never send email or create sessions',async()=>{
 const app=setup();await app.request('incorrect');assert.equal(app.sent.length,0);app.setOrigin(false);await app.request();assert.equal(app.sent.length,0);assert.equal(app.sessions.length,0);
});
test('delivery failure removes the unusable challenge and fails closed',async()=>{
 const app=setup();app.setDelivery(false);assert.match((await app.request()).error,/deliver/);assert.equal(app.codes.size,0);assert.equal(app.jar.has('neocsit_admin_challenge'),false);assert.equal(app.sessions.length,0);
});
test('expired codes and codes issued before a password change cannot authenticate',async()=>{
 const app=setup();await app.request();const row=app.codes.get('admin:owner@example.com');row.expiresAt=new Date(0);await app.verify(app.sent[0].code);assert.equal(app.sessions.length,0);row.expiresAt=new Date(Date.now()+10000);app.account.passwordHash=crypto.hashPassword('a changed password for tests');await app.verify(app.sent[0].code);assert.equal(app.sessions.length,0);
});
